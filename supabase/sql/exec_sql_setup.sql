-- ============================================================================
-- EXEC_SQL FUNCTION - Allows Edge Functions to execute arbitrary SQL
-- ============================================================================

CREATE OR REPLACE FUNCTION baby_shower.exec_sql(sql_query TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Execute the SQL query and return results as JSON
  EXECUTE sql_query;
  result := jsonb_build_object('success', true, 'message', 'SQL executed successfully');
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  result := jsonb_build_object('success', false, 'error', SQLERRM);
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SETUP_GAME_TABLES PROCEDURE - Creates all game tables and demo data
-- ============================================================================

CREATE OR REPLACE PROCEDURE baby_shower.setup_game_tables()
LANGUAGE plpgsql
AS $$
BEGIN
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

  -- Return success
  RAISE NOTICE 'Game tables created successfully';
END;
$$;

-- ============================================================================
-- VERIFY_SETUP FUNCTION - Returns current game session status
-- ============================================================================

CREATE OR REPLACE FUNCTION baby_shower.verify_setup()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  session_count INTEGER;
  table_count INTEGER;
BEGIN
  -- Count existing sessions
  SELECT COUNT(*) INTO session_count 
  FROM baby_shower.game_sessions 
  WHERE session_code LIKE 'LOBBY-%';

  -- Count tables
  SELECT COUNT(*) INTO table_count 
  FROM information_schema.tables 
  WHERE table_schema = 'baby_shower'
  AND table_name IN ('game_sessions', 'game_scenarios', 'game_votes');

  result := jsonb_build_object(
    'success', true,
    'tables_created', table_count,
    'demo_sessions', session_count,
    'status', 'ready'
  );

  RETURN result;
EXCEPTION WHEN OTHERS THEN
  result := jsonb_build_object('success', false, 'error', SQLERRM);
  RETURN result;
END;
$$ LANGUAGE plpgsql;
