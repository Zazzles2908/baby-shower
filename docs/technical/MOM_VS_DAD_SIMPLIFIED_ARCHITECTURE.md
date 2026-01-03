# Mom vs Dad - Simplified Lobby Architecture

## Overview

This document outlines the architecture for a streamlined, user-friendly Mom vs Dad game experience. The system eliminates complex session codes and administrative authentication in favor of a simple lobby-based model where up to 6 players (human or AI) can join pre-created lobbies, with the first joiner automatically becoming the admin. This design prioritizes simplicity, reliability, and production readiness while maintaining all the engaging gameplay elements of the original design.

The simplified architecture reduces friction for users by removing barriers to entry. Instead of generating and sharing session codes, players can simply select from 4 pre-configured lobbies and join immediately. The admin role emerges naturally through first participation, eliminating the need for separate authentication flows. This approach significantly reduces the attack surface and potential failure points while making the game more accessible for guests who may not be technically sophisticated.

The system maintains the core gameplay loop of guessing scenarios between Mom and Dad, with AI integration providing intelligent opponents when human players are insufficient. The real-time Supabase subscriptions ensure that all players see the same game state simultaneously, creating a cohesive multiplayer experience that feels responsive and engaging. The architecture scales horizontally to handle multiple concurrent lobbies without interference, and the persistent nature of lobbies means that partially completed games can be resumed by the same group of players.

## Database Schema

The database schema has been redesigned to support the simplified lobby architecture. We maintain the existing `baby_shower` namespace convention while introducing three new tables that handle lobby management, player tracking, and game session state. All tables include appropriate Row Level Security (RLS) policies to ensure data isolation between lobbies and prevent unauthorized access to game state information.

The schema uses UUID primary keys for all records, ensuring global uniqueness and preventing enumeration attacks. Timestamps are stored in TIMESTAMPTZ format to support accurate real-time synchronization across different time zones. The design minimizes data duplication while maintaining sufficient redundancy for efficient querying during gameplay. Each table includes soft-delete capability through the `deleted_at` field, allowing for audit trails without permanently removing data.

### Lobby Table

The lobby table serves as the container for all game activity. Each lobby is pre-created with a unique identifier, friendly name, and configurable parameters that control game behavior. The status field tracks the lobby's current state, transitioning from `waiting` to `active` when the admin starts the game, and finally to `completed` when all rounds have been played. The max_players field defaults to 6 but can be configured for smaller games if desired, providing flexibility for different party sizes.

The lobby table also tracks which players are human versus AI, allowing the system to intelligently fill empty slots with AI opponents when necessary. The current_ai_count field maintains a running count of AI players currently in the lobby, enabling efficient slot management without querying all player records. The created_at timestamp establishes a total ordering that naturally identifies the first joiner as the admin, eliminating the need for separate admin assignment logic.

```sql
-- Lobby table: 4 pre-created persistent lobbies
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
CREATE INDEX idx_lobby_key ON baby_shower.mom_dad_lobbies(lobby_key);
CREATE INDEX idx_status ON baby_shower.mom_dad_lobbies(status);

-- RLS Policies
ALTER TABLE baby_shower.mom_dad_lobbies ENABLE ROW LEVEL SECURITY;

-- Anyone can read lobby information
CREATE POLICY "Public lobbies are viewable by everyone"
ON baby_shower.mom_dad_lobbies FOR SELECT
USING (true);

-- Only admin functions can update lobby state
CREATE POLICY "Admin can update lobby"
ON baby_shower.mom_dad_lobbies FOR UPDATE
USING (
    auth.uid() IN (
        SELECT user_id FROM baby_shower.mom_dad_players 
        WHERE lobby_id = baby_shower.mom_dad_lobbies.id AND is_admin = true
    )
);

-- System functions can update lobby
CREATE POLICY "System can update lobby"
ON baby_shower.mom_dad_lobbies FOR UPDATE
USING (
    current_setting('app.current_role', true) = 'system'
);
```

### Player Table

The player table tracks all participants in a lobby, whether human or AI. Human players are linked to Supabase auth.users when available, providing identity persistence across sessions. AI players have NULL auth references but include personality attributes that influence their voting behavior during gameplay. The is_admin flag is set automatically when a player becomes the first joiner, and is_admin determines who can modify game parameters and start the game.

The player table includes a voting history cache that stores votes for the current round, enabling real-time vote counting without database joins. The is_ready flag tracks whether a player has submitted their answer for the current scenario, allowing the game to wait for all players before revealing results. The connected_at timestamp uses the first player to establish the admin ordering, while disconnected_at allows for temporary player absences without losing their position in the lobby.

```sql
-- Player table: tracks humans and AI in each lobby
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
CREATE INDEX idx_lobby_players ON baby_shower.mom_dad_players(lobby_id);
CREATE INDEX idx_user_players ON baby_shower.mom_dad_players(user_id);
CREATE INDEX idx_admin_lookup ON baby_shower.mom_dad_players(lobby_id, is_admin) WHERE is_admin = true;

-- RLS Policies
ALTER TABLE baby_shower.mom_dad_players ENABLE ROW LEVEL SECURITY;

-- Players can view lobby participants
CREATE POLICY "Players can view lobby members"
ON baby_shower.mom_dad_players FOR SELECT
USING (
    lobby_id IN (
        SELECT id FROM baby_shower.mom_dad_lobbies
        WHERE lobby_key IN ('LOBBY-A', 'LOBBY-B', 'LOBBY-C', 'LOBBY-D')
    )
    OR user_id = auth.uid()
);

-- Players can update their own state
CREATE POLICY "Players can update own state"
ON baby_shower.mom_dad_players FOR UPDATE
USING (user_id = auth.uid() OR player_type = 'ai');

-- Admin can update all players in their lobby
CREATE POLICY "Admin can update lobby players"
ON baby_shower.mom_dad_players FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM baby_shower.mom_dad_players p2
        WHERE p2.lobby_id = lobby_id AND p2.user_id = auth.uid() AND p2.is_admin = true
    )
);

-- System functions can insert/update
CREATE POLICY "System can manage players"
ON baby_shower.mom_dad_players FOR ALL
USING (current_setting('app.current_role', true) = 'system');
```

### Game Session Table

The game session table captures the state of each round within a lobby game. Each record represents a single scenario with its associated votes, results, and AI-generated content. The round_order field ensures scenarios are presented in the correct sequence, while the status field tracks whether the round is in voting, revealed, or completed state. This design allows for pause/resume functionality and historical record-keeping of completed games.

The perception_gap field stores the difference between crowd perception and actual answers, which drives the AI roast commentary generation. The results_cache field aggregates voting results to avoid expensive joins during real-time updates. All timestamps are recorded to enable replay analysis and time-based statistics. The table includes optimistic locking through the version field, preventing race conditions when multiple players submit votes simultaneously.

