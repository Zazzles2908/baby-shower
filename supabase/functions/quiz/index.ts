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

interface QuizRequest {
  name?: string
  puzzle1?: string
  puzzle2?: string
  puzzle3?: string
  puzzle4?: string
  puzzle5?: string
  answers?: Record<string, string>
  score: number
  totalQuestions: number
}

serve(async (req: Request) => {
  console.log('[quiz] Function starting...')
  
  const headers = new Headers({
    ...CORS_HEADERS,
    ...SECURITY_HEADERS,
    'Content-Type': 'application/json',
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
    ])

    if (!envValidation.isValid) {
      console.error('Environment validation failed:', envValidation.errors)
      return createErrorResponse('Server configuration error', 500)
    }

    if (envValidation.warnings.length > 0) {
      console.warn('Environment warnings:', envValidation.warnings)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Parse and validate request body
    let body: QuizRequest
    try {
      body = await req.json()
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400)
    }

    // Build answers object from individual puzzle fields if not provided
    const answers = body.answers || {
      puzzle1: body.puzzle1 || '',
      puzzle2: body.puzzle2 || '',
      puzzle3: body.puzzle3 || '',
      puzzle4: body.puzzle4 || '',
      puzzle5: body.puzzle5 || '',
    }

    // Input validation using standardized function
    const validation = validateInput({
      ...body,
      answers
    }, {
      name: { type: 'string', required: false, maxLength: 100 },
      answers: { type: 'object', required: true },
      score: { type: 'number', required: true, min: 0 },
      totalQuestions: { type: 'number', required: true, min: 1 }
    })

    // Additional validation
    const errors: string[] = [...validation.errors]
    
    if (validation.sanitized.answers && Object.keys(validation.sanitized.answers as Record<string, unknown>).length < 5) {
      errors.push('All 5 puzzle answers are required')
    }
    
    const score = validation.sanitized.score as number
    const totalQuestions = validation.sanitized.totalQuestions as number
    
    if (score > totalQuestions) {
      errors.push('Score cannot exceed total questions')
    }

    if (errors.length > 0) {
      return createErrorResponse('Validation failed', 400, errors)
    }

    const participantName = (validation.sanitized.name as string) || 'Anonymous Quiz Taker'
    const percentage = Math.round((score / totalQuestions) * 100)
    const answersData = validation.sanitized.answers as Record<string, string>

    console.log(`[quiz] Inserting result via RPC`)

    // Use existing RPC function to insert (bypasses RLS)
    const { data, error } = await supabase
      .rpc('insert_quiz_result', {
        p_name: participantName,
        p_p1: answersData.puzzle1 || null,
        p_p2: answersData.puzzle2 || null,
        p_p3: answersData.puzzle3 || null,
        p_p4: answersData.puzzle4 || null,
        p_p5: answersData.puzzle5 || null,
        p_score: score,
        p_total: totalQuestions,
      })

    if (error) {
      console.error('Supabase RPC error:', JSON.stringify(error, null, 2))
      return createErrorResponse('Database operation failed', 500, { 
        message: error.message,
        details: error,
        hint: error.hint || 'Check RPC function'
      })
    }

    console.log(`[quiz] Successfully inserted quiz result with id: ${data[0]?.id}`)

    return createSuccessResponse({
      id: data[0]?.id,
      participant_name: participantName,
      score: score,
      total_questions: totalQuestions,
      percentage,
      created_at: data[0]?.created_at,
      milestone: undefined
    }, 201)

  } catch (err) {
    console.error('Edge Function error:', err)
    return createErrorResponse('Internal server error', 500)
  }
})
