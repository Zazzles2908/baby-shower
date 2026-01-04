/**
 * Mom vs Dad Game - Game Reveal Function (Unified Schema)
 * Updated to use game_* tables from 20260103_mom_vs_dad_game_schema.sql
 * 
 * Purpose: Reveal round results and generate AI roast commentary
 * Trigger: POST /game-reveal
 * 
 * Schema Mapping:
 * - lobby_key → session_code
 * - admin_player_id → admin_code (4-digit PIN)
 * - round_id → scenario_id
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

interface GameRevealRequest {
  session_code: string
  admin_code: string
  scenario_id: string
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
    ], ['KIMI_API_KEY'])

    if (!envValidation.isValid) {
      console.error('Game Reveal - Environment validation failed:', envValidation.errors)
      return createErrorResponse('Server configuration error', 500)
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Parse and validate request body
    let body: GameRevealRequest
    try {
      body = await req.json()
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400)
    }

    // Input validation
    const validation = validateInput(body, {
      session_code: { type: 'string', required: true, minLength: 4, maxLength: 8 },
      admin_code: { type: 'string', required: true, minLength: 4, maxLength: 4 },
      scenario_id: { type: 'string', required: true }
    })

    if (!validation.isValid) {
      console.error('Game Reveal - Validation failed:', validation.errors)
      return createErrorResponse('Validation failed', 400, validation.errors)
    }

    const { session_code, admin_code, scenario_id } = validation.sanitized

    // Fetch session
    const { data: session, error: sessionError } = await supabase
      .from('baby_shower.game_sessions')
      .select('*')
      .eq('session_code', session_code)
      .single()

    if (sessionError || !session) {
      console.error('Game Reveal - Session not found:', session_code)
      return createErrorResponse('Session not found', 404)
    }

    // Verify admin authorization
    if (session.admin_code !== admin_code) {
      console.error('Game Reveal - Invalid admin code')
      return createErrorResponse('Invalid admin code', 403)
    }

    // Fetch scenario
    const { data: scenario, error: scenarioError } = await supabase
      .from('baby_shower.game_scenarios')
      .select('*')
      .eq('id', scenario_id)
      .eq('session_id', session.id)
      .single()

    if (scenarioError || !scenario) {
      console.error('Game Reveal - Scenario not found:', scenario_id)
      return createErrorResponse('Scenario not found', 404)
    }

    // Get vote statistics
    const { data: voteStats, error: statsError } = await supabase
      .rpc('baby_shower.calculate_vote_stats', { scenario_id: scenario_id })
      .single()

    if (statsError) {
      console.error('Game Reveal - Failed to get vote stats:', statsError)
      throw statsError
    }

    // Determine crowd choice
    const crowdChoice = voteStats.mom_percentage > voteStats.dad_percentage ? 'mom' : 
                       (voteStats.dad_percentage > voteStats.mom_percentage ? 'dad' : 'tie')

    // For simplified version, use crowd choice as actual answer
    // In full version, this would come from parent input in game_answers
    const actualChoice = crowdChoice
    const perceptionGap = Math.abs(voteStats.mom_percentage - voteStats.dad_percentage)

    // Generate roast commentary (simplified - no AI in this version)
    const roastCommentary = generateRoastCommentary(
      voteStats.mom_percentage,
      voteStats.dad_percentage,
      crowdChoice,
      perceptionGap
    )

    // Insert results
    const { error: insertError } = await supabase
      .from('baby_shower.game_results')
      .insert({
        scenario_id: scenario_id,
        mom_votes: voteStats.mom_count,
        dad_votes: voteStats.dad_count,
        crowd_choice: crowdChoice,
        actual_choice: actualChoice,
        perception_gap: perceptionGap,
        roast_commentary: roastCommentary,
        roast_provider: 'fallback',
        revealed_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Game Reveal - Failed to insert results:', insertError)
      throw insertError
    }

    // Deactivate scenario
    await supabase
      .from('baby_shower.game_scenarios')
      .update({ is_active: false })
      .eq('id', scenario_id)

    // Broadcast reveal event
    try {
      await supabase.channel(`game:${session_code}`)
        .send({
          type: 'broadcast',
          event: 'round_reveal',
          payload: {
            scenario_id,
            scenario: scenario,
            vote_stats: voteStats,
            crowd_choice: crowdChoice,
            actual_choice: actualChoice,
            perception_gap: perceptionGap,
            roast_commentary: roastCommentary
          }
        })
      console.log('Game Reveal - Broadcasted round_reveal event')
    } catch (broadcastError) {
      console.warn('Game Reveal - Reveal broadcast failed:', broadcastError)
    }

    console.log('Game Reveal - Successfully revealed round:', { scenario_id, crowd_choice: crowdChoice })

    return createSuccessResponse({
      message: 'Round revealed successfully',
      scenario: scenario,
      vote_stats: voteStats,
      crowd_choice: crowdChoice,
      actual_choice: actualChoice,
      perception_gap: perceptionGap,
      roast_commentary: roastCommentary
    }, 200)

  } catch (error) {
    console.error('Game Reveal - Unexpected error:', error)
    return createErrorResponse('Failed to reveal round', 500)
  }
})

/**
 * Generate roast commentary (fallback - replace with AI in production)
 */
function generateRoastCommentary(momPct: number, dadPct: number, crowdChoice: string, perceptionGap: number): string {
  if (perceptionGap < 10) {
    return "🎯 Spot on! The crowd knew exactly what would happen!"
  } else if (perceptionGap < 30) {
    return "🤔 Close, but the reality was a bit different..."
  } else if (perceptionGap < 50) {
    return "😱 Wow, the crowd was WAY off! What were you thinking?!"
  } else {
    return "🤡 Complete disaster! The crowd has NO idea how this family works!"
  }
}
