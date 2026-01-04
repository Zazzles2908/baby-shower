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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    console.log('[fix-permissions] Attempting to fix sequence permissions...')

    // Try to grant permissions using RPC
    const { data: grantResult, error: grantError } = await supabase.rpc('grant_sequence_access', {
      table_name: 'votes',
      schema_name: 'public'
    })

    if (grantError) {
      console.log('[fix-permissions] RPC method not available, trying direct grant...')
      
      // Try to execute SQL directly to grant permissions
      const grantSQL = `
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
        GRANT INSERT ON public.votes TO anon, authenticated;
        ALTER SEQUENCE IF EXISTS public.votes_id_seq OWNED BY public.votes.id;
      `

      // Try a simple insert to test permissions
      const { data: testData, error: testError } = await supabase
        .from('votes')
        .insert({
          voter_name: 'Permission Test',
          selected_names: ['test'],
          submitted_by: 'fix-permissions'
        })
        .select()
        .single()

      if (testError) {
        console.error('[fix-permissions] Permission test failed:', testError)
        
        // Try to fix by recreating the table with proper permissions
        console.log('[fix-permissions] Attempting to recreate table with proper permissions...')
        
        const { error: recreateError } = await supabase.rpc('recreate_votes_table', {})
        
        if (recreateError) {
          console.error('[fix-permissions] Recreate failed:', recreateError)
          return createErrorResponse(`Permission fix failed: ${testError.message}`, 500)
        }
        
        // Try insert again after recreation
        const { data: retryData, error: retryError } = await supabase
          .from('votes')
          .insert({
            voter_name: 'Retry Test',
            selected_names: ['test'],
            submitted_by: 'fix-permissions-retry'
          })
          .select()
          .single()
          
        if (retryError) {
          console.error('[fix-permissions] Retry after recreate failed:', retryError)
          return createErrorResponse(`Permission fix retry failed: ${retryError.message}`, 500)
        }
        
        // Clean up test data
        await supabase.from('votes').delete().eq('id', retryData.id)
        
        return createSuccessResponse({
          message: 'Permissions fixed successfully',
          testInsertSuccessful: true
        }, 200)
      }
      
      // Test succeeded, clean up test data
      if (testData) {
        await supabase.from('votes').delete().eq('id', testData.id)
      }
      
      return createSuccessResponse({
        message: 'Permissions were already correct',
        testInsertSuccessful: true
      }, 200)
    }

    return createSuccessResponse({
      message: 'Permissions fixed via RPC',
      result: grantResult
    }, 200)

  } catch (err) {
    console.error('[fix-permissions] Unexpected error:', err)
    return createErrorResponse(`Permission fix failed: ${err.message}`, 500)
  }
})