```sql
-- Game session table: individual rounds within a lobby game
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
CREATE INDEX idx_lobby_rounds ON baby_shower.mom_dad_game_sessions(lobby_id, round_number);
CREATE INDEX idx_active_round ON baby_shower.mom_dad_game_sessions(lobby_id, status) 
    WHERE status IN ('voting', 'revealed');

-- RLS Policies (same as player table)
ALTER TABLE baby_shower.mom_dad_game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view game sessions"
ON baby_shower.mom_dad_game_sessions FOR SELECT
USING (
    lobby_id IN (
        SELECT id FROM baby_shower.mom_dad_lobbies
    )
);

CREATE POLICY "System manages game sessions"
ON baby_shower.mom_dad_game_sessions FOR ALL
USING (current_setting('app.current_role', true) = 'system');
```

## Edge Functions Required

The Edge Functions have been redesigned to support the simplified lobby architecture. Each function handles a specific aspect of lobby management, game initialization, or player interaction. All functions follow the security-first pattern established in the AGENTS.md guidelines, including standardized error handling, environment validation, and comprehensive security headers. The functions use Supabase realtime subscriptions to broadcast state changes to all connected clients.

### 1. `lobby-create`

**Purpose:** Create lobby when first user joins, automatically assigning admin status
**Trigger:** POST /lobby-create
**Logic Flow:**

The lobby-create function handles the initial entry point for players joining a lobby. When called, it first validates that the requested lobby exists and is in waiting status. If the lobby is empty, the joining player automatically becomes the admin. The function creates a player record, updates the lobby's player count, and establishes a realtime subscription for the new player. The function returns the complete lobby state including all current players, enabling the frontend to render the waiting room immediately.

Environment validation occurs first to ensure all required configuration is present. The function checks that the lobby_key is one of the four pre-created lobbies and that the lobby hasn't reached maximum capacity. For AI players, the function handles the special case where no auth.user exists, creating a system-generated player identity. The function also handles the admin assignment logic, setting is_admin=true only when the lobby was previously empty and no admin had been assigned.

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { 
  validateEnvironmentVariables, 
  createErrorResponse, 
  createSuccessResponse,
  validateInput,
  CORS_HEADERS,
  SECURITY_HEADERS
} from '../_shared/security.ts'

interface JoinRequest {
  lobby_key: string
  player_name: string
  player_type?: 'human' | 'ai'
}

serve(async (req: Request) => {
  const headers = new Headers({ ...CORS_HEADERS, ...SECURITY_HEADERS, 'Content-Type': 'application/json' })

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405)
  }

  try {
    // Validate environment variables
    const envValidation = validateEnvironmentVariables([
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ], ['MINIMAX_API_KEY', 'Z_AI_API_KEY', 'KIMI_API_KEY'])

    if (!envValidation.isValid) {
      console.error('Environment validation failed:', envValidation.errors)
      return createErrorResponse('Server configuration error', 500)
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Parse and validate request
    let body: JoinRequest
    try {
      body = await req.json()
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400)
    }

    const validation = validateInput(body, {
      lobby_key: { type: 'string', required: true, pattern: /^(LOBBY-A|LOBBY-B|LOBBY-C|LOBBY-D)$/ },
      player_name: { type: 'string', required: true, minLength: 1, maxLength: 50 },
      player_type: { type: 'string', required: false, pattern: /^(human|ai)$/ }
    })

    if (!validation.isValid) {
      return createErrorResponse('Validation failed', 400, validation.errors)
    }

    const { lobby_key, player_name, player_type = 'human' } = validation.sanitized

    // Fetch lobby and check capacity
    const { data: lobby, error: lobbyError } = await supabase
      .from('mom_dad_lobbies')
      .select('*')
      .eq('lobby_key', lobby_key)
      .single()

    if (lobbyError || !lobby) {
      return createErrorResponse('Lobby not found', 404)
    }

    if (lobby.current_players >= lobby.max_players) {
      return createErrorResponse('Lobby is full', 400)
    }

    if (lobby.status !== 'waiting') {
      return createErrorResponse('Lobby is not accepting new players', 400)
    }

    // Check if player already in lobby (for reconnection)
    let existingPlayer = null
    if (player_type === 'human') {
      const { data: player } = await supabase
        .from('mom_dad_players')
        .select('*')
        .eq('lobby_id', lobby.id)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id || 'anonymous')
        .is('user_id', player_type === 'ai' ? null : null)
        .single()
      
      if (player) {
        existingPlayer = player
      }
    }

    // Determine admin status
    const isFirstPlayer = lobby.current_players === 0 && !lobby.admin_player_id
    const playerId = existingPlayer?.id || crypto.randomUUID()

    // Create or reactivate player
    if (existingPlayer) {
      const { error: updateError } = await supabase
        .from('mom_dad_players')
        .update({ 
          disconnected_at: null, 
          is_ready: false,
          current_vote: null
        })
        .eq('id', existingPlayer.id)

      if (updateError) throw updateError
    } else {
      const { error: insertError } = await supabase
        .from('mom_dad_players')
        .insert({
          id: playerId,
          lobby_id: lobby.id,
          player_name,
          player_type,
          is_admin: isFirstPlayer,
          is_ready: false
        })

      if (insertError) throw insertError
    }

    // Update lobby player count
    const updateData: any = { updated_at: new Date().toISOString() }
    if (isFirstPlayer) {
      updateData.admin_player_id = playerId
    }
    if (player_type === 'human') {
      updateData.current_humans = lobby.current_humans + 1
    } else {
      updateData.current_ai_count = lobby.current_ai_count + 1
    }
    updateData.current_players = lobby.current_players + 1

    const { error: updateLobbyError } = await supabase
      .from('mom_dad_lobbies')
      .update(updateData)
      .eq('id', lobby.id)

    if (updateLobbyError) throw updateLobbyError

    // Fetch updated lobby state
    const { data: updatedLobby } = await supabase
      .from('mom_dad_lobbies')
      .select('*')
      .eq('id', lobby.id)
      .single()

    const { data: players } = await supabase
      .from('mom_dad_players')
      .select('*')
      .eq('lobby_id', lobby.id)
      .is('disconnected_at', null)

    // Broadcast player joined event
    await supabase.channel(`lobby:${lobby_key}`)
      .send({
        type: 'broadcast',
        event: 'player_joined',
        payload: { player_id: playerId, player_name, is_admin: isFirstPlayer }
      })

    return createSuccessResponse({
      lobby: updatedLobby,
      players: players || [],
      current_player_id: playerId,
      is_admin: isFirstPlayer
    }, 200)

  } catch (error) {
    console.error('Lobby creation error:', error)
    return createErrorResponse('Failed to join lobby', 500)
  }
})
```

### 2. `lobby-join`

**Purpose:** Join existing lobby (alias for lobby-create with additional validation)
**Trigger:** POST /lobby-join
**Logic Flow:**

The lobby-join function provides additional validation and handling for players rejoining lobbies they previously participated in. Unlike lobby-create which focuses on new lobby initialization, lobby-join prioritizes reconnection scenarios where a player may have lost connection or left and returned. The function validates that the player has permission to rejoin (either through previous authentication or through a valid reconnection token).

For AI players, the function handles the special case of AI slot management, ensuring that AI players are properly tracked and can be removed when human players join. The function also manages the waiting room state, broadcasting updates to all connected clients when a player joins or rejoins. The function includes rate limiting to prevent spam joining and implements proper error messages for common failure scenarios like lobby full or game already in progress.

### 3. `lobby-status`

**Purpose:** Real-time lobby state updates through Supabase subscription
**Trigger:** Supabase Realtime subscription on `lobby:{lobby_key}` channel
**Returns:** Complete lobby state with all players and current game status

The lobby-status function is not a traditional HTTP endpoint but rather a realtime subscription handler that broadcasts state changes to all connected clients. Clients subscribe to their lobby channel and receive immediate updates when any lobby state changes occur. The subscription handles three types of events: player state changes (join, leave, ready status), lobby state changes (game started, round completed), and game events (new scenario, vote counts, reveal results).

The subscription design uses optimistic updates on the client side, with server confirmations ensuring eventual consistency. When a player performs an action (like marking ready), the client updates immediately while the server processes the request and broadcasts the confirmed state to all subscribers. This approach provides a responsive user experience even under network latency conditions. The subscription includes automatic reconnection handling and queue management for high-latency scenarios.

```typescript
// Client-side subscription setup (in scripts/mom-vs-dad.js)

