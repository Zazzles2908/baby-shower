#!/bin/bash
# Supabase CLI Environment Setup
# Run: source supabase-env-setup.sh
# This script reads the token from .env.local

# Extract token from .env.local
TOKEN=$(grep SUPABASE_ACCESS_TOKEN .env.local | cut -d'"' -f2)

if [ -n "$TOKEN" ]; then
    export SUPABASE_ACCESS_TOKEN="$TOKEN"
    echo "✅ Supabase token set from .env.local for this session"
else
    echo "❌ Could not find SUPABASE_ACCESS_TOKEN in .env.local"
    echo "Please manually set the token in .env.local"
fi
