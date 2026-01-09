import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { 
  validateEnvironmentVariables, 
  createErrorResponse, 
  createSuccessResponse,
  CORS_HEADERS,
  SECURITY_HEADERS
} from '../_shared/security.ts'

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

  if (req.method !== 'GET') {
    return createErrorResponse('Method not allowed', 405)
  }

  try {
    // Validate environment variables - USE ANON KEY FOR PUBLIC ENDPOINTS
    const envValidation = validateEnvironmentVariables([
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY'  // Using anon key for public read operations
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

    // Parse query parameters
    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Validate pagination parameters
    if (limit < 1 || limit > 100) {
      return createErrorResponse('Limit must be between 1 and 100', 400)
    }
    if (offset < 0) {
      return createErrorResponse('Offset must be non-negative', 400)
    }

    console.log(`[guestbook-entries] Fetching entries with limit: ${limit}, offset: ${offset}`)

    // Fetch guestbook entries - RLS policies will handle access control
    const { data, error } = await supabase
      .from('guestbook')
      .select('id, guest_name, relationship, message, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Supabase select error:', JSON.stringify(error, null, 2))
      return createErrorResponse('Database operation failed: ' + error.message, 500)
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('guestbook')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Supabase count error:', JSON.stringify(countError, null, 2))
      return createErrorResponse('Database operation failed: ' + countError.message, 500)
    }

    console.log(`[guestbook-entries] Successfully fetched ${data.length} entries out of ${count} total`)

    // Success response
    return createSuccessResponse({
      entries: data,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: offset + limit < (count || 0)
      }
    }, 200)

  } catch (err) {
    console.error('Edge Function error:', err)
    return createErrorResponse('Internal server error', 500)
  }
})