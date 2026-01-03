/**
 * Mom vs Dad Game - Game Start Function
 * 
 * Purpose: Admin starts the game, generates scenarios, transitions lobby to active
 * Trigger: POST /game-start
 * 
 * Logic Flow:
 * - Validates admin authorization
 * - Generates 5 rounds of scenarios (Z.AI or fallback)
 * - Creates game session records
 * - Updates lobby status to 'active'
 * - Broadcasts game_started and round_new events via Supabase
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
  lobby_key: string
  admin_player_id: string
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

    // Input validation
    const validation = validateInput(body, {
      lobby_key: { 
        type: 'string', 
        required: true, 
        pattern: /^(LOBBY-A|LOBBY-B|LOBBY-C|LOBBY-D)$/ 
      },
      admin_player_id: { type: 'string', required: true },
      total_rounds: { type: 'number', required: false, min: 1, max: 10 },
      intensity: { type: 'number', required: false, min: 0.1, max: 1.0 }
    })

    if (!validation.isValid) {
      console.error('Game Start - Validation failed:', validation.errors)
      return createErrorResponse('Validation failed', 400, validation.errors)
    }

    const { lobby_key, admin_player_id, total_rounds = 5, intensity = 0.5 } = validation.sanitized

    // Fetch and validate lobby
    const { data: lobby, error: lobbyError } = await supabase
      .from('baby_shower.mom_dad_lobbies')
      .select('*')
      .eq('lobby_key', lobby_key)
      .single()

    if (lobbyError || !lobby) {
      console.error('Game Start - Lobby not found:', lobby_key)
      return createErrorResponse('Lobby not found', 404)
    }

    if (lobby.status !== 'waiting') {
      console.error('Game Start - Game already in progress:', lobby.status)
      return createErrorResponse('Game already in progress or completed', 400)
    }

    if (lobby.admin_player_id !== admin_player_id) {
      console.error('Game Start - Unauthorized admin attempt:', { lobby_admin: lobby.admin_player_id, request_admin: admin_player_id })
      return createErrorResponse('Only admin can start the game', 403)
    }

    // Get current players
    const { data: players, error: playersError } = await supabase
      .from('baby_shower.mom_dad_players')
      .select('*')
      .eq('lobby_id', lobby.id)
      .is('disconnected_at', null)

    if (playersError) {
      console.error('Game Start - Failed to fetch players:', playersError)
      throw playersError
    }

    const activePlayers = players?.filter(p => p.disconnected_at === null) || []
    
    if (activePlayers.length < 2) {
      console.error('Game Start - Not enough players:', activePlayers.length)
      return createErrorResponse('At least 2 players required to start', 400)
    }

    // Check if AI players are needed to reach minimum viable player count
    const aiSlotsNeeded = Math.max(0, lobby.max_players - activePlayers.length)
    let addedAIPlayers = 0
    
    if (aiSlotsNeeded > 0 && lobby.current_ai_count < aiSlotsNeeded) {
      console.log('Game Start - Adding AI players:', aiSlotsNeeded)
      
      const aiPlayers = []
      for (let i = 0; i < aiSlotsNeeded; i++) {
        aiPlayers.push({
          lobby_id: lobby.id,
          player_name: `AI Guest ${lobby.current_ai_count + i + 1}`,
          player_type: 'ai',
          is_admin: false,
          is_ready: true, // AI is always ready
          current_vote: null
        })
      }

      const { error: aiError } = await supabase
        .from('baby_shower.mom_dad_players')
        .insert(aiPlayers)

      if (aiError) {
        console.error('Game Start - AI player creation failed:', aiError)
        throw aiError
      }

      addedAIPlayers = aiSlotsNeeded

      // Update AI count
      await supabase
        .from('baby_shower.mom_dad_lobbies')
        .update({ 
          current_ai_count: lobby.current_ai_count + aiSlotsNeeded,
          current_players: lobby.current_players + aiSlotsNeeded,
          updated_at: new Date().toISOString()
        })
        .eq('id', lobby.id)
    }

    // Generate scenarios using Z.AI or fallback to defaults
    console.log('Game Start - Generating', total_rounds, 'scenarios with intensity', intensity)
    const scenarios = await generateScenarios(supabase, total_rounds, intensity, lobby_key)

    // Create game sessions
    const gameSessions = scenarios.map((scenario, index) => ({
      lobby_id: lobby.id,
      round_number: index + 1,
      scenario_text: scenario.text,
      mom_option: scenario.mom_option,
      dad_option: scenario.dad_option,
      intensity: scenario.intensity || intensity,
      status: 'voting',
      mom_votes: 0,
      dad_votes: 0,
      mom_percentage: 0,
      dad_percentage: 0
    }))

    const { error: sessionsError } = await supabase
      .from('baby_shower.mom_dad_game_sessions')
      .insert(gameSessions)

    if (sessionsError) {
      console.error('Game Start - Game session creation failed:', sessionsError)
      throw sessionsError
    }

    // Update lobby status to active
    const { error: updateError } = await supabase
      .from('baby_shower.mom_dad_lobbies')
      .update({ 
        status: 'active',
        total_rounds,
        updated_at: new Date().toISOString()
      })
      .eq('id', lobby.id)

    if (updateError) {
      console.error('Game Start - Lobby update failed:', updateError)
      throw updateError
    }

    // Broadcast game started event
    try {
      await supabase.channel(`lobby:${lobby_key}`)
        .send({
          type: 'broadcast',
          event: 'game_started',
          payload: { 
            total_rounds, 
            intensity,
            ai_players_added: addedAIPlayers
          }
        })
      console.log('Game Start - Broadcasted game_started event')
    } catch (broadcastError) {
      console.warn('Game Start - Game started broadcast failed:', broadcastError)
    }

    // Get first round to broadcast
    const { data: firstRound, error: roundError } = await supabase
      .from('baby_shower.mom_dad_game_sessions')
      .select('*')
      .eq('lobby_id', lobby.id)
      .eq('round_number', 1)
      .single()

    if (roundError || !firstRound) {
      console.error('Game Start - Failed to fetch first round:', roundError)
      // Continue anyway - game is started, first round will be fetched by client
    } else {
      // Broadcast first round
      try {
        await supabase.channel(`lobby:${lobby_key}`)
          .send({
            type: 'broadcast',
            event: 'round_new',
            payload: { round: firstRound }
          })
        console.log('Game Start - Broadcasted first round')
      } catch (broadcastError) {
        console.warn('Game Start - Round broadcast failed:', broadcastError)
      }
    }

    console.log('Game Start - Successfully started game:', { 
      lobby_key, 
      total_rounds, 
      scenarios_generated: scenarios.length 
    })

    return createSuccessResponse({
      message: 'Game started successfully',
      total_rounds,
      scenarios_created: scenarios.length,
      first_round: firstRound,
      ai_players_added: addedAIPlayers
    }, 200)

  } catch (error) {
    console.error('Game Start - Unexpected error:', error)
    return createErrorResponse('Failed to start game', 500)
  }
})

/**
 * Generate scenarios using Z.AI API or fallback to defaults
 */
