/**
 * Mom vs Dad Game - Game Vote Function (Simplified Lobby Architecture)
 * 
 * Purpose: Submit vote for current scenario, update vote counts in real-time
 * Trigger: POST /game-vote
 * 
 * Logic Flow:
 * - Validates player is in lobby and game is active
 * - Records player vote and updates player's ready status
 * - Updates vote counts in game session
 * - Checks if all players have voted
 * - Broadcasts vote_update event via Supabase
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

interface GameVoteRequest {
  lobby_key: string
  player_id: string
  round_id: string
  vote: 'mom' | 'dad'
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
      console.error('Game Vote - Environment validation failed:', envValidation.errors)
      return createErrorResponse('Server configuration error', 500)
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Parse and validate request body
    let body: GameVoteRequest
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
      },
      player_id: { type: 'string', required: true },
      round_id: { type: 'string', required: true },
      vote: { type: 'string', required: true, pattern: /^(mom|dad)$/ }
    })

    if (!validation.isValid) {
      console.error('Game Vote - Validation failed:', validation.errors)
      return createErrorResponse('Validation failed', 400, validation.errors)
    }

    const { lobby_key, player_id, round_id, vote } = validation.sanitized

    // Fetch lobby
    const { data: lobby, error: lobbyError } = await supabase
      .from('mom_dad_lobbies')
      .select('*')
      .eq('lobby_key', lobby_key)
      .single()

    if (lobbyError || !lobby) {
      console.error('Game Vote - Lobby not found:', lobby_key)
      return createErrorResponse('Lobby not found', 404)
    }

    if (lobby.status !== 'active') {
      console.error('Game Vote - Game not active:', lobby.status)
      return createErrorResponse('Game is not active', 400)
    }

    // Fetch player
    const { data: player, error: playerError } = await supabase
      .from('mom_dad_players')
      .select('*')
      .eq('id', player_id)
      .eq('lobby_id', lobby.id)
      .is('disconnected_at', null)
      .single()

    if (playerError || !player) {
      console.error('Game Vote - Player not found:', player_id)
      return createErrorResponse('Player not found or not in lobby', 404)
    }

    // Fetch game session (round)
    const { data: round, error: roundError } = await supabase
      .from('mom_dad_game_sessions')
      .select('*')
      .eq('id', round_id)
      .eq('lobby_id', lobby.id)
      .single()

    if (roundError || !round) {
      console.error('Game Vote - Round not found:', round_id)
      return createErrorResponse('Round not found', 404)
    }

    if (round.status !== 'voting') {
      console.error('Game Vote - Round not accepting votes:', round.status)
      return createErrorResponse('Round is not accepting votes', 400)
    }

    // Check if player already voted this round
    if (player.current_vote) {
      console.error('Game Vote - Player already voted:', player_id)
      return createErrorResponse('You have already voted this round', 400)
    }

    // Update player with vote
    const { error: updatePlayerError } = await supabase
      .from('mom_dad_players')
      .update({
        current_vote: vote,
        is_ready: true
      })
      .eq('id', player_id)

    if (updatePlayerError) {
      console.error('Game Vote - Player update failed:', updatePlayerError)
      throw updatePlayerError
    }

    // Update vote counts in game session
    const newMomVotes = round.mom_votes + (vote === 'mom' ? 1 : 0)
    const newDadVotes = round.dad_votes + (vote === 'dad' ? 1 : 0)
    const totalVotes = newMomVotes + newDadVotes

    // Calculate percentages
    const momPercentage = totalVotes > 0 ? (newMomVotes / totalVotes) * 100 : 0
    const dadPercentage = totalVotes > 0 ? (newDadVotes / totalVotes) * 100 : 0

    const { error: updateRoundError } = await supabase
      .from('mom_dad_game_sessions')
      .update({
        mom_votes: newMomVotes,
        dad_votes: newDadVotes,
        mom_percentage: Math.round(momPercentage * 100) / 100,
        dad_percentage: Math.round(dadPercentage * 100) / 100
      })
      .eq('id', round_id)

    if (updateRoundError) {
      console.error('Game Vote - Round update failed:', updateRoundError)
      throw updateRoundError
    }

    // Get all active players to check if everyone voted
    const { data: allPlayers, error: playersError } = await supabase
      .from('mom_dad_players')
      .select('id, current_vote, player_type')
      .eq('lobby_id', lobby.id)
      .is('disconnected_at', null)

    if (playersError) {
      console.error('Game Vote - Failed to fetch players:', playersError)
      throw playersError
    }

    const players = allPlayers || []
    const votedPlayers = players.filter(p => p.current_vote !== null)
    const allVoted = votedPlayers.length === players.length

    // Fetch updated round data
    const { data: updatedRound } = await supabase
      .from('mom_dad_game_sessions')
      .select('*')
      .eq('id', round_id)
      .single()

    // Broadcast vote update
    try {
      await supabase.channel(`lobby:${lobby_key}`)
        .send({
          type: 'broadcast',
          event: 'vote_update',
          payload: {
            round_id,
            player_id,
            player_name: player.player_name,
            vote,
            mom_votes: newMomVotes,
            dad_votes: newDadVotes,
            mom_percentage: updatedRound?.mom_percentage,
            dad_percentage: updatedRound?.dad_percentage,
            voted_count: votedPlayers.length,
            total_players: players.length,
            all_voted: allVoted
          }
        })
      console.log('Game Vote - Broadcasted vote_update event')
    } catch (broadcastError) {
      console.warn('Game Vote - Vote update broadcast failed:', broadcastError)
    }

    console.log('Game Vote - Successfully recorded vote:', { 
      player_id, 
      vote, 
      round: round_id,
      mom_votes: newMomVotes,
      dad_votes: newDadVotes,
      all_voted: allVoted
    })

    return createSuccessResponse({
      message: 'Vote recorded successfully',
      vote,
      round: updatedRound,
      all_voted,
      voted_count: votedPlayers.length,
      total_players: players.length
    }, 200)

  } catch (error) {
    console.error('Game Vote - Unexpected error:', error)
    return createErrorResponse('Failed to record vote', 500)
  }
})
