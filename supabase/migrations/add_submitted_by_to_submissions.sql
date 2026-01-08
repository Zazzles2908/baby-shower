-- Migration: Add submitted_by to baby_shower.submissions
-- Created: 2026-01-09
-- Purpose: Track who created each submission for accountability

-- ============================================================================
-- STEP 1: Add submitted_by column to submissions table
-- ============================================================================

ALTER TABLE baby_shower.submissions
ADD COLUMN IF NOT EXISTS submitted_by TEXT;

-- Add comment for documentation
COMMENT ON COLUMN baby_shower.submissions.submitted_by IS 'Name of person who created this submission record';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_by ON baby_shower.submissions(submitted_by);

-- ============================================================================
-- STEP 2: Update insert_submission RPC function to accept and populate submitted_by
-- ============================================================================

-- Check if insert_submission function exists and get its current definition
DROP FUNCTION IF EXISTS baby_shower.insert_submission;

-- Create updated function with submitted_by support
CREATE OR REPLACE FUNCTION baby_shower.insert_submission(
    p_name TEXT,
    p_activity_type TEXT,
    p_activity_data JSONB DEFAULT '{}'::jsonb,
    p_message TEXT DEFAULT NULL,
    p_advice_type TEXT DEFAULT NULL,
    p_date_guess DATE DEFAULT NULL,
    p_time_guess TIME DEFAULT NULL,
    p_weight_guess NUMERIC DEFAULT NULL,
    p_length_guess INTEGER DEFAULT NULL,
    p_puzzle1 TEXT DEFAULT NULL,
    p_puzzle2 TEXT DEFAULT NULL,
    p_puzzle3 TEXT DEFAULT NULL,
    p_puzzle4 TEXT DEFAULT NULL,
    p_puzzle5 TEXT DEFAULT NULL,
    p_score INTEGER DEFAULT NULL,
    p_selected_names TEXT DEFAULT NULL,
    p_photo_url TEXT DEFAULT NULL,
    p_relationship TEXT DEFAULT NULL,
    p_favourite_colour VARCHAR DEFAULT NULL,
    p_submitted_by TEXT DEFAULT NULL
)
RETURNS TABLE(id BIGINT, name TEXT, activity_type TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    INSERT INTO baby_shower.submissions (
        name,
        activity_type,
        activity_data,
        message,
        advice_type,
        date_guess,
        time_guess,
        weight_guess,
        length_guess,
        puzzle1,
        puzzle2,
        puzzle3,
        puzzle4,
        puzzle5,
        score,
        selected_names,
        photo_url,
        relationship,
        favourite_colour,
        submitted_by
    )
    VALUES (
        p_name,
        p_activity_type,
        p_activity_data,
        p_message,
        p_advice_type,
        p_date_guess,
        p_time_guess,
        p_weight_guess,
        p_length_guess,
        p_puzzle1,
        p_puzzle2,
        p_puzzle3,
        p_puzzle4,
        p_puzzle5,
        p_score,
        p_selected_names,
        p_photo_url,
        p_relationship,
        p_favourite_colour,
        p_submitted_by
    )
    RETURNING
        baby_shower.submissions.id,
        baby_shower.submissions.name,
        baby_shower.submissions.activity_type,
        baby_shower.submissions.created_at;
END;
$function$;

-- ============================================================================
-- STEP 3: Grant permissions
-- ============================================================================

GRANT USAGE ON SCHEMA baby_shower TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION baby_shower.insert_submission(
    TEXT, TEXT, JSONB, TEXT, TEXT, DATE, TIME, NUMERIC, INTEGER,
    TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT
) TO anon, authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'baby_shower'
  AND table_name = 'submissions'
  AND column_name = 'submitted_by';

-- Check the function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'baby_shower'
  AND routine_name = 'insert_submission';
