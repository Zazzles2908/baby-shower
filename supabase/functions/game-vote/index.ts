import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Client } from 'https://deno.land/x/postgres@v0.17.0/mod.ts'

// Request/Response interfaces
interface SubmitVoteRequest {
  scenario_id: string
  guest_name: string
  vote_choice: 'mom' | 'dad'
}

interface GetVotesRequest {
  scenario_id: string
}

interface LockAnswerRequest {
  scenario_id: string
  parent: 'mom' | 'dad'
  answer: 'mom' | 'dad'
  admin_code: string
}

interface VoteCounts {
  mom_votes: number
  dad_votes: number
  mom_pct: number
  dad_pct: number
  total_votes: number
}

interface LockStatus {
  locked: boolean
  both_locked: boolean
  mom_locked?: boolean
  dad_locked?: boolean
  mom_answer?: string
  dad_answer?: string
}

interface ErrorResponse {
  error: string
  details?: unknown
}

interface RealtimePayload {
  type: 'vote_update' | 'answer_locked'
  scenario_id: string
  vote_counts?: VoteCounts
  lock_status?: LockStatus
}

// Utility function to calculate vote percentages
function calculatePercentages(momVotes: number, dadVotes: number): VoteCounts {
  const total = momVotes + dadVotes
  return {
    mom_votes: momVotes,
    dad_votes: dadVotes,
    mom_pct: total > 0 ? Math.round((momVotes / total) * 100) : 0,
    dad_pct: total > 0 ? Math.round((dadVotes / total) * 100) : 0,
    total_votes: total,
  }
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
  // CORS headers
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  })

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  let client: Client | null = null

  try {
    client = getDbClient()
    await client.connect()

    // GET endpoint: Get current vote counts for a scenario
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const scenarioId = url.searchParams.get('scenario_id')

      if (!scenarioId) {
        return new Response(
          JSON.stringify({ error: 'scenario_id is required' } as ErrorResponse),
          { status: 400, headers }
        )
      }

      console.log(`[game-vote] GET: Fetching vote counts for scenario ${scenarioId}`)

      // Get scenario details to verify it exists
      const scenarioResult = await client.queryObject<{ id: string, session_id: string }>(
        `SELECT id, session_id FROM baby_shower.game_scenarios WHERE id = $1`,
        [scenarioId]
      )

      if (scenarioResult.rows.length === 0) {
        console.error('[game-vote] Scenario not found')
        return new Response(
          JSON.stringify({ error: 'Scenario not found' } as ErrorResponse),
          { status: 404, headers }
        )
      }

      // Count votes for this scenario
      const votesResult = await client.queryObject<{ vote_choice: string }>(
        `SELECT vote_choice FROM baby_shower.game_votes WHERE scenario_id = $1`,
        [scenarioId]
      )

      // Calculate vote counts
      const momVotes = votesResult.rows.filter(v => v.vote_choice === 'mom').length
      const dadVotes = votesResult.rows.filter(v => v.vote_choice === 'dad').length
      const voteCounts = calculatePercentages(momVotes, dadVotes)

      console.log(`[game-vote] GET: Returning vote counts - Mom: ${momVotes}, Dad: ${dadVotes}`)

      return new Response(
        JSON.stringify({ success: true, data: voteCounts }),
        { status: 200, headers }
      )
    }

    // POST endpoint: Handle voting actions
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' } as ErrorResponse),
        { status: 405, headers }
      )
    }

    // Determine action type from request body
    const contentType = req.headers.get('content-type')
    let action: 'vote' | 'lock' | 'unknown' = 'unknown'

    if (contentType?.includes('application/json')) {
      // Read body as text first to prevent multiple consumption issues
      let bodyText: string
      try {
        bodyText = await req.text()
      } catch (textError) {
        console.error('[game-vote] Failed to read request body:', textError)
        return new Response(
          JSON.stringify({ error: 'Failed to read request body' } as ErrorResponse),
          { status: 400, headers }
        )
      }
      
      // Parse JSON manually to avoid body consumption issues
      let bodyData: unknown
      try {
        bodyData = JSON.parse(bodyText)
      } catch (jsonError) {
        console.error('[game-vote] Failed to parse JSON:', jsonError)
        return new Response(
          JSON.stringify({ error: 'Invalid JSON in request body' } as ErrorResponse),
          { status: 400, headers }
        )
      }
      
      // Check if this is a lock answer request (has admin_code)
      if (bodyData && typeof bodyData === 'object' && 'admin_code' in bodyData && 'parent' in bodyData && 'answer' in bodyData) {
        return await handleLockAnswer(client, bodyData as LockAnswerRequest, headers)
      }
      // Otherwise treat as vote submission
      else if (bodyData && typeof bodyData === 'object' && 'scenario_id' in bodyData && 'guest_name' in bodyData && 'vote_choice' in bodyData) {
        return await handleSubmitVote(client, bodyData as SubmitVoteRequest, headers)
      }
    }

    // If we get here, action is unknown
    return new Response(
      JSON.stringify({ 
        error: 'Invalid request format',
        details: 'Provide either vote data (scenario_id, guest_name, vote_choice) or lock data (scenario_id, parent, answer, admin_code)'
      } as ErrorResponse),
      { status: 400, headers }
    )

  } catch (err) {
    console.error('[game-vote] Edge Function error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Internal server error'
    
    return new Response(
      JSON.stringify({ error: errorMessage } as ErrorResponse),
      { status: 500, headers }
    )
  } finally {
    if (client) {
      try {
        await client.end()
      } catch (e) {
        console.error('[game-vote] Error closing database connection:', e)
      }
    }
  }
})

