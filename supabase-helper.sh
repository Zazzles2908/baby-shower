#!/bin/bash
# Supabase Helper for Baby_Shower Project
# Usage: source this script before running supabase commands in the Baby_Shower project

# Project-specific configuration
PROJECT_NAME="Baby_Shower"
PROJECT_DIR="C:/Project/Baby_Shower"
SUPABASE_URL="https://bkszmvfsfgvdwzacgmfz.supabase.co"
PROJECT_REF="bkszmvfsfgvdwzacgmfz"
ACCESS_TOKEN="sbp_fdca3aaba5d2ca76cc938e4b7c44c4599ac97812"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "============================================"
echo "Supabase Helper: ${PROJECT_NAME}"
echo "============================================"
echo ""

# Set the correct token for this project
export SUPABASE_ACCESS_TOKEN="${ACCESS_TOKEN}"
echo -e "${GREEN}✓${NC} Set SUPABASE_ACCESS_TOKEN for ${PROJECT_NAME}"
echo "  Token: ${ACCESS_TOKEN:0:15}...${ACCESS_TOKEN: -5}"
echo ""

# Change to project directory
cd "${PROJECT_DIR}"
echo -e "${GREEN}✓${NC} Working directory: ${PROJECT_DIR}"
echo ""

# Verify token works
echo "Verifying Supabase access..."
if supabase projects list 2>&1 | grep -q "${PROJECT_REF}"; then
    echo -e "${GREEN}✓${NC} Token is valid and project '${PROJECT_NAME}' is accessible"
    echo ""
    echo "Available commands:"
    echo "  supabase link --project-ref ${PROJECT_REF}   # Link to remote project"
    echo "  supabase db push                             # Push migrations to remote"
    echo "  supabase db diff                             # Show local changes"
    echo "  supabase migration new <name>                # Create new migration"
    echo "  supabase functions list                      # List edge functions"
    echo "  supabase functions deploy <name>             # Deploy edge function"
    echo ""
    echo "For local development:"
    echo "  supabase start                               # Start local Supabase"
    echo "  supabase stop                                # Stop local Supabase"
    echo "  supabase status                              # Check status"
    echo "  supabase logs                                # View logs"
else
    echo -e "${RED}✗${NC} Token validation failed"
    echo "  Please check the access token in .env.local"
fi
