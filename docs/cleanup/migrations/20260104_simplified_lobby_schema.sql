-- Mom vs Dad Simplified Lobby Schema Migration
-- Creates tables for lobby-based game architecture
-- Migration ID: 20260104_simplified_lobby_schema
-- Created: 2026-01-04

-- =============================================================================
-- LOBBY TABLE: 4 pre-created persistent lobbies
-- =============================================================================

CREATE TABLE baby_shower.mom_dad_lobbies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lobby_key VARCHAR(20) UNIQUE NOT NULL,  -- 'LOBBY-A', 'LOBBY-B', 'LOBBY-C', 'LOBBY-D'
    lobby_name VARCHAR(100) NOT NULL,       -- 'Sunny Meadows', 'Cozy Barn', '星光谷', '月光屋'
    status VARCHAR(20) DEFAULT 'waiting',   -- waiting, active, completed
    max_players INTEGER DEFAULT 6,
    current_players INTEGER DEFAULT 0,
    current_humans INTEGER DEFAULT 0,
    current_ai_count INTEGER DEFAULT 0,
    admin_player_id UUID,                   -- NULL until first player joins
    total_rounds INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_status CHECK (status IN ('waiting', 'active', 'completed')),
    CONSTRAINT valid_max_players CHECK (max_players BETWEEN 2 AND 6)
);

-- Index for fast lobby lookups
CREATE INDEX idx_mom_dad_lobby_key ON baby_shower.mom_dad_lobbies(lobby_key);
CREATE INDEX idx_mom_dad_status ON baby_shower.mom_dad_lobbies(status);

-- =============================================================================
-- PLAYER TABLE: tracks humans and AI in each lobby
-- =============================================================================

CREATE TABLE baby_shower.mom_dad_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lobby_id UUID REFERENCES baby_shower.mom_dad_lobbies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),  -- NULL for AI players
    player_name VARCHAR(100) NOT NULL,
    player_type VARCHAR(10) DEFAULT 'human',  -- human, ai
    is_admin BOOLEAN DEFAULT false,
    is_ready BOOLEAN DEFAULT false,
    current_vote VARCHAR(10),  -- 'mom', 'dad', or NULL for current round
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    disconnected_at TIMESTAMPTZ,
    
    CONSTRAINT valid_player_type CHECK (player_type IN ('human', 'ai')),
    CONSTRAINT valid_vote CHECK (current_vote IS NULL OR current_vote IN ('mom', 'dad'))
);

-- Indexes for efficient lookups
CREATE INDEX idx_mom_dad_lobby_players ON baby_shower.mom_dad_players(lobby_id);
CREATE INDEX idx_mom_dad_user_players ON baby_shower.mom_dad_players(user_id);
CREATE INDEX idx_mom_dad_admin_lookup ON baby_shower.mom_dad_players(lobby_id, is_admin) WHERE is_admin = true;

-- =============================================================================
-- GAME SESSION TABLE: individual rounds within a lobby game
-- =============================================================================

CREATE TABLE baby_shower.mom_dad_game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lobby_id UUID REFERENCES baby_shower.mom_dad_lobbies(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    scenario_text TEXT NOT NULL,
    mom_option TEXT NOT NULL,
    dad_option TEXT NOT NULL,
    intensity DECIMAL(3,2) DEFAULT 0.5,
    status VARCHAR(20) DEFAULT 'voting',  -- voting, revealed, completed
    mom_votes INTEGER DEFAULT 0,
    dad_votes INTEGER DEFAULT 0,
    mom_percentage DECIMAL(5,2),
    dad_percentage DECIMAL(5,2),
    crowd_choice VARCHAR(10),  -- 'mom' or 'dad'
    actual_mom_answer VARCHAR(10),  -- Truth from parent input
    actual_dad_answer VARCHAR(10),
    perception_gap DECIMAL(5,2),
    roast_commentary TEXT,
    particle_effect VARCHAR(20) DEFAULT 'confetti',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revealed_at TIMESTAMPTZ,
    
    CONSTRAINT valid_status CHECK (status IN ('voting', 'revealed', 'completed')),
    CONSTRAINT valid_intensity CHECK (intensity BETWEEN 0.1 AND 1.0),
    CONSTRAINT valid_answer CHECK (
        actual_mom_answer IS NULL OR actual_mom_answer IN ('mom', 'dad')
    ),
    CONSTRAINT valid_answer_dad CHECK (
        actual_dad_answer IS NULL OR actual_dad_answer IN ('mom', 'dad')
    )
);

