-- ============================================================================
-- BABY SHOWER APP - MULTI-TABLE SCHEMA DEPLOYMENT
-- Migration: Create Normalized Tables in baby_shower Schema
-- Project: bkszmvfsfgvdwzacgmfz
-- Date: 2025-01-02
-- ============================================================================

-- ============================================
-- SCHEMA SETUP
-- ============================================
CREATE SCHEMA IF NOT EXISTS baby_shower;

-- Grant permissions (required for Supabase)
GRANT USAGE ON SCHEMA baby_shower TO anon, authenticated, service_role;

-- ============================================
-- TABLE 1: GUESTBOOK
-- ============================================
CREATE TABLE IF NOT EXISTS baby_shower.guestbook (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Guest Information
    guest_name TEXT NOT NULL CHECK (length(guest_name) >= 2 AND length(guest_name) <= 100),
    relationship TEXT NOT NULL CHECK (relationship IN ('family', 'friend', 'colleague', 'other')),
    message TEXT NOT NULL CHECK (length(message) >= 10 AND length(message) <= 500),
    
    -- Tracking
    submitted_by TEXT CHECK (submitted_by IS NULL OR length(submitted_by) >= 2),
    source_ip INET,
    user_agent TEXT,
    
    -- Metadata
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'failed')),
    processed_at TIMESTAMPTZ
);

-- ============================================
-- TABLE 2: VOTES
-- ============================================
CREATE TABLE IF NOT EXISTS baby_shower.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Voter Information
    voter_name TEXT NOT NULL CHECK (length(voter_name) >= 2 AND length(voter_name) <= 100),
    
    -- Vote Data (JSONB for array of name strings)
    selected_names JSONB NOT NULL CHECK (jsonb_typeof(selected_names) = 'array'),
    
    -- Tracking
    submitted_by TEXT CHECK (submitted_by IS NULL OR length(submitted_by) >= 2),
    source_ip INET,
    user_agent TEXT,
    
    -- Validation constraint
    CONSTRAINT valid_selected_names CHECK (
        jsonb_array_length(selected_names) >= 1 
        AND jsonb_array_length(selected_names) <= 3
    ),
    
    -- Metadata
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'failed')),
    processed_at TIMESTAMPTZ
);

-- ============================================
-- TABLE 3: POOL_PREDICTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS baby_shower.pool_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Predictor Information
    predictor_name TEXT NOT NULL CHECK (length(predictor_name) >= 2 AND length(predictor_name) <= 100),
    
    -- Prediction Details
    gender TEXT NOT NULL CHECK (gender IN ('boy', 'girl', 'surprise')),
    birth_date DATE NOT NULL CHECK (birth_date >= '2024-01-01'::date AND birth_date <= '2025-12-31'::date),
    weight_kg NUMERIC(4,2) NOT NULL CHECK (weight_kg >= 2.0 AND weight_kg <= 6.0),
    length_cm INTEGER NOT NULL CHECK (length_cm >= 40 AND length_cm <= 60),
    hair_color TEXT CHECK (hair_color IS NULL OR length(hair_color) <= 50),
    eye_color TEXT CHECK (eye_color IS NULL OR length(eye_color) <= 50),
    personality TEXT CHECK (personality IS NULL OR length(personality) <= 200),
    
    -- Tracking
    submitted_by TEXT CHECK (submitted_by IS NULL OR length(submitted_by) >= 2),
    source_ip INET,
    user_agent TEXT,
    
    -- Metadata
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'failed')),
    processed_at TIMESTAMPTZ
);

-- ============================================
-- TABLE 4: QUIZ_RESULTS
-- ============================================
CREATE TABLE IF NOT EXISTS baby_shower.quiz_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Participant Information
    participant_name TEXT NOT NULL CHECK (length(participant_name) >= 2 AND length(participant_name) <= 100),
    
    -- Quiz Data (JSONB array of question/answer objects)
    answers JSONB NOT NULL CHECK (jsonb_typeof(answers) = 'array'),
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 5),
    
    -- Tracking
    submitted_by TEXT CHECK (submitted_by IS NULL OR length(submitted_by) >= 2),
    source_ip INET,
    user_agent TEXT,
    
    -- Validation constraint for answers structure
    CONSTRAINT valid_answers_structure CHECK (
        jsonb_array_length(answers) = 5 AND
        NOT EXISTS (
            SELECT 1 FROM jsonb_array_elements(answers) answer
            WHERE answer->>'question_id' IS NULL OR answer->>'answer' IS NULL
        )
    ),
    
    -- Metadata
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'failed')),
    processed_at TIMESTAMPTZ
);

