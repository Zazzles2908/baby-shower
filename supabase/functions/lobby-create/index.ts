/**
 * Mom vs Dad Game - Lobby Create Function
 * 
 * Purpose: Create lobby when first user joins, automatically assigning admin status
 * Trigger: POST /lobby-create
 * 
 * Logic Flow:
 * - Validates that the requested lobby exists and is in waiting status
 * - If lobby is empty, joining player automatically becomes admin
 * - Creates player record, updates lobby player count
 * - Returns complete lobby state including all current players
 * - Broadcasts player_joined event via Supabase realtime
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

interface JoinRequest {
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
    ], ['MINIMAX_API_KEY', 'Z_AI_API_KEY', 'KIMI_API_KEY'])

    if (!envValidation.isValid) {
      console.error('Lobby Create - Environment validation failed:', envValidation.errors)
      return createErrorResponse('Server configuration error', 500)
    }

    if (envValidation.warnings.length > 0) {
      console.warn('Lobby Create - Environment warnings:', envValidation.warnings)
    }

    // Initialize Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Parse and validate request body
    let body: JoinRequest
    try {
      body = await req.json()
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400)
    }

    // Input validation using standardized function
    const validation = validateInput(body, {
      lobby_key: { 
        type: 'string', 
        required: true, 
        pattern: /^(LOBBY-A|LOBBY-B|LOBBY-C|LOBBY-D)$/ 
      },
      player_name: { 
        type: 'string', 
        required: true, 
        minLength: 1, 
        maxLength: 50 
      },
      player_type: { 
        type: 'string', 
        required: false, 
        pattern: /^(human|ai)$/ 
      }
    })

    if (!validation.isValid) {
      console.error('Lobby Create - Validation failed:', validation.errors)
      return createErrorResponse('Validation failed', 400, validation.errors)
    }

    const { lobby_key, player_name, player_type = 'human' } = validation.sanitized

    // Fetch lobby and check capacity
    const { data: lobby, error: lobbyError } = await supabase
      .from('mom_dad_lobbies')
      .select('*')
      .eq('lobby_key', lobby_key)
      .single()

    if (lobbyError || !lobby) {
      console.error('Lobby Create - Lobby not found:', lobby_key)
      return createErrorResponse('Lobby not found', 404)
    }

    if (lobby.current_players >= lobby.max_players) {
      console.error('Lobby Create - Lobby is full:', lobby_key)
      return createErrorResponse('Lobby is full', 400)
    }

    if (lobby.status !== 'waiting') {
      console.error('Lobby Create - Lobby not accepting players:', lobby.status)
      return createErrorResponse('Lobby is not accepting new players', 400)
    }

    // Check if player already in lobby (for reconnection scenarios)
    let existingPlayer = null
    let userId: string | null = null
    
    if (player_type === 'human') {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        userId = user?.id || null
        
        if (userId) {
          const { data: player } = await supabase
            .from('mom_dad_players')
            .select('*')
            .eq('lobby_id', lobby.id)
            .eq('user_id', userId)
            .is('disconnected_at', null)
            .single()
          
          if (player) {
            existingPlayer = player
          }
        }
      } catch (authError) {
        console.warn('Lobby Create - Auth check failed, continuing without user:', authError)
      }
    }

    // Determine admin status - first player to join becomes admin
    const isFirstPlayer = lobby.current_players === 0 && !lobby.admin_player_id
    const playerId = existingPlayer?.id || crypto.randomUUID()

    // Create or reactivate player
    if (existingPlayer) {
      console.log('Lobby Create - Reactivating existing player:', existingPlayer.id)
      
      const { error: updateError } = await supabase
        .from('mom_dad_players')
        .update({ 
          disconnected_at: null, 
          is_ready: false,
          current_vote: null,
          player_name: player_name // Update name in case it changed
        })
        .eq('id', existingPlayer.id)

      if (updateError) {
        console.error('Lobby Create - Player reactivation failed:', updateError)
        throw updateError
      }
    } else {
      console.log('Lobby Create - Creating new player:', playerId)
      
      const { error: insertError } = await supabase
        .from('mom_dad_players')
        .insert({
          id: playerId,
          lobby_id: lobby.id,
          user_id: userId,
          player_name,
          player_type,
          is_admin: isFirstPlayer,
          is_ready: false,
          current_vote: null
        })

      if (insertError) {
        console.error('Lobby Create - Player creation failed:', insertError)
        throw insertError
      }
    }

    // Update lobby player counts
    const updateData: Record<string, unknown> = { 
      updated_at: new Date().toISOString() 
    }
    
    if (isFirstPlayer) {
      updateData.admin_player_id = playerId
    }
    
    if (player_type === 'human') {
      updateData.current_humans = lobby.current_humans + 1
    } else {
      updateData.current_ai_count = lobby.current_ai_count + 1
    }
    updateData.current_players = lobby.current_players + 1

    const { error: updateLobbyError } = await supabase
      .from('mom_dad_lobbies')
      .update(updateData)
      .eq('id', lobby.id)

    if (updateLobbyError) {
      console.error('Lobby Create - Lobby update failed:', updateLobbyError)
      throw updateLobbyError
    }

    // Fetch updated lobby state
    const { data: updatedLobby } = await supabase
      .from('mom_dad_lobbies')
      .select('*')
      .eq('id', lobby.id)
      .single()

    if (!updatedLobby) {
      console.error('Lobby Create - Failed to fetch updated lobby')
      throw new Error('Failed to fetch updated lobby')
    }

    // Fetch all active players in lobby
    const { data: players, error: playersError } = await supabase
      .from('mom_dad_players')
      .select('*')
      .eq('lobby_id', lobby.id)
      .is('disconnected_at', null)
      .order('joined_at', { ascending: true })

    if (playersError) {
      console.error('Lobby Create - Failed to fetch players:', playersError)
      throw playersError
    }

    // Broadcast player joined event via Supabase realtime
    try {
      await supabase.channel(`lobby:${lobby_key}`)
        .send({
          type: 'broadcast',
          event: 'player_joined',
          payload: { 
            player_id: playerId, 
            player_name, 
            is_admin: isFirstPlayer,
            player_type 
          }
        })
      console.log('Lobby Create - Broadcasted player_joined event')
    } catch (broadcastError) {
      console.warn('Lobby Create - Broadcast failed (non-critical):', broadcastError)
      // Continue even if broadcast fails - the HTTP response is more important
    }

    console.log('Lobby Create - Successfully joined lobby:', { 
      lobby_key, 
      player_id: playerId, 
      is_admin: isFirstPlayer 
    })

    return createSuccessResponse({
      lobby: updatedLobby,
      players: players || [],
      current_player_id: playerId,
      is_admin: isFirstPlayer
    }, 200)

  } catch (error) {
    console.error('Lobby Create - Unexpected error:', error)
    return createErrorResponse('Failed to join lobby', 500)
  }
})
