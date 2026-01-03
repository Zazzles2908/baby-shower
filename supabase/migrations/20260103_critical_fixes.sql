-- ============================================================================
-- BABY SHOWER APP - CRITICAL DATABASE FIXES
-- Fixes for: Duplicate Key, Missing Quiz Columns, Voting Table Issues
-- Project: bkszmvfsfgvdwzacgmfz
-- Date: 2026-01-03
-- ============================================================================

-- ============================================
-- FIX 1: GUESTBOOK DUPLICATE KEY RESOLUTION
-- Issue: Sequence out of sync or manual inserts causing conflicts
-- Solution: Reset sequences to max+1 of current data
-- ============================================

-- Reset guestbook sequence to avoid future duplicates
SELECT setval('baby_shower.guestbook_id_seq', COALESCE((SELECT MAX(id) FROM baby_shower.guestbook), 0) + 1, true);

-- Reset votes sequence  
SELECT setval('baby_shower.votes_id_seq', COALESCE((SELECT MAX(id) FROM baby_shower.votes), 0) + 1, true);

-- Reset pool_predictions sequence
SELECT setval('baby_shower.pool_predictions_id_seq', COALESCE((SELECT MAX(id) FROM baby_shower.pool_predictions), 0) + 1, true);

-- Reset quiz_results sequence
SELECT setval('baby_shower.quiz_results_id_seq', COALESCE((SELECT MAX(id) FROM baby_shower.quiz_results), 0) + 1, true);

-- Reset advice sequence
SELECT setval('baby_shower.advice_id_seq', COALESCE((SELECT MAX(id) FROM baby_shower.advice), 0) + 1, true);

-- ============================================
-- FIX 2: QUIZ MISSING COLUMNS  
-- Issue: Frontend sends puzzle1-puzzle5 but table expects JSONB answers
-- Solution: Add individual puzzle columns and create trigger to convert to JSONB
-- ============================================

-- Add missing puzzle columns to quiz_results table
ALTER TABLE baby_shower.quiz_results ADD COLUMN IF NOT EXISTS puzzle1 TEXT;
ALTER TABLE baby_shower.quiz_results ADD COLUMN IF NOT EXISTS puzzle2 TEXT;
ALTER TABLE baby_shower.quiz_results ADD COLUMN IF NOT EXISTS puzzle3 TEXT;
ALTER TABLE baby_shower.quiz_results ADD COLUMN IF NOT EXISTS puzzle4 TEXT;
ALTER TABLE baby_shower.quiz_results ADD COLUMN IF NOT EXISTS puzzle5 TEXT;

-- Create function to sync puzzle columns to JSONB answers column
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
    
    -- Calculate score from answers if not provided
    IF NEW.score IS NULL AND NEW.answers IS NOT NULL THEN
        -- Simple scoring: check if answers match expected patterns
        NEW.score := 0;
        -- This is a placeholder - actual scoring logic depends on expected answers
    END IF;
    
    -- Set total_questions default
    IF NEW.total_questions IS NULL THEN
        NEW.total_questions := 5;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync quiz answers
DROP TRIGGER IF EXISTS trg_sync_quiz_answers ON baby_shower.quiz_results;
CREATE TRIGGER trg_sync_quiz_answers
    BEFORE INSERT OR UPDATE ON baby_shower.quiz_results
    FOR EACH ROW
    EXECUTE FUNCTION baby_shower.sync_quiz_answers();

-- ============================================
-- FIX 3: VOTING TABLE REFERENCE ISSUES  
-- Issue: Application looking for public.baby_shower.votes instead of baby_shower.votes
-- Solution: Create view in public schema for compatibility and fix any missing indexes
-- ============================================

-- Create a view in public schema for compatibility with existing queries
CREATE OR REPLACE VIEW public.votes AS 
SELECT * FROM baby_shower.votes;

-- Add missing GIN index for JSONB selected_names if not exists
CREATE INDEX IF NOT EXISTS idx_votes_gin_names ON baby_shower.votes USING GIN (selected_names);

-- ============================================
-- FIX 4: ADDITIONAL SEQUENCE SYNCHRONIZATION
-- Sync the baby_shower.submissions table sequence as well
-- ============================================

SELECT setval('baby_shower.submissions_id_seq', COALESCE((SELECT MAX(id) FROM baby_shower.submissions), 0) + 1, true);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify sequences are properly set
SELECT 
    'Sequence Check' as check_type,
    schemaname,
    tablename, 
    column_name,
    column_default
FROM information_schema.columns 
WHERE column_default LIKE 'nextval%' 
AND schemaname = 'baby_shower'
ORDER BY tablename;

-- Verify quiz table has all required columns
SELECT 
    'Quiz Columns Check' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'quiz_results' 
AND table_schema = 'baby_shower'
ORDER BY ordinal_position;

-- Verify votes table and view exist
SELECT 
    'Votes Tables Check' as check_type,
    table_schema,
    table_name 
FROM information_schema.tables 
WHERE table_schema IN ('baby_shower', 'public')
AND table_name = 'votes';

SELECT 'Database fixes applied successfully' as result;