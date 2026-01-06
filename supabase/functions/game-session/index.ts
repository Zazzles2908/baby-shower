/**
 * Mom vs Dad Game - Game Session Function (Unified Schema)
 * Updated to use game_* tables from 20260103_mom_vs_dad_game_schema.sql
 * 
 * Purpose: Create/manage game sessions, generate session codes, handle admin login
 * Trigger: POST /game-session
 * 
 * Schema Mapping:
 * - Uses baby_shower.game_sessions table
 * - session_code: 6-char alphanumeric code (excludes confusing chars)
 * - admin_code: 4-digit PIN for parent access
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

/**
 * Generate a 6-character alphanumeric session code
 * Excludes confusing characters: I, 1, O, 0
 */
function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Generate a 4-digit PIN
 */
function generateAdminPIN(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
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
    ])

    if (!envValidation.isValid) {
      console.error('Game Session - Environment validation failed:', envValidation.errors)
      return createErrorResponse('Server configuration error', 500)
    }

    if (envValidation.warnings.length > 0) {
      console.warn('Game Session - Environment warnings:', envValidation.warnings)
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // GET: Retrieve session by code
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const sessionCode = url.searchParams.get('code')

      if (!sessionCode) {
        return createErrorResponse('Session code is required', 400)
      }

      console.log(`[game-session] Retrieving session: ${sessionCode}`)

      const { data: session, error } = await supabase
        .from('baby_shower.game_sessions')
        .select('id, session_code, mom_name, dad_name, status, current_round, total_rounds, created_at')
        .eq('session_code', sessionCode.toUpperCase())
        .single()

      if (error || !session) {
        console.error('[game-session] Session not found:', sessionCode)
        return createErrorResponse('Session not found', 404)
      }

      console.log(`[game-session] Successfully retrieved session: ${session.session_code}`)

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

    // POST: Create session, join session, or update session
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

    console.log(`[game-session] Action: ${body.action}`)

    // Route to appropriate handler
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
        return createErrorResponse('Invalid action. Must be create, join, admin_login, or update', 400)
    }

  } catch (error) {
    console.error('[game-session] Edge Function error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})

/**
 * Handle creating a new game session
 */
async function handleCreateSession(
  supabase: any,
  body: CreateSessionRequest
): Promise<Response> {
  // Input validation
  const validation = validateInput(body, {
    action: { type: 'string', required: true },
    mom_name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
    dad_name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
    total_rounds: { type: 'number', required: false, min: 1, max: 20 }
  })

  if (!validation.isValid) {
    console.error('Game Session - Validation failed:', validation.errors)
    return createErrorResponse('Validation failed', 400, validation.errors)
  }

  const { mom_name, dad_name, total_rounds } = validation.sanitized as CreateSessionRequest

  // Generate unique session code and admin PIN
  let sessionCode = generateSessionCode()
  const adminCode = generateAdminPIN()

  console.log(`[game-session] Creating session with code: ${sessionCode}`)

  // Ensure unique session code (collision prevention)
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
    throw new Error('Failed to generate unique session code after 10 attempts')
  }

  // Insert the new session
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

  if (insertError) {
    console.error('Game Session - Insert failed:', insertError)
    throw new Error('Failed to create session')
  }

  console.log(`[game-session] Session created successfully: ${session.id}`)

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

/**
 * Handle joining a session as a guest
 */
async function handleJoinSession(
  supabase: any,
  body: JoinSessionRequest
): Promise<Response> {
  // Input validation
  const validation = validateInput(body, {
    action: { type: 'string', required: true },
    session_code: { type: 'string', required: true, minLength: 6, maxLength: 6 },
    guest_name: { type: 'string', required: true, minLength: 1, maxLength: 100 }
  })

  if (!validation.isValid) {
    console.error('Game Session - Validation failed:', validation.errors)
    return createErrorResponse('Validation failed', 400, validation.errors)
  }

  const { session_code, guest_name } = validation.sanitized as JoinSessionRequest
  const normalizedCode = session_code.toUpperCase()

  console.log(`[game-session] Guest "${guest_name}" joining session: ${normalizedCode}`)

  // Check if session exists and is active
  const { data: session, error: sessionError } = await supabase
    .from('baby_shower.game_sessions')
    .select('session_code, mom_name, dad_name, status, current_round, total_rounds')
    .eq('session_code', normalizedCode)
    .single()

  if (sessionError || !session) {
    console.error('[game-session] Session not found:', normalizedCode)
    return createErrorResponse('Session not found', 404)
  }

  // Check if session is in a valid state for joining
  const validStatuses = ['setup', 'voting']
  if (!validStatuses.includes(session.status)) {
    return createErrorResponse(`Cannot join session in ${session.status} status`, 400)
  }

  console.log(`[game-session] Successfully joined session: ${normalizedCode}`)

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

/**
 * Handle updating session status (admin only)
 */
async function handleUpdateSession(
  supabase: any,
  body: UpdateSessionRequest
): Promise<Response> {
  // Input validation
  const validation = validateInput(body, {
    action: { type: 'string', required: true },
    session_code: { type: 'string', required: true, minLength: 6, maxLength: 6 },
    admin_code: { type: 'string', required: true, pattern: /^\d{4}$/ },
    status: { type: 'string', required: false, enum: ['setup', 'voting', 'revealed', 'complete'] },
    current_round: { type: 'number', required: false, min: 0 }
  })

  if (!validation.isValid) {
    console.error('Game Session - Validation failed:', validation.errors)
    return createErrorResponse('Validation failed', 400, validation.errors)
  }

  const { session_code, admin_code, status, current_round } = validation.sanitized as UpdateSessionRequest
  const normalizedCode = session_code.toUpperCase()

  console.log(`[game-session] Updating session: ${normalizedCode}`)

  // Get session
  const { data: session, error: sessionError } = await supabase
    .from('baby_shower.game_sessions')
    .select('session_code, admin_code, status, current_round, total_rounds')
    .eq('session_code', normalizedCode)
    .single()

  if (sessionError || !session) {
    console.error('[game-session] Session not found:', normalizedCode)
    return createErrorResponse('Session not found', 404)
  }

  // Verify admin code
  if (session.admin_code !== admin_code) {
    console.warn(`[game-session] Invalid admin code for session: ${normalizedCode}`)
    return createErrorResponse('Invalid admin code', 401)
  }

  // Build update object
  const updates: Record<string, unknown> = {}
  if (status) updates.status = status
  if (current_round !== undefined) updates.current_round = current_round

  // Don't update if nothing changed
  if (Object.keys(updates).length === 0) {
    return createSuccessResponse({
      message: 'No changes to apply',
      session_code: session.session_code,
      status: session.status,
      current_round: session.current_round,
      total_rounds: session.total_rounds
    }, 200)
  }

  // Perform update
  const { data: updatedSession, error: updateError } = await supabase
    .from('baby_shower.game_sessions')
    .update(updates)
    .eq('session_code', normalizedCode)
    .select('session_code, status, current_round, total_rounds')
    .single()

  if (updateError) {
    console.error('[game-session] Update failed:', updateError)
    throw new Error('Failed to update session')
  }

  console.log(`[game-session] Session updated successfully: ${normalizedCode}`)

  return createSuccessResponse({
    message: 'Session updated successfully',
    session_code: updatedSession.session_code,
    status: updatedSession.status,
    current_round: updatedSession.current_round,
    total_rounds: updatedSession.total_rounds
  }, 200)
}

/**
 * Handle admin login to manage game session
 */
async function handleAdminLogin(
  supabase: any,
  body: AdminLoginRequest
): Promise<Response> {
  // Input validation
  const validation = validateInput(body, {
    action: { type: 'string', required: true },
    session_code: { type: 'string', required: true, minLength: 6, maxLength: 6 },
    admin_code: { type: 'string', required: true, pattern: /^\d{4}$/ }
  })

  if (!validation.isValid) {
    console.error('Game Session - Validation failed:', validation.errors)
    return createErrorResponse('Validation failed', 400, validation.errors)
  }

  const { session_code, admin_code } = validation.sanitized as AdminLoginRequest
  const normalizedCode = session_code.toUpperCase()

  console.log(`[game-session] Admin login attempt for session: ${normalizedCode}`)

  // Get session with admin code verification
  const { data: session, error: sessionError } = await supabase
    .from('baby_shower.game_sessions')
    .select('id, session_code, admin_code, mom_name, dad_name, status, current_round, total_rounds')
    .eq('session_code', normalizedCode)
    .single()

  if (sessionError || !session) {
    console.error('[game-session] Session not found:', normalizedCode)
    return createErrorResponse('Session not found', 404)
  }

  // Verify admin code
  if (session.admin_code !== admin_code) {
    console.warn(`[game-session] Invalid admin code for session: ${normalizedCode}`)
    return createErrorResponse('Invalid admin code', 401)
  }

  console.log(`[game-session] Admin login successful for session: ${normalizedCode}`)

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
