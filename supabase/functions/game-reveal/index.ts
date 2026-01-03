/**
 * Mom vs Dad Game - Game Reveal Function (Simplified Lobby Architecture)
 * 
 * Purpose: Generate and display results for completed round, including AI roast commentary
 * Trigger: POST /game-reveal
 * 
 * Logic Flow:
 * - Validates admin authorization
 * - Calculates vote percentages and determines crowd choice
 * - Generates Moonshot AI roast commentary
 * - Updates round status to revealed
 * - Broadcasts round_reveal event via Supabase
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
  lobby_key: string
  admin_player_id: string
  round_id: string
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
      lobby_key: { 
        type: 'string', 
        required: true, 
        pattern: /^(LOBBY-A|LOBBY-B|LOBBY-C|LOBBY-D)$/ 
      },
      admin_player_id: { type: 'string', required: true },
      round_id: { type: 'string', required: true }
    })

    if (!validation.isValid) {
      console.error('Game Reveal - Validation failed:', validation.errors)
      return createErrorResponse('Validation failed', 400, validation.errors)
    }

    const { lobby_key, admin_player_id, round_id } = validation.sanitized

    // Fetch lobby
    const { data: lobby, error: lobbyError } = await supabase
      .from('mom_dad_lobbies')
      .select('*')
      .eq('lobby_key', lobby_key)
      .single()

    if (lobbyError || !lobby) {
      console.error('Game Reveal - Lobby not found:', lobby_key)
      return createErrorResponse('Lobby not found', 404)
    }

    // Verify admin authorization
    if (lobby.admin_player_id !== admin_player_id) {
      console.error('Game Reveal - Unauthorized reveal attempt:', { 
        lobby_admin: lobby.admin_player_id, 
        request_admin: admin_player_id 
      })
      return createErrorResponse('Only admin can reveal round results', 403)
    }

    // Fetch round
    const { data: round, error: roundError } = await supabase
      .from('mom_dad_game_sessions')
      .select('*')
      .eq('id', round_id)
      .eq('lobby_id', lobby.id)
      .single()

    if (roundError || !round) {
      console.error('Game Reveal - Round not found:', round_id)
      return createErrorResponse('Round not found', 404)
    }

    if (round.status !== 'voting') {
      console.error('Game Reveal - Round already revealed:', round.status)
      return createErrorResponse('Round has already been revealed', 400)
    }

    // Determine crowd choice based on vote percentages
    const crowdChoice = round.mom_percentage > round.dad_percentage ? 'mom' : 
                       (round.dad_percentage > round.mom_percentage ? 'dad' : 'tie')

    // For simplified version, we use crowd choice as actual answer
    // In a full implementation, this would come from parent input
    const actualChoice = crowdChoice // Simplified: crowd's choice becomes reality

    // Calculate perception gap (difference between expectation and reality)
    // Since we're using crowd choice as actual, gap is 0 for now
    // In full version: gap = abs(crowd_prediction - actual_answer)
    const perceptionGap = 0

    // Generate roast commentary using Moonshot AI or fallback
    const roastCommentary = await generateRoastCommentary(
      round.mom_percentage,
      round.dad_percentage,
      crowdChoice,
      actualChoice,
      perceptionGap,
      round.scenario_text
    )

    // Determine particle effect based on vote distribution
    const particleEffect = determineParticleEffect(round.mom_percentage, round.dad_percentage)

    // Update round to revealed status
    const { error: updateRoundError } = await supabase
      .from('mom_dad_game_sessions')
      .update({
        status: 'revealed',
        crowd_choice: crowdChoice,
        actual_mom_answer: actualChoice === 'mom' ? 'mom' : null,
        actual_dad_answer: actualChoice === 'dad' ? 'dad' : null,
        perception_gap: perceptionGap,
        roast_commentary: roastCommentary,
        particle_effect: particleEffect,
        revealed_at: new Date().toISOString()
      })
      .eq('id', round_id)

    if (updateRoundError) {
      console.error('Game Reveal - Round update failed:', updateRoundError)
      throw updateRoundError
    }

    // Fetch updated round
    const { data: updatedRound } = await supabase
      .from('mom_dad_game_sessions')
      .select('*')
      .eq('id', round_id)
      .single()

    // Check if this was the last round
    const { data: allRounds } = await supabase
      .from('mom_dad_game_sessions')
      .select('id, status')
      .eq('lobby_id', lobby.id)
      .order('round_number', { ascending: true })

    const remainingRounds = allRounds?.filter(r => r.status === 'voting' || r.status === 'revealed').length || 0
    const isGameComplete = remainingRounds === 0 || (allRounds?.length === round.round_number && round.round_number === lobby.total_rounds)

    // If game is complete, update lobby status
    if (isGameComplete) {
      await supabase
        .from('mom_dad_lobbies')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', lobby.id)
    }

    // Broadcast round reveal event
    try {
      await supabase.channel(`lobby:${lobby_key}`)
        .send({
          type: 'broadcast',
          event: 'round_reveal',
          payload: {
            round: updatedRound,
            crowd_choice: crowdChoice,
            actual_choice: actualChoice,
            perception_gap: perceptionGap,
            roast_commentary: roastCommentary,
            particle_effect: particleEffect,
            is_game_complete: isGameComplete
          }
        })
      console.log('Game Reveal - Broadcasted round_reveal event')
    } catch (broadcastError) {
      console.warn('Game Reveal - Round reveal broadcast failed:', broadcastError)
    }

    console.log('Game Reveal - Successfully revealed round:', { 
      round_id, 
      crowd_choice: crowdChoice,
      is_game_complete: isGameComplete 
    })

    return createSuccessResponse({
      message: 'Round revealed successfully',
      round: updatedRound,
      crowd_choice: crowdChoice,
      actual_choice: actualChoice,
      roast_commentary: roastCommentary,
      particle_effect: particleEffect,
      is_game_complete: isGameComplete
    }, 200)

  } catch (error) {
    console.error('Game Reveal - Unexpected error:', error)
    return createErrorResponse('Failed to reveal round', 500)
  }
})

/**
 * Generate roast commentary using Moonshot AI or fallback to defaults
 */
