-- Migration: Add submitted_by to baby_shower.game_votes
-- Created: 2026-01-09
-- Purpose: Track which guest submitted each vote for accountability

-- ============================================================================
-- STEP 1: Add submitted_by column to game_votes table
-- ============================================================================

ALTER TABLE baby_shower.game_votes
ADD COLUMN IF NOT EXISTS submitted_by VARCHAR(100);

-- Add comment for documentation
COMMENT ON COLUMN baby_shower.game_votes.submitted_by IS 'Name of guest who submitted this vote';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_game_votes_submitted_by ON baby_shower.game_votes(submitted_by);

-- ============================================================================
-- STEP 2: Grant permissions (RLS already enabled)
-- ============================================================================

-- Ensure RLS policies still work with new column
-- The existing policies allow INSERT with check (true), so no changes needed

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'baby_shower'
  AND table_name = 'game_votes'
  AND column_name = 'submitted_by';

-- List all columns in game_votes
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'baby_shower'
  AND table_name = 'game_votes'
ORDER BY ordinal_position;
