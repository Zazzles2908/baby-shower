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

interface GeneratedScenario {
  scenario_text: string
  mom_option: string
  dad_option: string
  intensity: number
  theme_tags: string[]
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

    // Generate personalized scenarios using Z.AI (BigModel/ChatGLM)
    let scenarios: GeneratedScenario[]
    let aiProvider: string = 'fallback'
    const zaiApiKey = Deno.env.get('Z_AI_API_KEY')
    
    if (zaiApiKey) {
      console.log('Game Start - Attempting Z.AI scenario generation...')
      
      try {
        scenarios = await generateAIScenariosWithZAI(
          session.mom_name, 
          session.dad_name, 
          total_rounds, 
          intensity,
          zaiApiKey
        )
        aiProvider = 'z_ai'
        console.log('Game Start - Successfully generated AI scenarios')
      } catch (zaiError) {
        console.error('Game Start - Z.AI generation failed, using fallback:', zaiError)
        scenarios = generateFallbackScenarios(session.mom_name, session.dad_name, total_rounds, intensity)
        aiProvider = 'fallback'
      }
    } else {
      console.log('Game Start - No Z.AI API key configured, using fallback scenarios')
      scenarios = generateFallbackScenarios(session.mom_name, session.dad_name, total_rounds, intensity)
      aiProvider = 'fallback'
    }

    // Insert scenarios
    const { error: scenariosError } = await supabase
      .from('baby_shower.game_scenarios')
      .insert(
        scenarios.map((scenario, index) => ({
          session_id: session.id,
          round_number: index + 1,
          scenario_text: scenario.scenario_text,
          mom_option: scenario.mom_option,
          dad_option: scenario.dad_option,
          intensity: scenario.intensity,
          theme_tags: scenario.theme_tags,
          ai_provider: aiProvider,
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
 * Generate personalized scenarios using Z.AI (BigModel/ChatGLM)
 * Falls back to template scenarios if AI fails or times out
 */
async function generateAIScenariosWithZAI(
  momName: string, 
  dadName: string, 
  count: number, 
  intensity: number,
  apiKey: string
): Promise<GeneratedScenario[]> {
  console.log(`Game Start - Generating ${count} scenarios with Z.AI (intensity: ${intensity})`)
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    console.warn('Game Start - Z.AI request timeout after 10 seconds')
    controller.abort()
  }, 10000)

  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [
          {
            role: 'system',
            content: `You are a witty, warm host for a baby shower game called "Mom vs Dad: The Truth Revealed". 
Your job is to generate funny, relatable "who would rather" scenarios that compare what ${momName} (mom) and ${dadName} (dad) would do in parenting situations.

Requirements:
- Be playful and humorous, never mean-spirited
- Reference both names naturally in the scenarios
- Create situations that are relatable new parent experiences
- Make the options funny and distinct (not obviously one is "right")
- Keep the tone warm and inclusive for a baby shower
- Each scenario should be a different parenting challenge`
          },
          {
            role: 'user',
            content: `Generate ${count} funny "who would rather" scenarios comparing ${momName} vs ${dadName} in parenting situations.

Return ONLY a valid JSON array (no markdown, no explanation) with exactly ${count} objects, each containing:
- scenario_text: The situation description (funny, relatable parenting moment)
- mom_option: What ${momName} would do (funny, specific)
- dad_option: What ${dadName} would do (funny, specific)  
- intensity: Comedy level from 0.1 (mild) to 1.0 (chaotic) - use around ${intensity}
- theme_tags: Array of 2-3 tags like ["sleep", "feeding", "public", "mess", "sleep_deprivation"]

Example format:
[
  {
    "scenario_text": "It's 3 AM and the baby starts crying uncontrollably...",
    "mom_option": "${momName} would gently rock and sing lullabies",
    "dad_option": "${dadName} would stumble in, half-asleep, offering a pacifier",
    "intensity": 0.6,
    "theme_tags": ["sleep_deprivation", "nighttime", "comfort"]
  }
]

Make each scenario unique and funny! Return ONLY the JSON array.`
          }
        ],
        temperature: 0.8,
        max_tokens: 1500,
        stream: false
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Game Start - Z.AI API error:', response.status, errorText)
      throw new Error(`Z.AI API returned status ${response.status}`)
    }

    const aiData = await response.json()
    
    if (!aiData.choices?.[0]?.message?.content) {
      console.error('Game Start - Invalid Z.AI response structure:', aiData)
      throw new Error('Invalid Z.AI response structure')
    }

    const content = aiData.choices[0].message.content
    console.log('Game Start - Z.AI raw response:', content.substring(0, 200) + '...')

    // Parse and validate the AI response
    const scenarios = parseAndValidateAIResponse(content, momName, dadName, count, intensity)
    
    console.log(`Game Start - Successfully parsed ${scenarios.length} scenarios from Z.AI`)
    return scenarios

  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Game Start - Z.AI request timed out')
      throw new Error('Z.AI request timed out after 10 seconds')
    }
    
    console.error('Game Start - Z.AI generation error:', error)
    throw error
  }
}

