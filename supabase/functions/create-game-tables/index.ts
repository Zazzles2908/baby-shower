/**
 * Create Game Tables Edge Function
 * Creates the Mom vs Dad game tables using native PostgreSQL
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface CreateTablesRequest {
  create_tables?: boolean;
  insert_demo?: boolean;
}

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
    const body: CreateTablesRequest = await req.json().catch(() => ({}))
    
    // Get environment variables
    const databaseUrl = Deno.env.get('DATABASE_URL')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    // For Supabase Edge Functions, we can't directly connect to PostgreSQL
    // We need to use the Supabase JS client instead
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing environment variables',
        message: 'Cannot execute SQL directly in Edge Functions. Please use Supabase SQL Editor or create a database migration.'
      }), { status: 500, headers })
    }

    // Since we can't execute SQL directly, provide instructions
    const sqlScript = `
-- ============================================================================
-- MOM VS DAD GAME TABLES - SQL SCRIPT
-- ============================================================================

-- Create game_sessions table
CREATE TABLE IF NOT EXISTS baby_shower.game_sessions (
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

-- Create game_scenarios table
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

-- Create game_votes table
CREATE TABLE IF NOT EXISTS baby_shower.game_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scenario_id UUID REFERENCES baby_shower.game_scenarios(id),
    guest_name VARCHAR(100) NOT NULL,
    guest_id UUID,
    vote_choice VARCHAR(10) CHECK (vote_choice IN ('mom', 'dad')),
    voted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert demo sessions
INSERT INTO baby_shower.game_sessions (session_code, admin_code, mom_name, dad_name, status, current_round, total_rounds)
VALUES
    ('LOBBY-A', '1111', 'Sunny', 'Barnaby', 'setup', 0, 5),
    ('LOBBY-B', '2222', 'Rosie', 'Ricky', 'setup', 0, 5),
    ('LOBBY-C', '3333', 'Clucky', 'Chuck', 'setup', 0, 5),
    ('LOBBY-D', '4444', 'Ducky', 'Donald', 'setup', 0, 5)
ON CONFLICT (session_code) DO NOTHING;

-- Verify setup
SELECT session_code, mom_name, dad_name, admin_code, status
FROM baby_shower.game_sessions
WHERE session_code LIKE 'LOBBY-%'
ORDER BY session_code;
    `

    return new Response(JSON.stringify({
      success: true,
      message: 'SQL Script Generated',
      sql: sqlScript,
      instructions: 'Please execute this SQL in Supabase SQL Editor or via CLI to complete setup',
      tables_needed: ['baby_shower.game_sessions', 'baby_shower.game_scenarios', 'baby_shower.game_votes'],
      demo_sessions: ['LOBBY-A', 'LOBBY-B', 'LOBBY-C', 'LOBBY-D']
    }), { status: 200, headers })

  } catch (error) {
    console.error('Function error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    }), { status: 500, headers })
  }
})

console.log('Create game tables function ready')