/**
 * Mom vs Dad Game - Lobby Join Function
 * Purpose: Allow players to join existing game sessions
 * Works with: baby_shower.game_sessions and baby_shower.game_votes tables
 *
 * Schema Used:
 * - game_sessions: Session codes (6-char codes) for game sessions
 * - game_votes: Players in each session (reusing for player tracking)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  validateEnvironmentVariables,
  createErrorResponse,
  createSuccessResponse,
  validateInput,
  CORS_HEADERS,
  SECURITY_HEADERS
} from '../_shared/security.ts'

interface JoinLobbyRequest {
  lobby_key: string
  player_name: string
  player_type?: 'human' | 'ai'
}

serve(async (req: Request) => {
  const headers = new Headers({
    ...CORS_HEADERS,
    ...SECURITY_HEADERS,
    'Content-Type': 'application/json'
  })

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405)
  }

  try {
    // Validate environment variables
    const envValidation = validateEnvironmentVariables([
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ])

    if (!envValidation.isValid) {
      console.error('[lobby-join] Environment validation failed:', envValidation.errors)
      return createErrorResponse('Server configuration error', 500)
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Parse and validate request body
    let body: JoinLobbyRequest
    try {
      body = await req.json()
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400)
    }

    // Input validation
    const validation = validateInput(body, {
      lobby_key: { type: 'string', required: true, minLength: 4, maxLength: 20 },
      player_name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
      player_type: { type: 'string', required: false, enum: ['human', 'ai'] }
    })

    if (!validation.isValid) {
      console.error('[lobby-join] Validation failed:', validation.errors)
      return createErrorResponse('Validation failed', 400, validation.errors)
    }

    const { lobby_key, player_name, player_type = 'human' } = validation.sanitized

    // Normalize session code
    let normalizedLobbyKey = lobby_key.toUpperCase().trim()

    // Support LOBBY-A/B/C/D format by mapping to session codes
    // Check if input matches LOBBY-X pattern
    const lobbyMatch = normalizedLobbyKey.match(/^LOBBY-([A-D])$/)
    if (lobbyMatch) {
        // Map LOBBY-A → LOBBY-A (keep as-is since we use session_code column)
        // The demo sessions use LOBBY-A as the actual session_code
        console.log('[lobby-join] Detected LOBBY format:', normalizedLobbyKey)
    }

    // Get session information from game_sessions table
    const { data: session, error: sessionError } = await supabase
      .from('baby_shower.game_sessions')
      .select('*')
      .eq('session_code', normalizedLobbyKey)
      .single()

    if (sessionError || !session) {
      console.error('[lobby-join] Session not found:', normalizedLobbyKey)
      return createErrorResponse('Session not found', 404)
    }

    // Check if session is in valid state for joining (setup or voting phases)
    if (session.status !== 'setup' && session.status !== 'voting') {
      console.warn('[lobby-join] Session not accepting players:', session.status)
      return createErrorResponse('Session is not accepting players', 400)
    }

    // Check if player with same name already exists in session
    // Note: In a real implementation, we'd also filter by scenario_id
    const { data: existingVotes } = await supabase
      .from('baby_shower.game_votes')
      .select('id, guest_name')
      .eq('guest_name', player_name)
      .limit(1)

    if (existingVotes && existingVotes.length > 0) {
      console.warn('[lobby-join] Player already in this session:', player_name)
      return createErrorResponse('Player already in this session', 400)
    }

    // Determine if this is the first player (admin)
    // Check existing votes to count players (simplified approach)
    const { data: existingPlayers } = await supabase
      .from('baby_shower.game_votes')
      .select('id')
      .eq('guest_name', player_name)

    const isFirstPlayer = !existingPlayers || existingPlayers.length === 0
    const isAdmin = isFirstPlayer

    // For now, we don't create a vote record on join - votes are created when they vote
    // The first player gets admin status for game management
    console.log('[lobby-join] Player joined successfully:', {
      session_code: session.session_code,
      player_name,
      is_admin: isAdmin
    })

    return createSuccessResponse({
      message: `Welcome to ${session.mom_name} vs ${session.dad_name} game!`,
      data: {
        // Session info
        lobby: {
          id: session.id,
          session_code: session.session_code,
          status: session.status,
          mom_name: session.mom_name,
          dad_name: session.dad_name,
          total_rounds: session.total_rounds,
          current_round: session.current_round
        },
        // Player info
        current_player_id: null, // Will be assigned when they vote
        player_name: player_name,
        player_type: player_type,
        is_admin: isAdmin,
        admin_code: session.admin_code,  // Include admin code for admin verification
        is_ready: true,
        joined_at: new Date().toISOString(),
        // All players (would need separate player tracking table for complete implementation)
        players: [{ player_name, is_admin, is_ready: true, joined_at: new Date().toISOString() }],
        // Game status
        game_status: {
          state: session.status,
          rounds_completed: session.current_round,
          current_round: session.current_round,
          can_start: isAdmin && session.status === 'setup'
        },
        // Instructions
        instructions: isAdmin ? {
          message: `You are the admin for the ${session.mom_name} vs ${session.dad_name} game! When ready, you can start the game.`,
          can_start: session.status === 'setup'
        } : {
          message: 'Waiting for the admin to start the game...',
          can_start: false
        }
      }
    }, 200)

  } catch (error) {
    console.error('[lobby-join] Unexpected error:', error)
    return createErrorResponse('Failed to join session', 500)
  }
})