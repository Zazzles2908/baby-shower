/**
 * Mom vs Dad Game - Lobby Create Function (Unified Schema)
 * Updated to use game_* tables from 20260103_mom_vs_dad_game_schema.sql
 * 
 * Purpose: Create a new game session when parents set up the game
 * Trigger: POST /lobby-create (now creates game_sessions)
 * 
 * Schema Mapping:
 * - lobby_key → session_code (auto-generated)
 * - player_name + player_type → mom_name + dad_name
 */

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

interface CreateSessionRequest {
  mom_name: string
  dad_name: string
  admin_code?: string  // Optional 4-digit PIN, will generate if not provided
  total_rounds?: number
}

serve(async (req: Request) => {
  const headers = new Headers({ 
    ...CORS_HEADERS, 
    ...SECURITY_HEADERS, 
    'Content-Type': 'application/json' 
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
      console.error('Session Create - Environment validation failed:', envValidation.errors)
      return createErrorResponse('Server configuration error', 500)
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Parse and validate request body
    let body: CreateSessionRequest
    try {
      body = await req.json()
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400)
    }

    // Input validation
    const validation = validateInput(body, {
      mom_name: { 
        type: 'string', 
        required: true, 
        minLength: 1, 
        maxLength: 100 
      },
      dad_name: { 
        type: 'string', 
        required: true, 
        minLength: 1, 
        maxLength: 100 
      },
      admin_code: { 
        type: 'string', 
        required: false, 
        minLength: 4, 
        maxLength: 4 
      },
      total_rounds: { 
        type: 'number', 
        required: false, 
        min: 1, 
        max: 10 
      }
    })

    if (!validation.isValid) {
      console.error('Session Create - Validation failed:', validation.errors)
      return createErrorResponse('Validation failed', 400, validation.errors)
    }

    const { mom_name, dad_name, admin_code, total_rounds = 5 } = validation.sanitized

    // Generate or use provided admin code
    const finalAdminCode = admin_code || generateAdminCode()

    // Generate session code using database function
    let session_code: string
    const { data: sessionCode, error: codeError } = await supabase
      .rpc('baby_shower.generate_session_code')
      .single()

    if (codeError || !sessionCode) {
      console.warn('Session Create - RPC failed, using fallback generation')
      session_code = generateSessionCode()
    } else {
      session_code = sessionCode
    }

    // Check if session code already exists (shouldn't happen but safety check)
    const { data: existingSession } = await supabase
      .from('baby_shower.game_sessions')
      .select('id')
      .eq('session_code', session_code)
      .single()

    if (existingSession) {
      console.warn('Session Create - Session code collision, regenerating...')
      session_code = generateSessionCode()
    }

    // Create session
    const { data: session, error: createError } = await supabase
      .from('baby_shower.game_sessions')
      .insert({
        session_code,
        mom_name,
        dad_name,
        admin_code: finalAdminCode,
        total_rounds,
        status: 'setup',
        current_round: 0
      })
      .select()
      .single()

    if (createError) {
      console.error('Session Create - Failed to create session:', createError)
      throw createError
    }

    console.log('Session Create - Successfully created session:', {
      session_code,
      mom_name,
      dad_name
    })

    return createSuccessResponse({
      message: 'Game session created successfully',
      session: {
        id: session.id,
        session_code: session.session_code,
        mom_name: session.mom_name,
        dad_name: session.dad_name,
        admin_code: session.admin_code,
        status: session.status,
        total_rounds: session.total_rounds,
        created_at: session.created_at
      },
      instructions: {
        share_code: 'Share this code with your guests to join the game',
        admin_pin: 'Use this PIN to start the game and reveal results',
        game_link: `${typeof window !== 'undefined' ? window.location.origin : ''}?game=${session.session_code}`
      }
    }, 201)

  } catch (error) {
    console.error('Session Create - Unexpected error:', error)
    return createErrorResponse('Failed to create session', 500)
  }
})

/**
 * Generate a 4-digit admin PIN
 */
function generateAdminCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

/**
 * Generate a 6-character session code (fallback)
 */
function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude confusing chars
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
