#!/bin/bash

# Game Session Function Deployment Script
# Deploys the updated game-session function to Supabase

set -e

PROJECT_REF="bkszmvfsfgvdwzacgmfz"
FUNCTION_NAME="game-session"
SOURCE_FILE="supabase/functions/game-session/index.ts"
CONFIG_FILE="supabase/functions/game-session/config.toml"

echo "🚀 Deploying game-session function to Supabase..."
echo "📦 Project: $PROJECT_REF"
echo ""

# Check if required files exist
if [ ! -f "$SOURCE_FILE" ]; then
    echo "❌ Error: Source file not found: $SOURCE_FILE"
    exit 1
fi

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Error: Config file not found: $CONFIG_FILE"
    exit 1
fi

# Read the source file content
echo "📄 Reading source file..."
SOURCE_CONTENT=$(cat "$SOURCE_FILE")

# Create deployment payload
DEPLOY_PAYLOAD=$(cat <<EOF
{
  "name": "$FUNCTION_NAME",
  "entrypoint_path": "index.ts",
  "source": "$SOURCE_CONTENT",
  "verify_jwt": false,
  "import_map_path": ""
}
EOF
)

echo "🔧 Deploying function..."

# Deploy using Supabase API (requires authentication)
curl -X POST "https://api.supabase.com/v1/projects/$PROJECT_REF/functions" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$DEPLOY_PAYLOAD"

echo ""
echo "✅ Deployment initiated!"

# Alternative: If you have Supabase CLI configured, use:
echo ""
echo "📋 Alternative deployment methods:"
echo "1. Supabase CLI (if authenticated):"
echo "   supabase functions deploy $FUNCTION_NAME --project-ref $PROJECT_REF"
echo ""
echo "2. Manual deployment via Dashboard:"
echo "   Go to: https://supabase.com/dashboard/project/$PROJECT_REF/functions"
echo "   Replace the function code with contents of: $SOURCE_FILE"

echo ""
echo "🎉 Deployment script completed!"