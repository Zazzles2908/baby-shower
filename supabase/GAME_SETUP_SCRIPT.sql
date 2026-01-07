-- ============================================================================
-- MOM VS DAD GAME SETUP - Complete Migration Script
-- Execute this in Supabase Dashboard → SQL Editor
-- https://database.supabase.co/project/bkszmvfsfgvdwzacgmfz
-- ============================================================================

-- STEP 1: Create exec_sql function (allows Edge Functions to run SQL)
-- ============================================================================
CREATE OR REPLACE FUNCTION baby_shower.exec_sql(sql_query TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE sql_query;
  result := jsonb_build_object('success', true, 'message', 'SQL executed successfully');
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  result := jsonb_build_object('success', false, 'error', SQLERRM);
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 2: Create game tables
-- ============================================================================
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

-- STEP 3: Create demo sessions
-- ============================================================================
INSERT INTO baby_shower.game_sessions (session_code, admin_code, mom_name, dad_name, status, current_round, total_rounds)
VALUES 
    ('LOBBY-A', '1111', 'Sunny', 'Barnaby', 'setup', 0, 5),
    ('LOBBY-B', '2222', 'Rosie', 'Ricky', 'setup', 0, 5),
    ('LOBBY-C', '3333', 'Clucky', 'Chuck', 'setup', 0, 5),
    ('LOBBY-D', '4444', 'Ducky', 'Donald', 'setup', 0, 5)
ON CONFLICT (session_code) DO NOTHING;

-- STEP 4: Verify setup
-- ============================================================================
SELECT 
  'baby_shower.game_sessions' as table_name,
  (SELECT COUNT(*) FROM baby_shower.game_sessions WHERE session_code LIKE 'LOBBY-%') as row_count
UNION ALL
SELECT 
  'baby_shower.game_scenarios' as table_name,
  (SELECT COUNT(*) FROM baby_shower.game_scenarios) as row_count
UNION ALL
SELECT 
  'baby_shower.game_votes' as table_name,
  (SELECT COUNT(*) FROM baby_shower.game_votes) as row_count;

-- Expected results:
-- table_name                    | row_count
-- ------------------------------|----------
-- baby_shower.game_sessions     | 4
-- baby_shower.game_scenarios    | 0
-- baby_shower.game_votes        | 0

-- ============================================================================
-- INSTRUCTIONS:
-- 1. Go to: https://database.supabase.co/project/bkszmvfsfgvdwzacgmfz
-- 2. Click: SQL Editor (left sidebar)
-- 3. Copy: All SQL above
-- 4. Paste: Into editor
-- 5. Click: Run button
-- 6. Verify: You should see 3 rows in results (4, 0, 0)
-- 7. Check: All 16 Edge Functions are active in Dashboard
-- ============================================================================
