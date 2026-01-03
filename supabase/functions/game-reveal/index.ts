import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Request/Response interfaces
interface RevealRequest {
  scenario_id: string
  admin_code: string
}

interface VoteCounts {
  mom_votes: number
  dad_votes: number
  mom_pct: number
  dad_pct: number
  total_votes: number
}

interface GameResult {
  id: string
  scenario_id: string
  mom_votes: number
  dad_votes: number
  mom_percentage: number
  dad_percentage: number
  crowd_choice: string
  actual_choice: string
  perception_gap: number
  roast_commentary: string
  particle_effect: string
  revealed_at: string
}

interface ErrorResponse {
  error: string
  details?: unknown
}

interface RealtimePayload {
  type: 'result_reveal'
  scenario_id: string
  result: GameResult
}

// Particle effect mapping based on perception gap
function determineParticleEffect(perceptionGap: number, accuracy: boolean): string {
  if (!accuracy) {
    // Completely wrong prediction - dramatic effect
    if (perceptionGap > 70) return 'rainbow'
    if (perceptionGap > 50) return 'stars'
    return 'confetti'
  }
  
  // Correct or close prediction - celebratory
  if (perceptionGap < 10) return 'sparkles'
  if (perceptionGap < 20) return 'confetti'
  return 'confetti'
}

// Generate roast commentary using available AI providers
async function generateRoastCommentary(
  scenarioText: string,
  momOption: string,
  dadOption: string,
  voteCounts: VoteCounts,
  actualChoice: string,
  momName: string,
  dadName: string
): Promise<string> {
  // Check for available AI providers
  const minimaxApiKey = Deno.env.get('MINIMAX_API_KEY')
  const moonshotApiKey = Deno.env.get('KIMI_CODING_API_KEY')
  
  console.log('[game-reveal] AI providers available:', {
    minimax: !!minimaxApiKey,
    moonshot: !!moonshotApiKey
  })
  
  const crowdChoice = voteCounts.mom_pct > voteCounts.dad_pct ? 'mom' : 'dad'
  const crowdPct = Math.max(voteCounts.mom_pct, voteCounts.dad_pct)
  const winner = actualChoice === 'mom' ? momName : dadName
  
  // Build the prompt
  const systemPrompt = `You are a witty, playful roast master at a cozy baby shower.
Your job is to create funny, family-friendly commentary about how wrong (or right!) the guests were.
Rules:
- Be funny, sassy, but always warm and appropriate
- Reference the scenario in your roast
- Keep roasts under 150 characters
- Never be mean-spirited - it's all in good fun`

  const userPrompt = `Guests were asked: "${scenarioText}"
They voted:
- ${momName} would: ${momOption} (${voteCounts.mom_pct}%)
- ${dadName} would: ${dadOption} (${voteCounts.dad_pct}%)
Reality: ${winner} did it!
Crowd was ${crowdChoice} with ${crowdPct}% confidence.
Roast them playfully!`

  // Try MiniMax first (primary provider)
  if (minimaxApiKey) {
    try {
      console.log('[game-reveal] Attempting MiniMax API')
      const roast = await callMiniMaxAPI(minimaxApiKey, systemPrompt, userPrompt)
      if (roast) {
        console.log('[game-reveal] MiniMax roast generated successfully')
        return roast
      }
    } catch (error) {
      console.warn('[game-reveal] MiniMax API failed, trying fallback:', error instanceof Error ? error.message : 'Unknown error')
    }
  }
  
  // Try Moonshot/Kimi as fallback
  if (moonshotApiKey) {
    try {
      console.log('[game-reveal] Attempting Moonshot/Kimi API')
      const roast = await callMoonshotAPI(moonshotApiKey, systemPrompt, userPrompt)
      if (roast) {
        console.log('[game-reveal] Moonshot/Kimi roast generated successfully')
        return roast
      }
    } catch (error) {
      console.warn('[game-reveal] Moonshot API failed, using fallback roast:', error instanceof Error ? error.message : 'Unknown error')
    }
  }
  
  // Ultimate fallback - pre-written roast
  console.warn('[game-reveal] All AI providers unavailable, using fallback roast')
  return generateFallbackRoast(voteCounts, actualChoice, momName, dadName)
}

