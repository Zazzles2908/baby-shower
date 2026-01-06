#!/bin/bash
# Setup demo game sessions for Mom vs Dad game

echo "Setting up demo game sessions..."

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI not found. Please install it first:"
    echo "  npm install -g supabase"
    exit 1
fi

# Get Supabase access token from environment or .env.local
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "SUPABASE_ACCESS_TOKEN not set. Attempting to read from .env.local..."
    export SUPABASE_ACCESS_TOKEN=$(grep SUPABASE_ACCESS_TOKEN .env.local | cut -d'"' -f2)
fi

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "Error: SUPABASE_ACCESS_TOKEN is required"
    echo "Please set it in .env.local or as an environment variable"
    exit 1
fi

# Set project reference if not already set
if [ -z "$SUPABASE_PROJECT_REF" ]; then
    # Try to get from supabase link or config
    export SUPABASE_PROJECT_REF=$(grep project_id supabase/supabase/config.toml | cut -d'=' -f2 | tr -d ' ')
fi

echo "Using Supabase project: $SUPABASE_PROJECT_REF"

# Create demo game sessions using SQL
echo "Creating demo game sessions..."

# SQL to insert demo sessions
SQL="
INSERT INTO baby_shower.game_sessions (session_code, admin_code, mom_name, dad_name, status, current_round, total_rounds)
VALUES 
    ('LOBBY-A', '1111', 'Sunny', 'Barnaby', 'setup', 0, 5),
    ('LOBBY-B', '2222', 'Rosie', 'Ricky', 'setup', 0, 5),
    ('LOBBY-C', '3333', 'Clucky', 'Chuck', 'setup', 0, 5),
    ('LOBBY-D', '4444', 'Ducky', 'Donald', 'setup', 0, 5)
ON CONFLICT (session_code) DO NOTHING;
"

# Execute the SQL
echo "$SQL" | supabase db execute --project-ref "$SUPABASE_PROJECT_REF" 2>/dev/null || \
echo "$SQL" | supabase functions db execute --project-ref "$SUPABASE_PROJECT_REF" 2>/dev/null || \
echo "Failed to execute SQL directly. Please run the SQL manually in Supabase SQL Editor:"

echo ""
echo "=== SQL to run in Supabase SQL Editor ==="
echo "$SQL"
echo "=========================================="

echo ""
echo "Demo session setup complete!"
echo "You can now test the Mom vs Dad game with lobbies: LOBBY-A, LOBBY-B, LOBBY-C, LOBBY-D"
echo "Admin codes: 1111, 2222, 3333, 4444 respectively"