-- ============================================
-- TABLE 5: ADVICE
-- ============================================
CREATE TABLE IF NOT EXISTS baby_shower.advice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Advice Giver Information
    advice_giver TEXT NOT NULL CHECK (length(advice_giver) >= 2 AND length(advice_giver) <= 100),
    
    -- Advice Content
    advice_text TEXT NOT NULL CHECK (length(advice_text) >= 10 AND length(advice_text) <= 500),
    delivery_option TEXT NOT NULL CHECK (delivery_option IN ('immediate', 'time_capsule')),
    
    -- Tracking
    submitted_by TEXT CHECK (submitted_by IS NULL OR length(submitted_by) >= 2),
    source_ip INET,
    user_agent TEXT,
    
    -- Metadata
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'failed')),
    processed_at TIMESTAMPTZ
);

-- ============================================
-- TABLE 6: AI_ROASTS
-- ============================================
CREATE TABLE IF NOT EXISTS baby_shower.ai_roasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Foreign Key to pool_predictions
    prediction_id UUID NOT NULL REFERENCES baby_shower.pool_predictions(id) ON DELETE CASCADE,
    
    -- Roast Content
    roast_text TEXT NOT NULL CHECK (length(roast_text) >= 10 AND length(roast_text) <= 500),
    roast_type TEXT NOT NULL CHECK (roast_type IN ('funny', 'witty', 'savory')),
    
    -- Tracking
    generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ai_model_version TEXT DEFAULT 'gpt-4' CHECK (length(ai_model_version) <= 50),
    generation_status TEXT DEFAULT 'pending' CHECK (generation_status IN ('pending', 'generated', 'failed'))
);

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

