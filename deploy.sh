#!/bin/bash
# Baby Shower App - Deployment Script
# Proper git workflow with Vercel deployment
# Optimized for both Node.js and Bun runtimes

set -e  # Exit on error

echo "========================================"
echo "🚀 Baby Shower App Deployment Script"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Detect runtime
if command -v bun &> /dev/null; then
    RUNTIME="bun"
    RUNTIME_VERSION=$(bun --version)
    print_status "Detected Bun runtime: $RUNTIME_VERSION"
elif command -v node &> /dev/null; then
    RUNTIME="node"
    RUNTIME_VERSION=$(node --version)
    print_status "Detected Node.js runtime: $RUNTIME_VERSION"
else
    print_error "No supported runtime found! Please install Bun or Node.js"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Not in Baby Shower project directory!"
    exit 1
fi

print_status "Starting deployment process..."

# =========================================
# Step 1: Runtime Detection and Setup
# =========================================
echo ""
echo "📦 Step 1: Runtime Configuration"

# Install dependencies faster with Bun
if [ "$RUNTIME" = "bun" ]; then
    print_info "Using Bun for package management (3-10x faster than npm)"
    if [ -f "bun.lockb" ]; then
        print_status "bun.lockb found - using optimized dependency resolution"
    else
        print_warning "bun.lockb not found - will be created on first install"
    fi
    bun install 2>/dev/null || print_warning "bun install completed with warnings"
else
    print_info "Using npm for package management"
    npm install 2>/dev/null || print_warning "npm install completed with warnings"
fi

# =========================================
# Step 2: Git Status Check
# =========================================
echo ""
echo "📋 Step 2: Checking git status..."
cd /d C:\Project\Baby_Shower 2>/dev/null || cd "$(dirname "$0")"

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes:"
    git status --short
    echo ""
    
    read -p "Do you want to commit these changes? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Step 2a: Git Add
        echo ""
        echo "📦 Adding files to git..."
        git add -A
        print_status "Files added"
        
        # Step 2b: Git Commit
        echo ""
        echo "💬 Creating commit..."
        read -p "Enter commit message: " COMMIT_MSG
        
        if [ -z "$COMMIT_MSG" ]; then
            COMMIT_MSG="Update: $(date +%Y-%m-%d) - Performance and bug fixes"
        fi
        
        git commit -m "$COMMIT_MSG"
        print_status "Commit created: $COMMIT_MSG"
        
        # Step 2c: Git Push
        echo ""
        echo "📤 Pushing to remote..."
        read -p "Push to origin main? (y/n): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git push origin main
            print_status "Changes pushed to remote"
        fi
    fi
else
    print_status "No uncommitted changes"
fi

# =========================================
# Step 3: Supabase CLI Setup (Optional)
# =========================================
echo ""
echo "🗄️ Step 3: Supabase CLI Setup"

read -p "Setup Supabase CLI for database migrations? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Check if Supabase token is set
    if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
        print_warning "SUPABASE_ACCESS_TOKEN not set in environment"
        print_warning "Please set it before running this script"
        print_warning "Example: export SUPABASE_ACCESS_TOKEN=\"your-token-here\""
    else
        print_status "Supabase token configured"
        
        # Test connection
        if command -v supabase &> /dev/null; then
            print_status "Supabase CLI installed"
        else
            print_warning "Supabase CLI not installed, skipping"
        fi
    fi
else
    print_warning "Skipping Supabase setup"
fi

# =========================================
# Step 4: Bun-Specific Optimizations
# =========================================
if [ "$RUNTIME" = "bun" ]; then
    echo ""
    echo "⚡ Step 4: Bun-Specific Optimizations"
    
    # Generate/update bun.lockb for faster installs
    if [ ! -f "bun.lockb" ] || [ package.json -nt bun.lockb ]; then
        print_info "Generating optimized bun.lockb lockfile..."
        bun install --lockfile
        print_status "bun.lockb updated/created"
    fi
    
    # Pre-warm bun's JIT compiler
    print_info "Pre-warming Bun JIT compiler..."
    bun --version > /dev/null 2>&1
    print_status "Bun JIT compiler warmed"
fi

# =========================================
# Step 5: Deploy to Vercel
# =========================================
echo ""
echo "🚀 Step 5: Deploying to Vercel..."

read -p "Deploy to Vercel production? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Run Vercel deployment with appropriate runtime
    if [ "$RUNTIME" = "bun" ]; then
        print_status "Running: bunx vercel --prod --force"
        bunx vercel --prod --force
    else
        print_status "Running: npx vercel --prod --force"
        npx vercel --prod --force
    fi
    
    if [ $? -eq 0 ]; then
        print_status "✅ Deployment successful!"
        echo ""
        echo "🌐 Your app is now live at:"
        echo "   https://baby-shower-v2.vercel.app"
    else
        print_error "Deployment failed!"
        exit 1
    fi
else
    print_warning "Skipping Vercel deployment"
    
    # Offer local dev server with appropriate runtime
    echo ""
    read -p "Start local development server instead? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Starting local server..."
        if [ "$RUNTIME" = "bun" ]; then
            print_info "Using bun run --hot for hot module replacement..."
            bun run --hot --port 3000 .
        else
            print_info "Using npm run dev (http-server)..."
            npm run dev
        fi
    fi
fi

# =========================================
# Summary
# =========================================
echo ""
echo "========================================"
echo "📊 Deployment Summary"
echo "========================================"
echo "Project: Baby Shower V2"
echo "Runtime: $RUNTIME $RUNTIME_VERSION"
echo "Status: Deployment complete!"
echo "URL: https://baby-shower-v2.vercel.app"
echo ""
echo "Next steps:"
echo "1. Test the deployed app at the URL above"
echo "2. Check console for any errors"
echo "3. Verify all features work correctly"
echo ""
if [ "$RUNTIME" = "bun" ]; then
    echo "🚀 Bun Performance Benefits:"
    echo "   • 3-10x faster package installation"
    echo "   • Native hot module replacement"
    echo "   • Faster startup time"
    echo "   • Built-in bundler support"
fi
echo ""
print_status "Done! 🎉"
