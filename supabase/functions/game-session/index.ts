import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Client } from 'https://deno.land/x/postgres@v0.17.0/mod.ts'

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

  let client: Client | null = null

  try {
    client = getDbClient()
    await client.connect()

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

      const result = await client.queryObject<{
        id: string
        session_code: string
        mom_name: string
        dad_name: string
        status: string
        current_round: number
        total_rounds: number
        created_at: Date
      }>(
        `SELECT id, session_code, mom_name, dad_name, status, 
                current_round, total_rounds, created_at
         FROM baby_shower.game_sessions 
         WHERE session_code = $1`,
        [sessionCode.toUpperCase()]
      )

      if (result.rows.length === 0) {
        console.error('[game-session] Session not found:', sessionCode)
        return new Response(
          JSON.stringify({ error: 'Session not found' }),
          { status: 404, headers }
        )
      }

      const session = result.rows[0]
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
            created_at: session.created_at.toISOString(),
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

    console.log(`[game-session] Action: ${action}`)

    // Route to appropriate handler
    switch (action) {
      case 'create':
        return await handleCreateSession(client, body, headers)
      case 'join':
        return await handleJoinSession(client, body, headers)
      case 'update':
        return await handleUpdateSession(client, body, headers)
      case 'admin_login':
        return await handleAdminLogin(client, body, headers)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Must be create, join, admin_login, or update' }),
          { status: 400, headers }
        )
    }

  } catch (err) {
    console.error('[game-session] Edge Function error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers }
    )
  } finally {
    if (client) {
      try {
        await client.end()
      } catch (e) {
        console.error('[game-session] Error closing database connection:', e)
      }
    }
  }
})

/**
 * Handle creating a new game session
 */
async function handleCreateSession(
  client: Client,
  body: { mom_name: string; dad_name: string; total_rounds?: number },
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
  let sessionCode = generateSessionCode()
  const adminCode = generateAdminPIN()

  console.log(`[game-session] Creating session with code: ${sessionCode}`)

  // Ensure unique session code (collision prevention)
  let attempts = 0
  while (attempts < 10) {
    const result = await client.queryObject<{ session_code: string }>(
      `SELECT session_code FROM baby_shower.game_sessions WHERE session_code = $1`,
      [sessionCode]
    )
    
    if (result.rows.length > 0) {
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
  const insertResult = await client.queryObject<{
    id: string
    session_code: string
    admin_code: string
    mom_name: string
    dad_name: string
    status: string
    current_round: number
    total_rounds: number
    created_at: Date
  }>(
    `INSERT INTO baby_shower.game_sessions 
      (session_code, admin_code, mom_name, dad_name, status, current_round, total_rounds)
     VALUES ($1, $2, $3, $4, 'setup', 0, $5)
     RETURNING id, session_code, admin_code, mom_name, dad_name, status, 
               current_round, total_rounds, created_at`,
    [sessionCode, adminCode, mom_name.trim(), dad_name.trim(), total_rounds || 5]
  )

  if (insertResult.rows.length === 0) {
    throw new Error('Failed to create session: No rows returned')
  }

  const session = insertResult.rows[0] as {
    id: string
    session_code: string
    admin_code: string
    mom_name: string
    dad_name: string
    status: string
    current_round: number
    total_rounds: number
    created_at: Date
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
        created_at: session.created_at.toISOString(),
      }
    } as SessionResponse),
    { status: 201, headers }
  )
}

/**
 * Handle joining a session as a guest
 */
