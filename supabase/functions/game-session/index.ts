import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { CORS_HEADERS, SECURITY_HEADERS, createErrorResponse, createSuccessResponse } from '../_shared/security.ts'

function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

function generateAdminPIN(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

interface CreateSessionRequest {
  action: 'create'
  mom_name: string
  dad_name: string
  total_rounds?: number
}

interface JoinSessionRequest {
  action: 'join'
  session_code: string
  guest_name: string
}

interface UpdateSessionRequest {
  action: 'update'
  session_code: string
  admin_code: string
  status?: string
  current_round?: number
}

interface AdminLoginRequest {
  action: 'admin_login'
  session_code: string
  admin_code: string
}

interface StartGameRequest {
  action: 'start_game'
  session_code: string
  player_id: string
  total_rounds?: number
  intensity?: number
}

type GameSessionRequest = CreateSessionRequest | JoinSessionRequest | UpdateSessionRequest | AdminLoginRequest | StartGameRequest

serve(async (req: Request) => {
  const headers = new Headers({ ...CORS_HEADERS, ...SECURITY_HEADERS, 'Content-Type': 'application/json' })

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[game-session] Missing env vars')
      return createErrorResponse('Server configuration error', 500)
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: 'baby_shower' }
    })

    if (req.method === 'GET') {
      const url = new URL(req.url)
      const sessionCode = url.searchParams.get('code')

      if (!sessionCode) {
        return createErrorResponse('Session code is required', 400)
      }

      console.log('[game-session] GET session:', sessionCode.toUpperCase())
      
      const { data: session, error } = await supabase
        .rpc('get_session_details', { p_session_code: sessionCode.toUpperCase() })
      
      console.log('[game-session] GET result:', { error, session })
      if (error || !session) {
        return createErrorResponse('Session not found', 404)
      }

      return createSuccessResponse(session, 200)
    }

    if (req.method !== 'POST') {
      return createErrorResponse('Method not allowed', 405)
    }

    let body: GameSessionRequest
    try {
      body = await req.json()
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400)
    }

    console.log('[game-session] POST action:', body.action)

    if (!body.action) {
      return createErrorResponse('Action is required', 400)
    }

    switch (body.action) {
      case 'create':
        return await handleCreateSession(supabase, body as CreateSessionRequest)
      case 'join':
        return await handleJoinSession(supabase, body as JoinSessionRequest)
      case 'update':
        return await handleUpdateSession(supabase, body as UpdateSessionRequest)
      case 'admin_login':
        return await handleAdminLogin(supabase, body as AdminLoginRequest)
      case 'get_status':
        return await handleGetStatus(supabase, body)
      case 'start_game':
        return await handleStartGame(supabase, body as StartGameRequest)
      default:
        return createErrorResponse('Invalid action', 400)
    }

  } catch (error) {
    console.error('[game-session] Fatal error:', error)
    return createErrorResponse('Internal server error', 500, error instanceof Error ? error.message : String(error))
  }
})

async function handleCreateSession(supabase: any, body: CreateSessionRequest): Promise<Response> {
  const { mom_name, dad_name, total_rounds } = body

  console.log('[game-session] Creating session for:', mom_name, dad_name)

  let sessionCode = generateSessionCode()
  const adminCode = generateAdminPIN()

  let attempts = 0
  while (attempts < 10) {
    const { data: exists } = await supabase
      .rpc('check_session_exists', { session_code_input: sessionCode })
    
    if (exists) {
      sessionCode = generateSessionCode()
      attempts++
    } else {
      break
    }
  }

  if (attempts >= 10) {
    return createErrorResponse('Failed to generate unique session code', 500)
  }

  const { data: session, error: insertError } = await supabase
    .rpc('create_game_session', {
      session_code_input: sessionCode,
      admin_code_input: adminCode,
      mom_name_input: mom_name,
      dad_name_input: dad_name,
      total_rounds_input: total_rounds || 5
    })
  
  console.log('[game-session] Insert result:', { insertError, sessionData: session })

  if (insertError || !session || session.length === 0) {
    console.error('[game-session] Insert failed:', insertError)
    return createErrorResponse('Database operation failed', 500, insertError)
  }

  const result = session[0]
  return createSuccessResponse({
    session_id: result.id,
    session_code: result.session_code,
    admin_code: result.admin_code,
    mom_name: result.mom_name,
    dad_name: result.dad_name,
    status: result.status,
    current_round: result.current_round,
    total_rounds: result.total_rounds,
    created_at: result.created_at
  }, 201)
}