/**
 * Parse and validate AI response as JSON array
 * Sanitizes content and validates required fields
 */
function parseAndValidateAIResponse(
  content: string, 
  momName: string, 
  dadName: string, 
  expectedCount: number,
  defaultIntensity: number
): GeneratedScenario[] {
  // Clean up the response - remove markdown code blocks if present
  let jsonContent = content.trim()
  
  // Remove markdown code block markers
  if (jsonContent.startsWith('```json')) {
    jsonContent = jsonContent.slice(7)
  } else if (jsonContent.startsWith('```')) {
    jsonContent = jsonContent.slice(3)
  }
  
  if (jsonContent.endsWith('```')) {
    jsonContent = jsonContent.slice(0, -3)
  }
  
  jsonContent = jsonContent.trim()

  // Parse JSON
  let parsed: any
  try {
    parsed = JSON.parse(jsonContent)
  } catch (parseError) {
    console.error('Game Start - Failed to parse AI response as JSON:', parseError)
    console.error('Game Start - Raw content:', jsonContent.substring(0, 500))
    throw new Error('AI response is not valid JSON')
  }

  // Validate it's an array
  if (!Array.isArray(parsed)) {
    console.error('Game Start - AI response is not an array:', typeof parsed)
    throw new Error('AI response must be an array of scenarios')
  }

  // Validate each scenario has required fields
  const scenarios: GeneratedScenario[] = []
  
  for (let i = 0; i < parsed.length; i++) {
    const scenario = parsed[i]
    
    if (!scenario.scenario_text || typeof scenario.scenario_text !== 'string') {
      console.warn(`Game Start - Missing scenario_text at index ${i}, skipping`)
      continue
    }
    
    if (!scenario.mom_option || typeof scenario.mom_option !== 'string') {
      console.warn(`Game Start - Missing mom_option at index ${i}, skipping`)
      continue
    }
    
    if (!scenario.dad_option || typeof scenario.dad_option !== 'string') {
      console.warn(`Game Start - Missing dad_option at index ${i}, skipping`)
      continue
    }

    // Ensure names are included in the options
    const sanitizedScenario: GeneratedScenario = {
      scenario_text: scenario.scenario_text,
      mom_option: scenario.mom_option.includes(momName) 
        ? scenario.mom_option 
        : `${momName} ${scenario.mom_option}`,
      dad_option: scenario.dad_option.includes(dadName) 
        ? scenario.dad_option 
        : `${dadName} ${scenario.dad_option}`,
      intensity: typeof scenario.intensity === 'number' 
        ? Math.max(0.1, Math.min(1.0, scenario.intensity)) 
        : defaultIntensity,
      theme_tags: Array.isArray(scenario.theme_tags) 
        ? scenario.theme_tags.slice(0, 5) 
        : ['funny', 'parenting']
    }

    scenarios.push(sanitizedScenario)
  }

  if (scenarios.length === 0) {
    console.error('Game Start - No valid scenarios found in AI response')
    throw new Error('AI response contained no valid scenarios')
  }

  // Return exactly the expected number of scenarios, or fewer if validation failed
  const result = scenarios.slice(0, expectedCount)
  console.log(`Game Start - Validated ${result.length}/${expectedCount} scenarios`)
  
  return result
}

