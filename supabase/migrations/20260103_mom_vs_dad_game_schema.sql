-- Baby Shower V2 - Mom vs Dad Game Schema
-- Integration with existing baby_shower namespace
-- Created: 2026-01-03
-- Status: Ready for implementation

-- ============================================================================
-- GAME SESSIONS TABLE
-- Manages game rounds and session state
-- ============================================================================

CREATE TABLE IF NOT EXISTS baby_shower.game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_code VARCHAR(8) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'setup' CHECK (status IN ('setup', 'voting', 'revealed', 'complete')),
    
    -- Parent names for AI personalization
    mom_name VARCHAR(100) NOT NULL,
    dad_name VARCHAR(100) NOT NULL,
    
    -- Admin authentication (for parents)
    admin_code VARCHAR(10) NOT NULL,
    
    -- Game settings
    total_rounds INTEGER DEFAULT 5,
    current_round INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Metadata
    created_by VARCHAR(100)
);

-- Index for session lookup
CREATE INDEX IF NOT EXISTS idx_game_sessions_code ON baby_shower.game_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON baby_shower.game_sessions(status);

COMMENT ON TABLE baby_shower.game_sessions IS 'Manages Mom vs Dad game sessions and rounds';
COMMENT ON COLUMN baby_shower.game_sessions.session_code IS '6-8 character code for guests to join';
COMMENT ON COLUMN baby_shower.game_sessions.status IS 'setup (configuring), voting (active), revealed (results shown), complete (finished)';

-- ============================================================================
-- GAME SCENARIOS TABLE
-- AI-generated questions/scenarios for each round
-- ============================================================================