function subscribeToLobby(lobbyKey, callbacks) {
  const subscription = window.supabase
    .channel(`lobby:${lobbyKey}`)
    .on('broadcast', { event: 'player_joined' }, (payload) => {
      console.log('[Lobby] Player joined:', payload)
      if (callbacks.onPlayerJoin) callbacks.onPlayerJoin(payload)
    })
    .on('broadcast', { event: 'player_left' }, (payload) => {
      console.log('[Lobby] Player left:', payload)
      if (callbacks.onPlayerLeave) callbacks.onPlayerLeave(payload)
    })
    .on('broadcast', { event: 'player_ready' }, (payload) => {
      console.log('[Lobby] Player ready:', payload)
      if (callbacks.onPlayerReady) callbacks.onPlayerReady(payload)
    })
    .on('broadcast', { event: 'game_started' }, (payload) => {
      console.log('[Lobby] Game started:', payload)
      if (callbacks.onGameStart) callbacks.onGameStart(payload)
    })
    .on('broadcast', { event: 'round_new' }, (payload) => {
      console.log('[Lobby] New round:', payload)
      if (callbacks.onNewRound) callbacks.onNewRound(payload)
    })
    .on('broadcast', { event: 'vote_update' }, (payload) => {
      console.log('[Lobby] Vote update:', payload)
      if (callbacks.onVoteUpdate) callbacks.onVoteUpdate(payload)
    })
    .on('broadcast', { event: 'round_reveal' }, (payload) => {
      console.log('[Lobby] Round reveal:', payload)
      if (callbacks.onRoundReveal) callbacks.onRoundReveal(payload)
    })
    .subscribe((status) => {
      console.log('[Lobby] Subscription status:', status)
      if (callbacks.onSubscribe) callbacks.onSubscribe(status)
    })

  return subscription
}
```

### 4. `game-start`

**Purpose:** Admin starts the game, generates scenarios, and transitions lobby to active
**Trigger:** POST /game-start
**Validation:** Request must come from admin player, lobby must be in waiting status with at least 2 players

The game-start function initiates gameplay by validating the admin's authority, generating AI scenarios, and transitioning the lobby to active status. The function performs comprehensive validation to ensure the game can start: verifying the requester is the admin, confirming sufficient players exist, and validating game parameters like total rounds and intensity. If AI players are needed to reach minimum viable player count, the function triggers AI player insertion before starting.

Scenario generation uses the Z.AI API to create funny, contextually appropriate scenarios based on the game parameters. The function generates the configured number of rounds (default 5) and creates game session records for each round. The scenarios are stored with the generated options for Mom and Dad, along with intensity ratings that control the comedic tone. After creating all rounds, the function updates the lobby status to active and broadcasts the game start event to all connected clients.

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { 
  validateEnvironmentVariables, 
  createErrorResponse, 
  createSuccessResponse,
  validateInput,
  CORS_HEADERS,
  SECURITY_HEADERS
} from '../_shared/security.ts'

interface StartGameRequest {
  lobby_key: string
  admin_player_id: string
  total_rounds?: number
  intensity?: number
}

serve(async (req: Request) => {
  const headers = new Headers({ ...CORS_HEADERS, ...SECURITY_HEADERS, 'Content-Type': 'application/json' })

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405)
  }

  try {
    // Validate environment
    const envValidation = validateEnvironmentVariables([
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ], ['Z_AI_API_KEY'])

    if (!envValidation.isValid) {
      return createErrorResponse('Server configuration error', 500)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Parse and validate request
    let body: StartGameRequest
    try {
      body = await req.json()
    } catch {
      return createErrorResponse('Invalid JSON', 400)
    }

    const validation = validateInput(body, {
      lobby_key: { type: 'string', required: true, pattern: /^(LOBBY-A|LOBBY-B|LOBBY-C|LOBBY-D)$/ },
      admin_player_id: { type: 'string', required: true },
      total_rounds: { type: 'number', required: false, min: 1, max: 10 },
      intensity: { type: 'number', required: false, min: 0.1, max: 1.0 }
    })

    if (!validation.isValid) {
      return createErrorResponse('Validation failed', 400, validation.errors)
    }

    const { lobby_key, admin_player_id, total_rounds = 5, intensity = 0.5 } = validation.sanitized

    // Fetch and validate lobby
    const { data: lobby, error: lobbyError } = await supabase
      .from('mom_dad_lobbies')
      .select('*')
      .eq('lobby_key', lobby_key)
      .single()

    if (lobbyError || !lobby) {
      return createErrorResponse('Lobby not found', 404)
    }

    if (lobby.status !== 'waiting') {
      return createErrorResponse('Game already in progress or completed', 400)
    }

    if (lobby.admin_player_id !== admin_player_id) {
      return createErrorResponse('Only admin can start the game', 403)
    }

    // Get current players
    const { data: players, error: playersError } = await supabase
      .from('mom_dad_players')
      .select('*')
      .eq('lobby_id', lobby.id)
      .is('disconnected_at', null)

    if (playersError) throw playersError

    const activePlayers = players?.filter(p => p.disconnected_at === null) || []
    
    if (activePlayers.length < 2) {
      return createErrorResponse('At least 2 players required to start', 400)
    }

    // Check if AI players needed
    const aiSlotsNeeded = Math.max(0, lobby.max_players - activePlayers.length)
    
    if (aiSlotsNeeded > 0 && lobby.current_ai_count < aiSlotsNeeded) {
      // Add AI players
      const aiPlayers = []
      for (let i = 0; i < aiSlotsNeeded; i++) {
        aiPlayers.push({
          lobby_id: lobby.id,
          player_name: `AI Guest ${lobby.current_ai_count + i + 1}`,
          player_type: 'ai',
          is_admin: false,
          is_ready: true  // AI is always ready
        })
      }

      const { error: aiError } = await supabase
        .from('mom_dad_players')
        .insert(aiPlayers)

      if (aiError) throw aiError

      // Update AI count
      await supabase
        .from('mom_dad_lobbies')
        .update({ 
          current_ai_count: lobby.current_ai_count + aiSlotsNeeded,
          current_players: lobby.current_players + aiSlotsNeeded,
          updated_at: new Date().toISOString()
        })
        .eq('id', lobby.id)
    }

    // Generate scenarios using Z.AI
    const scenarios = await generateScenarios(supabase, total_rounds, intensity, lobby_key)

    // Create game sessions
    const gameSessions = scenarios.map((scenario, index) => ({
      lobby_id: lobby.id,
      round_number: index + 1,
      scenario_text: scenario.text,
      mom_option: scenario.mom_option,
      dad_option: scenario.dad_option,
      intensity: scenario.intensity || intensity,
      status: 'voting'
    }))

    const { error: sessionsError } = await supabase
      .from('mom_dad_game_sessions')
      .insert(gameSessions)

    if (sessionsError) throw sessionsError

    // Update lobby status
    const { error: updateError } = await supabase
      .from('mom_dad_lobbies')
      .update({ 
        status: 'active',
        total_rounds,
        updated_at: new Date().toISOString()
      })
      .eq('id', lobby.id)

    if (updateError) throw updateError

    // Broadcast game start
    await supabase.channel(`lobby:${lobby_key}`)
      .send({
        type: 'broadcast',
        event: 'game_started',
        payload: { total_rounds, intensity }
      })

    // Get first round
    const { data: firstRound } = await supabase
      .from('mom_dad_game_sessions')
      .select('*')
      .eq('lobby_id', lobby.id)
      .eq('round_number', 1)
      .single()

    // Broadcast first round
    await supabase.channel(`lobby:${lobby_key}`)
      .send({
        type: 'broadcast',
        event: 'round_new',
        payload: { round: firstRound }
      })

    return createSuccessResponse({
      message: 'Game started successfully',
      total_rounds,
      first_round: firstRound
    }, 200)

  } catch (error) {
    console.error('Game start error:', error)
    return createErrorResponse('Failed to start game', 500)
  }
})

async function generateScenarios(supabase, count, intensity, lobbyKey) {
  const zaiKey = Deno.env.get('Z_AI_API_KEY')
  if (!zaiKey) {
    // Fallback to default scenarios if AI unavailable
    return getDefaultScenarios(count, intensity)
  }

  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v3/modelapi/chatglm_pro/completions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${zaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: `Generate ${count} funny "who would rather" scenarios for a baby shower game about Mom vs Dad.
                 Theme: Farm/Cozy. Comedy intensity: ${intensity} (0.1-1.0).
                 Return JSON array with objects containing: scenario_text, mom_option, dad_option, intensity.
                 Make scenarios relatable and funny.`
      })
    })

    if (!response.ok) {
      throw new Error('Z.AI API error')
    }

    const data = await response.json()
    return JSON.parse(data.choices?.[0]?.message?.content || '[]')
  } catch (error) {
    console.error('Scenario generation failed, using defaults:', error)
    return getDefaultScenarios(count, intensity)
  }
}

function getDefaultScenarios(count, intensity) {
  const defaults = [
    { text: "It's 3 AM and the baby explodes diaper everywhere", mom_option: "Mom would retch", dad_option: "Dad would clean it up", intensity },
    { text: "Baby's first solid food reaction", mom_option: "Mom would google frantically", dad_option: "Dad would take a video", intensity },
    { text: "Lost pacifier at 2 AM", mom_option: "Mom would sanitize it", dad_option: "Dad would buy a new one", intensity },
    { text: "Baby laughs at a dog but not at parents", mom_option: "Mom would be offended", dad_option: "Dad would high-five the dog", intensity },
    { text: "First time baby says a word", mom_option: "Mom would cry happy tears", dad_option: "Dad would compete to teach more words", intensity },
    { text: "Baby reaches for grandparent instead of parent", mom_option: "Mom would fake tears", dad_option: "Dad would tease about it", intensity },
    { text: "Baby's first bath time chaos", mom_option: "Mom would worry about water temperature", dad_option: "Dad would splash around", intensity },
    { text: "Middle of the night feeding responsibility", mom_option: "Mom would breastfeed", dad_option: "Dad would warm formula", intensity },
    { text: "Baby's first steps celebration", mom_option: "Mom would clap and cheer", dad_option: "Dad would video call everyone", intensity },
    { text: "Baby refuses to sleep at bedtime", mom_option: "Mom would try every trick", dad_option: "Dad would read the same book 10 times", intensity }
  ]
  
  return defaults.slice(0, count)
}
```

