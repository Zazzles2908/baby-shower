-- Migration: Simplified Who Would Rather Game Schema
-- Replaces complex Mom vs Dad game with fast-paced voting game
-- Created: 2026-01-04
-- Status: Ready for implementation

-- ============================================================================
-- WHO WOULD RATHER SESSIONS TABLE
-- Simplified game sessions (no admin authentication needed)
-- ============================================================================

CREATE TABLE IF NOT EXISTS baby_shower.who_would_rather_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_code VARCHAR(6) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'complete')),
    current_question_index INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 24,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_by VARCHAR(100)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_who_would_sessions_code ON baby_shower.who_would_rather_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_who_would_sessions_status ON baby_shower.who_would_rather_sessions(status);
CREATE INDEX IF NOT EXISTS idx_who_would_sessions_created ON baby_shower.who_would_rather_sessions(created_at);

COMMENT ON TABLE baby_shower.who_would_rather_sessions IS 'Simplified Who Would Rather game sessions';
COMMENT ON COLUMN baby_shower.who_would_rather_sessions.session_code IS '6-character code for guests to join (no admin needed)';
COMMENT ON COLUMN baby_shower.who_would_rather_sessions.current_question_index IS '0-indexed, points to current question';

-- ============================================================================
-- PREDEFINED QUESTIONS TABLE
-- 24 predefined questions (no AI generation needed)
-- ============================================================================

CREATE TABLE IF NOT EXISTS baby_shower.who_would_rather_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    question_number INTEGER UNIQUE NOT NULL CHECK (question_number BETWEEN 1 AND 24),
    category VARCHAR(50) DEFAULT 'general',
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for question lookup
CREATE INDEX IF NOT EXISTS idx_who_would_questions_number ON baby_shower.who_would_rather_questions(question_number);
CREATE INDEX IF NOT EXISTS idx_who_would_questions_active ON baby_shower.who_would_rather_questions(is_active);

COMMENT ON TABLE baby_shower.who_would_rather_questions IS 'Predefined questions for Who Would Rather game';
COMMENT ON COLUMN baby_shower.who_would_rather_questions.question_number IS '1-24, determines order in game';

-- ============================================================================
-- VOTES TABLE
-- Simplified voting (no duplicate prevention needed)
-- ============================================================================