async function handleJoinSession(supabase: any, body: JoinSessionRequest): Promise<Response> {
  const { session_code, guest_name } = body
  const normalizedCode = session_code.toUpperCase()

  console.log('[game-session] Joining session:', normalizedCode)

  const { data: session, error } = await supabase
    .rpc('get_session_details', { p_session_code: normalizedCode })
  
  if (error || !session) {
    console.error('[game-session] Join failed:', error)
    return createErrorResponse('Session not found', 404)
  }

  const result = session
  const validStatuses = ['setup', 'voting']
  if (!validStatuses.includes(result.status)) {
    return createErrorResponse(`Cannot join session in ${result.status} status`, 400)
  }

  const { data: player, error: playerError } = await supabase
    .rpc('add_game_player', {
      p_session_id: result.id,
      p_player_name: guest_name,
      p_submitted_by: guest_name  // Track who added this player (self-join for accountability)
    })

  if (playerError) {
    console.error('[game-session] Failed to add player:', playerError)
    return createErrorResponse('Failed to join session', 500, playerError)
  }

  console.log('[game-session] Player added:', player)

  return createSuccessResponse({
    message: `Welcome to the game, ${guest_name}!`,
    session_code: result.session_code,
    mom_name: result.mom_name,
    dad_name: result.dad_name,
    status: result.status,
    current_round: result.current_round,
    total_rounds: result.total_rounds,
    current_player_id: player?.id,
    is_admin: player?.is_admin,
    players: result.players
  }, 200)
}

async function handleUpdateSession(supabase: any, body: UpdateSessionRequest): Promise<Response> {
  const { session_code, admin_code, status, current_round } = body
  const normalizedCode = session_code.toUpperCase()

  console.log('[game-session] Updating session:', normalizedCode)

  const { data: session, error } = await supabase
    .rpc('get_session_details', { p_session_code: normalizedCode })
  
  if (error || !session) {
    return createErrorResponse('Session not found', 404)
  }

  const currentSession = session
  if (currentSession.admin_code !== admin_code) {
    return createErrorResponse('Invalid admin code', 401)
  }

  const updates: Record<string, unknown> = {}
  if (status) updates.status = status
  if (current_round !== undefined) updates.current_round = current_round

  if (Object.keys(updates).length === 0) {
    return createSuccessResponse({ message: 'No changes to apply', ...currentSession }, 200)
  }

  const { data: updatedSession, error: updateError } = await supabase
    .rpc('update_session', {
      session_code_input: normalizedCode,
      status_input: status,
      current_round_input: current_round
    })
  
  if (updateError || !updatedSession) {
    console.error('[game-session] Update failed:', updateError)
    return createErrorResponse('Database operation failed', 500, updateError)
  }

  return createSuccessResponse({
    message: 'Session updated successfully',
    ...updatedSession
  }, 200)
}

async function handleAdminLogin(supabase: any, body: AdminLoginRequest): Promise<Response> {
  const { session_code, admin_code } = body
  const normalizedCode = session_code.toUpperCase()

  console.log('[game-session] Admin login for:', normalizedCode)

  const { data: session, error } = await supabase
    .rpc('get_session_details', { p_session_code: normalizedCode })
  
  if (error || !session) {
    return createErrorResponse('Session not found', 404)
  }

  if (session.admin_code !== admin_code) {
    return createErrorResponse('Invalid admin code', 401)
  }

  return createSuccessResponse({
    message: 'Admin login successful',
    session_code: session.session_code,
    status: session.status
  }, 200)
}