/**
 * Handle submitting a vote
 */
async function handleSubmitVote(
  client: Client,
  body: SubmitVoteRequest,
  headers: Headers
): Promise<Response> {
  // Validate required fields
  const errors: string[] = []
  
  if (!body.scenario_id) {
    errors.push('scenario_id is required')
  }
  if (!body.guest_name || body.guest_name.trim().length === 0) {
    errors.push('guest_name is required')
  }
  if (!body.vote_choice || !['mom', 'dad'].includes(body.vote_choice)) {
    errors.push('vote_choice must be "mom" or "dad"')
  }
  if (body.guest_name && body.guest_name.length > 100) {
    errors.push('guest_name must be 100 characters or less')
  }

  if (errors.length > 0) {
    return new Response(
      JSON.stringify({ error: 'Validation failed', details: errors } as ErrorResponse),
      { status: 400, headers }
    )
  }

  console.log(`[game-vote] POST: Guest ${body.guest_name} voting ${body.vote_choice} for scenario ${body.scenario_id}`)

  // Get scenario and verify session status using direct SQL
  // First, get the scenario
  const scenarioResult = await client.queryObject<{
    session_id: string
  }>(
    `SELECT session_id FROM baby_shower.game_scenarios WHERE id = $1`,
    [body.scenario_id]
  )

  if (scenarioResult.rows.length === 0) {
    console.error('[game-vote] Scenario not found')
    return new Response(
      JSON.stringify({ error: 'Scenario not found' } as ErrorResponse),
      { status: 404, headers }
    )
  }

  const scenario = scenarioResult.rows[0]

  // Then, get the session status
  const sessionResult = await client.queryObject<{
    status: string
    admin_code: string
  }>(
    `SELECT status, admin_code FROM baby_shower.game_sessions WHERE id = $1`,
    [scenario.session_id]
  )

  if (sessionResult.rows.length === 0) {
    console.error('[game-vote] Session not found')
    return new Response(
      JSON.stringify({ error: 'Session not found' } as ErrorResponse),
      { status: 404, headers }
    )
  }

  const sessionData = sessionResult.rows[0]
  console.log(`[game-vote] Session status: ${sessionData.status}`)

  // Check if session is in voting status
  if (sessionData.status !== 'voting') {
    console.error(`[game-vote] Session not in voting status. Current status: ${sessionData.status}`)
    return new Response(
      JSON.stringify({ 
        error: 'Voting is not currently active for this scenario',
        details: { current_status: sessionData.status }
      } as ErrorResponse),
      { status: 400, headers }
    )
  }

  // Check if guest already voted for this scenario
  const existingVoteResult = await client.queryObject<{ id: string }>(
    `SELECT id FROM baby_shower.game_votes 
     WHERE scenario_id = $1 AND guest_name = $2`,
    [body.scenario_id, body.guest_name.trim()]
  )

  if (existingVoteResult.rows.length > 0) {
    console.log(`[game-vote] Guest ${body.guest_name} already voted, updating instead`)
    
    // Update existing vote
    await client.queryObject(
      `UPDATE baby_shower.game_votes 
       SET vote_choice = $1 
       WHERE scenario_id = $2 AND guest_name = $3`,
      [body.vote_choice, body.scenario_id, body.guest_name.trim()]
    )
  } else {
    // Insert new vote
    await client.queryObject(
      `INSERT INTO baby_shower.game_votes (scenario_id, guest_name, vote_choice)
       VALUES ($1, $2, $3)`,
      [body.scenario_id, body.guest_name.trim(), body.vote_choice]
    )
  }

  console.log(`[game-vote] Vote recorded successfully for ${body.guest_name}`)

  // Get updated vote counts
  const allVotesResult = await client.queryObject<{ vote_choice: string }>(
    `SELECT vote_choice FROM baby_shower.game_votes WHERE scenario_id = $1`,
    [body.scenario_id]
  )

  const momVotes = allVotesResult.rows.filter(v => v.vote_choice === 'mom').length
  const dadVotes = allVotesResult.rows.filter(v => v.vote_choice === 'dad').length
  const voteCounts = calculatePercentages(momVotes, dadVotes)

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        vote_counts: voteCounts,
        your_vote: {
          scenario_id: body.scenario_id,
          guest_name: body.guest_name.trim(),
          choice: body.vote_choice,
        },
      },
    }),
    { status: 200, headers }
  )
}

/**
 * Handle locking parent answer
 */
