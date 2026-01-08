-- Migration: Add submitted_by to baby_shower.game_players
-- Created: 2026-01-09
-- Purpose: Track who added each player to a game session

-- ============================================================================
-- STEP 1: Add submitted_by column to game_players table
-- ============================================================================

ALTER TABLE baby_shower.game_players
ADD COLUMN IF NOT EXISTS submitted_by VARCHAR(100);

-- Add comment for documentation
COMMENT ON COLUMN baby_shower.game_players.submitted_by IS 'Name of player who added this entry (usually same as player_name for self-join)';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_game_players_submitted_by ON baby_shower.game_players(submitted_by);

-- ============================================================================
-- STEP 2: Update add_game_player RPC function to accept and populate submitted_by
-- ============================================================================

-- Drop existing overloaded functions first
DROP FUNCTION IF EXISTS baby_shower.add_game_player(uuid, varchar);
DROP FUNCTION IF EXISTS baby_shower.add_game_player(uuid, varchar, boolean);

-- Recreate with submitted_by parameter
CREATE OR REPLACE FUNCTION baby_shower.add_game_player(
    p_session_id UUID,
    p_player_name VARCHAR(100),
    p_submitted_by VARCHAR(100) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_player_id UUID;
    v_is_admin BOOLEAN;
    v_existing_count INTEGER;
    v_result JSONB;
    v_effective_submitter VARCHAR(100);
BEGIN
    -- Use player_name as submitted_by if not provided (self-join)
    v_effective_submitter := COALESCE(p_submitted_by, p_player_name);

    -- Lock the session row to prevent race conditions
    PERFORM baby_shower.game_sessions
    FROM baby_shower.game_sessions
    WHERE id = p_session_id
    FOR UPDATE;

    -- Check if this is the first player
    SELECT COUNT(*) INTO v_existing_count
    FROM baby_shower.game_players
    WHERE session_id = p_session_id;

    -- First player becomes admin automatically
    IF v_existing_count = 0 THEN
        v_is_admin := TRUE;
    ELSE
        v_is_admin := FALSE;
    END IF;

    -- Insert the player with submitted_by
    INSERT INTO baby_shower.game_players (
        session_id,
        player_name,
        is_admin,
        is_ready,
        joined_at,
        submitted_by
    ) VALUES (
        p_session_id,
        p_player_name,
        v_is_admin,
        FALSE,
        NOW(),
        v_effective_submitter
    )
    RETURNING id INTO v_player_id;

    -- Return the player data with all current players
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', p.id,
            'player_name', p.player_name,
            'is_admin', p.is_admin,
            'is_ready', p.is_ready,
            'joined_at', p.joined_at,
            'submitted_by', p.submitted_by
        ) ORDER BY p.joined_at
    ) INTO v_result
    FROM baby_shower.game_players p
    WHERE p.session_id = p_session_id;

    -- Return the result
    RETURN jsonb_build_object(
        'id', v_player_id,
        'player_name', p_player_name,
        'is_admin', v_is_admin,
        'session_id', p_session_id,
        'submitted_by', v_effective_submitter,
        'players', COALESCE(v_result, '[]'::jsonb)
    );
END;
$function$;

-- ============================================================================
-- STEP 3: Grant permissions
-- ============================================================================

GRANT USAGE ON SCHEMA baby_shower TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION baby_shower.add_game_player(UUID, VARCHAR, VARCHAR) TO anon, authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'baby_shower'
  AND table_name = 'game_players'
  AND column_name = 'submitted_by';

-- Check the function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'baby_shower'
  AND routine_name = 'add_game_player';