-- Guestbook indexes
CREATE INDEX IF NOT EXISTS idx_guestbook_created_at ON baby_shower.guestbook(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guestbook_guest_name ON baby_shower.guestbook(guest_name);
CREATE INDEX IF NOT EXISTS idx_guestbook_relationship ON baby_shower.guestbook(relationship);

-- Votes indexes
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON baby_shower.votes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_voter_name ON baby_shower.votes(voter_name);
CREATE INDEX IF NOT EXISTS idx_votes_gin_names ON baby_shower.votes USING GIN (selected_names);

-- Pool predictions indexes
CREATE INDEX IF NOT EXISTS idx_pool_predictions_created_at ON baby_shower.pool_predictions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pool_predictions_predictor_name ON baby_shower.pool_predictions(predictor_name);
CREATE INDEX IF NOT EXISTS idx_pool_predictions_birth_date ON baby_shower.pool_predictions(birth_date);
CREATE INDEX IF NOT EXISTS idx_pool_predictions_gender ON baby_shower.pool_predictions(gender);

-- Quiz results indexes
CREATE INDEX IF NOT EXISTS idx_quiz_results_created_at ON baby_shower.quiz_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_results_participant_name ON baby_shower.quiz_results(participant_name);
CREATE INDEX IF NOT EXISTS idx_quiz_results_score ON baby_shower.quiz_results(score DESC);

-- Advice indexes
CREATE INDEX IF NOT EXISTS idx_advice_created_at ON baby_shower.advice(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_advice_advice_giver ON baby_shower.advice(advice_giver);
CREATE INDEX IF NOT EXISTS idx_advice_delivery_option ON baby_shower.advice(delivery_option);

-- AI roasts indexes
CREATE INDEX IF NOT EXISTS idx_ai_roasts_created_at ON baby_shower.ai_roasts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_roasts_prediction_id ON baby_shower.ai_roasts(prediction_id);
CREATE INDEX IF NOT EXISTS idx_ai_roasts_roast_type ON baby_shower.ai_roasts(roast_type);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE baby_shower.guestbook ENABLE ROW LEVEL SECURITY;
ALTER TABLE baby_shower.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE baby_shower.pool_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE baby_shower.quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE baby_shower.advice ENABLE ROW LEVEL SECURITY;
ALTER TABLE baby_shower.ai_roasts ENABLE ROW LEVEL SECURITY;

-- Guestbook policies
DROP POLICY IF EXISTS "Allow guestbook inserts" ON baby_shower.guestbook;
CREATE POLICY "Allow guestbook inserts" ON baby_shower.guestbook
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow guestbook reads" ON baby_shower.guestbook;
CREATE POLICY "Allow guestbook reads" ON baby_shower.guestbook
    FOR SELECT USING (true);

-- Votes policies
DROP POLICY IF EXISTS "Allow votes inserts" ON baby_shower.votes;
CREATE POLICY "Allow votes inserts" ON baby_shower.votes
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow votes reads" ON baby_shower.votes;
CREATE POLICY "Allow votes reads" ON baby_shower.votes
    FOR SELECT USING (true);

-- Pool predictions policies
DROP POLICY IF EXISTS "Allow pool inserts" ON baby_shower.pool_predictions;
CREATE POLICY "Allow pool inserts" ON baby_shower.pool_predictions
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow pool reads" ON baby_shower.pool_predictions;
CREATE POLICY "Allow pool reads" ON baby_shower.pool_predictions
    FOR SELECT USING (true);

-- Quiz results policies
DROP POLICY IF EXISTS "Allow quiz inserts" ON baby_shower.quiz_results;
CREATE POLICY "Allow quiz inserts" ON baby_shower.quiz_results
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow quiz reads" ON baby_shower.quiz_results;
CREATE POLICY "Allow quiz reads" ON baby_shower.quiz_results
    FOR SELECT USING (true);

-- Advice policies
DROP POLICY IF EXISTS "Allow advice inserts" ON baby_shower.advice;
CREATE POLICY "Allow advice inserts" ON baby_shower.advice
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow advice reads" ON baby_shower.advice;
CREATE POLICY "Allow advice reads" ON baby_shower.advice
    FOR SELECT USING (true);

-- AI roasts policies (read-only for public, insert for service_role)
DROP POLICY IF EXISTS "Allow roasts reads" ON baby_shower.ai_roasts;
CREATE POLICY "Allow roasts reads" ON baby_shower.ai_roasts
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Deny roasts inserts" ON baby_shower.ai_roasts;
CREATE POLICY "Deny roasts inserts" ON baby_shower.ai_roasts
    FOR INSERT USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- SUPABASE REALTIME SETUP
-- ============================================

-- Create publication for all baby_shower tables
DROP PUBLICATION IF EXISTS baby_shower_realtime;
CREATE PUBLICATION baby_shower_realtime;

-- Add all tables to realtime
ALTER PUBLICATION baby_shower_realtime ADD TABLE baby_shower.guestbook;
ALTER PUBLICATION baby_shower_realtime ADD TABLE baby_shower.votes;
ALTER PUBLICATION baby_shower_realtime ADD TABLE baby_shower.pool_predictions;
ALTER PUBLICATION baby_shower_realtime ADD TABLE baby_shower.quiz_results;
ALTER PUBLICATION baby_shower_realtime ADD TABLE baby_shower.advice;
ALTER PUBLICATION baby_shower_realtime ADD TABLE baby_shower.ai_roasts;

-- ============================================
-- TABLE PERMISSIONS
-- ============================================

-- Grant table permissions
GRANT SELECT, INSERT ON baby_shower.guestbook TO anon, authenticated;
GRANT SELECT, INSERT ON baby_shower.votes TO anon, authenticated;
GRANT SELECT, INSERT ON baby_shower.pool_predictions TO anon, authenticated;
GRANT SELECT, INSERT ON baby_shower.quiz_results TO anon, authenticated;
GRANT SELECT, INSERT ON baby_shower.advice TO anon, authenticated;
GRANT SELECT ON baby_shower.ai_roasts TO anon, authenticated;
GRANT INSERT ON baby_shower.ai_roasts TO service_role;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify RLS is enabled
SELECT 'RLS Check:' as status, 
       table_name, 
       relrowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'baby_shower'
ORDER BY table_name;

-- Verify policies exist
SELECT 'Policies Check:' as status,
       tablename,
       policyname,
       cmd
FROM pg_policies
WHERE schemaname = 'baby_shower'
ORDER BY tablename, cmd;

-- Verify indexes exist
SELECT 'Indexes Check:' as status,
       tablename,
       indexname
FROM pg_indexes
WHERE schemaname = 'baby_shower'
ORDER BY tablename, indexname;

SELECT 'Migration Complete: baby_shower multi-table schema created successfully' as result;
