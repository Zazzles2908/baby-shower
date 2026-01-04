#!/bin/bash
# One-command deployment script
# Run: bash scripts/deploy-all-functions.sh

echo "🚀 Supabase Edge Function Deployment"
echo "======================================"
echo ""

# Check for Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "📦 Installing Supabase CLI..."
    npm install -g supabase
fi

echo "🔗 To deploy, you need to be logged in."
echo ""
echo "RUN THESE COMMANDS:"
echo ""
echo "1. Login:"
echo "   cd supabase"
echo "   npx supabase login"
echo ""
echo "2. Link project:"
echo "   npx supabase link --project-ref bkszmvfsfgvdwzacgmfz"
echo ""
echo "3. Deploy functions:"
echo "   npx supabase functions deploy guestbook --project-ref bkszmvfsfgvdwzacgmfz"
echo "   npx supabase functions deploy vote --project-ref bkszmvfsfgvdwzacgmfz"
echo "   npx supabase functions deploy pool --project-ref bkszmvfsfgvdwzacgmfz"
echo "   npx supabase functions deploy quiz --project-ref bkszmvfsfgvdwzacgmfz"
echo "   npx supabase functions deploy advice --project-ref bkszmvfsfgvdwzacgmfz"
echo ""
echo "OR deploy all at once:"
echo "   npx supabase functions deploy --project-ref bkszmvfsfgvdwzacgmfz"
echo ""
echo "✅ OR USE DASHBOARD:"
echo "   1. Go to: https://supabase.com/dashboard/project/bkszmvfsfgvdwzacgmfz"
echo "   2. Click Edge Functions"
echo "   3. Click Deploy on each function"
echo ""
