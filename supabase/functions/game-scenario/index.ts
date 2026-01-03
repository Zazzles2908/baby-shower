import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface ScenarioRequest {
  session_id: string
  mom_name: string
  dad_name: string
  theme?: string
}

interface ScenarioResponse {
  scenario_id: string
  scenario_text: string
  mom_option: string
  dad_option: string
  intensity: number
}

interface GameScenario {
  id: string
  session_id: string
  scenario_text: string
  mom_option: string
  dad_option: string
  intensity: number
  created_at: string
}

/**
 * Call Z.AI (GLM-4.7) via OpenRouter to generate a funny scenario
 */
async function generateScenario(
  momName: string,
  dadName: string,
  theme: string = 'general'
): Promise<{ scenario: string; momOption: string; dadOption: string; intensity: number } | null> {
  const apiKey = Deno.env.get('OPENROUTER_API_KEY')
  if (!apiKey) {
    console.warn('OPENROUTER_API_KEY not configured')
    return null
  }

  const themes = {
    general: 'general parenting situations',
    farm: 'farm and barnyard themed scenarios',
    funny: 'hilarious and absurd situations',
    sleep: 'sleep deprivation and middle-of-the-night scenarios',
    feeding: 'feeding and eating situations',
    messy: 'messy diaper situations',
    emotional: 'emotional parenting moments'
  }

  const themeContext = themes[theme as keyof typeof themes] || themes.general

  const prompt = `Generate a funny "who would rather" scenario for a baby shower game about ${momName} (mom) vs ${dadName} (dad).

Theme: ${themeContext}

Requirements:
1. Write a realistic, relatable scenario that could happen with a new baby
2. Make it funny but not offensive - keep it family-friendly
3. The scenario should highlight personality differences between them
4. Generate two options - one that ${momName} would do, one that ${dadName} would do
5. Include an intensity score from 0.1 (mildly funny) to 1.0 (hilarious)

Return ONLY a JSON object with this exact format:
{
  "scenario": "The scenario description",
  "mom_option": "What ${momName} would do",
  "dad_option": "What ${dadName} would do",
  "intensity": 0.7
}

Do not include any other text or formatting.`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://baby-shower.app',
        'X-Title': 'Baby Shower Game',
      },
      body: JSON.stringify({
        model: 'thudoglm/glm-4:free',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.8,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter API error:', response.status, errorText)
      return null
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()

    if (!content) {
      console.error('Empty response from OpenRouter')
      return null
    }

    // Parse JSON from response
    try {
      // Remove any markdown formatting if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(cleanContent)

      return {
        scenario: parsed.scenario || 'Baby needs immediate attention!',
        momOption: parsed.mom_option || `${momName} would handle it with grace`,
        dadOption: parsed.dad_option || `${dadName} would figure it out`,
        intensity: Math.max(0.1, Math.min(1.0, parsed.intensity || 0.5))
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content)
      // Fallback to a default scenario
      return generateFallbackScenario(momName, dadName)
    }
  } catch (error) {
    console.error('AI scenario generation failed:', error instanceof Error ? error.message : 'Unknown error')
    return generateFallbackScenario(momName, dadName)
  }
}

/**
 * Generate a fallback scenario if AI fails
 */
function generateFallbackScenario(momName: string, dadName: string): {
  scenario: string
  momOption: string
  dadOption: string
  intensity: number
} {
  return {
    scenario: "It's 3 AM and the baby has a dirty diaper that requires immediate attention.",
    momOption: `${momName} would gently clean it up while singing a lullaby`,
    dadOption: `${dadName} would make a dramatic production of it while holding their breath`,
    intensity: 0.6
  }
}

/**
 * Get the current active scenario for a game session
 */
async function getCurrentScenario(
  supabase: ReturnType<typeof createClient>,
  sessionId: string
): Promise<GameScenario | null> {
  const { data, error } = await supabase
    .from('baby_shower.game_scenarios')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    console.log('No active scenario found for session:', sessionId)
    return null
  }

  return data as GameScenario
}

