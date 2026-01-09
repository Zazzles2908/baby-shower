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

interface GuestbookRequest {
  name: string
  message: string
  relationship: string
}

serve(async (req: Request) => {
  // Combine CORS and security headers
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
    // Validate environment variables - USE ANON KEY FOR PUBLIC ENDPOINTS
    const envValidation = validateEnvironmentVariables([
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY'  // Changed from SUPABASE_SERVICE_ROLE_KEY for security
    ])

    if (!envValidation.isValid) {
      console.error('Environment validation failed:', envValidation.errors)
      return createErrorResponse('Server configuration error', 500)
    }

    if (envValidation.warnings.length > 0) {
      console.warn('Environment warnings:', envValidation.warnings)
    }

    // Initialize Supabase client with ANON KEY for public operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'baby_shower'
      }
    })

    // Parse and validate request body
    let body: GuestbookRequest
    try {
      body = await req.json()
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400)
    }

    // Input validation using standardized function
    const validation = validateInput(body, {
      name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
      message: { type: 'string', required: true, minLength: 1, maxLength: 1000 },
      relationship: { type: 'string', required: true, minLength: 1, maxLength: 50 }
    })

    if (!validation.isValid) {
      return createErrorResponse('Validation failed', 400, validation.errors)
    }

    // Use sanitized data from validation
    const { name: sanitizedName, message: sanitizedMessage, relationship: sanitizedRelationship } = validation.sanitized

    // Count total entries in guestbook BEFORE insert to check milestone
    const { count: totalCount } = await supabase
      .from('guestbook')
      .select('*', { count: 'exact', head: true })
    const currentCount = totalCount || 0
    const isMilestone = currentCount + 1 === 50

    console.log(`[guestbook] Writing to guestbook, current count: ${currentCount}`)

    // Insert into guestbook table with dedicated columns
    const { data, error } = await supabase
      .from('guestbook')
      .insert({
        guest_name: sanitizedName,
        relationship: sanitizedRelationship,
        message: sanitizedMessage,
        submitted_by: sanitizedName,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', JSON.stringify(error, null, 2))
      return createErrorResponse('Database operation failed: ' + error.message, 500)
    }

    console.log(`[guestbook] Successfully inserted entry with id: ${data.id}`)

    // Success response
    return createSuccessResponse({
      id: data.id,
      guest_name: sanitizedName,
      relationship: sanitizedRelationship,
      message: sanitizedMessage,
      created_at: data.created_at,
      milestone: isMilestone ? {
        triggered: true,
        threshold: 50,
        message: '🎉 We hit 50 submissions! Cake time!'
      } : undefined
    }, 201)

  } catch (err) {
    console.error('Edge Function error:', err)
    return createErrorResponse('Internal server error', 500)
  }
})