-- Indexes for game state queries
CREATE INDEX idx_mom_dad_lobby_rounds ON baby_shower.mom_dad_game_sessions(lobby_id, round_number);
CREATE INDEX idx_mom_dad_active_round ON baby_shower.mom_dad_game_sessions(lobby_id, status) 
    WHERE status IN ('voting', 'revealed');

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE baby_shower.mom_dad_lobbies ENABLE ROW LEVEL SECURITY;

-- Anyone can read lobby information
CREATE POLICY "Public mom_dad lobbies are viewable by everyone"
ON baby_shower.mom_dad_lobbies FOR SELECT
USING (true);

-- Only admin functions can update lobby state (checked via player admin status)
CREATE POLICY "Admin can update mom_dad lobby"
ON baby_shower.mom_dad_lobbies FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM baby_shower.mom_dad_players 
        WHERE lobby_id = baby_shower.mom_dad_lobbies.id 
        AND is_admin = true
        AND (user_id = auth.uid() OR player_type = 'ai')
    )
);

-- System functions can update lobby (app.current_role = 'system')
CREATE POLICY "System can update mom_dad lobby"
ON baby_shower.mom_dad_lobbies FOR UPDATE
USING (
    current_setting('app.current_role', true) = 'system'
);

-- Players table RLS
ALTER TABLE baby_shower.mom_dad_players ENABLE ROW LEVEL SECURITY;

-- Players can view lobby participants
CREATE POLICY "Mom_dad players can view lobby members"
ON baby_shower.mom_dad_players FOR SELECT
USING (
    lobby_id IN (
        SELECT id FROM baby_shower.mom_dad_lobbies
        WHERE lobby_key IN ('LOBBY-A', 'LOBBY-B', 'LOBBY-C', 'LOBBY-D')
    )
    OR user_id = auth.uid()
);

-- Players can update their own state
CREATE POLICY "Mom_dad players can update own state"
ON baby_shower.mom_dad_players FOR UPDATE
USING (user_id = auth.uid() OR player_type = 'ai');

-- Admin can update all players in their lobby
CREATE POLICY "Admin can update mom_dad lobby players"
ON baby_shower.mom_dad_players FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM baby_shower.mom_dad_players p2
        WHERE p2.lobby_id = lobby_id 
        AND p2.user_id = auth.uid() 
        AND p2.is_admin = true
    )
);

-- System functions can manage players
CREATE POLICY "System can manage mom_dad players"
ON baby_shower.mom_dad_players FOR ALL
USING (current_setting('app.current_role', true) = 'system');

-- Game sessions table RLS
ALTER TABLE baby_shower.mom_dad_game_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can view game sessions for valid lobbies
CREATE POLICY "Anyone can view mom_dad game sessions"
ON baby_shower.mom_dad_game_sessions FOR SELECT
USING (
    lobby_id IN (
        SELECT id FROM baby_shower.mom_dad_lobbies
    )
);

-- System manages game sessions
CREATE POLICY "System manages mom_dad game sessions"
ON baby_shower.mom_dad_game_sessions FOR ALL
USING (current_setting('app.current_role', true) = 'system');

-- =============================================================================
-- SEED DATA: Pre-create the 4 lobbies
-- =============================================================================

INSERT INTO baby_shower.mom_dad_lobbies (lobby_key, lobby_name, status, max_players) VALUES
('LOBBY-A', 'Sunny Meadows', 'waiting', 6),
('LOBBY-B', 'Cozy Barn', 'waiting', 6),
('LOBBY-C', '星光谷', 'waiting', 6),
('LOBBY-D', '月光屋', 'waiting', 6);

-- =============================================================================
-- MIGRATION VERIFICATION
-- =============================================================================

-- Verify tables were created
SELECT 'mom_dad_lobbies' as table_name, count(*) as row_count 
FROM baby_shower.mom_dad_lobbies
UNION ALL
SELECT 'mom_dad_players', count(*) FROM baby_shower.mom_dad_players
UNION ALL
SELECT 'mom_dad_game_sessions', count(*) FROM baby_shower.mom_dad_game_sessions;

-- Verify lobby count
SELECT COUNT(*) as lobby_count FROM baby_shower.mom_dad_lobbies 
WHERE lobby_key IN ('LOBBY-A', 'LOBBY-B', 'LOBBY-C', 'LOBBY-D');