/**
 * Generate fallback scenarios (template-based, no AI)
 */
function generateFallbackScenarios(momName: string, dadName: string, count: number, intensity: number): GeneratedScenario[] {
  const fallbackScenarios: GeneratedScenario[] = [
    {
      scenario_text: `It's 3 AM and the baby starts crying uncontrollably...`,
      mom_option: `${momName} would gently rock and sing lullabies`,
      dad_option: `${dadName} would stumble in, half-asleep, offering a pacifier`,
      intensity: Math.min(1.0, Math.max(0.1, intensity)),
      theme_tags: ['sleep_deprivation', 'nighttime', 'comfort']
    },
    {
      scenario_text: `The diaper explosion reaches the ceiling...`,
      mom_option: `${momName} would retch but handle it like a pro`,
      dad_option: `${dadName} would run for the hills, then come back with wipes`,
      intensity: Math.min(1.0, Math.max(0.1, intensity + 0.2)),
      theme_tags: ['mess', 'diapers', 'chaos']
    },
    {
      scenario_text: `Someone forgot to pack the diaper bag for the outing...`,
      mom_option: `${momName} would improvise with handkerchiefs`,
      dad_option: `${dadName} would panic and call for emergency backup`,
      intensity: Math.min(1.0, Math.max(0.1, intensity + 0.1)),
      theme_tags: ['外出', 'planning', 'chaos']
    },
    {
      scenario_text: `Baby's first solid food ends up everywhere except the mouth...`,
      mom_option: `${momName} would document everything for memories`,
      dad_option: `${dadName} would be too busy taking video to help clean`,
      intensity: Math.min(1.0, Math.max(0.1, intensity)),
      theme_tags: ['feeding', 'mess', 'memories']
    },
    {
      scenario_text: `It's 2 AM and the baby finally falls asleep...`,
      mom_option: `${momName} would stare at them lovingly for an hour`,
      dad_option: `${dadName} would immediately collapse on the couch`,
      intensity: Math.min(1.0, Math.max(0.1, intensity)),
      theme_tags: ['sleep_deprivation', 'nighttime', 'exhaustion']
    },
    {
      scenario_text: `The baby refuses to eat the broccoli...`,
      mom_option: `${momName} would try creative presentation tricks`,
      dad_option: `${dadName} would shrug and say "they'll eat when hungry"`,
      intensity: Math.min(1.0, Math.max(0.1, intensity)),
      theme_tags: ['feeding', 'food', 'negotiation']
    },
    {
      scenario_text: `Public meltdown at the grocery store...`,
      mom_option: `${momName} would calmly try to distract with snacks`,
      dad_option: `${dadName} would turn red and rush to checkout`,
      intensity: Math.min(1.0, Math.max(0.1, intensity + 0.1)),
      theme_tags: ['public', 'chaos', 'embarrassment']
    },
    {
      scenario_text: `Baby discovers they can scream just for fun...`,
      mom_option: `${momName} would giggle and join in the fun`,
      dad_option: `${dadName} would fake-exclaim "the lungs!"`,
      intensity: Math.min(1.0, Math.max(0.1, intensity + 0.15)),
      theme_tags: ['fun', 'noise', 'entertainment']
    },
    {
      scenario_text: `The baby finally sleeps through the night for the first time...`,
      mom_option: `${momName} would check on them 47 times`,
      dad_option: `${dadName} would sleep through it completely`,
      intensity: Math.min(1.0, Math.max(0.1, intensity)),
      theme_tags: ['sleep', 'nighttime', 'relief']
    },
    {
      scenario_text: `Someone stepped on a Lego at 3 AM...`,
      mom_option: `${momName} would yelp and hop to the bathroom`,
      dad_option: `${dadName} would let out a creative exclamation`,
      intensity: Math.min(1.0, Math.max(0.1, intensity + 0.1)),
      theme_tags: ['pain', 'toys', 'nighttime']
    }
  ]

  return fallbackScenarios.slice(0, count)
}
