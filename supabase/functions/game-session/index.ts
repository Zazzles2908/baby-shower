import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
  'Access-Control-Max-Age': '86400'
}

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'"
}

function createErrorResponse(message: string, status: number = 500, details?: unknown): Response {
  const headers = new Headers({ ...CORS_HEADERS, ...SECURITY_HEADERS, 'Content-Type': 'application/json' })
  const body: Record<string, unknown> = { success: false, error: message, timestamp: new Date().toISOString() }
  if (details) {
    body.details = typeof details === 'string' ? details : JSON.stringify(details)
  }
  return new Response(JSON.stringify(body), { status, headers })
}

function createSuccessResponse(data: unknown, status: number = 200): Response {
  const headers = new Headers({ ...CORS_HEADERS, ...SECURITY_HEADERS, 'Content-Type': 'application/json' })
  return new Response(JSON.stringify({ success: true, data, timestamp: new Date().toISOString() }), { status, headers })
}

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

type GameSessionRequest = CreateSessionRequest | JoinSessionRequest | UpdateSessionRequest | AdminLoginRequest

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
    })

    if (req.method === 'GET') {
      const url = new URL(req.url)
      const sessionCode = url.searchParams.get('code')

      if (!sessionCode) {
        return createErrorResponse('Session code is required', 400)
      }

      console.log('[game-session] GET session:', sessionCode.toUpperCase())
      
      const { data: session, error } = await supabase
        .rpc('get_session_by_code', { session_code_input: sessionCode.toUpperCase() })
      
      console.log('[game-session] GET result:', { error, sessionCount: session?.length })
      if (error || !session || session.length === 0) {
        return createErrorResponse('Session not found', 404)
      }

      return createSuccessResponse(session[0], 200)
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
    .rpc('get_session_details', { session_code_input: normalizedCode })
  
  if (error || !session || session.length === 0) {
    console.error('[game-session] Join failed:', error)
    return createErrorResponse('Session not found', 404)
  }

  const result = session[0]
  const validStatuses = ['setup', 'voting']
  if (!validStatuses.includes(result.status)) {
    return createErrorResponse(`Cannot join session in ${result.status} status`, 400)
  }

  // Add player to session using RPC
  const { data: player, error: playerError } = await supabase
    .rpc('add_game_player', { 
      p_session_id: result.id, 
      p_player_name: guest_name 
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
    current_player_id: player[0]?.id,
    is_admin: player[0]?.is_admin,
    players: result.players
  }, 200)
}

async function handleUpdateSession(supabase: any, body: UpdateSessionRequest): Promise<Response> {
  const { session_code, admin_code, status, current_round } = body
  const normalizedCode = session_code.toUpperCase()

  console.log('[game-session] Updating session:', normalizedCode)

  const { data: session, error } = await supabase
    .rpc('get_session_details', { session_code_input: normalizedCode })
  
  if (error || !session || session.length === 0) {
    return createErrorResponse('Session not found', 404)
  }

  const currentSession = session[0]
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
  
  if (updateError || !updatedSession || updatedSession.length === 0) {
    console.error('[game-session] Update failed:', updateError)
    return createErrorResponse('Database operation failed', 500, updateError)
  }

  const result = updatedSession[0]
  return createSuccessResponse({
    message: 'Session updated successfully',
    ...result
  }, 200)
}

async function handleAdminLogin(supabase: any, body: AdminLoginRequest): Promise<Response> {
  const { session_code, admin_code } = body
  const normalizedCode = session_code.toUpperCase()

  console.log('[game-session] Admin login for:', normalizedCode)

  const { data: session, error } = await supabase
    .rpc('get_session_details', { session_code_input: normalizedCode })
  
  if (error || !session || session.length === 0) {
    return createErrorResponse('Session not found', 404)
  }

  const result = session[0]
  if (result.admin_code !== admin_code) {
    return createErrorResponse('Invalid admin code', 401)
  }

  return createSuccessResponse({
    message: 'Admin login successful',
    session_id: result.id,
    session_code: result.session_code,
    mom_name: result.mom_name,
    dad_name: result.dad_name,
    status: result.status,
    current_round: result.current_round,
    total_rounds: result.total_rounds
  }, 200)
}