async function handleJoinSession(
  client: Client,
  body: { session_code: string; guest_name: string },
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
  const result = await client.queryObject<{
    session_code: string
    mom_name: string
    dad_name: string
    status: string
    current_round: number
    total_rounds: number
  }>(
    `SELECT session_code, mom_name, dad_name, status, current_round, total_rounds
     FROM baby_shower.game_sessions 
     WHERE session_code = $1`,
    [normalizedCode]
  )

  if (result.rows.length === 0) {
    console.error('[game-session] Session not found:', normalizedCode)
    return new Response(
      JSON.stringify({ error: 'Session not found' }),
      { status: 404, headers }
    )
  }

  const session = result.rows[0]

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
  client: Client,
  body: { session_code: string; admin_code: string; status?: string; current_round?: number },
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
  const result = await client.queryObject<{
    session_code: string
    admin_code: string
    status: string
    current_round: number
    total_rounds: number
  }>(
    `SELECT session_code, admin_code, status, current_round, total_rounds
     FROM baby_shower.game_sessions 
     WHERE session_code = $1`,
    [normalizedCode]
  )

  if (result.rows.length === 0) {
    console.error('[game-session] Session not found:', normalizedCode)
    return new Response(
      JSON.stringify({ error: 'Session not found' }),
      { status: 404, headers }
    )
  }

  const session = result.rows[0]

  // Verify admin code
  if (session.admin_code !== admin_code) {
    console.warn(`[game-session] Invalid admin code for session: ${normalizedCode}`)
    return new Response(
      JSON.stringify({ error: 'Invalid admin code' }),
      { status: 401, headers }
    )
  }

  // Build update query
  const updates: string[] = []
  const values: unknown[] = []
  let paramIndex = 1

  if (status) {
    updates.push(`status = $${paramIndex++}`)
    values.push(status)
  }
  if (current_round !== undefined) {
    updates.push(`current_round = $${paramIndex++}`)
    values.push(current_round)
  }

  // Don't update if nothing changed
  if (updates.length === 0) {
    return new Response(
      JSON.stringify({
        success: true,
        message: 'No changes to apply',
        data: {
          session_code: session.session_code,
          status: session.status,
          current_round: session.current_round,
          total_rounds: session.total_rounds,
        }
      }),
      { status: 200, headers }
    )
  }

  values.push(normalizedCode)

  const updateResult = await client.queryObject<{
    session_code: string
    status: string
    current_round: number
    total_rounds: number
  }>(
    `UPDATE baby_shower.game_sessions 
     SET ${updates.join(', ')} 
     WHERE session_code = $${paramIndex}
     RETURNING session_code, status, current_round, total_rounds`,
    values
  )

  if (updateResult.rows.length === 0) {
    throw new Error('Failed to update session: No rows returned')
  }

  const updatedSession = updateResult.rows[0]
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

/**
 * Handle admin login to manage game session
 */
async function handleAdminLogin(
  client: Client,
  body: { session_code: string; admin_code: string },
  headers: Headers
): Promise<Response> {
  const { session_code, admin_code } = body

  // Validation
  const errors: string[] = []
  if (!session_code || session_code.trim().length === 0) {
    errors.push('Session code is required')
  }
  if (session_code && session_code.length !== 6) {
    errors.push('Session code must be 6 characters')
  }
  if (!admin_code || admin_code.trim().length === 0) {
    errors.push('Admin code is required')
  }
  if (admin_code && (admin_code.length !== 4 || !/^\d{4}$/.test(admin_code))) {
    errors.push('Admin code must be a 4-digit PIN')
  }

  if (errors.length > 0) {
    return new Response(
      JSON.stringify({ error: 'Validation failed', details: errors }),
      { status: 400, headers }
    )
  }

  const normalizedCode = session_code.trim().toUpperCase()

  console.log(`[game-session] Admin login attempt for session: ${normalizedCode}`)

  // Get session with admin code verification
  const result = await client.queryObject<{
    id: string
    session_code: string
    admin_code: string
    mom_name: string
    dad_name: string
    status: string
    current_round: number
    total_rounds: number
  }>(
    `SELECT id, session_code, admin_code, mom_name, dad_name, status, current_round, total_rounds
     FROM baby_shower.game_sessions 
     WHERE session_code = $1`,
    [normalizedCode]
  )

  if (result.rows.length === 0) {
    console.error('[game-session] Session not found:', normalizedCode)
    return new Response(
      JSON.stringify({ error: 'Session not found' }),
      { status: 404, headers }
    )
  }

  const session = result.rows[0]

  // Verify admin code
  if (session.admin_code !== admin_code) {
    console.warn(`[game-session] Invalid admin code for session: ${normalizedCode}`)
    return new Response(
      JSON.stringify({ error: 'Invalid admin code' }),
      { status: 401, headers }
    )
  }

  console.log(`[game-session] Admin login successful for session: ${normalizedCode}`)

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Admin login successful',
      data: {
        session_id: session.id,
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
