/**
 * Setup Demo Sessions - Creates game sessions and demo data
 * Simple approach using Supabase client insert (no SQL execution needed)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { 
  createErrorResponse, 
  createSuccessResponse,
  CORS_HEADERS,
  SECURITY_HEADERS
} from '../_shared/security.ts'

serve(async (req: Request) => {
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
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    console.log('[setup-demo] Starting demo session creation...')

    // Demo sessions to create
    const demoSessions = [
      {
        session_code: 'LOBBY-A',
        admin_code: '1111',
        mom_name: 'Sunny',
        dad_name: 'Barnaby',
        status: 'setup',
        total_rounds: 5
      },
      {
        session_code: 'LOBBY-B',
        admin_code: '2222',
        mom_name: 'Rosie',
        dad_name: 'Ricky',
        status: 'setup',
        total_rounds: 5
      },
      {
        session_code: 'LOBBY-C',
        admin_code: '3333',
        mom_name: 'Clucky',
        dad_name: 'Chuck',
        status: 'setup',
        total_rounds: 5
      },
      {
        session_code: 'LOBBY-D',
        admin_code: '4444',
        mom_name: 'Ducky',
        dad_name: 'Donald',
        status: 'setup',
        total_rounds: 5
      }
    ]

    const created = []
    const skipped = []
    const errors = []

    for (const session of demoSessions) {
      try {
        // Try to insert - will fail if already exists (that's OK)
        const { data, error } = await supabase
          .from('baby_shower.game_sessions')
          .insert(session)
          .select('session_code, mom_name, dad_name, status')
          .single()

        if (error) {
          if (error.message.includes('duplicate key') || error.code === '23505') {
            console.log(`[setup-demo] Session ${session.session_code} already exists, skipping`)
            skipped.push(session.session_code)
          } else {
            console.error(`[setup-demo] Error creating ${session.session_code}:`, error)
            errors.push({ session: session.session_code, error: error.message })
          }
        } else {
          console.log(`[setup-demo] Created session: ${data.session_code}`)
          created.push(data.session_code)
        }
      } catch (err) {
        console.error(`[setup-demo] Exception creating ${session.session_code}:`, err)
        errors.push({ session: session.session_code, error: err.message })
      }
    }

    // Verify by fetching all sessions
    const { data: allSessions, error: fetchError } = await supabase
      .from('baby_shower.game_sessions')
      .select('session_code, mom_name, dad_name, admin_code, status, total_rounds')
      .ilike('session_code', 'LOBBY%')
      .order('session_code')

    if (fetchError) {
      console.error('[setup-demo] Failed to fetch sessions:', fetchError)
      return createErrorResponse(`Failed to verify sessions: ${fetchError.message}`, 500)
    }

    console.log(`[setup-demo] Setup complete. Created: ${created.length}, Skipped: ${skipped.length}, Errors: ${errors.length}`)

    return createSuccessResponse({
      message: 'Demo sessions setup complete',
      created,
      skipped,
      errors,
      totalSessions: allSessions?.length || 0,
      sessions: allSessions
    }, 200)

  } catch (err) {
    console.error('[setup-demo] Setup error:', err)
    return createErrorResponse(`Setup failed: ${err.message}`, 500)
  }
})
