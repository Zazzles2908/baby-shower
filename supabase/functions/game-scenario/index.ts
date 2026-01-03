import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Client } from 'https://deno.land/x/postgres@v0.17.0/mod.ts'

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

/**
 * Get database client using connection string from environment
 */
function getDbClient(): Client {
  const connectionString = Deno.env.get('POSTGRES_URL') ?? 
    Deno.env.get('SUPABASE_DB_URL') ?? 
    Deno.env.get('DATABASE_URL') ?? ''
  
  if (!connectionString) {
    throw new Error('Missing database connection string: POSTGRES_URL, SUPABASE_DB_URL, or DATABASE_URL')
  }
  
  return new Client(connectionString)
}

/**
 * Call Z.AI (GLM-4.7) directly or via OpenRouter to generate a funny scenario
 */
async function generateScenario(
  momName: string,
  dadName: string,
  theme: string = 'general'
): Promise<{ scenario: string; momOption: string; dadOption: string; intensity: number } | null> {
  // Check for Z.AI API key first (note the period in the name)
  const zaiApiKey = Deno.env.get('Z.AI_API_KEY')
  // Fall back to OpenRouter API key
  const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY')
  
  if (!zaiApiKey && !openrouterApiKey) {
    console.warn('No AI API keys configured (Z.AI_API_KEY or OPENROUTER_API_KEY)')
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

    let response: Response
    
    // Try Z.AI direct API first if available
    if (zaiApiKey) {
      console.log('[game-scenario] Using Z.AI API directly')
      response = await fetch('https://open.bigmodel.cn/api/paas/v3/modelapi/chatglm_pro/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${zaiApiKey}`,
        },
        body: JSON.stringify({
          prompt: prompt,
          temperature: 0.8,
          max_tokens: 500,
        }),
        signal: controller.signal,
      })
    } else {
      // Fall back to OpenRouter
      console.log('[game-scenario] Using OpenRouter API')
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openrouterApiKey}`,
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
    }

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI API error:', response.status, errorText)
      return null
    }

    const data = await response.json()
    let content: string

    // Handle different response formats
    if (zaiApiKey) {
      // Z.AI direct response format
      content = data.data?.choices?.[0]?.message?.content || data.choices?.[0]?.message?.content || ''
    } else {
      // OpenRouter response format
      content = data.choices?.[0]?.message?.content?.trim() || ''
    }

    if (!content) {
      console.error('Empty response from AI API')
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

  let client: Client | null = null

  try {
    client = getDbClient()
    await client.connect()

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

      console.log(`[game-scenario] GET: Fetching scenario for session: ${sessionId}`)

      // Get the most recent scenario for this session
      const result = await client.queryObject<{
        id: string
        scenario_text: string
        mom_option: string
        dad_option: string
        intensity: number
        created_at: Date
      }>(
        `SELECT id, scenario_text, mom_option, dad_option, intensity, created_at
         FROM baby_shower.game_scenarios 
         WHERE session_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [sessionId]
      )

      if (result.rows.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: null,
            message: 'No active scenario for this session'
          }),
          { status: 200, headers }
        )
      }

      const scenario = result.rows[0]
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            scenario_id: scenario.id,
            scenario_text: scenario.scenario_text,
            mom_option: scenario.mom_option,
            dad_option: scenario.dad_option,
            intensity: scenario.intensity,
            created_at: scenario.created_at.toISOString()
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

    const scenarioText = aiResult?.scenario || generateFallbackScenario(sanitizedMomName, sanitizedDadName).scenario
    const momOption = aiResult?.momOption || `${sanitizedMomName} would handle it with grace`
    const dadOption = aiResult?.dadOption || `${sanitizedDadName} would figure it out`
    const intensity = aiResult?.intensity || 0.5

    // Insert scenario into database using direct SQL
    const insertResult = await client.queryObject<{
      id: string
      scenario_text: string
      mom_option: string
      dad_option: string
      intensity: number
    }>(
      `INSERT INTO baby_shower.game_scenarios 
        (session_id, round_number, scenario_text, mom_option, dad_option, intensity)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, scenario_text, mom_option, dad_option, intensity`,
      [body.session_id, 1, scenarioText, momOption, dadOption, intensity]
    )

    if (insertResult.rows.length === 0) {
      throw new Error('Failed to insert scenario: No rows returned')
    }

    const scenarioData = insertResult.rows[0]
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
  } finally {
    if (client) {
      try {
        await client.end()
      } catch (e) {
        console.error('[game-scenario] Error closing database connection:', e)
      }
    }
  }
})
