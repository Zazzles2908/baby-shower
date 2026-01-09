// Edge Function: Who Would Rather Game API
// Simplified voting game with real-time results
// Created: 2026-01-04

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

// Rate limiting map (simple in-memory, consider Redis for production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 100 // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute in milliseconds

serve(async (req: Request) => {
  const headers = new Headers({
    ...CORS_HEADERS,
    ...SECURITY_HEADERS,
    'Content-Type': 'application/json',
  })

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  try {
    // Validate environment
    const envValidation = validateEnvironmentVariables([
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ])

    if (!envValidation.isValid) {
      return createErrorResponse('Server configuration error', 500)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const url = new URL(req.url)
    const path = url.pathname

    // Rate limiting check
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(clientIP)) {
      return createErrorResponse('Rate limit exceeded', 429)
    }

    // Route handling
    switch (path) {
      case '/who-would-rather/create-session':
        return await createSession(supabase, req)
      case '/who-would-rather/current-question':
        return await getCurrentQuestion(supabase, req)
      case '/who-would-rather/vote':
        return await submitVote(supabase, req)
      case '/who-would-rather/results':
        return await getResults(supabase, req)
      case '/who-would-rather/next-question':
        return await nextQuestion(supabase, req)
      case '/who-would-rather/session-status':
        return await getSessionStatus(supabase, req)
      default:
        return createErrorResponse('Endpoint not found', 404)
    }

  } catch (error) {
    console.error('Who Would Rather error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})

// Rate limiting helper
function checkRateLimit(clientIP: string): boolean {
  const now = Date.now()
  const limitInfo = rateLimitMap.get(clientIP)
  
  if (!limitInfo || now > limitInfo.resetTime) {
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (limitInfo.count >= RATE_LIMIT) {
    return false
  }
  
  limitInfo.count++
  return true
}

// Create new game session
async function createSession(supabase: any, req: Request) {
  const body = await req.json()
  
  const validation = validateInput(body, {
    guest_name: { type: 'string', required: true, minLength: 1, maxLength: 100 }
  })

  if (!validation.isValid) {
    return createErrorResponse('Validation failed', 400, validation.errors)
  }

  const { guest_name } = validation.sanitized

  try {
    // Generate unique session code
    const sessionCode = generateSessionCode()
    
    const { data: session, error } = await supabase
      .from('who_would_rather_sessions')
      .insert({
        session_code: sessionCode,
        status: 'active',
        current_question_index: 0,
        total_questions: 24,
        created_by: guest_name
      })
      .select()
      .single()

    if (error) {
      console.error('Session creation error:', error)
      return createErrorResponse('Failed to create session', 500)
    }

    return createSuccessResponse({
      session_id: session.id,
      session_code: session.session_code,
      current_question: 1,
      total_questions: 24,
      status: session.status
    })

  } catch (error) {
    console.error('Create session error:', error)
    return createErrorResponse('Failed to create session', 500)
  }
}

// Get current question for session
async function getCurrentQuestion(supabase: any, req: Request) {
  const url = new URL(req.url)
  const sessionCode = url.searchParams.get('session_code')
  const guestName = url.searchParams.get('guest_name')

  if (!sessionCode) {
    return createErrorResponse('Session code required', 400)
  }

  try {
    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('who_would_rather_sessions')
      .select('*')
      .eq('session_code', sessionCode)
      .single()

    if (sessionError || !session) {
      return createErrorResponse('Session not found', 404)
    }

    if (session.status !== 'active') {
      return createErrorResponse('Session is not active', 400)
    }

    // Get current question
    const currentQuestionNumber = session.current_question_index + 1
    
    const { data: question, error: questionError } = await supabase
      .from('who_would_rather_questions')
      .select('*')
      .eq('question_number', currentQuestionNumber)
      .eq('is_active', true)
      .single()

    if (questionError || !question) {
      return createErrorResponse('Question not found', 404)
    }

    // Check if guest has voted
    let hasVoted = false
    let guestVote = null
    
    if (guestName) {
      const { data: existingVote } = await supabase
        .from('who_would_rather_votes')
        .select('vote_choice')
        .eq('session_id', session.id)
        .eq('question_number', currentQuestionNumber)
        .eq('guest_name', guestName)
        .single()
      
      if (existingVote) {
        hasVoted = true
        guestVote = existingVote.vote_choice
      }
    }

    return createSuccessResponse({
      question_number: question.question_number,
      question_text: question.question_text,
      category: question.category,
      difficulty: question.difficulty,
      has_voted: hasVoted,
      guest_vote: guestVote,
      session_status: session.status
    })

  } catch (error) {
    console.error('Get current question error:', error)
    return createErrorResponse('Failed to get current question', 500)
  }
}

// Submit vote
async function submitVote(supabase: any, req: Request) {
  const body = await req.json()
  
  const validation = validateInput(body, {
    session_code: { type: 'string', required: true, pattern: /^[A-Z0-9]{6}$/ },
    guest_name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
    question_number: { type: 'number', required: true, min: 1, max: 24 },
    vote_choice: { type: 'string', required: true, pattern: /^(mom|dad)$/ }
  })

  if (!validation.isValid) {
    return createErrorResponse('Validation failed', 400, validation.errors)
  }

  const { session_code, guest_name, question_number, vote_choice } = validation.sanitized

  try {
    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('who_would_rather_sessions')
      .select('id, status')
      .eq('session_code', session_code)
      .single()

    if (sessionError || !session) {
      return createErrorResponse('Session not found', 404)
    }

    if (session.status !== 'active') {
      return createErrorResponse('Session is not active', 400)
    }

    // Validate question number matches current session question
    const { data: sessionData } = await supabase
      .from('who_would_rather_sessions')
      .select('current_question_index')
      .eq('id', session.id)
      .single()

    const currentQuestionNumber = sessionData.current_question_index + 1
    
    if (question_number !== currentQuestionNumber) {
      return createErrorResponse('Can only vote on current question', 400)
    }

    // Submit vote (upsert to handle re-votes)
    const { data: vote, error: voteError } = await supabase
      .from('who_would_rather_votes')
      .upsert({
        session_id: session.id,
        question_number,
        guest_name,
        vote_choice
      }, {
        onConflict: 'session_id,question_number,guest_name'
      })
      .select()
      .single()

    if (voteError) {
      console.error('Vote submission error:', voteError)
      return createErrorResponse('Failed to submit vote', 500)
    }

    // Get updated results
    const { data: results } = await supabase
      .from('who_would_rather_results')
      .select('*')
      .eq('session_id', session.id)
      .eq('question_number', question_number)
      .single()

    return createSuccessResponse({
      vote_id: vote.id,
      results: results || {
        mom_votes: vote_choice === 'mom' ? 1 : 0,
        dad_votes: vote_choice === 'dad' ? 1 : 0,
        mom_percentage: vote_choice === 'mom' ? 100.0 : 0.0,
        dad_percentage: vote_choice === 'dad' ? 100.0 : 0.0,
        winning_choice: vote_choice,
        total_votes: 1
      }
    })

  } catch (error) {
    console.error('Submit vote error:', error)
    return createErrorResponse('Failed to submit vote', 500)
  }
}

// Get results for specific question
async function getResults(supabase: any, req: Request) {
  const url = new URL(req.url)
  const sessionCode = url.searchParams.get('session_code')
  const questionNumber = parseInt(url.searchParams.get('question_number') || '0')
  const guestName = url.searchParams.get('guest_name')

  if (!sessionCode || !questionNumber) {
    return createErrorResponse('Session code and question number required', 400)
  }

  try {
    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('who_would_rather_sessions')
      .select('id')
      .eq('session_code', sessionCode)
      .single()

    if (sessionError || !session) {
      return createErrorResponse('Session not found', 404)
    }

    // Get question details
    const { data: question, error: questionError } = await supabase
      .from('who_would_rather_questions')
      .select('*')
      .eq('question_number', questionNumber)
      .single()

    if (questionError || !question) {
      return createErrorResponse('Question not found', 404)
    }

    // Get results
    const { data: results, error: resultsError } = await supabase
      .from('who_would_rather_results')
      .select('*')
      .eq('session_id', session.id)
      .eq('question_number', questionNumber)
      .single()

    if (resultsError) {
      console.error('Get results error:', resultsError)
      // Return empty results if no votes yet
      return createSuccessResponse({
        question_number: questionNumber,
        question_text: question.question_text,
        results: {
          mom_votes: 0,
          dad_votes: 0,
          mom_percentage: 0.0,
          dad_percentage: 0.0,
          winning_choice: 'tie',
          total_votes: 0
        },
        user_vote: null
      })
    }

    // Get user's vote if provided
    let userVote = null
    if (guestName) {
      const { data: userVoteData } = await supabase
        .from('who_would_rather_votes')
        .select('vote_choice')
        .eq('session_id', session.id)
        .eq('question_number', questionNumber)
        .eq('guest_name', guestName)
        .single()
      
      userVote = userVoteData?.vote_choice || null
    }

    return createSuccessResponse({
      question_number: results.question_number,
      question_text: results.question_text,
      results: {
        mom_votes: results.mom_votes,
        dad_votes: results.dad_votes,
        mom_percentage: results.mom_percentage,
        dad_percentage: results.dad_percentage,
        winning_choice: results.winning_choice,
        total_votes: results.total_votes
      },
      user_vote: userVote
    })

  } catch (error) {
    console.error('Get results error:', error)
    return createErrorResponse('Failed to get results', 500)
  }
}

// Navigate to next question
async function nextQuestion(supabase: any, req: Request) {
  const body = await req.json()
  
  const validation = validateInput(body, {
    session_code: { type: 'string', required: true, pattern: /^[A-Z0-9]{6}$/ }
  })

  if (!validation.isValid) {
    return createErrorResponse('Validation failed', 400, validation.errors)
  }

  const { session_code } = validation.sanitized

  try {
    // Get current session
    const { data: session, error: sessionError } = await supabase
      .from('who_would_rather_sessions')
      .select('*')
      .eq('session_code', session_code)
      .single()

    if (sessionError || !session) {
      return createErrorResponse('Session not found', 404)
    }

    if (session.status !== 'active') {
      return createErrorResponse('Session is not active', 400)
    }

    // Calculate next question
    const nextQuestionIndex = session.current_question_index + 1
    
    if (nextQuestionIndex >= session.total_questions) {
      // Game complete
      const { error: updateError } = await supabase
        .from('who_would_rather_sessions')
        .update({
          status: 'complete',
          completed_at: new Date().toISOString()
        })
        .eq('id', session.id)

      if (updateError) {
        console.error('Complete session error:', updateError)
        return createErrorResponse('Failed to complete session', 500)
      }

      return createSuccessResponse({
        is_complete: true,
        message: 'Game completed!',
        total_questions_answered: session.total_questions
      })
    }

    // Update to next question
    const { data: updatedSession, error: updateError } = await supabase
      .from('who_would_rather_sessions')
      .update({
        current_question_index: nextQuestionIndex
      })
      .eq('id', session.id)
      .select()
      .single()

    if (updateError) {
      console.error('Next question error:', updateError)
      return createErrorResponse('Failed to advance to next question', 500)
    }

    // Get next question details
    const { data: nextQuestion } = await supabase
      .from('who_would_rather_questions')
      .select('*')
      .eq('question_number', nextQuestionIndex + 1)
      .eq('is_active', true)
      .single()

    return createSuccessResponse({
      question_number: nextQuestionIndex + 1,
      question_text: nextQuestion.question_text,
      is_complete: false
    })

  } catch (error) {
    console.error('Next question error:', error)
    return createErrorResponse('Failed to advance to next question', 500)
  }
}

// Get session status
async function getSessionStatus(supabase: any, req: Request) {
  const url = new URL(req.url)
  const sessionCode = url.searchParams.get('session_code')

  if (!sessionCode) {
    return createErrorResponse('Session code required', 400)
  }

  try {
    const { data: session, error } = await supabase
      .from('who_would_rather_sessions')
      .select('*')
      .eq('session_code', sessionCode)
      .single()

    if (error || !session) {
      return createErrorResponse('Session not found', 404)
    }

    // Get current question details
    const { data: currentQuestion } = await supabase
      .from('who_would_rather_questions')
      .select('*')
      .eq('question_number', session.current_question_index + 1)
      .single()

    return createSuccessResponse({
      session_id: session.id,
      session_code: session.session_code,
      status: session.status,
      current_question_index: session.current_question_index,
      current_question_number: session.current_question_index + 1,
      total_questions: session.total_questions,
      current_question: currentQuestion ? {
        question_number: currentQuestion.question_number,
        question_text: currentQuestion.question_text,
        category: currentQuestion.category,
        difficulty: currentQuestion.difficulty
      } : null,
      created_at: session.created_at,
      completed_at: session.completed_at
    })

  } catch (error) {
    console.error('Get session status error:', error)
    return createErrorResponse('Failed to get session status', 500)
  }
}

// Helper function to generate session code
function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed confusing characters
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}