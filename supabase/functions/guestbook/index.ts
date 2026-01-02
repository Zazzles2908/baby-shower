import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface GuestbookRequest {
  name: string
  message: string
  relationship: string
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
    // Initialize Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Parse and validate request body
    const body: GuestbookRequest = await req.json()

    // Input validation
    const errors: string[] = []
    if (!body.name || body.name.trim().length === 0) {
      errors.push('Name is required')
    }
    if (body.name && body.name.length > 100) {
      errors.push('Name must be 100 characters or less')
    }
    if (!body.message || body.message.trim().length === 0) {
      errors.push('Message is required')
    }
    if (body.message && body.message.length > 1000) {
      errors.push('Message must be 1000 characters or less')
    }
    if (!body.relationship || body.relationship.trim().length === 0) {
      errors.push('Relationship is required')
    }
    if (body.relationship && body.relationship.length > 50) {
      errors.push('Relationship must be 50 characters or less')
    }

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: errors } as ErrorResponse),
        { status: 400, headers }
      )
    }

    // Sanitize inputs
    const sanitizedName = body.name.trim().slice(0, 100)
    const sanitizedMessage = body.message.trim().slice(0, 1000)
    const sanitizedRelationship = body.relationship.trim().slice(0, 50)

    // Insert into submissions table (baby_shower schema uses activity_data JSONB)
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        activity_type: 'guestbook',
        name: sanitizedName,
        activity_data: {
          name: sanitizedName,
          message: sanitizedMessage,
          relationship: sanitizedRelationship,
          submitted_at: new Date().toISOString(),
        },
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: data.id,
          name: sanitizedName,
          message: sanitizedMessage,
          relationship: sanitizedRelationship,
          created_at: data.created_at,
        },
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
