import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Request/Response interfaces
interface CreateSessionRequest {
  mom_name: string
  dad_name: string
  total_rounds?: number
}

interface JoinSessionRequest {
  session_code: string
  guest_name: string
}

interface UpdateSessionRequest {
  session_code: string
  admin_code: string
  status?: string
  current_round?: number
}

interface SessionResponse {
  session_code: string
  admin_code: string
  session_id: string
  mom_name: string
  dad_name: string
  status: string
  current_round: number
  total_rounds: number
  created_at: string
}

/**
 * Generate a 6-character alphanumeric session code
 */
function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude confusing chars like I, 1, O, 0
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
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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
      throw new Error('Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // GET: Retrieve session by code
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const sessionCode = url.searchParams.get('code')

      if (!sessionCode) {
        return new Response(
          JSON.stringify({ error: 'Session code is required' }),
          { status: 400, headers }
        )
      }

      console.log(`[game-session] Retrieving session: ${sessionCode}`)

      const { data: session, error } = await supabase
        .from('baby_shower.game_sessions')
        .select('*')
        .eq('session_code', sessionCode.toUpperCase())
        .single()

      if (error || !session) {
        console.error('[game-session] Session not found:', sessionCode)
        return new Response(
          JSON.stringify({ error: 'Session not found' }),
          { status: 404, headers }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            session_code: session.session_code,
            mom_name: session.mom_name,
            dad_name: session.dad_name,
            status: session.status,
            current_round: session.current_round,
            total_rounds: session.total_rounds,
            created_at: session.created_at,
          }
        }),
        { status: 200, headers }
      )
    }

    // POST: Create session, join session, or update session
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers }
      )
    }

    const body = await req.json()
    const action = body.action

    // Route to appropriate handler
    switch (action) {
      case 'create':
        return await handleCreateSession(supabase, body, headers)
      case 'join':
        return await handleJoinSession(supabase, body, headers)
      case 'update':
        return await handleUpdateSession(supabase, body, headers)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Must be create, join, or update' }),
          { status: 400, headers }
        )
    }

  } catch (err) {
    console.error('[game-session] Edge Function error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers }
    )
  }
})

/**
 * Handle creating a new game session
 */
async function handleCreateSession(
  supabase: ReturnType<typeof createClient>,
  body: CreateSessionRequest,
  headers: Headers
): Promise<Response> {
  const { mom_name, dad_name, total_rounds } = body

  // Validation
  const errors: string[] = []
  if (!mom_name || mom_name.trim().length === 0) {
    errors.push('Mom name is required')
  }
  if (mom_name && mom_name.length > 100) {
    errors.push('Mom name must be 100 characters or less')
  }
  if (!dad_name || dad_name.trim().length === 0) {
    errors.push('Dad name is required')
  }
  if (dad_name && dad_name.length > 100) {
    errors.push('Dad name must be 100 characters or less')
  }
  if (total_rounds !== undefined && (typeof total_rounds !== 'number' || total_rounds < 1 || total_rounds > 20)) {
    errors.push('Total rounds must be a number between 1 and 20')
  }

  if (errors.length > 0) {
    return new Response(
      JSON.stringify({ error: 'Validation failed', details: errors }),
      { status: 400, headers }
    )
  }

  // Generate unique session code and admin PIN
  const sessionCode = generateSessionCode()
  const adminCode = generateAdminPIN()

  console.log(`[game-session] Creating session with code: ${sessionCode}`)

  // Ensure unique session code (collision prevention)
  let attempts = 0
  let finalCode = sessionCode
  while (attempts < 10) {
    const { data: existing } = await supabase
      .from('baby_shower.game_sessions')
      .select('session_code')
      .eq('session_code', finalCode)
      .single()

    if (existing) {
      finalCode = generateSessionCode()
      attempts++
    } else {
      break
    }
  }

  if (attempts >= 10) {
    throw new Error('Failed to generate unique session code after 10 attempts')
  }

  const { data: session, error } = await supabase
    .from('baby_shower.game_sessions')
    .insert({
      session_code: finalCode,
      admin_code: adminCode,
      mom_name: mom_name.trim(),
      dad_name: dad_name.trim(),
      status: 'setup',
      current_round: 0,
      total_rounds: total_rounds || 5,
    })
    .select()
    .single()

  if (error) {
    console.error('[game-session] Database insert error:', error)
    throw new Error(`Failed to create session: ${error.message}`)
  }

  console.log(`[game-session] Session created successfully: ${session.id}`)

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        session_id: session.id,
        session_code: session.session_code,
        admin_code: session.admin_code,
        mom_name: session.mom_name,
        dad_name: session.dad_name,
        status: session.status,
        current_round: session.current_round,
        total_rounds: session.total_rounds,
        created_at: session.created_at,
      }
    } as SessionResponse),
    { status: 201, headers }
  )
}

/**
 * Handle joining a session as a guest
 */
