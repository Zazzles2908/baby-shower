import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface AdviceRequest {
  advice: string
  category: string
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

    const body: AdviceRequest = await req.json()

    // Validation
    const errors: string[] = []
    
    if (!body.advice || body.advice.trim().length === 0) {
      errors.push('Advice text is required')
    }
    
    if (body.advice && body.advice.length > 2000) {
      errors.push('Advice must be 2000 characters or less')
    }
    
    if (!body.category || body.category.trim().length === 0) {
      errors.push('Category is required')
    }
    
    const validCategories = ['general', 'naming', 'feeding', 'sleeping', 'safety', 'fun']
    if (body.category && !validCategories.includes(body.category.toLowerCase())) {
      errors.push(`Category must be one of: ${validCategories.join(', ')}`)
    }

    if (errors.length > 0) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: errors }), { status: 400, headers })
    }

    const sanitizedAdvice = body.advice.trim().slice(0, 2000)
    const sanitizedCategory = body.category.toLowerCase().trim()

    const { data, error } = await supabase
      .from('submissions')
      .insert({
        name: 'Anonymous Advisor',
        activity_type: 'advice',
        activity_data: {
          advice: sanitizedAdvice,
          category: sanitizedCategory,
          is_approved: false,
          submitted_at: new Date().toISOString(),
        },
      })
      .select()
      .single()

    if (error) throw new Error(`Database error: ${error.message}`)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: data.id,
          advice: sanitizedAdvice,
          category: sanitizedCategory,
          created_at: data.created_at,
        },
      }),
      { status: 201, headers }
    )

  } catch (err) {
    console.error('Edge Function error:', err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }), { status: 500, headers })
  }
})
