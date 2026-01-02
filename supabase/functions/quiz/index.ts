import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  })

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Missing env vars')

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const body: QuizRequest = await req.json()

    // Build answers object from individual puzzle fields if not provided
    const answers = body.answers || {
      puzzle1: body.puzzle1 || '',
      puzzle2: body.puzzle2 || '',
      puzzle3: body.puzzle3 || '',
      puzzle4: body.puzzle4 || '',
      puzzle5: body.puzzle5 || '',
    }

    // Validation
    const errors: string[] = []
    
    if (!answers || Object.keys(answers).length === 0) {
      errors.push('Answers object is required')
    }
    
    if (answers && Object.keys(answers).length < 5) {
      errors.push('All 5 puzzle answers are required')
    }
    
    if (typeof body.score !== 'number' || body.score < 0) {
      errors.push('Score must be a non-negative number')
    }
    
    if (typeof body.totalQuestions !== 'number' || body.totalQuestions < 1) {
      errors.push('Total questions must be at least 1')
    }
    
    if (body.score > body.totalQuestions) {
      errors.push('Score cannot exceed total questions')
    }

    if (errors.length > 0) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: errors }), { status: 400, headers })
    }

    // Count total submissions BEFORE insert to check milestone
    const { count: totalCount } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
    const currentCount = totalCount || 0
    const isMilestone = currentCount + 1 === 50

    const { data, error } = await supabase
      .from('submissions')
      .insert({
        name: body.name || 'Anonymous Quiz Taker',
        activity_type: 'quiz',
        activity_data: {
          answers: answers,
          score: body.score,
          total_questions: body.totalQuestions,
          percentage: Math.round((body.score / body.totalQuestions) * 100),
          submitted_at: new Date().toISOString(),
        },
      })
      .select()
      .single()

    if (error) throw new Error(`Database error: ${error.message}`)

    const percentage = Math.round((body.score / body.totalQuestions) * 100)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: data.id,
          score: body.score,
          total_questions: body.totalQuestions,
          percentage,
          created_at: data.created_at,
        },
        milestone: isMilestone ? {
          triggered: true,
          threshold: 50,
          message: '🎉 We hit 50 submissions! Cake time!'
        } : undefined
      }),
      { status: 201, headers }
    )

  } catch (err) {
    console.error('Edge Function error:', err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }), { status: 500, headers })
  }
})