### 5. `game-vote`

**Purpose:** Submit vote for current scenario, update vote counts in real-time
**Trigger:** POST /game-vote
**Logic:** Validates player is in lobby, game is active, round is in voting status, then records vote and broadcasts update

The game-vote function handles vote submission from players during active rounds. The function validates that the player is in the lobby and that the game is in an active state with a round currently accepting votes. For human players, it records the vote and updates the player's ready status. For AI players, votes are generated automatically based on personality attributes and voting patterns.

The function implements optimistic voting where the vote is immediately reflected in the vote counts and broadcast to all subscribers. The function tracks both the current vote for the active round and the historical voting record. After recording the vote, the function checks if all players have voted and automatically triggers the reveal phase when the last vote is submitted. This automatic progression ensures smooth gameplay without requiring manual admin intervention to advance rounds.

### 6. `game-reveal`

**Purpose:** Generate and display results for completed round, including AI roast commentary
**Trigger:** POST /game-reveal
**Logic:** Calculates vote percentages, determines crowd vs actual answers, generates Moonshot AI roast, broadcasts results

The game-reveal function processes the completed round by calculating vote distributions, determining the crowd's perception versus actual answers, and generating entertaining roast commentary. The function requires admin authorization to trigger the reveal, ensuring the admin controls when results are displayed. For rounds where parents have input their answers, the function compares crowd perception to reality and calculates the perception gap that drives the roast generation.

