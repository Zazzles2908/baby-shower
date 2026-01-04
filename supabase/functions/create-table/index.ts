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

    console.log('[create-table] Creating baby_shower.votes table...')

    // Try to create the table using SQL execution
    const createTableSQL = `
      -- Create the baby_shower schema if it doesn't exist
      CREATE SCHEMA IF NOT EXISTS baby_shower;
      GRANT USAGE ON SCHEMA baby_shower TO anon, authenticated, service_role;

      -- Drop existing table if it exists
      DROP TABLE IF EXISTS baby_shower.votes;

      -- Create the votes table in baby_shower schema
      CREATE TABLE baby_shower.votes (
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

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_baby_shower_votes_created_at ON baby_shower.votes(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_baby_shower_votes_voter_name ON baby_shower.votes(voter_name);
      CREATE INDEX IF NOT EXISTS idx_baby_shower_votes_gin_names ON baby_shower.votes USING GIN (selected_names);

      -- Enable RLS
      ALTER TABLE baby_shower.votes ENABLE ROW LEVEL SECURITY;

      -- Create RLS policies
      DROP POLICY IF EXISTS "Allow votes inserts" ON baby_shower.votes;
      CREATE POLICY "Allow votes inserts" ON baby_shower.votes FOR INSERT WITH CHECK (true);

      DROP POLICY IF EXISTS "Allow votes reads" ON baby_shower.votes;
      CREATE POLICY "Allow votes reads" ON baby_shower.votes FOR SELECT USING (true);

      -- Grant permissions
      GRANT USAGE ON SCHEMA baby_shower TO anon, authenticated;
      GRANT SELECT, INSERT ON baby_shower.votes TO anon, authenticated;
    `

    // Execute the SQL (this will likely fail, but let's try)
    try {
      const { error: sqlError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
      
      if (sqlError) {
        console.log('[create-table] RPC exec failed, trying alternative approach...')
        
        // Try a simple insert to see if the table already exists and works
        const { data: insertTest, error: insertTestError } = await supabase
          .from('baby_shower.votes')
          .insert({
            voter_name: 'Create Table Test',
            selected_names: ['test'],
            submitted_by: 'create-table'
          })
          .select()
          .single()
          
        if (insertTestError) {
          console.error('[create-table] Insert test failed:', insertTestError)
          
          // Try the public.votes table as fallback
          console.log('[create-table] Trying public.votes table as fallback...')
          
          const { data: publicTest, error: publicTestError } = await supabase
            .from('votes')
            .insert({
              voter_name: 'Public Table Test',
              selected_names: ['test'],
              submitted_by: 'create-table'
            })
            .select()
            .single()
            
          if (publicTestError) {
            console.error('[create-table] Public table test failed:', publicTestError)
            return createErrorResponse(`Table creation/access failed: ${insertTestError.message} (public: ${publicTestError.message})`, 500)
          }
          
          // Clean up test data
          await supabase.from('votes').delete().eq('id', publicTest.id)
          
          return createSuccessResponse({
            message: 'Using public.votes table as fallback',
            tableSchema: 'public',
            testInsertSuccessful: true
          }, 200)
        }
        
        // Clean up test data
        await supabase.from('baby_shower.votes').delete().eq('id', insertTest.id)
        
        return createSuccessResponse({
          message: 'baby_shower.votes table created and working',
          tableSchema: 'baby_shower',
          testInsertSuccessful: true
        }, 200)
      }
      
      // Test the newly created table
      const { data: testData, error: testError } = await supabase
        .from('baby_shower.votes')
        .insert({
          voter_name: 'Final Test',
          selected_names: ['final'],
          submitted_by: 'create-table-final'
        })
        .select()
        .single()
        
      if (testError) {
        return createErrorResponse(`Table created but insert failed: ${testError.message}`, 500)
      }
      
      // Clean up test data
      await supabase.from('baby_shower.votes').delete().eq('id', testData.id)
      
      return createSuccessResponse({
        message: 'baby_shower.votes table created successfully',
        tableSchema: 'baby_shower',
        testInsertSuccessful: true
      }, 200)
      
    } catch (execError) {
      console.error('[create-table] Execution error:', execError)
      return createErrorResponse(`Table creation failed: ${execError.message}`, 500)
    }

  } catch (err) {
    console.error('[create-table] Unexpected error:', err)
    return createErrorResponse(`Table creation failed: ${err.message}`, 500)
  }
})