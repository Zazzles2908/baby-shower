/**
 * Mom vs Dad Game - Game Start Function (Unified Schema)
 * Updated to use game_* tables from 20260103_mom_vs_dad_game_schema.sql
 * 
 * Purpose: Admin starts the game, generates scenarios, transitions session to voting
 * Trigger: POST /game-start
 * 
 * Schema Mapping:
 * - lobby_key → session_code (from game_sessions)
 * - admin_player_id → validated against session's admin_code
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

interface StartGameRequest {
  session_code: string  // Changed from lobby_key
  admin_code: string    // Changed from admin_player_id - 4-digit PIN
  total_rounds?: number
  intensity?: number
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
    ], ['Z_AI_API_KEY'])

    if (!envValidation.isValid) {
      console.error('Game Start - Environment validation failed:', envValidation.errors)
      return createErrorResponse('Server configuration error', 500)
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Parse and validate request body
    let body: StartGameRequest
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
      admin_code: { type: 'string', required: true, minLength: 4, maxLength: 4 },
      total_rounds: { type: 'number', required: false, min: 1, max: 10 },
      intensity: { type: 'number', required: false, min: 0.1, max: 1.0 }
    })

    if (!validation.isValid) {
      console.error('Game Start - Validation failed:', validation.errors)
      return createErrorResponse('Validation failed', 400, validation.errors)
    }

    const { session_code, admin_code, total_rounds = 5, intensity = 0.5 } = validation.sanitized

    // Fetch and validate session
    const { data: session, error: sessionError } = await supabase
      .from('baby_shower.game_sessions')
      .select('*')
      .eq('session_code', session_code)
      .single()

    if (sessionError || !session) {
      console.error('Game Start - Session not found:', session_code)
      return createErrorResponse('Session not found', 404)
    }

    if (session.status !== 'setup') {
      console.error('Game Start - Game already in progress:', session.status)
      return createErrorResponse('Game already in progress or completed', 400)
    }

    // Validate admin code
    if (session.admin_code !== admin_code) {
      console.error('Game Start - Invalid admin code')
      return createErrorResponse('Invalid admin code', 403)
    }

    // Generate scenarios for each round (simplified - uses fallback scenarios)
    // In production, this would call Z.AI or another AI provider
    const scenarios = generateFallbackScenarios(session.mom_name, session.dad_name, total_rounds, intensity)

    // Insert scenarios
    const { error: scenariosError } = await supabase
      .from('baby_shower.game_scenarios')
      .insert(
        scenarios.map((scenario, index) => ({
          session_id: session.id,
          round_number: index + 1,
          scenario_text: scenario.text,
          mom_option: scenario.mom_option,
          dad_option: scenario.dad_option,
          intensity: intensity,
          theme_tags: ['funny', 'parenting'],
          is_active: true
        }))
      )

    if (scenariosError) {
      console.error('Game Start - Failed to create scenarios:', scenariosError)
      throw scenariosError
    }

    // Update session status to voting
    const { error: updateSessionError } = await supabase
      .from('baby_shower.game_sessions')
      .update({
        status: 'voting',
        current_round: 1,
        started_at: new Date().toISOString()
      })
      .eq('id', session.id)

    if (updateSessionError) {
      console.error('Game Start - Failed to update session:', updateSessionError)
      throw updateSessionError
    }

    // Fetch created scenarios
    const { data: createdScenarios } = await supabase
      .from('baby_shower.game_scenarios')
      .select('*')
      .eq('session_id', session.id)
      .order('round_number', { ascending: true })

    // Broadcast game started event
    try {
      await supabase.channel(`game:${session_code}`)
        .send({
          type: 'broadcast',
          event: 'game_started',
          payload: {
            session_id: session.id,
            session_code: session_code,
            mom_name: session.mom_name,
            dad_name: session.dad_name,
            total_rounds: total_rounds,
            current_round: 1,
            first_scenario: createdScenarios?.[0]
          }
        })
      console.log('Game Start - Broadcasted game_started event')
    } catch (broadcastError) {
      console.warn('Game Start - Game start broadcast failed:', broadcastError)
    }

    console.log('Game Start - Successfully started game:', { 
      session_code, 
      total_rounds,
      scenario_count: createdScenarios?.length 
    })

    return createSuccessResponse({
      message: 'Game started successfully',
      session_code,
      total_rounds,
      scenarios: createdScenarios
    }, 200)

  } catch (error) {
    console.error('Game Start - Unexpected error:', error)
    return createErrorResponse('Failed to start game', 500)
  }
})

/**
 * Generate fallback scenarios (replace with AI generation in production)
 */
function generateFallbackScenarios(momName: string, dadName: string, count: number, intensity: number) {
  const fallbackScenarios = [
    {
      text: `It's 3 AM and the baby starts crying uncontrollably...`,
      mom_option: `${momName} would gently rock and sing lullabies`,
      dad_option: `${dadName} would stumble in, half-asleep, offering a pacifier`
    },
    {
      text: `The diaper explosion reaches the ceiling...`,
      mom_option: `${momName} would retch but handle it like a pro`,
      dad_option: `${dadName} would run for the hills, then come back with wipes`
    },
    {
      text: `Someone forgot to pack the diaper bag for outing...`,
      mom_option: `${momName} would improvisation with handkerchiefs`,
      dad_option: `${dadName} would panic and call for emergency backup`
    },
    {
      text: `Baby's first solid food ends up everywhere except mouth...`,
      mom_option: `${momName} would document everything for memories`,
      dad_option: `${dadName} would be too busy taking video to help clean`
    },
    {
      text: `It's 2 AM and baby finally falls asleep...`,
      mom_option: `${momName} would stare at them lovingly for an hour`,
      dad_option: `${dadName} would immediately collapse on the couch`
    }
  ]

  return fallbackScenarios.slice(0, count)
}
