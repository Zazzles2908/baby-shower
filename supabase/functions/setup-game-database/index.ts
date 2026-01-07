/**
 * Setup Game Database Edge Function - Fixed Version
 * Calls the database procedure to create tables and demo data
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  // CORS headers
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
  })

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Method not allowed' 
    }), { status: 405, headers })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Server configuration error',
        message: 'Missing environment variables'
      }), { status: 500, headers })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    console.log('Setting up game tables...')

    // Try to call the setup procedure
    let setupResult
    try {
      const { data, error } = await supabase.rpc('setup_game_tables')
      
      if (error) {
        console.log('RPC call failed, trying manual approach:', error.message)
        setupResult = { success: false, error: error.message }
      } else {
        setupResult = { success: true, data: data }
      }
    } catch (rpcError) {
      console.log('RPC exception:', rpcError)
      setupResult = { success: false, error: String(rpcError) }
    }

    // If RPC failed, try to check if tables exist
    if (!setupResult.success) {
      console.log('Checking if tables already exist...')
      
      try {
        const { data: sessions, error: checkError } = await supabase
          .from('baby_shower.game_sessions')
          .select('session_code, mom_name, dad_name, admin_code, status')
          .ilike('session_code', 'LOBBY-%')
          .limit(4)

        if (checkError) {
          console.log('Tables do not exist yet:', checkError.message)
          
          // Tables don't exist, return manual SQL instructions
          return new Response(JSON.stringify({
            success: false,
            error: 'Game tables do not exist',
            manual_instructions: {
              step_1: 'Go to Supabase Dashboard > SQL Editor',
              step_2: 'Execute the following SQL:',
              sql_script: `CREATE TABLE IF NOT EXISTS baby_shower.game_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_code VARCHAR(8) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'setup',
    mom_name VARCHAR(100) NOT NULL,
    dad_name VARCHAR(100) NOT NULL,
    admin_code VARCHAR(10) NOT NULL,
    total_rounds INTEGER DEFAULT 5,
    current_round INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_by VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS baby_shower.game_scenarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES baby_shower.game_sessions(id),
    round_number INTEGER NOT NULL,
    scenario_text TEXT NOT NULL,
    mom_option TEXT NOT NULL,
    dad_option TEXT NOT NULL,
    ai_provider VARCHAR(20) DEFAULT 'z_ai',
    intensity NUMERIC(3,2) DEFAULT 0.5,
    theme_tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS baby_shower.game_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scenario_id UUID REFERENCES baby_shower.game_scenarios(id),
    guest_name VARCHAR(100) NOT NULL,
    guest_id UUID,
    vote_choice VARCHAR(10) CHECK (vote_choice IN ('mom', 'dad')),
    voted_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO baby_shower.game_sessions (session_code, admin_code, mom_name, dad_name, status, current_round, total_rounds)
VALUES
    ('LOBBY-A', '1111', 'Sunny', 'Barnaby', 'setup', 0, 5),
    ('LOBBY-B', '2222', 'Rosie', 'Ricky', 'setup', 0, 5),
    ('LOBBY-C', '3333', 'Clucky', 'Chuck', 'setup', 0, 5),
    ('LOBBY-D', '4444', 'Ducky', 'Donald', 'setup', 0, 5)
ON CONFLICT (session_code) DO NOTHING;`,
              step_3: 'After creating tables, invoke create-demo-sessions function',
              dashboard_url: 'https://supabase.com/dashboard/project/bkszmvfsfgvdwzacgmfz/sql'
            }
          }), { status: 200, headers })
        } else {
          // Tables exist, return success
          return new Response(JSON.stringify({
            success: true,
            message: 'Game tables already exist',
            demo_sessions: sessions,
            next_steps: [
              'Tables are ready',
              'Demo sessions are available',
              'Game is ready for players'
            ]
          }), { status: 200, headers })
        }
      } catch (checkException) {
        console.log('Check exception:', checkException)
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to check database state',
          details: String(checkException),
          manual_instructions: true
        }), { status: 500, headers })
      }
    }

    // Setup was successful
    return new Response(JSON.stringify({
      success: true,
      message: 'Game setup completed successfully',
      result: setupResult,
      demo_sessions: ['LOBBY-A', 'LOBBY-B', 'LOBBY-C', 'LOBBY-D']
    }), { status: 200, headers })

  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error',
      details: String(error)
    }), { status: 500, headers })
  }
})

console.log('Setup game database function ready')