serve(async (req: Request) => {
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  })

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // GET: Fetch current scenario
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const sessionId = url.searchParams.get('session_id')

      if (!sessionId) {
        return new Response(
          JSON.stringify({ error: 'session_id is required' }),
          { status: 400, headers }
        )
      }

      const scenario = await getCurrentScenario(supabase, sessionId)

      if (!scenario) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: null,
            message: 'No active scenario for this session'
          }),
          { status: 200, headers }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            scenario_id: scenario.id,
            scenario_text: scenario.scenario_text,
            mom_option: scenario.mom_option,
            dad_option: scenario.dad_option,
            intensity: scenario.intensity,
            created_at: scenario.created_at
          }
        }),
        { status: 200, headers }
      )
    }

    // POST: Generate new scenario
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers }
      )
    }

    const body: ScenarioRequest = await req.json()

    // Validation
    const errors: string[] = []
    if (!body.session_id || body.session_id.trim().length === 0) {
      errors.push('session_id is required')
    }
    if (!body.mom_name || body.mom_name.trim().length === 0) {
      errors.push('mom_name is required')
    }
    if (!body.dad_name || body.dad_name.trim().length === 0) {
      errors.push('dad_name is required')
    }

    // Validate names length
    if (body.mom_name?.length > 100) errors.push('mom_name must be 100 chars or less')
    if (body.dad_name?.length > 100) errors.push('dad_name must be 100 chars or less')

    // Validate theme if provided
    const validThemes = ['general', 'farm', 'funny', 'sleep', 'feeding', 'messy', 'emotional']
    if (body.theme && !validThemes.includes(body.theme.toLowerCase())) {
      errors.push(`theme must be one of: ${validThemes.join(', ')}`)
    }

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: errors }),
        { status: 400, headers }
      )
    }

    const sanitizedMomName = body.mom_name.trim().slice(0, 100)
    const sanitizedDadName = body.dad_name.trim().slice(0, 100)
    const theme = body.theme?.toLowerCase() || 'general'

    console.log(`[game-scenario] Generating scenario for session: ${body.session_id}`)
    console.log(`[game-scenario] Mom: ${sanitizedMomName}, Dad: ${sanitizedDadName}, Theme: ${theme}`)

    // Generate scenario using AI
    const aiResult = await generateScenario(sanitizedMomName, sanitizedDadName, theme)

    if (!aiResult) {
      console.warn('[game-scenario] AI generation failed, using fallback')
    }

    // Insert scenario into database
    const { data: scenarioData, error: insertError } = await supabase
      .from('baby_shower.game_scenarios')
      .insert({
        session_id: body.session_id,
        scenario_text: aiResult?.scenario || generateFallbackScenario(sanitizedMomName, sanitizedDadName).scenario,
        mom_option: aiResult?.momOption || `${sanitizedMomName} would handle it with grace`,
        dad_option: aiResult?.dadOption || `${sanitizedDadName} would figure it out`,
        intensity: aiResult?.intensity || 0.5,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to insert scenario:', insertError)
      throw new Error(`Database error: ${insertError.message}`)
    }

    console.log(`[game-scenario] Successfully created scenario: ${scenarioData.id}`)

    const response: ScenarioResponse = {
      scenario_id: scenarioData.id,
      scenario_text: scenarioData.scenario_text,
      mom_option: scenarioData.mom_option,
      dad_option: scenarioData.dad_option,
      intensity: scenarioData.intensity,
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: response,
        ai_generated: aiResult !== null
      }),
      { status: 201, headers }
    )

  } catch (err) {
    console.error('[game-scenario] Edge Function error:', err)
    return new Response(
      JSON.stringify({ 
        error: err instanceof Error ? err.message : 'Internal server error' 
      }),
      { status: 500, headers }
    )
  }
})
