-- ============================================================================
-- BABY SHOWER APP - SCHEMA CONSTRAINT FIXES AND OPTIMIZATION
-- Fixes for: Birth date constraint, performance indexes, data consistency
-- Project: bkszmvfsfgvdwzacgmfz
-- Date: 2026-01-03
-- ============================================================================

-- ============================================
-- FIX 1: BIRTH DATE CONSTRAINT EXTENSION
-- Issue: Current constraint only allows 2024-2025 dates
-- Solution: Extend range to include 2026
-- ============================================

-- Step 1: Drop the old constraint
ALTER TABLE baby_shower.pool_predictions DROP CONSTRAINT IF EXISTS pool_predictions_birth_date_check;

-- Step 2: Add new constraint with extended date range (2024-01-01 to 2026-12-31)
-- This allows for the current year and provides buffer for late submissions
ALTER TABLE baby_shower.pool_predictions 
ADD CONSTRAINT pool_predictions_birth_date_check 
CHECK (birth_date >= '2024-01-01'::date AND birth_date <= '2026-12-31'::date);

-- ============================================
-- FIX 2: ADD COMPOSITE INDEXES FOR PERFORMANCE
-- Issue: Missing optimal indexes for frequently joined/queried columns
-- Solution: Add composite indexes for common query patterns
-- ============================================

-- Composite index for pool predictions: gender + birth_date (common filtering combination)
CREATE INDEX IF NOT EXISTS idx_pool_predictions_gender_birth_date 
ON baby_shower.pool_predictions(gender, birth_date);

-- Composite index for quiz results: score + created_at (for leaderboard queries)
CREATE INDEX IF NOT EXISTS idx_quiz_results_score_created 
ON baby_shower.quiz_results(score DESC, created_at DESC);

-- Composite index for guestbook: relationship + created_at (for filtering by guest type)
CREATE INDEX IF NOT EXISTS idx_guestbook_relationship_created 
ON baby_shower.guestbook(relationship, created_at DESC);

-- Composite index for advice: delivery_option + created_at (for time capsule filtering)
CREATE INDEX IF NOT EXISTS idx_advice_delivery_created 
ON baby_shower.advice(delivery_option, created_at DESC);

-- Composite index for votes: created_at + processing_status (for admin queue processing)
CREATE INDEX IF NOT EXISTS idx_votes_status_created 
ON baby_shower.votes(processing_status, created_at DESC);

-- Covering index for game votes: scenario_id + vote_choice + voted_at (for real-time tally)
CREATE INDEX IF NOT EXISTS idx_game_votes_scenario_choice_time 
ON baby_shower.game_votes(scenario_id, vote_choice, voted_at DESC);

-- ============================================
-- FIX 3: DATA TYPE CONSISTENCY
-- Issue: Inconsistent handling of nullable fields in related tables
-- Solution: Standardize constraints across related tables
-- ============================================

-- Standardize processing_status default values across all tables
ALTER TABLE baby_shower.guestbook ALTER COLUMN processing_status SET DEFAULT 'pending';
ALTER TABLE baby_shower.votes ALTER COLUMN processing_status SET DEFAULT 'pending';
ALTER TABLE baby_shower.pool_predictions ALTER COLUMN processing_status SET DEFAULT 'pending';
ALTER TABLE baby_shower.quiz_results ALTER COLUMN processing_status SET DEFAULT 'pending';
ALTER TABLE baby_shower.advice ALTER COLUMN processing_status SET DEFAULT 'pending';

-- Add missing total_questions column to quiz_results if not exists (referenced in trigger)
ALTER TABLE baby_shower.quiz_results ADD COLUMN IF NOT EXISTS total_questions INTEGER DEFAULT 5;

-- Ensure ai_roasts has proper foreign key constraint name
ALTER TABLE baby_shower.ai_roasts DROP CONSTRAINT IF EXISTS ai_roasts_prediction_id_fkey;
ALTER TABLE baby_shower.ai_roasts 
ADD CONSTRAINT ai_roasts_prediction_id_fkey 
FOREIGN KEY (prediction_id) REFERENCES baby_shower.pool_predictions(id) ON DELETE CASCADE;

-- ============================================
-- FIX 4: RLS POLICY ENHANCEMENTS
-- Issue: Some tables may have incomplete RLS coverage
-- Solution: Verify and add missing policies where needed
-- ============================================

