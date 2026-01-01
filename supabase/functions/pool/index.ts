import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface PoolRequest {
  name: string
  prediction: string
  dueDate: string
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

    const body: PoolRequest = await req.json()

    // Validation
    const errors: string[] = []
    if (!body.name || body.name.trim().length === 0) errors.push('Name is required')
    if (body.name?.length > 100) errors.push('Name must be 100 chars or less')
    if (!body.prediction || body.prediction.trim().length === 0) errors.push('Prediction is required')
    if (body.prediction?.length > 500) errors.push('Prediction must be 500 chars or less')
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!body.dueDate || !dateRegex.test(body.dueDate)) {
      errors.push('Due date must be in YYYY-MM-DD format')
    }

    if (errors.length > 0) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: errors }), { status: 400, headers })
    }

    const sanitizedName = body.name.trim().slice(0, 100)
    const sanitizedPrediction = body.prediction.trim().slice(0, 500)

    const { data, error } = await supabase
      .from('submissions')
      .insert({
        activity_type: 'pool',
        name: sanitizedName,
        prediction: sanitizedPrediction,
        due_date: body.dueDate,
        activity_data: {
          name: sanitizedName,
          prediction: sanitizedPrediction,
          due_date: body.dueDate,
          submitted_at: new Date().toISOString(),
        },
      })
      .select()
      .single()

    if (error) throw new Error(`Database error: ${error.message}`)

    return new Response(
      JSON.stringify({
        success: true,
        data: { id: data.id, name: sanitizedName, prediction: sanitizedPrediction, due_date: body.dueDate },
      }),
      { status: 201, headers }
    )

  } catch (err) {
    console.error('Edge Function error:', err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }), { status: 500, headers })
  }
})
