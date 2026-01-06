/**
 * Mom vs Dad Game - Game Vote Function (Unified Schema)
 * Updated to use game_* tables from 20260103_mom_vs_dad_game_schema.sql
 * 
 * Purpose: Submit vote for current scenario, update vote counts in real-time
 * Trigger: POST /game-vote
 * 
 * Schema Mapping:
 * - lobby_key → session_code (from game_sessions)
 * - round_id → scenario_id (from game_scenarios)
 * - player_id + current_vote → game_votes table
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
  session_code: string  // Changed from lobby_key
  guest_name: string    // Changed from player_id
  scenario_id: string   // Changed from round_id
  vote_choice: 'mom' | 'dad'  // Changed from vote
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

    // Input validation - updated for new schema
    const validation = validateInput(body, {
      session_code: { 
        type: 'string', 
        required: true, 
        minLength: 4,
        maxLength: 8
      },
      guest_name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
      scenario_id: { type: 'string', required: true },  // UUID format
      vote_choice: { type: 'string', required: true, pattern: /^(mom|dad)$/ }
    })

    if (!validation.isValid) {
      console.error('Game Vote - Validation failed:', validation.errors)
      return createErrorResponse('Validation failed', 400, validation.errors)
    }

    const { session_code, guest_name, scenario_id, vote_choice } = validation.sanitized

    // Fetch session (replaces lobby lookup)
    const { data: session, error: sessionError } = await supabase
      .from('baby_shower.game_sessions')
      .select('*')
      .eq('session_code', session_code)
      .single()

    if (sessionError || !session) {
      console.error('Game Vote - Session not found:', session_code)
      return createErrorResponse('Session not found', 404)
    }

    if (session.status !== 'voting') {
      console.error('Game Vote - Game not accepting votes:', session.status)
      return createErrorResponse('Game is not accepting votes', 400)
    }

    // Fetch scenario (replaces round lookup)
    const { data: scenario, error: scenarioError } = await supabase
      .from('baby_shower.game_scenarios')
      .select('*')
      .eq('id', scenario_id)
      .eq('session_id', session.id)
      .single()

    if (scenarioError || !scenario) {
      console.error('Game Vote - Scenario not found:', scenario_id)
      return createErrorResponse('Scenario not found', 404)
    }

    if (!scenario.is_active) {
      console.error('Game Vote - Scenario is not active')
      return createErrorResponse('This scenario is no longer active', 400)
    }

    // Check if guest already voted this scenario
    const { data: existingVote, error: voteCheckError } = await supabase
      .from('baby_shower.game_votes')
      .select('id')
      .eq('scenario_id', scenario_id)
      .eq('guest_name', guest_name)
      .maybeSingle()

    if (voteCheckError) {
      console.error('Game Vote - Vote check failed:', voteCheckError)
      throw voteCheckError
    }

    if (existingVote) {
      console.error('Game Vote - Guest already voted:', guest_name)
      return createErrorResponse('You have already voted on this scenario', 400)
    }

    // Insert vote into game_votes table
    const { error: insertVoteError } = await supabase
      .from('baby_shower.game_votes')
      .insert({
        scenario_id: scenario_id,
        guest_name: guest_name,
        vote_choice: vote_choice
      })

    if (insertVoteError) {
      console.error('Game Vote - Vote insert failed:', insertVoteError)
      throw insertVoteError
    }

    // Get updated vote counts using direct SQL query (replaces missing RPC function)
    let voteStats = null
    try {
      const { data: stats, error: statsError } = await supabase
        .from('baby_shower.game_votes')
        .select('vote_choice')
        .eq('scenario_id', scenario_id)

      if (!statsError && stats) {
        const momCount = stats.filter(v => v.vote_choice === 'mom').length
        const dadCount = stats.filter(v => v.vote_choice === 'dad').length
        const totalVotes = stats.length
        const momPercentage = totalVotes > 0 ? (momCount / totalVotes) * 100 : 0
        const dadPercentage = totalVotes > 0 ? (dadCount / totalVotes) * 100 : 0

        voteStats = {
          mom_count: momCount,
          dad_count: dadCount,
          mom_percentage: Math.round(momPercentage * 100) / 100,
          dad_percentage: Math.round(dadPercentage * 100) / 100
        }
      } else if (statsError) {
        console.warn('Game Vote - Could not get vote stats:', statsError)
      }
    } catch (e) {
      console.warn('Game Vote - Error calculating vote stats:', e)
    }

    // Broadcast vote update via realtime
    try {
      await supabase.channel(`game:${session_code}`)
        .send({
          type: 'broadcast',
          event: 'vote_update',
          payload: {
            scenario_id,
            guest_name,
            vote_choice,
            mom_votes: voteStats?.mom_count || 0,
            dad_votes: voteStats?.dad_count || 0,
            mom_percentage: voteStats?.mom_percentage || 0,
            dad_percentage: voteStats?.dad_percentage || 0
          }
        })
      console.log('Game Vote - Broadcasted vote_update event')
    } catch (broadcastError) {
      console.warn('Game Vote - Vote update broadcast failed:', broadcastError)
    }

    console.log('Game Vote - Successfully recorded vote:', { 
      guest_name, 
      vote_choice, 
      scenario_id,
      mom_votes: voteStats?.mom_count,
      dad_votes: voteStats?.dad_count
    })

    return createSuccessResponse({
      message: 'Vote recorded successfully',
      vote_choice,
      scenario_id,
      vote_stats: voteStats
    }, 200)

  } catch (error) {
    console.error('Game Vote - Unexpected error:', error)
    return createErrorResponse('Failed to record vote', 500)
  }
})