async function handleJoinSession(
  supabase: ReturnType<typeof createClient>,
  body: JoinSessionRequest,
  headers: Headers
): Promise<Response> {
  const { session_code, guest_name } = body

  // Validation
  const errors: string[] = []
  if (!session_code || session_code.trim().length === 0) {
    errors.push('Session code is required')
  }
  if (session_code && session_code.length !== 6) {
    errors.push('Session code must be 6 characters')
  }
  if (!guest_name || guest_name.trim().length === 0) {
    errors.push('Guest name is required')
  }
  if (guest_name && guest_name.length > 100) {
    errors.push('Guest name must be 100 characters or less')
  }

  if (errors.length > 0) {
    return new Response(
      JSON.stringify({ error: 'Validation failed', details: errors }),
      { status: 400, headers }
    )
  }

  const normalizedCode = session_code.trim().toUpperCase()
  const sanitizedGuestName = guest_name.trim().slice(0, 100)

  console.log(`[game-session] Guest "${sanitizedGuestName}" joining session: ${normalizedCode}`)

  // Check if session exists and is active
  const { data: session, error: sessionError } = await supabase
    .from('baby_shower.game_sessions')
    .select('*')
    .eq('session_code', normalizedCode)
    .single()

  if (sessionError || !session) {
    console.error('[game-session] Session not found:', normalizedCode)
    return new Response(
      JSON.stringify({ error: 'Session not found' }),
      { status: 404, headers }
    )
  }

  // Check if session is in a valid state for joining
  const validStatuses = ['setup', 'voting']
  if (!validStatuses.includes(session.status)) {
    return new Response(
      JSON.stringify({ error: `Cannot join session in ${session.status} status` }),
      { status: 400, headers }
    )
  }

  console.log(`[game-session] Successfully joined session: ${normalizedCode}`)

  return new Response(
    JSON.stringify({
      success: true,
      message: `Welcome to the game, ${sanitizedGuestName}!`,
      data: {
        session_code: session.session_code,
        mom_name: session.mom_name,
        dad_name: session.dad_name,
        status: session.status,
        current_round: session.current_round,
        total_rounds: session.total_rounds,
      }
    }),
    { status: 200, headers }
  )
}

/**
 * Handle updating session status (admin only)
 */
async function handleUpdateSession(
  supabase: ReturnType<typeof createClient>,
  body: UpdateSessionRequest,
  headers: Headers
): Promise<Response> {
  const { session_code, admin_code, status, current_round } = body

  // Validation
  const errors: string[] = []
  if (!session_code || session_code.trim().length === 0) {
    errors.push('Session code is required')
  }
  if (!admin_code || admin_code.trim().length === 0) {
    errors.push('Admin code is required')
  }
  if (admin_code && (admin_code.length !== 4 || !/^\d{4}$/.test(admin_code))) {
    errors.push('Admin code must be a 4-digit PIN')
  }
  if (status && !['setup', 'voting', 'revealed', 'complete'].includes(status)) {
    errors.push('Invalid status. Must be: setup, voting, revealed, or complete')
  }
  if (current_round !== undefined && (typeof current_round !== 'number' || current_round < 0)) {
    errors.push('Current round must be a non-negative number')
  }

  if (errors.length > 0) {
    return new Response(
      JSON.stringify({ error: 'Validation failed', details: errors }),
      { status: 400, headers }
    )
  }

  const normalizedCode = session_code.trim().toUpperCase()

  console.log(`[game-session] Updating session: ${normalizedCode}`)

  // Get session
  const { data: session, error: sessionError } = await supabase
    .from('baby_shower.game_sessions')
    .select('*')
    .eq('session_code', normalizedCode)
    .single()

  if (sessionError || !session) {
    console.error('[game-session] Session not found:', normalizedCode)
    return new Response(
      JSON.stringify({ error: 'Session not found' }),
      { status: 404, headers }
    )
  }

  // Verify admin code
  if (session.admin_code !== admin_code) {
    console.warn(`[game-session] Invalid admin code for session: ${normalizedCode}`)
    return new Response(
      JSON.stringify({ error: 'Invalid admin code' }),
      { status: 401, headers }
    )
  }

  // Build update object
  const updateData: Record<string, unknown> = {}
  if (status) updateData.status = status
  if (current_round !== undefined) updateData.current_round = current_round

  // Don't update if nothing changed
  if (Object.keys(updateData).length === 0) {
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'No changes to apply',
        data: {
          session_code: session.session_code,
          status: session.status,
          current_round: session.current_round,
        }
      }),
      { status: 200, headers }
    )
  }

  const { data: updatedSession, error: updateError } = await supabase
    .from('baby_shower.game_sessions')
    .update(updateData)
    .eq('session_code', normalizedCode)
    .select()
    .single()

  if (updateError) {
    console.error('[game-session] Database update error:', updateError)
    throw new Error(`Failed to update session: ${updateError.message}`)
  }

  console.log(`[game-session] Session updated successfully: ${normalizedCode}`)

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Session updated successfully',
      data: {
        session_code: updatedSession.session_code,
        status: updatedSession.status,
        current_round: updatedSession.current_round,
        total_rounds: updatedSession.total_rounds,
      }
    }),
    { status: 200, headers }
  )
}
