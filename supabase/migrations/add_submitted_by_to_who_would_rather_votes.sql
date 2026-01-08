-- Migration: Add submitted_by to baby_shower.who_would_rather_votes
-- Created: 2026-01-09
-- Purpose: Track which guest submitted each shoe game vote

-- ============================================================================
-- STEP 1: Add submitted_by column to who_would_rather_votes table
-- ============================================================================

ALTER TABLE baby_shower.who_would_rather_votes
ADD COLUMN IF NOT EXISTS submitted_by VARCHAR(100);

-- Add comment for documentation
COMMENT ON COLUMN baby_shower.who_would_rather_votes.submitted_by IS 'Name of guest who submitted this vote';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_who_would_rather_votes_submitted_by ON baby_shower.who_would_rather_votes(submitted_by);

-- ============================================================================
-- STEP 2: Note on frontend integration
-- ============================================================================

/*
The who-would-rather.js (Shoe Game) is a FRONTEND-ONLY experience:
- Questions are stored in JavaScript array (no database)
- Votes are tracked in local state (session only)
- No backend submission occurs

If backend storage is needed in the future, the frontend would need to:
1. Add a submitVotes() function that calls an Edge Function
2. The Edge Function would insert into who_would_rather_votes with submitted_by

Example Edge Function (for future implementation):
*/

-- Example schema for reference (already created above):
-- who_would_rather_votes already has:
--   - id UUID PRIMARY KEY DEFAULT gen_random_uuid()
--   - session_id UUID (optional, for session tracking)
--   - question_number INTEGER
--   - guest_name VARCHAR(100)
--   - vote_choice VARCHAR(10) CHECK (vote_choice IN ('mom', 'dad'))
--   - voted_at TIMESTAMPTZ DEFAULT NOW()
--   - submitted_by VARCHAR(100) -- ADDED BY THIS MIGRATION

-- ============================================================================
-- STEP 3: Grant permissions
-- ============================================================================

GRANT USAGE ON SCHEMA baby_shower TO anon, authenticated, service_role;

-- Ensure RLS policies work with new column
ALTER TABLE baby_shower.who_would_rather_votes ENABLE ROW LEVEL SECURITY;

-- Existing policies should still work - they allow INSERT with check (true)
-- No changes needed to policies as the column is nullable

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'baby_shower'
  AND table_name = 'who_would_rather_votes'
  AND column_name = 'submitted_by';

-- List all columns in who_would_rather_votes
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'baby_shower'
  AND table_name = 'who_would_rather_votes'
ORDER BY ordinal_position;