The function uses Moonshot AI (Kimi-K2) to generate personalized roast commentary based on the perception gap, voting patterns, and game context. The roast is designed to be humorous and playful while maintaining appropriate boundaries for a family gathering. The function updates the round status to revealed, stores the calculated percentages and commentary, and broadcasts the complete results to all players. The broadcast includes vote counts, percentages, actual answers, and the roast commentary for display.

## Frontend Architecture

The frontend architecture follows the established IIFE pattern from the AGENTS.md guidelines while implementing the simplified lobby navigation model. The frontend uses vanilla JavaScript without frameworks, attaching functionality to the window object for global access. The design prioritizes mobile-first responsive design with progressive enhancement, ensuring core functionality works even with JavaScript limitations.

### Pages/Routes

The application uses simple URL-based routing with hash fragments for lobby selection. This approach works without server-side routing configuration and provides shareable URLs for each lobby. The main route serves as the lobby selector, while direct navigation to lobby URLs automatically loads the appropriate lobby view. The router handles page state transitions and manages browser history for back/forward navigation support.

```javascript
// Simple hash-based routing
const ROUTES = {
  HOME: '#/',
  LOBBY_A: '#/lobby/LOBBY-A',
  LOBBY_B: '#/lobby/LOBBY-B',
  LOBBY_C: '#/lobby/LOBBY-C',
  LOBBY_D: '#/lobby/LOBBY-D'
}

// Route patterns
const ROUTE_PATTERN = /#\/lobby\/(LOBBY-[A-D])/

function handleRoute() {
  const hash = window.location.hash
  const match = hash.match(ROUTE_PATTERN)
  
  if (match) {
    const lobbyKey = match[1]
    showLobbyView(lobbyKey)
  } else if (hash === '#/' || hash === '') {
    showLobbySelector()
  } else {
    showLobbySelector()
  }
}

window.addEventListener('hashchange', handleRoute)
window.addEventListener('DOMContentLoaded', handleRoute)
```

### Components

The frontend components are organized into logical groups that handle specific aspects of the game experience. The lobby selector component presents the four available lobbies with current status information. The waiting room component displays players and admin controls. The game active component handles scenario display and voting. The results component presents round outcomes and accumulated scores. Each component manages its own state and updates the DOM efficiently using targeted refreshes rather than full re-renders.

**LobbySelector Component:**

The lobby selector presents a visually appealing grid of four lobby cards, each displaying the lobby name, current player count, and status indicator. The component fetches lobby status on load and periodically refreshes to show current availability. Clicking a lobby card initiates the join process, either prompting for login if not authenticated or proceeding directly to lobby entry for authenticated users. The component includes visual feedback for full lobbies and active games.

```javascript
// LobbySelector component
const LobbySelector = {
  container: null,
  lobbies: [],

  async init(containerId) {
    this.container = document.getElementById(containerId)
    if (!this.container) {
      console.error('[LobbySelector] Container not found:', containerId)
      return
    }
    
    await this.loadLobbies()
    this.render()
    this.startPolling()
  },

  async loadLobbies() {
    try {
      const response = await fetch('/functions/v1/lobby-list')
      if (!response.ok) throw new Error('Failed to fetch lobbies')
      
      const data = await response.json()
      this.lobbies = data.data || []
    } catch (error) {
      console.error('[LobbySelector] Failed to load lobbies:', error)
      this.lobbies = [
        { lobby_key: 'LOBBY-A', lobby_name: 'Sunny Meadows', current_players: 0, status: 'waiting', max_players: 6 },
        { lobby_key: 'LOBBY-B', lobby_name: 'Cozy Barn', current_players: 0, status: 'waiting', max_players: 6 },
        { lobby_key: 'LOBBY-C', lobby_name: '星光谷', current_players: 0, status: 'waiting', max_players: 6 },
        { lobby_key: 'LOBBY-D', lobby_name: '月光屋', current_players: 0, status: 'waiting', max_players: 6 }
      ]
    }
  },

  render() {
    if (!this.container) return
    
    this.container.innerHTML = `
      <div class="lobby-selector">
        <h2 class="selector-title">Choose Your Lobby</h2>
        <div class="lobby-grid">
          ${this.lobbies.map(lobby => this.renderLobbyCard(lobby)).join('')}
        </div>
      </div>
    `
    
    // Attach event listeners
    this.container.querySelectorAll('.lobby-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const lobbyKey = e.currentTarget.dataset.lobbyKey
        this.handleLobbySelect(lobbyKey)
      })
    })
  },

  renderLobbyCard(lobby) {
    const isFull = lobby.current_players >= lobby.max_players
    const isActive = lobby.status === 'active'
    const statusText = isActive ? 'Game in Progress' : `${lobby.current_players}/${lobby.max_players} Players`
    const statusClass = isActive ? 'status-active' : (isFull ? 'status-full' : 'status-available')
    const cardClass = isActive ? 'lobby-card active' : (isFull ? 'lobby-card full' : 'lobby-card')
    
    return `
      <div class="${cardClass}" data-lobby-key="${lobby.lobby_key}">
        <div class="lobby-icon">🏠</div>
        <h3 class="lobby-name">${lobby.lobby_name}</h3>
        <div class="lobby-status ${statusClass}">${statusText}</div>
        ${isActive ? '<div class="lobby-join-hint">Join to watch</div>' : ''}
      </div>
    `
  },

  handleLobbySelect(lobbyKey) {
    const lobby = this.lobbies.find(l => l.lobby_key === lobbyKey)
    if (!lobby) return
    
    if (lobby.status === 'active') {
      // Can join to watch but not participate
      if (confirm('This game is in progress. You can join to watch but not vote. Continue?')) {
        window.location.hash = `/lobby/${lobbyKey}`
      }
    } else if (lobby.current_players >= lobby.max_players) {
      alert('This lobby is full. Please choose another lobby.')
    } else {
      window.location.hash = `/lobby/${lobbyKey}`
    }
  },

  startPolling() {
    // Refresh lobby status every 10 seconds
    setInterval(() => this.loadLobbies().then(() => this.render()), 10000)
  }
}
```

**LobbyWaitingRoom Component:**

The waiting room displays all current players with their connection status and admin badge. The component shows admin controls only to the first player (auto-detected by join order) and provides clear visual feedback about the current game state. The component handles real-time updates through Supabase subscriptions, adding and removing player cards as participants join or leave. The admin section includes configuration options for game parameters and the start button.