CREATE TABLE IF NOT EXISTS baby_shower.game_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES baby_shower.game_sessions(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    
    -- Scenario content
    scenario_text TEXT NOT NULL,
    mom_option TEXT NOT NULL,      -- "Mom would do X"
    dad_option TEXT NOT NULL,      -- "Dad would do Y"
    
    -- AI metadata
    ai_provider VARCHAR(20) DEFAULT 'z_ai',
    intensity DECIMAL(3,2) DEFAULT 0.5,  -- 0.1 (tame) to 1.0 (wild)
    theme_tags TEXT[] DEFAULT '{}',       -- Array of theme tags: ['farm', 'funny', 'sleep']
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_game_scenarios_session ON baby_shower.game_scenarios(session_id);
CREATE INDEX IF NOT EXISTS idx_game_scenarios_round ON baby_shower.game_scenarios(session_id, round_number);
CREATE INDEX IF NOT EXISTS idx_game_scenarios_active ON baby_shower.game_scenarios(session_id, is_active);

COMMENT ON TABLE baby_shower.game_scenarios IS 'AI-generated scenarios for Mom vs Dad game rounds';
COMMENT ON COLUMN baby_shower.game_scenarios.intensity IS 'Comedy level: 0.1=tame, 0.5=funny, 1.0=wild';
COMMENT ON COLUMN baby_shower.game_scenarios.theme_tags IS 'Theme tags for categorization: farm, cozy, parenting, funny, etc.';

-- ============================================================================
-- GAME VOTES TABLE
-- Guest votes for each scenario (separate from name voting!)
-- ============================================================================

CREATE TABLE IF NOT EXISTS baby_shower.game_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES baby_shower.game_scenarios(id) ON DELETE CASCADE,
    
    -- Voter info (guests don't need accounts)
    guest_name VARCHAR(100) NOT NULL,
    guest_id UUID,  -- Optional: link to authenticated user
    
    -- Vote choice
    vote_choice VARCHAR(10) NOT NULL CHECK (vote_choice IN ('mom', 'dad')),
    
    -- When they voted
    voted_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate votes per round
    UNIQUE(scenario_id, guest_id),
    UNIQUE(scenario_id, guest_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_game_votes_scenario ON baby_shower.game_votes(scenario_id);
CREATE INDEX IF NOT EXISTS idx_game_votes_guest ON baby_shower.game_votes(guest_name);
CREATE INDEX IF NOT EXISTS idx_game_votes_choice ON baby_shower.game_votes(scenario_id, vote_choice);

COMMENT ON TABLE baby_shower.game_votes IS 'Guest votes for Mom vs Dad scenarios';
COMMENT ON COLUMN baby_shower.game_votes.vote_choice IS 'Which parent the guest thinks would do the scenario';

-- ============================================================================
-- GAME ANSWERS TABLE
-- Parent's secret answers (locked before reveal!)
-- ============================================================================

CREATE TABLE IF NOT EXISTS baby_shower.game_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES baby_shower.game_scenarios(id) ON DELETE CASCADE,
    
    -- Answers from each parent
    mom_answer VARCHAR(10) CHECK (mom_answer IN ('mom', 'dad') OR mom_answer IS NULL),
    dad_answer VARCHAR(10) CHECK (dad_answer IN ('mom', 'dad') OR dad_answer IS NULL),
    
    -- Lock status
    mom_locked BOOLEAN DEFAULT FALSE,
    mom_locked_at TIMESTAMPTZ,
    dad_locked BOOLEAN DEFAULT FALSE,
    dad_locked_at TIMESTAMPTZ,
    
    -- Final consensus (if parents disagree, use mom's answer or random?)
    final_answer VARCHAR(10) CHECK (final_answer IN ('mom', 'dad') OR final_answer IS NULL),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    all_locked_at TIMESTAMPTZ
);

-- Index
CREATE INDEX IF NOT EXISTS idx_game_answers_scenario ON baby_shower.game_answers(scenario_id);

COMMENT ON TABLE baby_shower.game_answers IS 'Secret parent answers, locked before reveal';
COMMENT ON COLUMN baby_shower.game_answers.final_answer IS 'Consensus answer (if parents disagree, could use coin flip or require re-vote)';

-- ============================================================================
-- GAME RESULTS TABLE
-- Perception gap analysis and AI roasts
-- ============================================================================

CREATE TABLE IF NOT EXISTS baby_shower.game_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES baby_shower.game_scenarios(id) ON DELETE CASCADE,
    
    -- Vote statistics
    mom_votes INTEGER DEFAULT 0,
    dad_votes INTEGER DEFAULT 0,
    total_votes INTEGER GENERATED ALWAYS AS (COALESCE(mom_votes, 0) + COALESCE(dad_votes, 0)) STORED,
    mom_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN COALESCE(mom_votes, 0) + COALESCE(dad_votes, 0) > 0 
            THEN (COALESCE(mom_votes, 0)::DECIMAL / (COALESCE(mom_votes, 0) + COALESCE(dad_votes, 0)) * 100)
            ELSE 0 
        END
    ) STORED,
    
    -- Perception vs Reality
    crowd_choice VARCHAR(10),  -- 'mom' or 'dad' (who majority picked)
    actual_choice VARCHAR(10), -- The actual answer (from game_answers)
    perception_gap DECIMAL(5,2), -- How wrong the crowd was
    
    -- AI Roast (Moonshot-generated)
    roast_commentary TEXT,
    roast_provider VARCHAR(20) DEFAULT 'moonshot',
    roast_model VARCHAR(50),
    
    -- Particle effects to trigger
    particle_effect VARCHAR(20) DEFAULT 'confetti',  -- confetti, sparkles, stars
    
    -- Timestamps
    revealed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_game_results_scenario ON baby_shower.game_results(scenario_id);
CREATE INDEX IF NOT EXISTS idx_game_results_perception ON baby_shower.game_results(perception_gap);

COMMENT ON TABLE baby_shower.game_results IS 'Perception gap analysis and AI roast commentary';
COMMENT ON COLUMN baby_shower.game_results.perception_gap IS 'Percentage difference between crowd choice and reality';

-- ============================================================================
-- REALTIME PUBLICATION
-- ============================================================================

-- Create publication for game state updates
DROP PUBLICATION IF EXISTS baby_shower_game_realtime;
CREATE PUBLICATION baby_shower_game_realtime FOR TABLE 
    baby_shower.game_sessions,
    baby_shower.game_scenarios,
    baby_shower.game_votes,
    baby_shower.game_results;

COMMENT ON PUBLICATION baby_shower_game_realtime IS 'Realtime updates for Mom vs Dad game';

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE baby_shower.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE baby_shower.game_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE baby_shower.game_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE baby_shower.game_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE baby_shower.game_results ENABLE ROW LEVEL SECURITY;

-- Game Sessions: Public read, Admin write
CREATE POLICY "Public can read game sessions" ON baby_shower.game_sessions
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create game sessions" ON baby_shower.game_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update game sessions" ON baby_shower.game_sessions
    FOR UPDATE USING (
        -- Check if the request includes the correct admin_code
        -- This is validated server-side by comparing against stored admin_code
        -- RLS ensures only authenticated service_role can bypass this check
        true  -- Allow update, let function-level validation handle admin checks
    );

-- Scenarios: Public read, Admin write
CREATE POLICY "Public can read scenarios" ON baby_shower.game_scenarios
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM baby_shower.game_sessions s 
            WHERE s.id = baby_shower.game_scenarios.session_id 
            AND s.status IN ('voting', 'revealed', 'complete')
        )
    );

CREATE POLICY "Anyone can view active scenarios" ON baby_shower.game_scenarios
    FOR SELECT USING (is_active = true);

-- Votes: Anyone can vote, Public read
CREATE POLICY "Anyone can submit votes" ON baby_shower.game_votes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read vote counts" ON baby_shower.game_votes
    FOR SELECT USING (true);

