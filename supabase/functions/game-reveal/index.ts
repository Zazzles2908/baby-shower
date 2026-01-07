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

    // Generate roast commentary using Moonshot AI
    let roastProvider = 'fallback'
    let roastCommentary: string

    try {
      const roastResult = await generateRoastCommentaryWithAI(
        voteStats.mom_percentage,
        voteStats.dad_percentage,
        crowdChoice,
        perceptionGap,
        session.mom_name,
        session.dad_name,
        scenario
      )
      roastCommentary = roastResult.roast
      roastProvider = roastResult.provider
    } catch (roastError) {
      console.warn('Game Reveal - AI roast generation failed, using fallback:', roastError)
      roastCommentary = generateFallbackRoast(
        voteStats.mom_percentage,
        voteStats.dad_percentage,
        crowdChoice,
        perceptionGap,
        session.mom_name,
        session.dad_name
      )
      roastProvider = 'fallback'
    }

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
        roast_provider: roastProvider,
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
 * Generate roast commentary using Moonshot AI (Kimi)
 * Falls back to template roasts if AI fails
 */
async function generateRoastCommentaryWithAI(
  momPct: number,
  dadPct: number,
  crowdChoice: string,
  perceptionGap: number,
  momName: string,
  dadName: string,
  scenario: any
): Promise<{ roast: string; provider: string }> {
  const kimiApiKey = Deno.env.get('KIMI_API_KEY')
  
  if (!kimiApiKey) {
    console.warn('Game Reveal - KIMI_API_KEY not configured, using fallback')
    return { 
      roast: generateFallbackRoast(momPct, dadPct, crowdChoice, perceptionGap, momName, dadName),
      provider: 'fallback'
    }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

  try {
    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${kimiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'kimi-k2-thinking',
        messages: [
          {
            role: 'system',
            content: `You are a witty, playful host for a baby shower game called "Mom vs Dad: The Truth Revealed". 
Your job is to roast the crowd for their predictions about what mom or dad would do in silly scenarios.
Be funny, teasing, and family-friendly. Use emojis and keep it SHORT (under 100 characters).
Never be mean-spirited - the goal is playful teasing that makes everyone laugh.`
          },
          {
            role: 'user',
            content: `Generate a witty roast for this "Mom vs Dad" round:

📊 VOTE RESULTS:
- Mom got ${momPct.toFixed(1)}% of votes (${crowdChoice === 'mom' ? '🗳️ Crowd picked MOM' : 'Dad won this round'})
- Dad got ${dadPct.toFixed(1)}% of votes
- Perception gap: ${perceptionGap.toFixed(1)}%

👨‍👩‍👧 THE CONTESTANTS:
- Mom: ${momName}
- Dad: ${dadName}

📝 THE SCENARIO:
"${scenario.scenario_text}"
- Mom's choice: "${scenario.mom_option}"
- Dad's choice: "${scenario.dad_option}"

🎯 ROAST THE CROWD:
Be funny and teasing! ${perceptionGap < 15 ? 'They were spot-on, roast them for being too predictable!' :
  perceptionGap < 35 ? 'They were somewhat wrong, tease them gently!' :
  perceptionGap < 55 ? 'They were way off! Give them a good roasting!' :
  'They were completely clueless! Destroy them with wit!'}

Keep it SHORT, punchy, and family-friendly!`
          }
        ],
        temperature: 0.8,
        max_tokens: 150
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Game Reveal - Moonshot API error:', response.status, errorText)
      throw new Error(`Moonshot API returned ${response.status}`)
    }

    const aiData = await response.json()
    
    // Extract roast text from AI response
    const roastText = aiData.choices?.[0]?.message?.content?.trim() || ''
    
    if (!roastText) {
      console.warn('Game Reveal - Empty AI response, using fallback')
      return { 
        roast: generateFallbackRoast(momPct, dadPct, crowdChoice, perceptionGap, momName, dadName),
        provider: 'fallback'
      }
    }

    console.log('Game Reveal - AI roast generated successfully')
    return { roast: roastText, provider: 'moonshot-kimi-k2' }

  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error.name === 'AbortError') {
      console.warn('Game Reveal - Moonshot API timeout after 10 seconds')
    } else {
      console.error('Game Reveal - Moonshot API error:', error.message)
    }
    
    throw error
  }
}

/**
 * Generate fallback roast commentary when AI is unavailable
 */
function generateFallbackRoast(momPct: number, dadPct: number, crowdChoice: string, perceptionGap: number, momName: string, dadName: string): string {
  if (perceptionGap < 15) {
    return `🎯 Spot on! You really know ${crowdChoice === 'mom' ? momName : dadName}!`
  } else if (perceptionGap < 35) {
    return `🤔 Close, but clearly nobody knows ${crowdChoice === 'mom' ? dadName : momName} well enough!`
  } else if (perceptionGap < 55) {
    return `😱 What were you thinking?! Clearly nobody has seen ${crowdChoice === 'mom' ? momName : dadName} in action!`
  } else {
    return `🤡 Complete disaster! The crowd has NO idea how this family works!`
  }
}