async function handleGetStatus(supabase: any, body: { session_code: string }): Promise<Response> {
  const { session_code } = body
  const normalizedCode = session_code.toUpperCase()

  console.log('[game-session] Get status for:', normalizedCode)

  const { data: session, error } = await supabase
    .rpc('get_session_details', { p_session_code: normalizedCode })
  
  if (error || !session) {
    return createErrorResponse('Session not found', 404)
  }

  const { data: players, error: playersError } = await supabase
    .from('game_players')
    .select('id, player_name, is_admin, is_ready, joined_at')
    .eq('session_id', session.id)
    .order('joined_at', { ascending: true })

  if (playersError) {
    console.warn('[game-session] Failed to fetch players:', playersError)
  }

  return createSuccessResponse({
    id: session.id,
    session_code: session.session_code,
    mom_name: session.mom_name,
    dad_name: session.dad_name,
    status: session.status,
    total_rounds: session.total_rounds,
    current_round: session.current_round,
    admin_code: session.admin_code,
    created_at: session.created_at,
    started_at: session.started_at,
    completed_at: session.completed_at,
    players: players || []
  }, 200)
}

async function handleStartGame(supabase: any, body: StartGameRequest): Promise<Response> {
  const { session_code, player_id, total_rounds, intensity } = body
  const normalizedCode = session_code.toUpperCase()

  console.log('[game-session] Starting game:', normalizedCode, 'by player:', player_id)

  const { data: session, error } = await supabase
    .rpc('get_session_details', { p_session_code: normalizedCode })
  
  if (error || !session) {
    return createErrorResponse('Session not found', 404)
  }

  const { data: player, error: playerError } = await supabase
    .from('game_players')
    .select('id, player_name, is_admin')
    .eq('id', player_id)
    .single()

  if (playerError || !player) {
    console.error('[game-session] Player not found:', player_id)
    return createErrorResponse('Player not found', 404)
  }

  if (!player.is_admin) {
    console.warn('[game-session] Non-admin tried to start game:', player_id)
    return createErrorResponse('Only admin can start the game', 403)
  }

  if (session.status !== 'setup' && session.status !== 'voting') {
    return createErrorResponse(`Cannot start game in ${session.status} status`, 400)
  }

  // Update session status to 'voting'
  const { data: updatedSession, error: updateError } = await supabase
    .rpc('update_session', {
      session_code_input: normalizedCode,
      status_input: 'voting',
      current_round_input: 1
    })

  if (updateError || !updatedSession) {
    console.error('[game-session] Failed to update session:', updateError)
    return createErrorResponse('Failed to start game', 500, updateError)
  }

  // Generate scenarios for each round
  const roundsToGenerate = total_rounds || session.total_rounds || 5
  const gameIntensity = intensity || 0.5
  const scenarios: any[] = []
  const themes = ['general', 'funny', 'sleep', 'feeding', 'messy', 'emotional', 'farm']

  for (let round = 1; round <= roundsToGenerate; round++) {
    const theme = themes[(round - 1) % themes.length]
    const fallbackScenario = generateFallbackScenario(session.mom_name, session.dad_name)
    
    // Try to generate AI scenario
    let scenarioData = null
    const zaiApiKey = Deno.env.get('Z_AI_API_KEY')
    const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY')
    
    if (zaiApiKey || openrouterApiKey) {
      try {
        const aiResult = await generateScenarioWithAI(session.mom_name, session.dad_name, theme, zaiApiKey || openrouterApiKey, !!openrouterApiKey)
        if (aiResult) {
          scenarioData = aiResult
        }
      } catch (e) {
        console.warn('[game-session] AI generation failed for round', round, e)
      }
    }
    
    if (!scenarioData) {
      scenarioData = {
        scenario_text: fallbackScenario.scenario,
        mom_option: fallbackScenario.momOption,
        dad_option: fallbackScenario.dadOption,
        intensity: fallbackScenario.intensity
      }
    }

    // Insert scenario into database
    const { data: insertedScenario, error: insertError } = await supabase
      .from('game_scenarios')
      .insert({
        session_id: session.id,
        round_number: round,
        scenario_text: scenarioData.scenario_text,
        mom_option: scenarioData.mom_option,
        dad_option: scenarioData.dad_option,
        intensity: scenarioData.intensity
      })
      .select('id, scenario_text, mom_option, dad_option, intensity')
      .single()

    if (!insertError && insertedScenario) {
      scenarios.push({
        scenario_id: insertedScenario.id,
        round: round,
        scenario_text: insertedScenario.scenario_text,
        mom_option: insertedScenario.mom_option,
        dad_option: insertedScenario.dad_option,
        intensity: insertedScenario.intensity
      })
    } else {
      // Fallback if insert fails
      scenarios.push({
        scenario_id: `round-${round}`,
        round: round,
        scenario_text: scenarioData.scenario_text,
        mom_option: scenarioData.mom_option,
        dad_option: scenarioData.dad_option,
        intensity: scenarioData.intensity
      })
    }
  }

  console.log('[game-session] Generated', scenarios.length, 'scenarios for game')

  return createSuccessResponse({
    message: 'Game started successfully',
    session_code: normalizedCode,
    status: 'voting',
    current_round: 1,
    total_rounds: roundsToGenerate,
    started_at: new Date().toISOString(),
    scenarios: scenarios
  }, 200)
}

