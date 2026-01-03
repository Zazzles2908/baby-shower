# OpenCode MCP Configuration

**Purpose:** MCP (Model Context Protocol) configuration for OpenCode orchestrator

**Location:** `.opencode/mcp.json`

## Available MCP Servers

### 1. Supabase MCP
- **Purpose:** Database operations, Edge Functions, project management
- **Version:** `@supabase/mcp-server-supabase@0.5.5`
- **Key Capabilities:**
  - Execute SQL queries
  - Manage database schema
  - Deploy Edge Functions
  - List/Create branches
  - Get project information

### 2. Playwright MCP
- **Purpose:** Browser automation and testing
- **Version:** `@playwright/mcp@0.0.38`
- **Key Capabilities:**
  - Browser control and navigation
  - Screenshot capture
  - Form interaction testing
  - Cross-browser testing
  - Element interaction (click, type, hover)

### 3. GitHub MCP
- **Purpose:** Repository operations and Git automation
- **Server:** `ghcr.io/github/github-mcp-server`
- **Key Capabilities:**
  - Repository file operations
  - Branch management
  - Pull request creation/merging
  - Commit history
  - Code search across repositories

## Environment Variables Required

- `GITHUB_PERSONAL_ACCESS_TOKEN` - GitHub personal access token for repository operations
- Supabase access token is hardcoded in configuration (consider moving to env var for security)

## Usage

When you see `/mcp` commands, OpenCode can now access:
- Supabase database operations
- Browser automation via Playwright
- GitHub repository management

This enables full-stack orchestration: database queries, browser testing, and Git operations all through MCP.