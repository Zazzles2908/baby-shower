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

    console.log('[setup] Creating missing tables...')

    // Create votes table if it doesn't exist
    const { data: votesCheck, error: votesCheckError } = await supabase
      .from('baby_shower.votes')
      .select('*')
      .limit(1)

    if (votesCheckError) {
      console.log('[setup] Votes table missing, creating...')
      
      // Try to create the table using raw SQL
      const createVotesSQL = `
        CREATE TABLE IF NOT EXISTS baby_shower.votes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
          voter_name TEXT NOT NULL CHECK (length(voter_name) >= 2 AND length(voter_name) <= 100),
          selected_names JSONB NOT NULL CHECK (jsonb_typeof(selected_names) = 'array'),
          submitted_by TEXT,
          source_ip INET,
          user_agent TEXT,
          processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'failed')),
          processed_at TIMESTAMPTZ,
          CONSTRAINT valid_selected_names CHECK (
            jsonb_array_length(selected_names) >= 1 
            AND jsonb_array_length(selected_names) <= 3
          )
        );
        
        CREATE INDEX IF NOT EXISTS idx_votes_created_at ON baby_shower.votes(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_votes_voter_name ON baby_shower.votes(voter_name);
        CREATE INDEX IF NOT EXISTS idx_votes_gin_names ON baby_shower.votes USING GIN (selected_names);
        
        ALTER TABLE baby_shower.votes ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Allow votes inserts" ON baby_shower.votes;
        CREATE POLICY "Allow votes inserts" ON baby_shower.votes FOR INSERT WITH CHECK (true);
        
        DROP POLICY IF EXISTS "Allow votes reads" ON baby_shower.votes;
        CREATE POLICY "Allow votes reads" ON baby_shower.votes FOR SELECT USING (true);
        
        GRANT SELECT, INSERT ON baby_shower.votes TO anon, authenticated;
      `

      const { error: createVotesError } = await supabase.rpc('exec_sql', { sql: createVotesSQL })
      
      if (createVotesError) {
        console.error('[setup] Failed to create votes table:', createVotesError)
        // Try alternative approach using multiple queries
        try {
          await supabase.from('baby_shower.votes').insert({
            voter_name: 'Setup Test',
            selected_names: ['test'],
            submitted_by: 'setup'
          })
        } catch (insertError) {
          console.error('[setup] Insert test failed:', insertError)
        }
      } else {
        console.log('[setup] Votes table created successfully')
      }
    } else {
      console.log('[setup] Votes table already exists')
    }

    // Test the vote function
    const { data: voteTest, error: voteTestError } = await supabase
      .from('baby_shower.votes')
      .insert({
        voter_name: 'Test Voter',
        selected_names: ['Emma', 'Olivia'],
        submitted_by: 'Test',
      })
      .select()
      .single()

    if (voteTestError) {
      console.error('[setup] Vote insert test failed:', voteTestError)
      return createErrorResponse(`Setup failed: ${voteTestError.message}`, 500)
    }

    console.log('[setup] Vote insert successful:', voteTest.id)

    // Clean up test data
    await supabase.from('baby_shower.votes').delete().eq('id', voteTest.id)

    return createSuccessResponse({
      message: 'Setup completed successfully',
      votesTableExists: true,
      testInsertSuccessful: true
    }, 200)

  } catch (err) {
    console.error('[setup] Setup error:', err)
    return createErrorResponse(`Setup failed: ${err.message}`, 500)
  }
})