```javascript
// LobbyWaitingRoom component
const LobbyWaitingRoom = {
  lobbyKey: null,
  lobbyData: null,
  players: [],
  currentPlayer: null,
  container: null,
  subscription: null,

  async init(containerId, lobbyKey) {
    this.lobbyKey = lobbyKey
    this.container = document.getElementById(containerId)
    if (!this.container) return
    
    await this.joinLobby()
    this.setupSubscription()
    this.render()
  },

  async joinLobby() {
    try {
      const playerName = await this.getPlayerName()
      const response = await fetch('/functions/v1/lobby-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lobby_key: this.lobbyKey,
          player_name: playerName
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to join lobby')
      }

      const data = await response.json()
      this.lobbyData = data.data.lobby
      this.players = data.data.players
      this.currentPlayer = data.data.current_player_id
      this.isAdmin = data.data.is_admin
      
      console.log('[LobbyWaitingRoom] Joined lobby:', this.lobbyKey, 'as admin:', this.isAdmin)
    } catch (error) {
      console.error('[LobbyWaitingRoom] Join failed:', error)
      alert('Failed to join lobby: ' + error.message)
      window.location.hash = '#/'
    }
  },

  async getPlayerName() {
    // Try to get stored name first
    let name = localStorage.getItem('player_name')
    if (name) return name
    
    // Prompt for name
    name = prompt('Enter your name to join the game:', '')?.trim()
    if (!name) {
      name = `Guest ${Math.floor(Math.random() * 1000)}`
    }
    
    localStorage.setItem('player_name', name)
    return name
  },

  setupSubscription() {
    if (!window.supabase) {
      console.warn('[LobbyWaitingRoom] Supabase not available')
      return
    }

    this.subscription = window.supabase
      .channel(`lobby:${this.lobbyKey}`)
      .on('broadcast', { event: 'player_joined' }, (payload) => {
        this.handlePlayerJoin(payload)
      })
      .on('broadcast', { event: 'player_left' }, (payload) => {
        this.handlePlayerLeave(payload)
      })
      .on('broadcast', { event: 'game_started' }, (payload) => {
        this.handleGameStart(payload)
      })
      .subscribe()
  },

  handlePlayerJoin(payload) {
    console.log('[LobbyWaitingRoom] New player:', payload)
    this.players.push({
      id: payload.player_id,
      player_name: payload.player_name,
      is_admin: payload.is_admin,
      is_ready: false
    })
    this.render()
  },

  handlePlayerLeave(payload) {
    console.log('[LobbyWaitingRoom] Player left:', payload)
    this.players = this.players.filter(p => p.id !== payload.player_id)
    this.render()
  },

  handleGameStart(payload) {
    console.log('[LobbyWaitingRoom] Game starting:', payload)
    this.lobbyData.status = 'active'
    window.MomVsDadGame.start(payload)
  },

  render() {
    if (!this.container) return

    const waitingForPlayers = this.players.length < 2
    const canStart = this.isAdmin && this.players.length >= 2

    this.container.innerHTML = `
      <div class="waiting-room">
        <div class="waiting-header">
          <h2 class="lobby-title">${this.lobbyData?.lobby_name || this.lobbyKey}</h2>
          <div class="player-count">${this.players.length}/${this.lobbyData?.max_players || 6} Players</div>
        </div>
        
        <div class="player-list">
          ${this.players.map(player => this.renderPlayerCard(player)).join('')}
        </div>
        
        ${waitingForPlayers ? `
          <div class="waiting-message">
            <div class="waiting-spinner">⏳</div>
            <p>Waiting for more players...</p>
          </div>
        ` : ''}
        
        ${this.isAdmin ? this.renderAdminControls(canStart) : `
          <div class="waiting-message">
            <p>Waiting for admin to start the game...</p>
          </div>
        `}
      </div>
    `

    // Attach event listeners
    if (this.isAdmin) {
      const startBtn = this.container.querySelector('.start-game-btn')
      if (startBtn) {
        startBtn.addEventListener('click', () => this.startGame())
      }

      const roundsSelect = this.container.querySelector('.rounds-select')
      if (roundsSelect) {
        roundsSelect.addEventListener('change', (e) => {
          this.lobbyData.total_rounds = parseInt(e.target.value)
        })
      }
    }
  },

  renderPlayerCard(player) {
    const adminBadge = player.is_admin ? '<span class="admin-badge">👑 Admin</span>' : ''
    return `
      <div class="player-card ${player.player_type || 'human'}" data-player-id="${player.id}">
        <div class="player-avatar">${player.player_name.charAt(0).toUpperCase()}</div>
        <div class="player-name">${player.player_name}</div>
        ${adminBadge}
        <div class="player-status">${player.is_ready ? '✓ Ready' : '...'}</div>
      </div>
    `
  },

  renderAdminControls(canStart) {
    return `
      <div class="admin-controls">
        <h3>Game Settings</h3>
        <div class="setting-row">
          <label>Rounds:</label>
          <select class="rounds-select">
            <option value="3" ${this.lobbyData?.total_rounds === 3 ? 'selected' : ''}>3 Rounds</option>
            <option value="5" ${this.lobbyData?.total_rounds === 5 ? 'selected' : ''}>5 Rounds</option>
            <option value="7" ${this.lobbyData?.total_rounds === 7 ? 'selected' : ''}>7 Rounds</option>
            <option value="10" ${this.lobbyData?.total_rounds === 10 ? 'selected' : ''}>10 Rounds</option>
          </select>
        </div>
        <div class="setting-row">
          <label>Intensity:</label>
          <select class="intensity-select">
            <option value="0.3">Mild</option>
            <option value="0.5" selected>Medium</option>
            <option value="0.7">Spicy</option>
            <option value="0.9">Wild</option>
          </select>
        </div>
        <button class="start-game-btn" ${!canStart ? 'disabled' : ''}>
          ${canStart ? '🎮 Start Game' : 'Need 2+ Players'}
        </button>
      </div>
    `
  },

  async startGame() {
    const startBtn = this.container?.querySelector('.start-game-btn')
    if (startBtn) startBtn.disabled = true

    try {
      const intensity = parseFloat(this.container?.querySelector('.intensity-select')?.value || '0.5')
      const totalRounds = parseInt(this.container?.querySelector('.rounds-select')?.value || '5')

      const response = await fetch('/functions/v1/game-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lobby_key: this.lobbyKey,
          admin_player_id: this.currentPlayer,
          total_rounds: totalRounds,
          intensity: intensity
        })
      })

      if (!response.ok) throw new Error('Failed to start game')
      
      const data = await response.json()
      console.log('[LobbyWaitingRoom] Game started:', data)
    } catch (error) {
      console.error('[LobbyWaitingRoom] Start failed:', error)
      alert('Failed to start game: ' + error.message)
      if (startBtn) startBtn.disabled = false
    }
  },

  destroy() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }
}
```

