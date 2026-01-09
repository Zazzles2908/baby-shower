-- Edge Function Patch: Update game-session to populate submitted_by for players
-- File: supabase/functions/game-session/index.ts (handleJoinSession function)
-- Purpose: Include guest_name as submitted_by when adding game players

-- ============================================================================
-- FIND THE ADD_PLAYER CALL (around line 212-216)
-- ============================================================================

/*
ORIGINAL CODE TO REPLACE:

  const { data: player, error: playerError } = await supabase
    .rpc('add_game_player', { 
      p_session_id: result.id, 
      p_player_name: guest_name 
    })

REPLACE WITH:

  const { data: player, error: playerError } = await supabase
    .rpc('add_game_player', { 
      p_session_id: result.id, 
      p_player_name: guest_name,
      p_submitted_by: guest_name  // Track who added this player (self-join)
    })
*/

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Check if submitted_by column exists and has data in game_players
SELECT
    COUNT(*) as total_players,
    COUNT(submitted_by) as players_with_submitter,
    COUNT(*) - COUNT(submitted_by) as players_without_submitter
FROM baby_shower.game_players;

-- Sample of recent players with submitted_by
SELECT id, player_name, is_admin, submitted_by, joined_at
FROM baby_shower.game_players
ORDER BY joined_at DESC
LIMIT 10;
