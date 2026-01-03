/**
 * Mom vs Dad Game - Lobby Status Function
 * 
 * Purpose: Return current lobby state, list all players, indicate game status
 * Trigger: POST /lobby-status
 * 
 * Logic Flow:
 * - Validates lobby exists
 * - Returns complete lobby state with players list
 * - Includes current game session if active
 * - Provides real-time game status (waiting/active/completed)
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

interface LobbyStatusRequest {
  lobby_key: string
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
      console.error('Lobby Status - Environment validation failed:', envValidation.errors)
      return createErrorResponse('Server configuration error', 500)
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Parse and validate request body
    let body: LobbyStatusRequest
    try {
      body = await req.json()
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400)
    }

    // Input validation
    const validation = validateInput(body, {
      lobby_key: { 
        type: 'string', 
        required: true, 
        pattern: /^(LOBBY-A|LOBBY-B|LOBBY-C|LOBBY-D)$/ 
      }
    })

    if (!validation.isValid) {
      console.error('Lobby Status - Validation failed:', validation.errors)
      return createErrorResponse('Validation failed', 400, validation.errors)
    }

    const { lobby_key } = validation.sanitized

    // Fetch lobby
    const { data: lobby, error: lobbyError } = await supabase
      .from('mom_dad_lobbies')
      .select('*')
      .eq('lobby_key', lobby_key)
      .single()

    if (lobbyError || !lobby) {
      console.error('Lobby Status - Lobby not found:', lobby_key)
      return createErrorResponse('Lobby not found', 404)
    }

    // Fetch active players
    const { data: players, error: playersError } = await supabase
      .from('mom_dad_players')
      .select('*')
      .eq('lobby_id', lobby.id)
      .is('disconnected_at', null)
      .order('joined_at', { ascending: true })

    if (playersError) {
      console.error('Lobby Status - Failed to fetch players:', playersError)
      throw playersError
    }

    // Build response with game status
    const response: Record<string, unknown> = {
      lobby: {
        id: lobby.id,
        lobby_key: lobby.lobby_key,
        lobby_name: lobby.lobby_name,
        status: lobby.status,
        max_players: lobby.max_players,
        current_players: lobby.current_players,
        current_humans: lobby.current_humans,
        current_ai_count: lobby.current_ai_count,
        total_rounds: lobby.total_rounds,
        admin_player_id: lobby.admin_player_id,
        created_at: lobby.created_at,
        updated_at: lobby.updated_at
      },
      players: players || [],
      game_status: {
        state: lobby.status,
        rounds_completed: 0,
        current_round: null,
        can_start: lobby.status === 'waiting' && (players?.length || 0) >= 2
      }
    }

    // If game is active, fetch current game session
    if (lobby.status === 'active' || lobby.status === 'completed') {
      // Get the current or latest round
      const { data: currentRound } = await supabase
        .from('mom_dad_game_sessions')
        .select('*')
        .eq('lobby_id', lobby.id)
        .in('status', ['voting', 'revealed'])
        .order('round_number', { ascending: false })
        .limit(1)
        .single()

      // Get all rounds for this game
      const { data: allRounds } = await supabase
        .from('mom_dad_game_sessions')
        .select('round_number, status')
        .eq('lobby_id', lobby.id)
        .order('round_number', { ascending: true })

      if (currentRound) {
        response.game_status = {
          ...response.game_status as object,
          current_round: currentRound,
          rounds_completed: allRounds?.filter(r => r.status === 'completed').length || 0
        }
      }
    }

    console.log('Lobby Status - Retrieved status for:', lobby_key, { 
      player_count: players?.length || 0,
      game_status: response.game_status 
    })

    return createSuccessResponse(response, 200)

  } catch (error) {
    console.error('Lobby Status - Unexpected error:', error)
    return createErrorResponse('Failed to get lobby status', 500)
  }
})