// Call MiniMax API (primary provider)
async function callMiniMaxAPI(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const response = await fetch('https://api.minimax.chat/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.1',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 150,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[game-reveal] MiniMax API error:', errorText)
      return null
    }

    const data = await response.json()
    const roast = data.choices?.[0]?.message?.content?.trim()
    return roast?.replace(/^["']|["']$/g, '') || null
  } catch (error) {
    console.error('[game-reveal] MiniMax API call failed:', error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

// Call Moonshot/Kimi API (fallback provider)
async function callMoonshotAPI(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch('https://api.moonshot.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'kimi-k2-thinking',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 150,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[game-reveal] Moonshot API error:', errorText)
      return null
    }

    const data = await response.json()
    const roast = data.choices?.[0]?.message?.content?.trim()
    return roast?.replace(/^["']|["']$/g, '') || null
  } catch (error) {
    console.error('[game-reveal] Moonshot API call failed:', error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

// Fallback roast when AI is unavailable
function generateFallbackRoast(voteCounts: VoteCounts, actualChoice: string, momName: string, dadName: string): string {
  const crowdChoice = voteCounts.mom_pct > voteCounts.dad_pct ? 'mom' : 'dad'
  const crowdPct = Math.max(voteCounts.mom_pct, voteCounts.dad_pct)
  const winner = actualChoice === 'mom' ? momName : dadName
  
  if (crowdChoice === actualChoice) {
    return `🎯 Spot on! ${crowdPct}% correctly picked ${winner}! You really know them!`
  }
  
  if (crowdPct > 70) {
    return `😅 Oops! ${crowdPct}% were SO wrong about ${winner}! The crowd was absolutely certain!`
  }
  
  if (crowdPct > 50) {
    return `🤔 Hmm, ${crowdPct}% picked wrong! ${winner} had other plans!`
  }
  
  return `🤷 It was anyone's game, but ${winner} proved everyone wrong!`
}

// Calculate vote percentages
function calculatePercentages(momVotes: number, dadVotes: number): VoteCounts {
  const total = momVotes + dadVotes
  return {
    mom_votes: momVotes,
    dad_votes: dadVotes,
    mom_pct: total > 0 ? Math.round((momVotes / total) * 100) : 0,
    dad_pct: total > 0 ? Math.round((dadVotes / total) * 100) : 0,
    total_votes: total,
  }
}

// Broadcast realtime reveal event
async function broadcastRealtimeUpdate(
  supabase: ReturnType<typeof createClient>,
  payload: RealtimePayload
): Promise<void> {
  try {
    const channel = supabase.channel('game_state')
    await channel.send({
      type: 'broadcast',
      event: payload.type,
      payload,
    })
    console.log(`[game-reveal] Broadcast ${payload.type} for scenario ${payload.scenario_id}`)
  } catch (error) {
    console.error('[game-reveal] Failed to broadcast realtime update:', error)
    // Non-blocking - don't fail the request if realtime fails
  }
}

serve(async (req: Request) => {
  // CORS headers
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  })

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  // Initialize Supabase client with service role
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[game-reveal] Missing Supabase environment variables')
    return new Response(
      JSON.stringify({ error: 'Server configuration error' } as ErrorResponse),
      { status: 500, headers }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    // GET endpoint: Get reveal status and results
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const scenarioId = url.searchParams.get('scenario_id')

      if (!scenarioId) {
        return new Response(
          JSON.stringify({ error: 'scenario_id is required' } as ErrorResponse),
          { status: 400, headers }
        )
      }

      console.log(`[game-reveal] GET: Fetching reveal status for scenario ${scenarioId}`)

      // Get scenario details
      const { data: scenario, error: scenarioError } = await supabase
        .from('baby_shower.game_scenarios')
        .select(`
          id,
          session_id,
          scenario_text,
          mom_option,
          dad_option,
          baby_shower.game_sessions!inner (status, mom_name, dad_name)
        `)
        .eq('id', scenarioId)
        .single()

      if (scenarioError || !scenario) {
        console.error('[game-reveal] Scenario not found:', scenarioError?.message)
        return new Response(
          JSON.stringify({ error: 'Scenario not found' } as ErrorResponse),
          { status: 404, headers }
        )
      }

      const sessionData = scenario.baby_shower?.game_sessions?.[0]
      if (!sessionData) {
        console.error('[game-reveal] Failed to get session data')
        return new Response(
          JSON.stringify({ error: 'Session data not found' } as ErrorResponse),
          { status: 404, headers }
        )
      }

      // Check if results exist for this scenario
      const { data: existingResult, error: resultError } = await supabase
        .from('baby_shower.game_results')
        .select('*')
        .eq('scenario_id', scenarioId)
        .maybeSingle()

      if (resultError) {
        console.error('[game-reveal] Failed to check results:', resultError.message)
        throw new Error(`Database error: ${resultError.message}`)
      }

      // Check lock status for answers
      const { data: gameAnswer, error: answerError } = await supabase
        .from('baby_shower.game_answers')
        .select('*')
        .eq('scenario_id', scenarioId)
        .maybeSingle()

      if (answerError) {
        console.error('[game-reveal] Failed to check answers:', answerError.message)
        throw new Error(`Database error: ${answerError.message}`)
      }

      const isRevealed = sessionData.status === 'revealed' || sessionData.status === 'complete'
      const bothLocked = gameAnswer?.mom_locked && gameAnswer?.dad_locked

      console.log(`[game-reveal] GET: Status - revealed: ${isRevealed}, both locked: ${bothLocked}`)

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            scenario_id: scenarioId,
            is_revealed: isRevealed,
            both_parents_locked: bothLocked,
            session_status: sessionData.status,
            scenario: {
              text: scenario.scenario_text,
              mom_option: scenario.mom_option,
              dad_option: scenario.dad_option,
            },
            parents: {
              mom_name: sessionData.mom_name,
              dad_name: sessionData.dad_name,
            },
            result: existingResult ? {
              roast_commentary: existingResult.roast_commentary,
              perception_gap: existingResult.perception_gap,
              vote_comparison: {
                mom_votes: existingResult.mom_votes,
                dad_votes: existingResult.dad_votes,
                mom_percentage: Number(existingResult.mom_percentage),
                dad_percentage: 100 - Number(existingResult.mom_percentage),
                crowd_choice: existingResult.crowd_choice,
                actual_choice: existingResult.actual_choice,
              },
              particle_effect: existingResult.particle_effect,
              revealed_at: existingResult.revealed_at,
            } : null,
          },
        }),
        { status: 200, headers }
      )
    }

    // POST endpoint: Trigger reveal
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' } as ErrorResponse),
        { status: 405, headers }
      )
    }

    // Parse request body
    const contentType = req.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      return new Response(
        JSON.stringify({ error: 'Content-Type must be application/json' } as ErrorResponse),
        { status: 400, headers }
      )
    }

    const body: RevealRequest = await req.json()

    // Validate required fields
    const errors: string[] = []
    
    if (!body.scenario_id) {
      errors.push('scenario_id is required')
    }
    if (!body.admin_code || body.admin_code.length !== 4) {
      errors.push('admin_code must be a 4-digit PIN')
    }

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: errors } as ErrorResponse),
        { status: 400, headers }
      )
    }

    console.log(`[game-reveal] POST: Triggering reveal for scenario ${body.scenario_id}`)

    // Get scenario and session details
    const { data: scenario, error: scenarioError } = await supabase
      .from('baby_shower.game_scenarios')
      .select(`
        id,
        session_id,
        scenario_text,
        mom_option,
        dad_option,
        round_number,
        baby_shower.game_sessions!inner (id, status, admin_code, mom_name, dad_name, current_round, total_rounds)
      `)
      .eq('id', body.scenario_id)
      .single()

    if (scenarioError || !scenario) {
      console.error('[game-reveal] Scenario not found:', scenarioError?.message)
      return new Response(
        JSON.stringify({ error: 'Scenario not found' } as ErrorResponse),
        { status: 404, headers }
      )
    }

    const sessionData = scenario.baby_shower?.game_sessions?.[0]
    if (!sessionData) {
      console.error('[game-reveal] Failed to get session data')
      return new Response(
        JSON.stringify({ error: 'Session data not found' } as ErrorResponse),
        { status: 404, headers }
      )
    }

    // Verify admin code
    if (sessionData.admin_code !== body.admin_code) {
      console.error('[game-reveal] Invalid admin code')
      return new Response(
        JSON.stringify({ error: 'Invalid admin PIN' } as ErrorResponse),
        { status: 401, headers }
      )
    }

    // Check if session is in voting status
    if (sessionData.status !== 'voting') {
      console.error(`[game-reveal] Session not in voting status. Current status: ${sessionData.status}`)
      return new Response(
        JSON.stringify({ 
          error: 'Cannot trigger reveal - voting is not active',
          details: { current_status: sessionData.status }
        } as ErrorResponse),
        { status: 400, headers }
      )
    }

    // Check if both parents have locked their answers
    const { data: gameAnswer, error: answerError } = await supabase
      .from('baby_shower.game_answers')
      .select('*')
      .eq('scenario_id', body.scenario_id)
      .maybeSingle()

    if (answerError) {
      console.error('[game-reveal] Failed to check game answers:', answerError.message)
      throw new Error(`Database error: ${answerError.message}`)
    }

    if (!gameAnswer || !gameAnswer.mom_locked || !gameAnswer.dad_locked) {
      console.error('[game-reveal] Both parents must lock their answers before reveal')
      return new Response(
        JSON.stringify({ 
          error: 'Both parents must lock their answers before reveal',
          details: { 
            mom_locked: gameAnswer?.mom_locked || false,
            dad_locked: gameAnswer?.dad_locked || false,
          }
        } as ErrorResponse),
        { status: 400, headers }
      )
    }

    // Get votes for this scenario
    const { data: votes, error: votesError } = await supabase
      .from('baby_shower.game_votes')
      .select('vote_choice')
      .eq('scenario_id', body.scenario_id)

    if (votesError) {
      console.error('[game-reveal] Failed to fetch votes:', votesError.message)
      throw new Error(`Database error: ${votesError.message}`)
    }

    // Calculate vote counts
    const momVotes = votes?.filter(v => v.vote_choice === 'mom').length ?? 0
    const dadVotes = votes?.filter(v => v.vote_choice === 'dad').length ?? 0
    const voteCounts = calculatePercentages(momVotes, dadVotes)

    // Determine crowd choice and actual choice
    const crowdChoice = voteCounts.mom_pct > voteCounts.dad_pct ? 'mom' : 'dad'
    
    // Determine final answer (use mom's answer, or if they differ, mom's wins)
    let actualChoice: string
    if (gameAnswer.mom_answer && gameAnswer.dad_answer) {
      if (gameAnswer.mom_answer === gameAnswer.dad_answer) {
        actualChoice = gameAnswer.mom_answer
      } else {
        actualChoice = gameAnswer.mom_answer
      }
    } else if (gameAnswer.mom_answer) {
      actualChoice = gameAnswer.mom_answer
    } else if (gameAnswer.dad_answer) {
      actualChoice = gameAnswer.dad_answer
    } else {
      console.warn('[game-reveal] No valid answer found, defaulting to mom')
      actualChoice = 'mom'
    }

    // Calculate perception gap
    const crowdPct = Math.max(voteCounts.mom_pct, voteCounts.dad_pct)
    let perceptionGap: number
    
    if (crowdChoice === actualChoice) {
      perceptionGap = crowdPct - 50
    } else {
      const correctPct = actualChoice === 'mom' ? voteCounts.mom_pct : voteCounts.dad_pct
      perceptionGap = crowdPct - correctPct
    }
    
    perceptionGap = Math.round(perceptionGap * 100) / 100

    console.log(`[game-reveal] Vote counts - Mom: ${momVotes} (${voteCounts.mom_pct}%), Dad: ${dadVotes} (${voteCounts.dad_pct}%)`)
    console.log(`[game-reveal] Crowd choice: ${crowdChoice}, Actual: ${actualChoice}, Perception gap: ${perceptionGap}%`)

    // Generate AI roast commentary
    const roastCommentary = await generateRoastCommentary(
      scenario.scenario_text,
      scenario.mom_option,
      scenario.dad_option,
      voteCounts,
      actualChoice,
      sessionData.mom_name,
      sessionData.dad_name
    )

    // Determine particle effect
    const accuracy = crowdChoice === actualChoice
    const particleEffect = determineParticleEffect(Math.abs(perceptionGap), accuracy)

    // Insert result into baby_shower.game_results
    const { data: result, error: insertError } = await supabase
      .from('baby_shower.game_results')
      .insert({
        scenario_id: body.scenario_id,
        mom_votes: momVotes,
        dad_votes: dadVotes,
        crowd_choice: crowdChoice,
        actual_choice: actualChoice,
        perception_gap: perceptionGap,
        roast_commentary: roastCommentary,
        roast_provider: 'minimax',
        roast_model: 'MiniMax-M2.1',
        particle_effect: particleEffect,
        revealed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('[game-reveal] Failed to insert game result:', insertError.message)
      throw new Error(`Database error: ${insertError.message}`)
    }

    console.log(`[game-reveal] Successfully inserted result with id: ${result.id}`)

    // Update session status to 'revealed'
    const { error: updateError } = await supabase
      .from('baby_shower.game_sessions')
      .update({ 
        status: 'revealed',
        current_round: sessionData.current_round + 1,
      })
      .eq('id', sessionData.id)

    if (updateError) {
      console.error('[game-reveal] Failed to update session status:', updateError.message)
    }

    // Broadcast realtime reveal event
    await broadcastRealtimeUpdate(supabase, {
      type: 'result_reveal',
      scenario_id: body.scenario_id,
      result: {
        id: result.id,
        scenario_id: result.scenario_id,
        mom_votes: result.mom_votes,
        dad_votes: result.dad_votes,
        mom_percentage: Number(result.mom_percentage),
        dad_percentage: 100 - Number(result.mom_percentage),
        crowd_choice: result.crowd_choice,
        actual_choice: result.actual_choice,
        perception_gap: result.perception_gap,
        roast_commentary: result.roast_commentary,
        particle_effect: result.particle_effect,
        revealed_at: result.revealed_at,
      },
    })

    // Prepare response
    const voteComparison = {
      mom_votes: momVotes,
      dad_votes: dadVotes,
      mom_percentage: voteCounts.mom_pct,
      dad_percentage: voteCounts.dad_pct,
      total_votes: voteCounts.total_votes,
      crowd_choice: crowdChoice,
      actual_choice: actualChoice,
    }

    console.log(`[game-reveal] Reveal complete!`)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          roast_commentary: roastCommentary,
          perception_gap: perceptionGap,
          vote_comparison: voteComparison,
          particle_effect: particleEffect,
          result_id: result.id,
          scenario_info: {
            text: scenario.scenario_text,
            mom_option: scenario.mom_option,
            dad_option: scenario.dad_option,
          },
          round_info: {
            current_round: sessionData.current_round + 1,
            total_rounds: sessionData.total_rounds,
          },
        },
      }),
      { status: 200, headers }
    )

  } catch (err) {
    console.error('[game-reveal] Edge Function error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Internal server error'
    
    return new Response(
      JSON.stringify({ error: errorMessage } as ErrorResponse),
      { status: 500, headers }
    )
  }
})
