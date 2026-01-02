# Baby Shower App - Deployment Guide

## Overview

This document describes the automated deployment workflow for the Baby Shower App, including Git operations, Vercel integration, and production deployment procedures.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Automated Deployment Workflow](#automated-deployment-workflow)
4. [Manual Deployment](#manual-deployment)
5. [GitHub MCP Commands](#github-mcp-commands)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js >= 18.0.0
- Git configured with remote repository
- Vercel CLI (`npm i -g vercel`) or web dashboard access
- GitHub personal access token (for MCP operations)

## Environment Setup

### 1. Configure Git Remote

```bash
git remote add origin https://github.com/your-org/baby-shower.git
git branch -M main
git push -u origin main
```

### 2. Set Up GitHub Token

Create a personal access token at GitHub Settings → Developer settings → Personal access tokens with:
- `repo` scope for full repository control
- `workflow` scope for GitHub Actions

Export the token:
```bash
export GITHUB_PERSONAL_ACCESS_TOKEN=your_token_here
```

### 3. Configure Environment Variables

Create `.env.local` (never commit this file):
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Sheets (Backend Integration)
GOOGLE_SHEETS_API_KEY=your_api_key
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id

# Application Settings
PUBLIC_APP_URL=https://baby-shower.vercel.app
```

## Automated Deployment Workflow

### Using NPM Scripts

The project includes npm scripts for common deployment operations:

```bash
# Check current git status
npm run status

# Stage all changes
npm run add

# Commit with automated conventional message
npm run commit

# Push to trigger Vercel deployment
npm run push

# Full deploy (commit + push)
npm run deploy
```

### Manual Git Commands

```bash
# Stage changes
git add .

# Commit with message
git commit -m "feat(scripts): add voting functionality"

# Push to trigger deployment
git push origin main
```

### Conventional Commit Format

The automated commit script uses [Conventional Commits](https://www.conventionalcommits.org/):

- `feat(scope): description` - New features
- `fix(scope): description` - Bug fixes
- `docs(scope): description` - Documentation changes
- `test(scope): description` - Test additions/modifications
- `refactor(scope): description` - Code refactoring
- `chore(scope): description` - Maintenance tasks

## Manual Deployment

### Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Deploy preview
vercel
```

### Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Import the GitHub repository: `baby-shower-qr-app`
3. Configure environment variables in Project Settings
4. Deploy automatically on git push

## GitHub MCP Commands

The GitHub MCP server provides automated repository operations:

### Repository Operations

```javascript
// Check repository status
list_commits({ owner, repo, sha: 'main' })

// Create branch
create_branch({ owner, repo, branch: 'develop', from_branch: 'main' })

// Push files
push_files({ owner, repo, branch, files, message })
```

### Deployment Integration

```bash
# GitHub MCP will automatically detect Vercel deployments
# when pushes occur to the main branch
```

## Troubleshooting

### Git Push Fails

```bash
# Check remote configuration
git remote -v

# Update remote URL with token
git remote set-url origin https://GITHUB_TOKEN@github.com/your-org/baby-shower.git
```

### Vercel Not Deploying

1. Check GitHub → Repository → Settings → Webhooks
2. Verify Vercel webhook is active
3. Check Vercel project settings → Git Integration

### MCP Operations Failing

1. Verify GitHub token has correct permissions
2. Check token is exported as `GITHUB_PERSONAL_ACCESS_TOKEN`
3. Ensure repository exists and is accessible

## Files to Commit

Always commit these files:
- `index.html` - Frontend
- `scripts/` - Frontend JavaScript
- `styles/` - CSS
- `supabase/functions/` - Edge Functions
- `tests/` - Test suite
- `backend/` - Google Sheets integration
- `package.json` - Dependencies
- `.gitignore` - Git exclusions
- `README.md` - Documentation
- `DEPLOYMENT.md` - This file

## Files to Exclude

Never commit:
- `.env.local` - Contains secrets
- `node_modules/` - Dependencies
- `test-results/` - Test output
- `.vercel/` - Vercel cache
- `*.log` - Log files

## Deployment Checklist

- [ ] Code changes completed and tested
- [ ] No secrets in committed files
- [ ] `npm run commit` executed
- [ ] `npm run push` executed
- [ ] Vercel deployment completes successfully
- [ ] Deployed changes verified in production

## Support

- Vercel Documentation: https://vercel.com/docs
- GitHub MCP: https://github.com/mcp/github
- Conventional Commits: https://www.conventionalcommits.org
