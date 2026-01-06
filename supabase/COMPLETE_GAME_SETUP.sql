-- ============================================================================
-- MOM VS DAD GAME - Database Setup Script
-- Execute this in Supabase Dashboard → SQL Editor
-- URL: https://database.supabase.co/project/bkszmvfsfgvdwzacgmfz
-- ============================================================================

-- STEP 1: Create game_sessions table
-- ============================================================================
CREATE TABLE IF NOT EXISTS baby_shower.game_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_code VARCHAR(8) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'setup' CHECK (status IN ('setup', 'voting', 'revealed', 'complete')),
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

-- STEP 2: Create game_scenarios table
-- ============================================================================
CREATE TABLE IF NOT EXISTS baby_shower.game_scenarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES baby_shower.game_sessions(id) ON DELETE CASCADE,
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

-- STEP 3: Create game_votes table
-- ============================================================================
CREATE TABLE IF NOT EXISTS baby_shower.game_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scenario_id UUID NOT NULL REFERENCES baby_shower.game_scenarios(id) ON DELETE CASCADE,
    guest_name VARCHAR(100) NOT NULL,
    guest_id UUID,
    vote_choice VARCHAR(10) NOT NULL CHECK (vote_choice IN ('mom', 'dad')),
    voted_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 4: Create game_answers table (for parent answers before reveal)
-- ============================================================================
CREATE TABLE IF NOT EXISTS baby_shower.game_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scenario_id UUID NOT NULL REFERENCES baby_shower.game_scenarios(id) ON DELETE CASCADE,
    mom_answer VARCHAR(10) CHECK (mom_answer IN ('mom', 'dad') OR mom_answer IS NULL),
    dad_answer VARCHAR(10) CHECK (dad_answer IN ('mom', 'dad') OR dad_answer IS NULL),
    mom_locked BOOLEAN DEFAULT FALSE,
    dad_locked BOOLEAN DEFAULT FALSE
);

-- STEP 5: Create game_results table (perception gap analysis)
-- ============================================================================
CREATE TABLE IF NOT EXISTS baby_shower.game_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scenario_id UUID NOT NULL REFERENCES baby_shower.game_scenarios(id) ON DELETE CASCADE,
    mom_votes INTEGER DEFAULT 0,
    dad_votes INTEGER DEFAULT 0,
    mom_percentage DECIMAL(5,2),
    dad_percentage DECIMAL(5,2),
    crowd_choice VARCHAR(10) CHECK (crowd_choice IN ('mom', 'dad') OR crowd_choice IS NULL),
    actual_choice VARCHAR(10) CHECK (actual_choice IN ('mom', 'dad') OR actual_choice IS NULL),
    perception_gap DECIMAL(5,2),
    roast_commentary TEXT,
    particle_effect VARCHAR(20) DEFAULT 'confetti',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 6: Insert demo sessions (LOBBY-A, LOBBY-B, LOBBY-C, LOBBY-D)
-- ============================================================================
INSERT INTO baby_shower.game_sessions (session_code, admin_code, mom_name, dad_name, status, current_round, total_rounds)
VALUES
    ('LOBBY-A', '1111', 'Sunny', 'Barnaby', 'setup', 0, 5),
    ('LOBBY-B', '2222', 'Rosie', 'Ricky', 'setup', 0, 5),
    ('LOBBY-C', '3333', 'Clucky', 'Chuck', 'setup', 0, 5),
    ('LOBBY-D', '4444', 'Ducky', 'Donald', 'setup', 0, 5)
ON CONFLICT (session_code) DO NOTHING;

-- STEP 7: Verify setup
-- ============================================================================
SELECT 
    'game_sessions' as table_name,
    (SELECT COUNT(*) FROM baby_shower.game_sessions) as row_count
UNION ALL
SELECT 
    'game_scenarios' as table_name,
    (SELECT COUNT(*) FROM baby_shower.game_scenarios) as row_count
UNION ALL
SELECT 
    'game_votes' as table_name,
    (SELECT COUNT(*) FROM baby_shower.game_votes) as row_count
UNION ALL
SELECT 
    'game_answers' as table_name,
    (SELECT COUNT(*) FROM baby_shower.game_answers) as row_count
UNION ALL
SELECT 
    'game_results' as table_name,
    (SELECT COUNT(*) FROM baby_shower.game_results) as row_count;

-- Expected results after running:
-- table_name       | row_count
-- -----------------|----------
-- game_sessions    | 4 (demo sessions)
-- game_scenarios   | 0
-- game_votes       | 0
-- game_answers     | 0
-- game_results     | 0

-- Also verify demo sessions:
SELECT session_code, mom_name, dad_name, admin_code, status 
FROM baby_shower.game_sessions 
WHERE session_code LIKE 'LOBBY-%' 
ORDER BY session_code;

-- ============================================================================
-- INSTRUCTIONS:
-- 1. Go to: https://database.supabase.co/project/bkszmvfsfgvdwzacgmfz
-- 2. Click: SQL Editor (left sidebar)
-- 3. Copy: All SQL above
-- 4. Paste: Into editor
-- 5. Click: Run button
-- 6. Verify: See 5 table rows (4, 0, 0, 0, 0) and 4 demo sessions
-- ============================================================================
