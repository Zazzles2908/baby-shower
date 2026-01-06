/**
 * Baby Shower Game - Demo Session Setup Script
 * Creates demo game sessions for testing the Mom vs Dad game
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Demo session configurations
const DEMO_SESSIONS = [
  {
    session_code: 'LOBBY-A',
    mom_name: 'Sunny',
    dad_name: 'Barnaby',
    total_rounds: 5,
    admin_code: '1111'
  },
  {
    session_code: 'LOBBY-B', 
    mom_name: 'Rosie',
    dad_name: 'Ricky',
    total_rounds: 5,
    admin_code: '2222'
  },
  {
    session_code: 'LOBBY-C',
    mom_name: 'Clucky',
    dad_name: 'Chuck',
    total_rounds: 5,
    admin_code: '3333'
  },
  {
    session_code: 'LOBBY-D',
    mom_name: 'Ducky',
    dad_name: 'Donald',
    total_rounds: 5,
    admin_code: '4444'
  }
]

async function setupDemoSessions() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('Setting up demo game sessions...')

  for (const session of DEMO_SESSIONS) {
    // Check if session already exists
    const { data: existing } = await supabase
      .from('baby_shower.game_sessions')
      .select('session_code')
      .eq('session_code', session.session_code)
      .single()

    if (existing) {
      console.log(`Session ${session.session_code} already exists, skipping...`)
      continue
    }

    // Create new session
    const { data: newSession, error } = await supabase
      .from('baby_shower.game_sessions')
      .insert({
        session_code: session.session_code,
        admin_code: session.admin_code,
        mom_name: session.mom_name,
        dad_name: session.dad_name,
        status: 'setup',
        current_round: 0,
        total_rounds: session.total_rounds
      })
      .select('id, session_code')
      .single()

    if (error) {
      console.error(`Failed to create session ${session.session_code}:`, error)
    } else {
      console.log(`Created demo session: ${newSession.session_code} (ID: ${newSession.id})`)
    }
  }

  console.log('Demo session setup complete!')
}

// Run if executed directly
if (import.meta.main) {
  setupDemoSessions()
    .then(() => console.log('Setup completed'))
    .catch((error) => console.error('Setup failed:', error))
}

export { setupDemoSessions }
