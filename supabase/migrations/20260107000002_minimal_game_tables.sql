-- Minimal game tables for Mom vs Dad demo
-- Created: 2026-01-07
-- Only creates what's needed for demo lobbies

-- Create game_sessions table if not exists
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

-- Create game_scenarios table if not exists
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

-- Create game_votes table if not exists
CREATE TABLE IF NOT EXISTS baby_shower.game_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scenario_id UUID REFERENCES baby_shower.game_scenarios(id),
    guest_name VARCHAR(100) NOT NULL,
    guest_id UUID,
    vote_choice VARCHAR(10) CHECK (vote_choice IN ('mom', 'dad')),
    voted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert demo sessions (only if not exist)
INSERT INTO baby_shower.game_sessions (session_code, admin_code, mom_name, dad_name, status, current_round, total_rounds)
VALUES
    ('LOBBY-A', '1111', 'Sunny', 'Barnaby', 'setup', 0, 5),
    ('LOBBY-B', '2222', 'Rosie', 'Ricky', 'setup', 0, 5),
    ('LOBBY-C', '3333', 'Clucky', 'Chuck', 'setup', 0, 5),
    ('LOBBY-D', '4444', 'Ducky', 'Donald', 'setup', 0, 5)
ON CONFLICT (session_code) DO NOTHING;

-- Verify
SELECT session_code, mom_name, dad_name, admin_code, status
FROM baby_shower.game_sessions
WHERE session_code LIKE 'LOBBY-%'
ORDER BY session_code;