/**
 * Generate a scenario using AI (reused from game-scenario)
 */
async function generateScenarioWithAI(
  momName: string,
  dadName: string,
  theme: string,
  apiKey: string,
  useOpenRouter: boolean
): Promise<{ scenario_text: string; mom_option: string; dad_option: string; intensity: number } | null> {
  const themes: Record<string, string> = {
    general: 'general parenting situations',
    farm: 'farm and barnyard themed scenarios',
    funny: 'hilarious and absurd situations',
    sleep: 'sleep deprivation and middle-of-the-night scenarios',
    feeding: 'feeding and eating situations',
    messy: 'messy diaper situations',
    emotional: 'emotional parenting moments'
  }

  const themeContext = themes[theme] || themes.general

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
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    let response: Response
    
    if (useOpenRouter) {
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://baby-shower.app',
          'X-Title': 'Baby Shower Game',
        },
        body: JSON.stringify({
          model: 'thudoglm/glm-4:free',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
          temperature: 0.8,
        }),
        signal: controller.signal,
      })
    } else {
      response = await fetch('https://open.bigmodel.cn/api/paas/v3/modelapi/GLM4.7/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          prompt: prompt,
          temperature: 0.8,
          max_tokens: 500,
        }),
        signal: controller.signal,
      })
    }

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error('[game-session] AI API error:', response.status)
      return null
    }

    const data = await response.json()
    let content = useOpenRouter 
      ? data.choices?.[0]?.message?.content?.trim() || ''
      : data.data?.choices?.[0]?.message?.content || data.choices?.[0]?.message?.content || ''

    if (!content) {
      return null
    }

    // Parse JSON from response
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(cleanContent)
      return {
        scenario_text: parsed.scenario || 'Baby needs immediate attention!',
        mom_option: parsed.mom_option || `${momName} would handle it with grace`,
        dad_option: parsed.dad_option || `${dadName} would figure it out`,
        intensity: Math.max(0.1, Math.min(1.0, parsed.intensity || 0.5))
      }
    } catch (parseError) {
      console.error('[game-session] Failed to parse AI response:', content)
      return null
    }
  } catch (error) {
    console.error('[game-session] AI generation failed:', error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

/**
 * Generate a fallback scenario if AI fails (reused from game-scenario)
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
