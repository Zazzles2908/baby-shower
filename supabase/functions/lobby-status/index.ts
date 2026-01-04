/**
 * Mom vs Dad Game - Lobby Status Function (Unified Schema)
 * Updated to use game_* tables from 20260103_mom_vs_dad_game_schema.sql
 * 
 * Purpose: Return current game session state and scenarios
 * Trigger: POST /lobby-status (now returns game session status)
 * 
 * Schema Mapping:
 * - lobby_key → session_code
 * Returns game_sessions data instead of mom_dad_lobbies
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

interface SessionStatusRequest {
  session_code: string
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
      console.error('Session Status - Environment validation failed:', envValidation.errors)
      return createErrorResponse('Server configuration error', 500)
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Parse and validate request body
    let body: SessionStatusRequest
    try {
      body = await req.json()
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400)
    }

    // Input validation
    const validation = validateInput(body, {
      session_code: { type: 'string', required: true, minLength: 4, maxLength: 8 }
    })

    if (!validation.isValid) {
      console.error('Session Status - Validation failed:', validation.errors)
      return createErrorResponse('Validation failed', 400, validation.errors)
    }

    const { session_code } = validation.sanitized

    // Fetch session
    const { data: session, error: sessionError } = await supabase
      .from('baby_shower.game_sessions')
      .select('*')
      .eq('session_code', session_code)
      .single()

    if (sessionError || !session) {
      console.error('Session Status - Session not found:', session_code)
      return createErrorResponse('Session not found', 404)
    }

    // Fetch scenarios based on game status
    let scenarios: unknown[] = []
    if (session.status !== 'setup') {
      const { data: scenariosData } = await supabase
        .from('baby_shower.game_scenarios')
        .select('*')
        .eq('session_id', session.id)
        .order('round_number', { ascending: true })

      // For 'voting' status, only return active scenario
      if (session.status === 'voting') {
        scenarios = scenariosData?.filter((s: unknown) => (s as { is_active: boolean }).is_active) || []
      } else {
        // For revealed/complete, return all scenarios
        scenarios = scenariosData || []
      }
    }

    // Get vote counts for each scenario
    const scenariosWithVotes = await Promise.all(
      (scenarios as Array<{ id: string }>).map(async (scenario) => {
        const { data: voteStats } = await supabase
          .rpc('baby_shower.calculate_vote_stats', { scenario_id: scenario.id })
          .single()
        
        // Get results if revealed
        const { data: results } = await supabase
          .from('baby_shower.game_results')
          .select('*')
          .eq('scenario_id', scenario.id)
          .maybeSingle()

        return {
          ...scenario,
          vote_stats: voteStats,
          results: results
        }
      })
    )

    // Build response
    const response = {
      session: {
        id: session.id,
        session_code: session.session_code,
        mom_name: session.mom_name,
        dad_name: session.dad_name,
        status: session.status,
        total_rounds: session.total_rounds,
        current_round: session.current_round,
        created_at: session.created_at,
        started_at: session.started_at,
        completed_at: session.completed_at
      },
      scenarios: scenariosWithVotes,
      can_start: session.status === 'setup'
    }

    console.log('Session Status - Retrieved status for:', session_code)

    return createSuccessResponse(response, 200)

  } catch (error) {
    console.error('Session Status - Unexpected error:', error)
    return createErrorResponse('Failed to get session status', 500)
  }
})
