import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

// Broadcast realtime event to all connected clients
async function broadcastRealtimeUpdate(
  supabase: ReturnType<typeof createClient>,
  payload: RealtimePayload
): Promise<void> {
  try {
    const channel = supabase.channel('game_state')
    await channel.send({
      type: 'broadcast',
      event: payload.type,
      payload,
    })
    console.log(`[game-vote] Broadcast ${payload.type} for scenario ${payload.scenario_id}`)
  } catch (error) {
    console.error('[game-vote] Failed to broadcast realtime update:', error)
    // Non-blocking - don't fail the request if realtime fails
  }
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

  // Initialize Supabase client with service role
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[game-vote] Missing Supabase environment variables')
    return new Response(
      JSON.stringify({ error: 'Server configuration error' } as ErrorResponse),
      { status: 500, headers }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
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
      const { data: scenario, error: scenarioError } = await supabase
        .from('baby_shower.game_scenarios')
        .select('id, session_id')
        .eq('id', scenarioId)
        .single()

      if (scenarioError || !scenario) {
        console.error('[game-vote] Scenario not found:', scenarioError?.message)
        return new Response(
          JSON.stringify({ error: 'Scenario not found' } as ErrorResponse),
          { status: 404, headers }
        )
      }

      // Count votes for this scenario
      const { data: votes, error: votesError } = await supabase
        .from('baby_shower.game_votes')
        .select('vote_choice')
        .eq('scenario_id', scenarioId)

      if (votesError) {
        console.error('[game-vote] Failed to fetch votes:', votesError.message)
        throw new Error(`Database error: ${votesError.message}`)
      }

      // Calculate vote counts
      const momVotes = votes?.filter(v => v.vote_choice === 'mom').length ?? 0
      const dadVotes = votes?.filter(v => v.vote_choice === 'dad').length ?? 0
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
      const body = await req.json()
      
      // Check if this is a lock answer request (has admin_code)
      if (body.admin_code && body.parent && body.answer) {
        action = 'lock'
      }
      // Otherwise treat as vote submission
      else if (body.scenario_id && body.guest_name && body.vote_choice) {
        action = 'vote'
      }
    }

    if (action === 'unknown') {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request format',
          details: 'Provide either vote data (scenario_id, guest_name, vote_choice) or lock data (scenario_id, parent, answer, admin_code)'
        } as ErrorResponse),
        { status: 400, headers }
      )
    }

    // Handle vote submission
    if (action === 'vote') {
      const body: SubmitVoteRequest = await req.json()

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

      // Get scenario and verify session status
      const { data: scenario, error: scenarioError } = await supabase
        .from('baby_shower.game_scenarios')
        .select(`
          id,
          session_id,
          baby_shower.game_sessions!inner (status, admin_code)
        `)
        .eq('id', body.scenario_id)
        .single()

      if (scenarioError || !scenario) {
        console.error('[game-vote] Scenario not found:', scenarioError?.message)
        return new Response(
          JSON.stringify({ error: 'Scenario not found' } as ErrorResponse),
          { status: 404, headers }
        )
      }

      const sessionData = scenario.baby_shower?.game_sessions?.[0]
      if (!sessionData) {
        console.error('[game-vote] Failed to get session data')
        return new Response(
          JSON.stringify({ error: 'Session data not found' } as ErrorResponse),
          { status: 404, headers }
        )
      }

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
      const { data: existingVote, error: existingVoteError } = await supabase
        .from('baby_shower.game_votes')
        .select('id')
        .eq('scenario_id', body.scenario_id)
        .eq('guest_name', body.guest_name.trim())
        .maybeSingle()

      if (existingVoteError) {
        console.error('[game-vote] Failed to check existing vote:', existingVoteError.message)
        throw new Error(`Database error: ${existingVoteError.message}`)
      }

      if (existingVote) {
        console.log(`[game-vote] Guest ${body.guest_name} already voted, updating instead`)
        
        // Update existing vote
        const { error: updateError } = await supabase
          .from('baby_shower.game_votes')
          .update({ vote_choice: body.vote_choice })
          .eq('id', existingVote.id)

        if (updateError) {
          console.error('[game-vote] Failed to update vote:', updateError.message)
          throw new Error(`Database error: ${updateError.message}`)
        }
      } else {
        // Insert new vote
        const { error: insertError } = await supabase
          .from('baby_shower.game_votes')
          .insert({
            scenario_id: body.scenario_id,
            guest_name: body.guest_name.trim(),
            vote_choice: body.vote_choice,
          })

        if (insertError) {
          console.error('[game-vote] Failed to insert vote:', insertError.message)
          throw new Error(`Database error: ${insertError.message}`)
        }
      }

      console.log(`[game-vote] Vote recorded successfully for ${body.guest_name}`)

      // Get updated vote counts
      const { data: allVotes, error: countError } = await supabase
        .from('baby_shower.game_votes')
        .select('vote_choice')
        .eq('scenario_id', body.scenario_id)

      if (countError) {
        console.error('[game-vote] Failed to get vote counts:', countError.message)
        throw new Error(`Database error: ${countError.message}`)
      }

      const momVotes = allVotes?.filter(v => v.vote_choice === 'mom').length ?? 0
      const dadVotes = allVotes?.filter(v => v.vote_choice === 'dad').length ?? 0
      const voteCounts = calculatePercentages(momVotes, dadVotes)

      // Broadcast realtime update
      await broadcastRealtimeUpdate(supabase, {
        type: 'vote_update',
        scenario_id: body.scenario_id,
        vote_counts: voteCounts,
      })

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

    // Handle lock parent answer
    if (action === 'lock') {
      const body: LockAnswerRequest = await req.json()

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

      // Get scenario and verify admin code
      const { data: scenario, error: scenarioError } = await supabase
        .from('baby_shower.game_scenarios')
        .select(`
          id,
          session_id,
          baby_shower.game_sessions!inner (admin_code, status, mom_name, dad_name)
        `)
        .eq('id', body.scenario_id)
        .single()

      if (scenarioError || !scenario) {
        console.error('[game-vote] Scenario not found:', scenarioError?.message)
        return new Response(
          JSON.stringify({ error: 'Scenario not found' } as ErrorResponse),
          { status: 404, headers }
        )
      }

      const sessionData = scenario.baby_shower?.game_sessions?.[0]
      if (!sessionData) {
        console.error('[game-vote] Failed to get session data')
        return new Response(
          JSON.stringify({ error: 'Session data not found' } as ErrorResponse),
          { status: 404, headers }
        )
      }

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
      let { data: gameAnswer, error: answerError } = await supabase
        .from('baby_shower.game_answers')
        .select('*')
        .eq('scenario_id', body.scenario_id)
        .maybeSingle()

      if (answerError) {
        console.error('[game-vote] Failed to check game answers:', answerError.message)
        throw new Error(`Database error: ${answerError.message}`)
      }

      // Prepare update data
      const updateData: Record<string, unknown> = {}
      if (body.parent === 'mom') {
        updateData.mom_answer = body.answer
        updateData.mom_locked = true
      } else {
        updateData.dad_answer = body.answer
        updateData.dad_locked = true
      }

      let lockStatus: LockStatus

      if (gameAnswer) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('baby_shower.game_answers')
          .update(updateData)
          .eq('id', gameAnswer.id)

        if (updateError) {
          console.error('[game-vote] Failed to update game answer:', updateError.message)
          throw new Error(`Database error: ${updateError.message}`)
        }

        lockStatus = {
          locked: true,
          both_locked: (updateData.mom_locked ? true : gameAnswer.mom_locked) && 
                       (updateData.dad_locked ? true : gameAnswer.dad_locked),
          mom_locked: updateData.mom_locked ? true : gameAnswer.mom_locked,
          dad_locked: updateData.dad_locked ? true : gameAnswer.dad_locked,
          mom_answer: updateData.mom_answer as string ?? gameAnswer.mom_answer,
          dad_answer: updateData.dad_answer as string ?? gameAnswer.dad_answer,
        }
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('baby_shower.game_answers')
          .insert({
            scenario_id: body.scenario_id,
            ...updateData,
          })

        if (insertError) {
          console.error('[game-vote] Failed to insert game answer:', insertError.message)
          throw new Error(`Database error: ${insertError.message}`)
        }

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

      // Broadcast realtime update
      await broadcastRealtimeUpdate(supabase, {
        type: 'answer_locked',
        scenario_id: body.scenario_id,
        lock_status: lockStatus,
      })

      return new Response(
        JSON.stringify({
          success: true,
          data: lockStatus,
        }),
        { status: 200, headers }
      )
    }

    // Fallback for unknown action
    return new Response(
      JSON.stringify({ error: 'Unknown action' } as ErrorResponse),
      { status: 400, headers }
    )

  } catch (err) {
    console.error('[game-vote] Edge Function error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Internal server error'
    
    return new Response(
      JSON.stringify({ error: errorMessage } as ErrorResponse),
      { status: 500, headers }
    )
  }
})
