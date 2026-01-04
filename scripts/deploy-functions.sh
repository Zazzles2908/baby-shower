#!/bin/bash
# Supabase CLI Deployment Script
# Run this to deploy all Edge Functions properly

echo "🚀 Supabase CLI Deployment"
echo "=========================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "📦 Installing Supabase CLI..."
    npm install -g supabase
fi

echo "🔗 To link your project, you need to:"
echo ""
echo "1. Get your project reference:"
echo "   - Go to: https://supabase.com/dashboard/project/bkszmvfsfgvdwzacgmfz"
echo "   - Copy the project ID from the URL"
echo ""
echo "2. Run this command:"
echo "   cd supabase"
echo "   supabase login"
echo "   supabase link --project-ref bkszmvfsfgvdwzacgmfz"
echo ""
echo "3. Then deploy all functions:"
echo "   supabase functions deploy guestbook"
echo "   supabase functions deploy vote"
echo "   supabase functions deploy pool"
echo "   supabase functions deploy quiz"
echo "   supabase functions deploy advice"
echo ""
echo "Or deploy all at once:"
echo "   supabase functions deploy --project-ref bkszmvfsfgvdwzacgmfz"
echo ""

# Try to deploy directly if project ref is available
echo "🔧 Attempting direct deployment..."

cd supabase

# Deploy each function
for func in guestbook vote pool quiz advice; do
    echo "📦 Deploying $func function..."
    npx supabase functions deploy $func --project-ref bkszmvfsfgvdwzacgmfz
    
    if [ $? -eq 0 ]; then
        echo "✅ $func deployed successfully"
    else
        echo "❌ $func deployment failed"
    fi
done

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "🧪 Test the functions:"
echo 'curl -X POST "https://bkszmvfsfgvdwzacgmfz.functions.supabase.co/vote" \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"selected_names": ["Test"]}'"'"'