### State Management

The frontend uses a simple centralized state object attached to the window for global access. This approach provides a single source of truth while maintaining modularity through component-specific state properties. The state object includes lobby information, player data, current game round, and UI state. Changes to state trigger selective DOM updates rather than full re-renders, ensuring performance with minimal overhead.

```javascript
// Centralized state management
window.GameState = {
  // Lobby state
  lobbyKey: null,
  lobbyData: null,
  
  // Player state
  currentPlayerId: null,
  isAdmin: false,
  players: [],
  
  // Game state
  currentRound: null,
  gameStatus: 'waiting', // waiting, voting, revealed, complete
  rounds: [],
  myVote: null,
  
  // UI state
  view: 'selector', // selector, waiting, game, results
  notifications: [],
  
  // Methods
  setLobby(key, data) {
    this.lobbyKey = key
    this.lobbyData = data
    this.saveState()
  },

  addPlayer(player) {
    this.players.push(player)
    this.saveState()
  },

  removePlayer(playerId) {
    this.players = this.players.filter(p => p.id !== playerId)
    this.saveState()
  },

  setMyVote(vote) {
    this.myVote = vote
    this.saveState()
  },

  updateRound(round) {
    this.currentRound = round
    this.gameStatus = round.status
    this.saveState()
  },

  setView(view) {
    this.view = view
    this.saveState()
  },

  saveState() {
    // Persist to localStorage
    localStorage.setItem('game_state', JSON.stringify({
      lobbyKey: this.lobbyKey,
      currentPlayerId: this.currentPlayerId,
      isAdmin: this.isAdmin
    }))
  },

  loadState() {
    const saved = localStorage.getItem('game_state')
    if (saved) {
      const data = JSON.parse(saved)
      this.lobbyKey = data.lobbyKey
      this.currentPlayerId = data.currentPlayerId
      this.isAdmin = data.isAdmin
    }
  },

  clearState() {
    this.lobbyKey = null
    this.lobbyData = null
    this.currentPlayerId = null
    this.isAdmin = false
    this.players = []
    this.currentRound = null
    this.gameStatus = 'waiting'
    this.rounds = []
    this.myVote = null
    localStorage.removeItem('game_state')
  }
}
```

## Real-time Sync Strategy

The real-time synchronization uses Supabase Realtime channels with broadcast messaging for lobby state updates. Each lobby has a dedicated channel (`lobby:{lobby_key}`) that all connected clients subscribe to. The channel carries player events (join, leave, ready), game events (start, new round, vote update, reveal), and system notifications. This pub/sub model ensures all players see the same game state with minimal latency.

### Subscription Channels and Events

The subscription architecture uses a single channel per lobby with multiple event types. Client connections are established on lobby entry and maintained throughout the game session. The channel automatically reconnects on network interruptions and resynchronizes state using the HTTP API as the source of truth. This hybrid approach combines the responsiveness of realtime with the reliability of request/response.

```typescript
// Server-side event broadcast (in Edge Functions)
await supabase.channel(`lobby:${lobbyKey}`)
  .send({
    type: 'broadcast',
    event: 'vote_update',
    payload: {
      round_id: roundId,
      mom_votes: newMomCount,
      dad_votes: newDadCount,
      mom_percentage: newMomPercent,
      dad_percentage: newDadPercent,
      voted_players: votedPlayerNames
    }
  })

// Client-side handling
function handleVoteUpdate(payload) {
  // Update vote bar UI
  updateVoteBar(payload.mom_percentage, payload.dad_percentage)
  
  // Update player status indicators
  payload.voted_players.forEach(name => markPlayerVoted(name))
  
  // Play subtle feedback sound
  if (window.AudioManager) {
    window.AudioManager.play('vote_cast')
  }
}
```

### Optimistic Updates

The frontend implements optimistic updates for user actions to provide immediate feedback. When a player votes or marks ready, the UI updates instantly while the server request processes in the background. If the server request fails, the UI rolls back to the previous state with an error notification. This approach creates a responsive user experience even under network latency conditions while maintaining data consistency through server validation.

```javascript
// Optimistic vote submission
async function submitVote(vote) {
  // Optimistic update
  window.GameState.setMyVote(vote)
  updateVoteUI(vote)
  
  try {
    const response = await fetch('/functions/v1/game-vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lobby_key: window.GameState.lobbyKey,
        player_id: window.GameState.currentPlayerId,
        round_id: window.GameState.currentRound?.id,
        vote: vote
      })
    })

    if (!response.ok) {
      throw new Error('Vote failed')
    }
  } catch (error) {
    // Rollback on failure
    window.GameState.setMyVote(null)
    rollbackVoteUI()
    showNotification('Vote failed. Please try again.', 'error')
  }
}
```

## AI Integration

AI players fill empty slots when fewer than 6 humans join a lobby, ensuring the game always has enough participants for engaging gameplay. The AI system generates player names, voting behaviors, and personality traits that create varied and interesting game experiences. AI players never hog the spotlight but participate authentically in the voting process, making the game feel alive even with minimal human players.

### AI Player Management

AI players are added automatically by the game-start function when the lobby has fewer than 6 total players. The system maintains a count of current AI players and adds more as needed to reach the maximum. AI players have unique names, consistent personalities, and voting patterns that make them feel like real participants. The AI system respects the game's intensity setting, generating more or less controversial votes based on configuration.

```javascript
// AI Player behavior
const AIPersonalities = [
  { name: 'ardy', votingBias: 0.5, volatility: 0.3, description: 'Balanced observer' },
  { name: 'Bella', votingBias: 0.6, volatility: 0.2, description: 'Mom supporter' },
  { name: 'Charlie', votingBias: 0.4, volatility: 0.4, description: 'Dad supporter' },
  { name: 'Diana', votingBias: 0.5, volatility: 0.5, description: 'Wild card' },
  { name: 'Ethan', votingBias: 0.55, volatility: 0.25, description: 'Slightly biased' },
  { name: 'Fiona', votingBias: 0.45, volatility: 0.35, description: 'Contrarian' }
]

function generateAIVote(scenario, personality, allVotes) {
  // Base vote decision on scenario content
  let voteProbability = personality.votingBias
  
  // Add some randomness based on volatility
  voteProbability += (Math.random() - 0.5) * personality.volatility
  
  // Consider current vote distribution (herding behavior)
  const momVotes = allVotes.filter(v => v === 'mom').length
  const dadVotes = allVotes.filter(v => v === 'dad').length
  const totalVotes = allVotes.length
  
  if (totalVotes > 0) {
    const crowdMomPercent = momVotes / totalVotes
    // Slight tendency to follow crowd, but not always
    voteProbability += (crowdMomPercent - 0.5) * 0.2
  }
  
  return voteProbability > 0.5 ? 'mom' : 'dad'
}
```