CREATE TABLE IF NOT EXISTS baby_shower.who_would_rather_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES baby_shower.who_would_rather_sessions(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL CHECK (question_number BETWEEN 1 AND 24),
    guest_name VARCHAR(100) NOT NULL,
    vote_choice VARCHAR(10) NOT NULL CHECK (vote_choice IN ('mom', 'dad')),
    voted_at TIMESTAMPTZ DEFAULT NOW(),
    -- Allow guests to change their vote (unique constraint prevents duplicates)
    UNIQUE(session_id, question_number, guest_name)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_who_would_votes_session_question ON baby_shower.who_would_rather_votes(session_id, question_number);
CREATE INDEX IF NOT EXISTS idx_who_would_votes_guest ON baby_shower.who_would_rather_votes(guest_name);
CREATE INDEX IF NOT EXISTS idx_who_would_votes_choice ON baby_shower.who_would_rather_votes(session_id, question_number, vote_choice);

COMMENT ON TABLE baby_shower.who_would_rather_votes IS 'Guest votes for Who Would Rather questions';
COMMENT ON COLUMN baby_shower.who_would_rather_votes.vote_choice IS 'mom or dad - which parent the guest chooses';

-- ============================================================================
-- RESULTS VIEW
-- Real-time calculated results (no storage needed)
-- ============================================================================

CREATE OR REPLACE VIEW baby_shower.who_would_rather_results AS
SELECT 
    v.session_id,
    v.question_number,
    q.question_text,
    COUNT(CASE WHEN v.vote_choice = 'mom' THEN 1 END) as mom_votes,
    COUNT(CASE WHEN v.vote_choice = 'dad' THEN 1 END) as dad_votes,
    COUNT(*) as total_votes,
    CASE 
        WHEN COUNT(*) > 0 
        THEN ROUND((COUNT(CASE WHEN v.vote_choice = 'mom' THEN 1 END)::DECIMAL / COUNT(*) * 100), 1)
        ELSE 0 
    END as mom_percentage,
    CASE 
        WHEN COUNT(*) > 0 
        THEN ROUND((COUNT(CASE WHEN v.vote_choice = 'dad' THEN 1 END)::DECIMAL / COUNT(*) * 100), 1)
        ELSE 0 
    END as dad_percentage,
    CASE 
        WHEN COUNT(CASE WHEN v.vote_choice = 'mom' THEN 1 END) > COUNT(CASE WHEN v.vote_choice = 'dad' THEN 1 END) THEN 'mom'
        WHEN COUNT(CASE WHEN v.vote_choice = 'dad' THEN 1 END) > COUNT(CASE WHEN v.vote_choice = 'mom' THEN 1 END) THEN 'dad'
        ELSE 'tie'
    END as winning_choice,
    MAX(v.voted_at) as last_vote_at
FROM baby_shower.who_would_rather_votes v
JOIN baby_shower.who_would_rather_questions q ON v.question_number = q.question_number
GROUP BY v.session_id, v.question_number, q.question_text;

COMMENT ON VIEW baby_shower.who_would_rather_results IS 'Real-time calculated voting results';

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- Simplified security (no admin roles needed)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE baby_shower.who_would_rather_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE baby_shower.who_would_rather_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE baby_shower.who_would_rather_votes ENABLE ROW LEVEL SECURITY;

-- Sessions: Public read, anyone can create
CREATE POLICY "Public can read sessions" ON baby_shower.who_would_rather_sessions
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create sessions" ON baby_shower.who_would_rather_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update active sessions" ON baby_shower.who_would_rather_sessions
    FOR UPDATE USING (status = 'active');

-- Questions: Public can read active questions
CREATE POLICY "Public can read active questions" ON baby_shower.who_would_rather_questions
    FOR SELECT USING (is_active = true);

-- Votes: Anyone can vote, public can read results
CREATE POLICY "Anyone can submit votes" ON baby_shower.who_would_rather_votes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read vote results" ON baby_shower.who_would_rather_votes
    FOR SELECT USING (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to generate unique session code (6 characters)
CREATE OR REPLACE FUNCTION baby_shower.generate_who_would_session_code()
RETURNS VARCHAR(6) AS $$
DECLARE
    chars VARCHAR(32) := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- Removed confusing chars (0, O, I, 1)
    code VARCHAR(6) := '';
BEGIN
    FOR i IN 1..6 LOOP
        code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    
    -- Ensure uniqueness
    IF EXISTS (SELECT 1 FROM baby_shower.who_would_rather_sessions WHERE session_code = code) THEN
        code := baby_shower.generate_who_would_session_code();
    END IF;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to get current question for a session
CREATE OR REPLACE FUNCTION baby_shower.get_current_question(session_code VARCHAR)
RETURNS TABLE (
    question_number INTEGER,
    question_text TEXT,
    category VARCHAR(50),
    difficulty VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.question_number,
        q.question_text,
        q.category,
        q.difficulty
    FROM baby_shower.who_would_rather_sessions s
    JOIN baby_shower.who_would_rather_questions q 
        ON q.question_number = s.current_question_index + 1
    WHERE s.session_code = get_current_question.session_code
    AND s.status = 'active'
    AND q.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to check if guest has voted
CREATE OR REPLACE FUNCTION baby_shower.has_guest_voted(
    session_code VARCHAR,
    guest_name VARCHAR,
    question_num INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM baby_shower.who_would_rather_votes v
        JOIN baby_shower.who_would_rather_sessions s ON v.session_id = s.id
        WHERE s.session_code = has_guest_voted.session_code
        AND v.guest_name = has_guest_voted.guest_name
        AND v.question_number = has_guest_voted.question_num
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PREDEFINED QUESTIONS DATA
-- 24 questions as specified in requirements
-- ============================================================================

INSERT INTO baby_shower.who_would_rather_questions (question_text, question_number, category, difficulty) VALUES
('Who worries more?', 1, 'personality', 'easy'),
('Who wants more kids?', 2, 'parenting', 'medium'),
('Whose parents will feed you more?', 3, 'family', 'easy'),
('Who will be more nervous in labour?', 4, 'parenting', 'medium'),
('Who keeps track of appointments?', 5, 'daily_life', 'easy'),
('Who came up with the name?', 6, 'parenting', 'medium'),
('Who was the bigger baby at birth?', 7, 'personal_history', 'hard'),
('Who took long to potty train?', 8, 'personal_history', 'hard'),
('Who will change more diapers?', 9, 'parenting', 'medium'),
('Who will gag more changing diapers?', 10, 'parenting', 'easy'),
('Who will be the "good cop" parent?', 11, 'parenting', 'medium'),
('Who will be the more strict parent?', 12, 'parenting', 'medium'),
('Who will take more pictures and videos of the child?', 13, 'daily_life', 'easy'),
('Who will resemble the baby the most?', 14, 'family', 'medium'),
('Who will ramble at the baby?', 15, 'personality', 'easy'),
('Who will have an easier time letting baby cry?', 16, 'parenting', 'hard'),
('Who will have more patience (through newborn stage)?', 17, 'personality', 'medium'),
('Who will tell the story of the birds and the bees?', 18, 'parenting', 'hard'),
('Who will read more bedtime stories?', 19, 'daily_life', 'easy'),
('Who will fix the ouchies and boo-boos?', 20, 'parenting', 'medium'),
('Who will dress the child?', 21, 'daily_life', 'easy'),
('Who will play games with the child?', 22, 'daily_life', 'medium'),
('Who will be more excited for school events?', 23, 'parenting', 'medium'),
('Who will cry more at kindergarten drop-off?', 24, 'parenting', 'easy');

-- ============================================================================
-- REALTIME PUBLICATION
-- For live vote updates
-- ============================================================================

DROP PUBLICATION IF EXISTS baby_shower_who_would_realtime;
CREATE PUBLICATION baby_shower_who_would_realtime FOR TABLE 
    baby_shower.who_would_rather_sessions,
    baby_shower.who_would_rather_votes;

COMMENT ON PUBLICATION baby_shower_who_would_realtime IS 'Realtime updates for Who Would Rather game';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA baby_shower TO anon, authenticated, service_role;
GRANT SELECT, INSERT ON baby_shower.who_would_rather_sessions TO anon, authenticated;
GRANT SELECT ON baby_shower.who_would_rather_questions TO anon, authenticated;
GRANT SELECT, INSERT ON baby_shower.who_would_rather_votes TO anon, authenticated;
GRANT SELECT ON baby_shower.who_would_rather_results TO anon, authenticated;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION baby_shower.generate_who_would_session_code() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION baby_shower.get_current_question(VARCHAR) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION baby_shower.has_guest_voted(VARCHAR, VARCHAR, INTEGER) TO anon, authenticated;

-- ============================================================================
-- MIGRATION VALIDATION
-- ============================================================================

-- Verify all tables created
SELECT 
    'who_would_rather_sessions' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'baby_shower' AND table_name = 'who_would_rather_sessions') as exists
UNION ALL
SELECT 
    'who_would_rather_questions' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'baby_shower' AND table_name = 'who_would_rather_questions') as exists
UNION ALL
SELECT 
    'who_would_rather_votes' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'baby_shower' AND table_name = 'who_would_rather_votes') as exists
UNION ALL
SELECT 
    'who_would_rather_results' as view_name,
    EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'baby_shower' AND table_name = 'who_would_rather_results') as exists;

