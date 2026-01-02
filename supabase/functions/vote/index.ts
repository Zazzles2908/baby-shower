import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface VoteRequest {
  names: string[]
}

interface ErrorResponse {
  error: string
  details?: unknown
}

serve(async (req: Request) => {
  // CORS headers
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  })

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' } as ErrorResponse),
      { status: 405, headers }
    )
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Parse request
    const body: VoteRequest = await req.json()

    // Validation
    const errors: string[] = []
    
    if (!body.names || !Array.isArray(body.names)) {
      errors.push('Names array is required')
    }
    
    if (body.names) {
      if (body.names.length === 0) {
        errors.push('At least one name is required')
      }
      if (body.names.length > 4) {
        errors.push('Maximum 4 names allowed')
      }
      
      // Validate each name
      body.names.forEach((name, index) => {
        if (!name || name.trim().length === 0) {
          errors.push(`Name at index ${index} cannot be empty`)
        }
        if (name && name.length > 50) {
          errors.push(`Name at index ${index} must be 50 characters or less`)
        }
      })
    }

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: errors } as ErrorResponse),
        { status: 400, headers }
      )
    }

    // Sanitize names
    const sanitizedNames = body.names
      .map(n => n.trim().slice(0, 50))
      .filter(n => n.length > 0)

    // Count total submissions BEFORE insert to check milestone
    const { count: totalCount } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
    const currentCount = totalCount || 0
    const isMilestone = currentCount + 1 === 50

    // Insert into submissions
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        name: 'Anonymous Voter',
        activity_type: 'vote',
        activity_data: {
          names: sanitizedNames,
          vote_count: sanitizedNames.length,
          submitted_at: new Date().toISOString(),
        },
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: data.id,
          names: sanitizedNames,
          vote_count: sanitizedNames.length,
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
    const errorMessage = err instanceof Error ? err.message : 'Internal server error'
    
    return new Response(
      JSON.stringify({ error: errorMessage } as ErrorResponse),
      { status: 500, headers }
    )
  }
})