-- Ensure ai_roasts has proper INSERT policy for service_role (already exists, but verify)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_roasts' 
        AND policyname = 'Deny roasts inserts'
    ) THEN
        CREATE POLICY "Deny roasts inserts" ON baby_shower.ai_roasts
            FOR INSERT USING (auth.jwt()->>'role' = 'service_role');
    END IF;
END $$;

-- Add UPDATE policy for ai_roasts to allow status updates
CREATE POLICY IF NOT EXISTS "Allow roasts updates" ON baby_shower.ai_roasts
    FOR UPDATE USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- FIX 5: GAME TABLE CONSISTENCY
-- Issue: game_votes unique constraints may cause issues with anonymous users
-- Solution: Make guest_name unique constraint conditional
-- ============================================

-- Drop the strict UNIQUE constraint and replace with partial index for authenticated users
ALTER TABLE baby_shower.game_votes DROP CONSTRAINT IF EXISTS game_votes_guest_name_key;

-- Create partial unique index for authenticated users (guest_id must be unique per scenario)
CREATE UNIQUE INDEX IF NOT EXISTS idx_game_votes_authenticated_unique 
ON baby_shower.game_votes(scenario_id, guest_id) 
WHERE guest_id IS NOT NULL;

-- ============================================
-- FIX 6: HELPER FUNCTION UPDATES
-- Issue: Some helper functions may need updates for new constraints
-- Solution: Update functions to handle edge cases
-- ============================================

-- Update the quiz sync function to handle new total_questions column properly
CREATE OR REPLACE FUNCTION baby_shower.sync_quiz_answers()
RETURNS TRIGGER AS $$
BEGIN
    -- If individual puzzle columns are provided but answers JSONB is empty/null, build JSONB
    IF (NEW.puzzle1 IS NOT NULL OR NEW.puzzle2 IS NOT NULL OR NEW.puzzle3 IS NOT NULL OR 
        NEW.puzzle4 IS NOT NULL OR NEW.puzzle5 IS NOT NULL) AND 
       (NEW.answers IS NULL OR NEW.answers = '{}'::jsonb) THEN
        
        NEW.answers := JSONB_BUILD_OBJECT(
            'puzzle1', NEW.puzzle1,
            'puzzle2', NEW.puzzle2, 
            'puzzle3', NEW.puzzle3,
            'puzzle4', NEW.puzzle4,
            'puzzle5', NEW.puzzle5
        );
    END IF;
    
    -- Set total_questions default if not provided
    IF NEW.total_questions IS NULL THEN
        NEW.total_questions := 5;
    END IF;
    
    -- Ensure score is set if answers are provided
    IF NEW.score IS NULL AND NEW.answers IS NOT NULL THEN
        NEW.score := 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FIX 7: PERFORMANCE OPTIMIZATION
-- Issue: Query performance may suffer without proper statistics
-- Solution: Update statistics for query planner
-- ============================================

-- Analyze tables to update query planner statistics
ANALYZE baby_shower.guestbook;
ANALYZE baby_shower.votes;
ANALYZE baby_shower.pool_predictions;
ANALYZE baby_shower.quiz_results;
ANALYZE baby_shower.advice;
ANALYZE baby_shower.ai_roasts;
ANALYZE baby_shower.game_sessions;
ANALYZE baby_shower.game_scenarios;
ANALYZE baby_shower.game_votes;
ANALYZE baby_shower.game_answers;
ANALYZE baby_shower.game_results;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify birth date constraint is updated
SELECT 
    'Birth Date Constraint Check' as check_type,
    constraint_name,
    check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'baby_shower'
AND tc.table_name = 'pool_predictions'
AND tc.constraint_type = 'CHECK'
AND tc.constraint_name LIKE '%birth_date%';

-- Verify all indexes exist including new composite ones
SELECT 
    'Indexes Check' as check_type,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'baby_shower'
AND indexname LIKE '%idx_%'
ORDER BY tablename, indexname;

-- Verify composite indexes
SELECT 
    'Composite Indexes Check' as check_type,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'baby_shower'
AND indexdef LIKE '%(%' 
AND indexdef LIKE '%,%';

-- Verify RLS is enabled on all tables
SELECT 
    'RLS Check' as check_type,
    tablename,
    relrowsecurity as rls_enabled,
    relhasoids as has_oids
FROM pg_tables
WHERE schemaname = 'baby_shower'
ORDER BY tablename;

-- Verify policies exist for all tables
SELECT 
    'Policies Check' as check_type,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'baby_shower'
ORDER BY tablename, cmd;

SELECT 'Schema constraint fixes applied successfully' as result;
