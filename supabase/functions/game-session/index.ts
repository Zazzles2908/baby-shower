/**
 * Mom vs Dad Game - Game Session Function (Unified Schema)
 * Purpose: Create/manage game sessions, generate session codes, handle admin login
 */

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

function createErrorResponse(message: string, status: number = 500): Response {
  const headers = new Headers({ ...CORS_HEADERS, ...SECURITY_HEADERS, 'Content-Type': 'application/json' })
  return new Response(JSON.stringify({ success: false, error: message, timestamp: new Date().toISOString() }), { status, headers })
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!supabaseUrl || !supabaseServiceKey) {
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

      const { data: session, error } = await supabase
        .from('baby_shower.game_sessions')
        .select('id, session_code, mom_name, dad_name, status, current_round, total_rounds, created_at')
        .eq('session_code', sessionCode.toUpperCase())
        .single()
      
      if (error || !session) {
        return createErrorResponse('Session not found', 404)
      }

      return createSuccessResponse({
        session_id: session.id,
        session_code: session.session_code,
        mom_name: session.mom_name,
        dad_name: session.dad_name,
        status: session.status,
        current_round: session.current_round,
        total_rounds: session.total_rounds,
        created_at: session.created_at
      }, 200)
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
    console.error('[game-session] Error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})

async function handleCreateSession(supabase: any, body: CreateSessionRequest): Promise<Response> {
  const { mom_name, dad_name, total_rounds } = body

  let sessionCode = generateSessionCode()
  const adminCode = generateAdminPIN()

  let attempts = 0
  while (attempts < 10) {
    const { data: existing } = await supabase
      .from('baby_shower.game_sessions')
      .select('session_code')
      .eq('session_code', sessionCode)
      .single()
    
    if (existing) {
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
    .from('baby_shower.game_sessions')
    .insert({
      session_code: sessionCode,
      admin_code: adminCode,
      mom_name: mom_name,
      dad_name: dad_name,
      status: 'setup',
      current_round: 0,
      total_rounds: total_rounds || 5
    })
    .select('id, session_code, admin_code, mom_name, dad_name, status, current_round, total_rounds, created_at')
    .single()
  
  if (insertError || !session) {
    return createErrorResponse('Database operation failed', 500)
  }

  return createSuccessResponse({
    session_id: session.id,
    session_code: session.session_code,
    admin_code: session.admin_code,
    mom_name: session.mom_name,
    dad_name: session.dad_name,
    status: session.status,
    current_round: session.current_round,
    total_rounds: session.total_rounds,
    created_at: session.created_at
  }, 201)
}

async function handleJoinSession(supabase: any, body: JoinSessionRequest): Promise<Response> {
  const { session_code, guest_name } = body
  const normalizedCode = session_code.toUpperCase()

  const { data: session, error } = await supabase
    .from('baby_shower.game_sessions')
    .select('session_code, mom_name, dad_name, status, current_round, total_rounds')
    .eq('session_code', normalizedCode)
    .single()
  
  if (error || !session) {
    return createErrorResponse('Session not found', 404)
  }

  const validStatuses = ['setup', 'voting']
  if (!validStatuses.includes(session.status)) {
    return createErrorResponse(`Cannot join session in ${session.status} status`, 400)
  }

  return createSuccessResponse({
    message: `Welcome to the game, ${guest_name}!`,
    session_code: session.session_code,
    mom_name: session.mom_name,
    dad_name: session.dad_name,
    status: session.status,
    current_round: session.current_round,
    total_rounds: session.total_rounds
  }, 200)
}

async function handleUpdateSession(supabase: any, body: UpdateSessionRequest): Promise<Response> {
  const { session_code, admin_code, status, current_round } = body
  const normalizedCode = session_code.toUpperCase()

  const { data: session, error } = await supabase
    .from('baby_shower.game_sessions')
    .select('session_code, admin_code, status, current_round, total_rounds')
    .eq('session_code', normalizedCode)
    .single()
  
  if (error || !session) {
    return createErrorResponse('Session not found', 404)
  }

  if (session.admin_code !== admin_code) {
    return createErrorResponse('Invalid admin code', 401)
  }

  const updates: Record<string, unknown> = {}
  if (status) updates.status = status
  if (current_round !== undefined) updates.current_round = current_round

  if (Object.keys(updates).length === 0) {
    return createSuccessResponse({ message: 'No changes to apply', ...session }, 200)
  }

  const { data: updatedSession, error: updateError } = await supabase
    .from('baby_shower.game_sessions')
    .update(updates)
    .eq('session_code', normalizedCode)
    .select('session_code, status, current_round, total_rounds')
    .single()
  
  if (updateError || !updatedSession) {
    return createErrorResponse('Database operation failed', 500)
  }

  return createSuccessResponse({
    message: 'Session updated successfully',
    ...updatedSession
  }, 200)
}

async function handleAdminLogin(supabase: any, body: AdminLoginRequest): Promise<Response> {
  const { session_code, admin_code } = body
  const normalizedCode = session_code.toUpperCase()

  const { data: session, error } = await supabase
    .from('baby_shower.game_sessions')
    .select('id, session_code, admin_code, mom_name, dad_name, status, current_round, total_rounds')
    .eq('session_code', normalizedCode)
    .single()
  
  if (error || !session) {
    return createErrorResponse('Session not found', 404)
  }

  if (session.admin_code !== admin_code) {
    return createErrorResponse('Invalid admin code', 401)
  }

  return createSuccessResponse({
    message: 'Admin login successful',
    session_id: session.id,
    session_code: session.session_code,
    mom_name: session.mom_name,
    dad_name: session.dad_name,
    status: session.status,
    current_round: session.current_round,
    total_rounds: session.total_rounds
  }, 200)
}