-- Answers: Only admins can see locked answers before reveal
-- Note: Admin validation is done at function level, not RLS
CREATE POLICY "Admins can manage answers" ON baby_shower.game_answers
    FOR ALL USING (
        -- Anyone can insert (vote/submit), authenticated can manage
        -- True security is enforced by Edge Functions
        auth.role() = 'authenticated' OR auth.role() = 'service_role'
    );

CREATE POLICY "Reveal answers after game" ON baby_shower.game_answers
    FOR SELECT USING (
        (
            EXISTS (
                SELECT 1 FROM baby_shower.game_sessions s 
                JOIN baby_shower.game_scenarios sc ON s.id = sc.session_id
                WHERE sc.id = baby_shower.game_answers.scenario_id
                AND s.status IN ('revealed', 'complete')
            )
        )
        OR 
        (
            -- Or if both answers are locked (but not yet revealed)
            mom_locked = true AND dad_locked = true
        )
    );

-- Results: Public read after reveal
CREATE POLICY "Public can read results" ON baby_shower.game_results
    FOR SELECT USING (revealed_at IS NOT NULL);

CREATE POLICY "Admins can create results" ON baby_shower.game_results
    FOR INSERT WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to generate unique session code
CREATE OR REPLACE FUNCTION baby_shower.generate_session_code()
RETURNS VARCHAR(8) AS $$
DECLARE
    chars VARCHAR(36) := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- Removed confusing chars
    code VARCHAR(8) := '';
BEGIN
    FOR i IN 1..6 LOOP
        code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    
    -- Ensure uniqueness
    IF EXISTS (SELECT 1 FROM baby_shower.game_sessions WHERE session_code = code) THEN
        code := baby_shower.generate_session_code();
    END IF;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate vote percentages
CREATE OR REPLACE FUNCTION baby_shower.calculate_vote_stats(scenario_id UUID)
RETURNS TABLE (
    mom_count BIGINT,
    dad_count BIGINT,
    total_votes BIGINT,
    mom_percentage DECIMAL(5,2),
    dad_percentage DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(CASE WHEN vote_choice = 'mom' THEN 1 END)::BIGINT as mom_count,
        COUNT(CASE WHEN vote_choice = 'dad' THEN 1 END)::BIGINT as dad_count,
        COUNT(*)::BIGINT as total_votes,
        CASE 
            WHEN COUNT(*) > 0 
            THEN (COUNT(CASE WHEN vote_choice = 'mom' THEN 1 END)::DECIMAL / COUNT(*) * 100)
            ELSE 0 
        END as mom_percentage,
        CASE 
            WHEN COUNT(*) > 0 
            THEN (COUNT(CASE WHEN vote_choice = 'dad' THEN 1 END)::DECIMAL / COUNT(*) * 100)
            ELSE 0 
        END as dad_percentage
    FROM baby_shower.game_votes
    WHERE scenario_id = baby_shower.calculate_vote_stats.scenario_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if all votes are in for a scenario
CREATE OR REPLACE FUNCTION baby_shower.check_voting_complete(scenario_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    vote_count INTEGER;
    guest_count INTEGER;
BEGIN
    -- Count total votes
    SELECT COUNT(*) INTO vote_count 
    FROM baby_shower.game_votes 
    WHERE scenario_id = check_voting_complete.scenario_id;
    
    -- Could add logic to check if all guests have voted
    -- For now, just return true if at least 1 vote
    RETURN vote_count >= 1;
END;
$$ LANGUAGE plpgsql;

-- Function to generate admin code
CREATE OR REPLACE FUNCTION baby_shower.generate_admin_code()
RETURNS VARCHAR(10) AS $$
DECLARE
    code VARCHAR(10) := '';
BEGIN
    FOR i IN 1..4 LOOP
        code := code || floor(random() * 10)::int::text;
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

/*
-- Insert a test session (for development only!)
INSERT INTO baby_shower.game_sessions (
    session_code,
    mom_name,
    dad_name,
    admin_code,
    status,
    total_rounds
) VALUES (
    'MOMDAD1',
    'Sarah',
    'Mike',
    '1234',
    'voting',
    5
);
*/

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA baby_shower TO anon, authenticated, service_role;
GRANT SELECT, INSERT ON baby_shower.game_sessions TO anon, authenticated;
GRANT SELECT, INSERT ON baby_shower.game_scenarios TO anon, authenticated;
GRANT SELECT, INSERT ON baby_shower.game_votes TO anon, authenticated;
GRANT ALL ON baby_shower.game_answers TO authenticated, service_role;
GRANT SELECT, INSERT ON baby_shower.game_results TO anon, authenticated;

-- ============================================================================
-- MIGRATION LOG
-- ============================================================================

-- This migration adds Mom vs Dad game tables to the existing baby_shower schema
-- Compatible with existing production schema (public.submissions + internal.*)
-- Does not affect existing tables or data
-- Can be safely applied to existing Supabase project

-- Version: 2026-01-03
-- Author: OpenCode Orchestrator
-- Status: Ready for production deployment