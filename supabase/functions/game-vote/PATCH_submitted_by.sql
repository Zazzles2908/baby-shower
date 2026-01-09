-- Edge Function Patch: Update game-vote to populate submitted_by
-- File: supabase/functions/game-vote/index.ts (lines 148-160)
-- Purpose: Include guest_name as submitted_by when inserting votes

-- ============================================================================
-- FIND THE INSERT BLOCK (around line 148-160)
-- ============================================================================

/*
ORIGINAL CODE TO REPLACE:

    // Insert vote into game_votes table
    const { error: insertVoteError } = await supabase
      .from('baby_shower.game_votes')
      .insert({
        scenario_id: scenario_id,
        guest_name: guest_name,
        vote_choice: vote_choice
      })

REPLACE WITH:

    // Insert vote into game_votes table with submitted_by
    const { error: insertVoteError } = await supabase
      .from('baby_shower.game_votes')
      .insert({
        scenario_id: scenario_id,
        guest_name: guest_name,
        vote_choice: vote_choice,
        submitted_by: guest_name  // Track who submitted this vote
      })
*/

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Check if submitted_by column exists and has data
SELECT
    COUNT(*) as total_votes,
    COUNT(submitted_by) as votes_with_submitter,
    COUNT(*) - COUNT(submitted_by) as votes_without_submitter
FROM baby_shower.game_votes;

-- Sample of recent votes with submitted_by
SELECT id, guest_name, vote_choice, submitted_by, voted_at
FROM baby_shower.game_votes
ORDER BY voted_at DESC
LIMIT 10;