async function generateRoastCommentary(
  momPercentage: number,
  dadPercentage: number,
  crowdChoice: string,
  actualChoice: string,
  perceptionGap: number,
  scenarioText: string
): Promise<string> {
  const kimiKey = Deno.env.get('KIMI_API_KEY')
  
  if (!kimiKey) {
    console.warn('Generate Roast - Moonshot not configured, using defaults')
    return getDefaultRoast(momPercentage, dadPercentage, crowdChoice)
  }

  try {
    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${kimiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'kimi-k2-thinking',
        messages: [
          {
            role: 'system',
            content: `You are a sassy but loving barnyard host at a baby shower game.
                     Your job is to roast the crowd's predictions playfully.
                     Keep it family-friendly, funny, and short (1-2 sentences).
                     Use a warm, teasing tone that makes everyone laugh.`
          },
          {
            role: 'user',
            content: `The crowd predicted: ${crowdChoice} would win (${Math.round(crowdChoice === 'mom' ? momPercentage : dadPercentage)}%).
                     Reality: ${actualChoice} won!
                     
                     Scenario: ${scenarioText}
                     
                     Generate a short, playful roast teasing the crowd. Be funny but kind!`
          }
        ],
        temperature: 0.8,
        max_tokens: 100
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Generate Roast - Moonshot API error:', response.status, errorText)
      throw new Error(`Moonshot API error: ${response.status}`)
    }

    const data = await response.json()
    const roast = data.choices?.[0]?.message?.content?.trim()

    if (roast && roast.length > 0) {
      console.log('Generate Roast - Successfully generated roast from Moonshot')
      return roast
    }

    return getDefaultRoast(momPercentage, dadPercentage, crowdChoice)
    
  } catch (error) {
    console.error('Generate Roast - Moonshot request failed, using defaults:', error)
    return getDefaultRoast(momPercentage, dadPercentage, crowdChoice)
  }
}

/**
 * Default roast commentary when AI is unavailable
 */
function getDefaultRoast(momPercentage: number, dadPercentage: number, crowdChoice: string): string {
  const gap = Math.abs(momPercentage - dadPercentage)
  
  const defaultRoasts = [
    { gap: 0, roast: "Well folks, looks like we're evenly split! Even the universe is undecided!" },
    { gap: 10, roast: "The crowd thinks they know best, but plot twist: nobody knows anything about babies!" },
    { gap: 30, roast: "Your parenting intuition score: needs work! Better luck next round, folks!" },
    { gap: 50, roast: "Wow, that's a landslide! Either the crowd is brilliant or someone needs to rethink their life choices!" },
    { gap: 70, roast: "The crystal ball was cloudy today, folks! Even grandma's intuition failed!" },
    { gap: 100, roast: "100% consensus! Either you're all psychic or this was way too obvious!" }
  ]

  // Find appropriate roast based on gap
  const applicableRoast = defaultRoasts
    .sort((a, b) => b.gap - a.gap)
    .find(r => gap >= r.gap) || defaultRoasts[0]

  // Add scenario-specific flavor
  const flavorTexts = [
    " Time to call the parenting experts!",
    " Someone's been watching too many parenting videos!",
    " The baby is definitely judging your choices right now.",
    " Remember this moment next time you're confident!",
    " This is why we can't have nice things!"
  ]

  const randomFlavor = flavorTexts[Math.floor(Math.random() * flavorTexts.length)]

  return applicableRoast.roast + randomFlavor
}

/**
 * Determine particle effect based on vote distribution
 */
function determineParticleEffect(momPercentage: number, dadPercentage: number): string {
  const gap = Math.abs(momPercentage - dadPercentage)
  
  if (gap > 60) {
    return 'fireworks' // Landslide victory
  } else if (gap > 40) {
    return 'confetti' // Clear winner
  } else if (gap > 20) {
    return 'stars' // Close race
  } else {
    return 'hearts' // Very close race
  }
}
