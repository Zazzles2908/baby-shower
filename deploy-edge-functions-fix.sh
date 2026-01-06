#!/bin/bash
# ============================================================================
# Edge Functions Deployment Script - Fixed Security Implementation
# 
# Purpose: Deploy the refactored game-session and game-scenario functions
#          with consistent security utilities pattern
# 
# Prerequisites:
# 1. Docker Desktop must be running (for local Supabase)
# 2. .env.local must contain SUPABASE_ACCESS_TOKEN
# 3. Run from project root directory
# 
# Usage:
#   chmod +x deploy-edge-functions-fix.sh
#   ./deploy-edge-functions-fix.sh
#   (or source deploy-edge-functions-fix.sh to keep env vars in current shell)
# 
# What this script does:
# 1. Sets SUPABASE_ACCESS_TOKEN from .env.local
# 2. Deploys game-session Edge Function
# 3. Deploys game-scenario Edge Function  
# 4. Verifies deployment success
# 5. Shows function status
# ============================================================================

set -e  # Exit on error

echo "========================================================================"
echo "Edge Functions Deployment - Security Fix"
echo "========================================================================"
echo ""

# Set working directory to script location
cd "$(dirname "$0")"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ ERROR: .env.local file not found!"
    echo "Please ensure .env.local exists in the project root with SUPABASE_ACCESS_TOKEN"
    exit 1
fi

# Extract SUPABASE_ACCESS_TOKEN from .env.local
echo "📖 Reading SUPABASE_ACCESS_TOKEN from .env.local..."

# Read token and remove quotes
SUPABASE_ACCESS_TOKEN=$(grep "SUPABASE_ACCESS_TOKEN=" .env.local | cut -d'"' -f2 | cut -d'=' -f2-)

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "❌ ERROR: SUPABASE_ACCESS_TOKEN not found in .env.local"
    echo "Please add SUPABASE_ACCESS_TOKEN=\"your_token_here\" to .env.local"
    exit 1
fi

# Clean any whitespace
SUPABASE_ACCESS_TOKEN=$(echo "$SUPABASE_ACCESS_TOKEN" | xargs)

echo "✅ SUPABASE_ACCESS_TOKEN found and cleaned"

# Export for current session
export SUPABASE_ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN"

# Also extract project ref
PROJECT_REF=$(grep "SUPABASE_PROJECT_REF=" .env.local | cut -d'"' -f2 | cut -d'=' -f2- | xargs)

if [ -z "$PROJECT_REF" ]; then
    echo "⚠️  WARNING: SUPABASE_PROJECT_REF not found in .env.local"
    echo "   You may need to specify --project-ref manually for some commands"
fi

echo ""
echo "🚀 Starting deployment..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ ERROR: Supabase CLI not found!"
    echo "Please install Supabase CLI: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "✅ Supabase CLI found: $(supabase version)"

# Function to deploy a function and check result
deploy_function() {
    local func_name=$1
    echo ""
    echo "📦 Step: Deploying $func_name Edge Function..."
    echo "---------------------------------------------------------------------------"
    
    if [ -n "$PROJECT_REF" ]; then
        supabase functions deploy "$func_name" --project-ref "$PROJECT_REF"
    else
        supabase functions deploy "$func_name"
    fi
    
    if [ $? -ne 0 ]; then
        echo "❌ ERROR: Failed to deploy $func_name function"
        echo "Check the error messages above and try again"
        return 1
    fi
    
    echo "✅ $func_name function deployed successfully"
    return 0
}

# Deploy game-session function
deploy_function "game-session" || exit 1

# Deploy game-scenario function
deploy_function "game-scenario" || exit 1

# Verify deployment
echo ""
echo "🔍 Step: Verifying deployment..."
echo "---------------------------------------------------------------------------"
supabase functions list

echo ""
echo "📋 Step: Checking recent logs..."
echo "---------------------------------------------------------------------------"

if [ -n "$PROJECT_REF" ]; then
    echo "game-session logs:"
    supabase functions logs "game-session" --project-ref "$PROJECT_REF" --tail 5 2>&1 || echo "   (no logs available or function not yet invoked)"
    
    echo ""
    echo "game-scenario logs:"
    supabase functions logs "game-scenario" --project-ref "$PROJECT_REF" --tail 5 2>&1 || echo "   (no logs available or function not yet invoked)"
else
    echo "⚠️  Cannot show logs - SUPABASE_PROJECT_REF not available"
fi

echo ""
echo "========================================================================"
echo "✅ Deployment Complete!"
echo "========================================================================"
echo ""
echo "Summary:"
echo "  - game-session:  DEPLOYED (using security utilities pattern)"
echo "  - game-scenario: DEPLOYED (using security utilities pattern)"
echo ""
echo "What's Fixed:"
echo "  ✅ Uses ../_shared/security.ts utilities"
echo "  ✅ Supabase client instead of direct PostgreSQL"
echo "  ✅ Proper CORS_HEADERS + SECURITY_HEADERS"
echo "  ✅ validateEnvironmentVariables() for env validation"
echo "  ✅ validateInput() for request validation"
echo "  ✅ createErrorResponse() / createSuccessResponse()"
echo ""
echo "Next Steps:"
echo "  1. Test session creation: POST /game-session with action=create"
echo "  2. Test session joining: POST /game-session with action=join"
echo "  3. Test admin login: POST /game-session with action=admin_login"
echo "  4. Test scenario generation: POST /game-scenario"
echo ""
echo "See docs/technical/EDGE_FUNCTIONS_FIX.md for complete testing checklist"
echo "========================================================================"
