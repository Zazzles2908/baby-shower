#!/bin/bash

# Configure Supabase Edge Functions Environment Variables
# This script uses Supabase CLI to set environment variables

set -e

PROJECT_REF="bkszmvfsfgvdwzacgmfz"
ENV_FILE="supabase/functions/.env"

echo "🔧 Configuring Supabase Edge Functions environment variables..."
echo "📦 Project: $PROJECT_REF"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install with: npm install -g supabase"
    echo "   Then run: supabase login"
    exit 1
fi

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Run: supabase login"
    exit 1
fi

# Verify project is linked
echo "🔗 Verifying project link..."
cd supabase
if ! supabase link --project-ref "$PROJECT_REF" 2>/dev/null; then
    echo "⚠️  Project not linked. Attempting to link..."
    supabase link --project-ref "$PROJECT_REF"
fi
cd ..

echo ""
echo "📋 Setting environment variables from $ENV_FILE..."

# Read and set each variable from .env file
while IFS='=' read -r key value || [[ -n "$key" ]]; do
    # Skip comments and empty lines
    [[ "$key" =~ ^# ]] && continue
    [[ -z "$key" ]] && continue
    
    # Trim whitespace
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)
    
    # Skip if key is empty after trimming
    [[ -z "$key" ]] && continue
    
    # Don't output sensitive values
    if [[ "$key" == *"KEY"* ]] || [[ "$key" == *"TOKEN"* ]]; then
        echo "  ✓ Setting $key: [REDACTED]"
    else
        echo "  ✓ Setting $key: $value"
    fi
    
    supabase env set "$key" "$value" --project-ref "$PROJECT_REF" 2>/dev/null || true
    
done < "$ENV_FILE"

echo ""
echo "✅ Environment variables configuration complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Redeploy Edge Functions: supabase functions deploy --project-ref $PROJECT_REF"
echo "   2. Or update individual function: supabase functions deploy advice --project-ref $PROJECT_REF"
echo "   3. Test the AI Roasts feature at category='ai_roast'"