### AI Behavior During Game

AI players submit votes automatically when the round begins, with slight delays to simulate human thinking time. The voting delay is randomized between 2-5 seconds to create natural pacing. AI votes are influenced by scenario content, their assigned personality, and the current voting pattern of human players. This creates emergent behavior where AI players may align with the crowd or break away based on their programmed tendencies.

AI players also participate in the voting completion check. When all AI votes are in, the system checks if human players have also voted. If not, the system waits for human input before triggering automatic round progression. This ensures that human players always have time to vote, even when AI votes arrive quickly. The waiting period is configurable by the admin, with a default of 30 seconds per round.

### AI Commentary Generation

When the game reaches the reveal phase, AI systems generate entertaining commentary about the voting results. The Moonshot Kimi-K2 model creates personalized roasts based on the perception gap between crowd perception and actual answers. The commentary is designed to be playful and appropriate for a family gathering, highlighting funny moments and surprising twists without being mean-spirited.

```typescript
// Roast generation prompt
const roastPrompt = `You are a sassy but loving barnyard host at a baby shower game.
The crowd predicted ${crowdChoice} would win (${crowdPercent}% voted this way),
but the actual answer was ${actualChoice}!

Perception gap: ${perceptionGap}%

Generate a short, playful roast (2-3 sentences) teasing the crowd for being wrong.
Keep it lighthearted and family-friendly. Reference the scenario if helpful.

Examples of good roasts:
- "Well folks, looks like the crystal ball was cloudy today! Even grandma's intuition failed!"
- "The crowd thought they knew best, but plot twist: nobody knows anything about babies!"
- "Your parenting intuition score: needs work! Better luck next round, folks!"

Generate your roast:`
```

## Migration Plan

The migration from the complex session-based architecture to the simplified lobby system requires careful coordination of database changes, Edge Function updates, and frontend modifications. The plan is executed in phases to minimize disruption and enable rollback if issues arise. Each phase includes database migrations, code deployments, and verification steps.

### Phase 1: Database Schema Creation

**File Changes:**
- Create `supabase/migrations/20260104_simplified_lobby_schema.sql`
- Update `docs/reference/SCHEMA.md` with new table definitions
- Update `docs/technical/ARCHITECTURE.md` with lobby architecture documentation

**Steps:**
1. Apply migration to create new tables (lobbies, players, game_sessions)
2. Insert 4 pre-configured lobby records
3. Verify tables with SELECT queries
4. Test RLS policies with different user contexts

```sql
-- Pre-create the 4 lobbies
INSERT INTO baby_shower.mom_dad_lobbies (lobby_key, lobby_name, status, max_players) VALUES
('LOBBY-A', 'Sunny Meadows', 'waiting', 6),
('LOBBY-B', 'Cozy Barn', 'waiting', 6),
('LOBBY-C', '星光谷', 'waiting', 6),
('LOBBY-D', '月光屋', 'waiting', 6);
```

### Phase 2: Edge Function Updates

**File Changes:**
- Create `supabase/functions/lobby-create/index.ts`
- Create `supabase/functions/lobby-join/index.ts`
- Create `supabase/functions/lobby-status/index.ts` (wrapper)
- Update `supabase/functions/game-start/index.ts`
- Create `supabase/functions/game-vote/index.ts`
- Create `supabase/functions/game-reveal/index.ts`
- Update `supabase/functions/_shared/security.ts` with new validation functions

**Steps:**
1. Deploy lobby-create function
2. Deploy lobby-join function
3. Deploy game-start function (updated)
4. Deploy game-vote function
5. Deploy game-reveal function
6. Test each function with curl commands
7. Verify realtime subscriptions work

### Phase 3: Frontend Implementation

**File Changes:**
- Create `scripts/mom-vs-dad-lobby.js`
- Create `scripts/mom-vs-dad-game.js` (updated from existing)
- Update `index.html` to include new scripts
- Update `styles/main.css` with lobby-specific styles
- Create `styles/lobby.css` for lobby components

**Steps:**
1. Implement LobbySelector component
2. Implement LobbyWaitingRoom component
3. Integrate with existing game logic
4. Test all navigation flows
5. Verify realtime updates work

### Phase 4: Cleanup and Deprecation

**File Changes:**
- Archive old `scripts/mom-vs-dad.js` to `scripts/mom-vs-dad-legacy.js`
- Remove deprecated Edge Functions (game-session, game-scenario, game-vote - old versions)
- Update documentation to reflect new architecture

**Steps:**
1. Archive old code files
2. Update AGENTS.md with new patterns
3. Test complete game flow from lobby selection to results
4. Run full E2E test suite
5. Deploy to production

## Estimated Effort

The implementation effort is estimated based on similar complexity features and includes coding, testing, and documentation. The estimates assume the developer is familiar with the existing codebase patterns and Supabase/Edge Function development.

### Backend Implementation: 12-16 hours

The backend implementation includes creating 5 new Edge Functions (lobby-create, lobby-join, game-start, game-vote, game-reveal) with comprehensive validation, error handling, and realtime integration. The database schema design and migration creation requires 2-3 hours. Each Edge Function requires approximately 2-3 hours for implementation and testing. The AI integration for scenario generation and roast commentary adds 2-3 hours for prompt engineering and API integration. Real-time subscription implementation and testing requires 2-3 hours. Contingency for debugging and refinements adds 3-4 hours.

### Frontend Implementation: 10-14 hours

The frontend implementation includes creating the lobby selector with 4 lobby cards (2-3 hours), implementing the waiting room with player list and admin controls (3-4 hours), integrating with existing game logic for scenario display and voting (3-4 hours), implementing realtime updates and optimistic UI (2-3 hours), and adding CSS styling for all components (2-3 hours). Browser testing and mobile responsiveness validation requires 2-3 hours.

### Testing and Quality Assurance: 8-10 hours

Testing includes unit tests for Edge Function logic (2-3 hours), integration tests for API endpoints (2-3 hours), E2E tests for complete game flows (2-3 hours), realtime subscription testing (1-2 hours), and performance testing with multiple concurrent lobbies (1 hour). Test data generation and fixture setup requires 1-2 hours.

### Documentation: 3-4 hours

Documentation updates include updating AGENTS.md with new patterns (1 hour), updating technical documentation (1 hour), creating API documentation for new endpoints (1 hour), and updating README and user guides (1 hour).

**Total Estimated Effort: 33-44 hours**

The implementation can be parallelized by having one developer work on backend while another works on frontend. Database and migration work should be completed first to enable parallel development. Testing can begin once both backend and frontend implementations reach stable milestones. Documentation should be updated throughout the process rather than at the end.