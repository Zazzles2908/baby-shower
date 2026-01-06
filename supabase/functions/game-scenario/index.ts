/**
 * Mom vs Dad Game - Game Scenario Function (Unified Schema)
 * Updated to use game_* tables from 20260103_mom_vs_dad_game_schema.sql
 * 
 * Purpose: Generate and retrieve "who would rather" scenarios using AI
 * Trigger: GET/POST /game-scenario
 * 
 * Schema Mapping:
 * - Uses baby_shower.game_scenarios table
 * - session_id: References game_sessions.id
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

interface GetScenarioRequest {
  session_id: string
}

interface GenerateScenarioRequest {
  session_id: string
  mom_name: string
  dad_name: string
  theme?: string
}

type ScenarioRequest = GetScenarioRequest | GenerateScenarioRequest

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
    ...CORS_HEADERS, 
    ...SECURITY_HEADERS, 
    'Content-Type': 'application/json' 
  })

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  try {
    // Validate environment variables
    const envValidation = validateEnvironmentVariables([
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ], ['Z.AI_API_KEY', 'OPENROUTER_API_KEY']) // Optional AI keys

    if (!envValidation.isValid) {
      console.error('Game Scenario - Environment validation failed:', envValidation.errors)
      return createErrorResponse('Server configuration error', 500)
    }

    if (envValidation.warnings.length > 0) {
      console.warn('Game Scenario - Environment warnings:', envValidation.warnings)
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // GET: Fetch current scenario
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const sessionId = url.searchParams.get('session_id')

      if (!sessionId) {
        return createErrorResponse('session_id is required', 400)
      }

      console.log(`[game-scenario] GET: Fetching scenario for session: ${sessionId}`)

      // Get the most recent scenario for this session
      const { data: scenario, error } = await supabase
        .from('baby_shower.game_scenarios')
        .select('id, scenario_text, mom_option, dad_option, intensity, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !scenario) {
        console.log('[game-scenario] No active scenario for this session')
        return createSuccessResponse({
          data: null,
          message: 'No active scenario for this session'
        }, 200)
      }

      console.log(`[game-scenario] Successfully retrieved scenario: ${scenario.id}`)

      return createSuccessResponse({
        scenario_id: scenario.id,
        scenario_text: scenario.scenario_text,
        mom_option: scenario.mom_option,
        dad_option: scenario.dad_option,
        intensity: scenario.intensity,
        created_at: scenario.created_at
      }, 200)
    }

    // POST: Generate new scenario
    if (req.method !== 'POST') {
      return createErrorResponse('Method not allowed', 405)
    }

    let body: ScenarioRequest
    try {
      body = await req.json()
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400)
    }

    // Input validation
    const validation = validateInput(body, {
      session_id: { type: 'string', required: true },
      mom_name: { type: 'string', required: false, minLength: 1, maxLength: 100 },
      dad_name: { type: 'string', required: false, minLength: 1, maxLength: 100 },
      theme: { type: 'string', required: false, enum: ['general', 'farm', 'funny', 'sleep', 'feeding', 'messy', 'emotional'] }
    })

    if (!validation.isValid) {
      console.error('Game Scenario - Validation failed:', validation.errors)
      return createErrorResponse('Validation failed', 400, validation.errors)
    }

    const { session_id, mom_name, dad_name, theme } = validation.sanitized as ScenarioRequest

    console.log(`[game-scenario] Generating scenario for session: ${session_id}`)

    // Generate scenario using AI if mom_name and dad_name are provided
    let scenarioText: string
    let momOption: string
    let dadOption: string
    let intensity: number
    let aiGenerated = false

    if (mom_name && dad_name) {
      console.log(`[game-scenario] Mom: ${mom_name}, Dad: ${dad_name}, Theme: ${theme || 'general'}`)
      
      const aiResult = await generateScenario(mom_name, dad_name, theme || 'general')
      
      if (aiResult) {
        scenarioText = aiResult.scenario
        momOption = aiResult.momOption
        dadOption = aiResult.dadOption
        intensity = aiResult.intensity
        aiGenerated = true
        console.log('[game-scenario] AI scenario generated successfully')
      } else {
        console.warn('[game-scenario] AI generation failed, using fallback')
        const fallback = generateFallbackScenario(mom_name, dad_name)
        scenarioText = fallback.scenario
        momOption = fallback.momOption
        dadOption = fallback.dadOption
        intensity = fallback.intensity
      }
    } else {
      // Use default fallback if names not provided
      const fallback = generateFallbackScenario('Mom', 'Dad')
      scenarioText = fallback.scenario
      momOption = fallback.momOption
      dadOption = fallback.dadOption
      intensity = fallback.intensity
      console.log('[game-scenario] Using default fallback scenario')
    }

    // Insert scenario into database
    const { data: scenarioData, error: insertError } = await supabase
      .from('baby_shower.game_scenarios')
      .insert({
        session_id: session_id,
        round_number: 1,
        scenario_text: scenarioText,
        mom_option: momOption,
        dad_option: dadOption,
        intensity: intensity
      })
      .select('id, scenario_text, mom_option, dad_option, intensity')
      .single()

    if (insertError) {
      console.error('Game Scenario - Insert failed:', insertError)
      throw new Error('Failed to insert scenario')
    }

    console.log(`[game-scenario] Successfully created scenario: ${scenarioData.id}`)

    return createSuccessResponse({
      scenario_id: scenarioData.id,
      scenario_text: scenarioData.scenario_text,
      mom_option: scenarioData.mom_option,
      dad_option: scenarioData.dad_option,
      intensity: scenarioData.intensity,
      ai_generated: aiGenerated
    }, 201)

  } catch (error) {
    console.error('[game-scenario] Edge Function error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})