async function generateScenarios(
  supabase: ReturnType<typeof createClient>,
  count: number,
  intensity: number,
  lobbyKey: string
): Promise<Array<{
  text: string
  mom_option: string
  dad_option: string
  intensity: number
}>> {
  const zaiKey = Deno.env.get('Z_AI_API_KEY')
  
  if (!zaiKey) {
    console.warn('Generate Scenarios - Z.AI not configured, using defaults')
    return getDefaultScenarios(count, intensity)
  }

  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v3/modelapi/chatglm_pro/completions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${zaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: `Generate ${count} funny "who would rather" scenarios for a baby shower game about Mom vs Dad.
                 Theme: Farm/Cozy. Comedy intensity: ${intensity} (0.1-1.0).
                 Return JSON array with objects containing: scenario_text, mom_option, dad_option, intensity.
                 Make scenarios relatable, funny, and family-friendly. Each scenario should be unique.`
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Generate Scenarios - Z.AI API error:', response.status, errorText)
      throw new Error(`Z.AI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || data.data?.result || '[]'
    
    // Try to parse the JSON response
    try {
      const parsed = JSON.parse(content)
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log('Generate Scenarios - Successfully generated', parsed.length, 'scenarios from Z.AI')
        return parsed.map(s => ({
          text: s.scenario_text || s.text || s.scenario,
          mom_option: s.mom_option || s.mom,
          dad_option: s.dad_option || s.dad,
          intensity: s.intensity || intensity
        }))
      }
     } catch {
       console.warn('Generate Scenarios - Failed to parse Z.AI response, using defaults')
     }
    
    return getDefaultScenarios(count, intensity)
    
  } catch (error) {
    console.error('Generate Scenarios - Z.AI request failed, using defaults:', error)
    return getDefaultScenarios(count, intensity)
  }
}

/**
 * Fallback default scenarios when AI is unavailable
 */
function getDefaultScenarios(
  count: number,
  intensity: number
): Array<{
  text: string
  mom_option: string
  dad_option: string
  intensity: number
}> {
  const defaults = [
    { 
      text: "It's 3 AM and the baby explodes diaper everywhere", 
      mom_option: "Mom would retch dramatically", 
      dad_option: "Dad would clean it up immediately",
      intensity 
    },
    { 
      text: "Baby's first solid food reaction", 
      mom_option: "Mom would google frantically", 
      dad_option: "Dad would take a video for memories",
      intensity 
    },
    { 
      text: "Lost pacifier at 2 AM", 
      mom_option: "Mom would sanitize it", 
      dad_option: "Dad would buy a new one",
      intensity 
    },
    { 
      text: "Baby laughs at a dog but not at parents", 
      mom_option: "Mom would be offended", 
      dad_option: "Dad would high-five the dog",
      intensity 
    },
    { 
      text: "First time baby says a word", 
      mom_option: "Mom would cry happy tears", 
      dad_option: "Dad would compete to teach more words",
      intensity 
    },
    { 
      text: "Baby reaches for grandparent instead of parent", 
      mom_option: "Mom would fake tears", 
      dad_option: "Dad would tease about it",
      intensity 
    },
    { 
      text: "Baby's first bath time chaos", 
      mom_option: "Mom would worry about water temperature", 
      dad_option: "Dad would splash around playfully",
      intensity 
    },
    { 
      text: "Middle of the night feeding responsibility", 
      mom_option: "Mom would breastfeed", 
      dad_option: "Dad would warm formula",
      intensity 
    },
    { 
      text: "Baby's first steps celebration", 
      mom_option: "Mom would clap and cheer", 
      dad_option: "Dad would video call everyone",
      intensity 
    },
    { 
      text: "Baby refuses to sleep at bedtime", 
      mom_option: "Mom would try every trick", 
      dad_option: "Dad would read the same book 10 times",
      intensity 
    }
  ]
  
  console.log('Get Default Scenarios - Using', Math.min(count, defaults.length), 'default scenarios')
  return defaults.slice(0, count)
}