-- Verify questions inserted
SELECT COUNT(*) as total_questions FROM baby_shower.who_would_rather_questions WHERE is_active = true;

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================

/*
-- To rollback this migration, run:
DROP TABLE IF EXISTS baby_shower.who_would_rather_votes CASCADE;
DROP TABLE IF EXISTS baby_shower.who_would_rather_sessions CASCADE;
DROP TABLE IF EXISTS baby_shower.who_would_rather_questions CASCADE;
DROP VIEW IF EXISTS baby_shower.who_would_rather_results CASCADE;
DROP PUBLICATION IF EXISTS baby_shower_who_would_realtime;
DROP FUNCTION IF EXISTS baby_shower.generate_who_would_session_code();
DROP FUNCTION IF EXISTS baby_shower.get_current_question(VARCHAR);
DROP FUNCTION IF EXISTS baby_shower.has_guest_voted(VARCHAR, VARCHAR, INTEGER);
*/

-- ============================================================================
-- MIGRATION LOG
-- ============================================================================

-- This migration creates a simplified Who Would Rather game
-- Compatible with existing baby_shower schema
-- No impact on existing Mom vs Dad game tables
-- Can be safely applied alongside existing game
-- Version: 2026-01-04
-- Author: Technical Architecture Team
-- Status: Ready for production deployment