async function handleLockAnswer(
  client: Client,
  body: LockAnswerRequest,
  headers: Headers
): Promise<Response> {
  // Validate required fields
  const errors: string[] = []
  
  if (!body.scenario_id) {
    errors.push('scenario_id is required')
  }
  if (!body.parent || !['mom', 'dad'].includes(body.parent)) {
    errors.push('parent must be "mom" or "dad"')
  }
  if (!body.answer || !['mom', 'dad'].includes(body.answer)) {
    errors.push('answer must be "mom" or "dad"')
  }
  if (!body.admin_code || body.admin_code.length !== 4) {
    errors.push('admin_code must be a 4-digit PIN')
  }

  if (errors.length > 0) {
    return new Response(
      JSON.stringify({ error: 'Validation failed', details: errors } as ErrorResponse),
      { status: 400, headers }
    )
  }

  console.log(`[game-vote] POST: ${body.parent} locking answer for scenario ${body.scenario_id}`)

  // Get scenario first to find session_id
  const scenarioResult = await client.queryObject<{
    session_id: string
  }>(
    `SELECT session_id FROM baby_shower.game_scenarios WHERE id = $1`,
    [body.scenario_id]
  )

  if (scenarioResult.rows.length === 0) {
    console.error('[game-vote] Scenario not found')
    return new Response(
      JSON.stringify({ error: 'Scenario not found' } as ErrorResponse),
      { status: 404, headers }
    )
  }

  const scenario = scenarioResult.rows[0]

  // Then, get session data (status and admin_code)
  const sessionResult = await client.queryObject<{
    status: string
    admin_code: string
  }>(
    `SELECT status, admin_code FROM baby_shower.game_sessions WHERE id = $1`,
    [scenario.session_id]
  )

  if (sessionResult.rows.length === 0) {
    console.error('[game-vote] Session not found')
    return new Response(
      JSON.stringify({ error: 'Session not found' } as ErrorResponse),
      { status: 404, headers }
    )
  }

  const sessionData = sessionResult.rows[0]

  // Verify admin code
  if (sessionData.admin_code !== body.admin_code) {
    console.error('[game-vote] Invalid admin code')
    return new Response(
      JSON.stringify({ error: 'Invalid admin PIN' } as ErrorResponse),
      { status: 401, headers }
    )
  }

  // Check if session is in voting status
  if (sessionData.status !== 'voting') {
    console.error(`[game-vote] Session not in voting status. Current status: ${sessionData.status}`)
    return new Response(
      JSON.stringify({ 
        error: 'Cannot lock answers - voting is not active',
        details: { current_status: sessionData.status }
      } as ErrorResponse),
      { status: 400, headers }
    )
  }

  // Check if game_answers record exists for this scenario
  const gameAnswerResult = await client.queryObject<{
    id: string
    mom_locked: boolean
    dad_locked: boolean
    mom_answer: string
    dad_answer: string
  }>(
    `SELECT id, mom_locked, dad_locked, mom_answer, dad_answer 
     FROM baby_shower.game_answers WHERE scenario_id = $1`,
    [body.scenario_id]
  )

  let gameAnswer = gameAnswerResult.rows[0]

  // Prepare update data
  let momLocked = gameAnswer?.mom_locked ?? false
  let dadLocked = gameAnswer?.dad_locked ?? false
  let momAnswer = gameAnswer?.mom_answer
  let dadAnswer = gameAnswer?.dad_answer

  if (body.parent === 'mom') {
    momLocked = true
    momAnswer = body.answer
  } else {
    dadLocked = true
    dadAnswer = body.answer
  }

  let lockStatus: LockStatus

  if (gameAnswer) {
    // Update existing record
    await client.queryObject(
      `UPDATE baby_shower.game_answers 
       SET mom_locked = $1, dad_locked = $2, mom_answer = $3, dad_answer = $4
       WHERE scenario_id = $5`,
      [momLocked, dadLocked, momAnswer, dadAnswer, body.scenario_id]
    )

    lockStatus = {
      locked: true,
      both_locked: momLocked && dadLocked,
      mom_locked: momLocked,
      dad_locked: dadLocked,
      mom_answer: momAnswer ?? null,
      dad_answer: dadAnswer ?? null,
    }
  } else {
    // Create new record
    await client.queryObject(
      `INSERT INTO baby_shower.game_answers 
       (scenario_id, mom_locked, dad_locked, mom_answer, dad_answer)
       VALUES ($1, $2, $3, $4, $5)`,
      [body.scenario_id, momLocked, dadLocked, momAnswer, dadAnswer]
    )

    lockStatus = {
      locked: true,
      both_locked: false,
      mom_locked: body.parent === 'mom',
      dad_locked: body.parent === 'dad',
      mom_answer: body.parent === 'mom' ? body.answer : null,
      dad_answer: body.parent === 'dad' ? body.answer : null,
    }
  }

  console.log(`[game-vote] ${body.parent} successfully locked answer: ${body.answer}`)

  return new Response(
    JSON.stringify({
      success: true,
      data: lockStatus,
    }),
    { status: 200, headers }
  )
}
