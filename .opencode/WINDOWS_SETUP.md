# Windows MCP Setup Guide for OpenCode

**Purpose:** Configure MCP (Model Context Protocol) servers for OpenCode orchestrator on Windows

**Last Updated:** 2026-01-03

---

## 🪟 Windows-Specific Setup

### **Step 1: Environment Variables (Windows)**

Open **Command Prompt as Administrator** and run:

```cmd
# Set GitHub Personal Access Token
setx GITHUB_PERSONAL_ACCESS_TOKEN "your-github-token-here" /M

# Verify it's set
echo %GITHUB_PERSONAL_ACCESS_TOKEN%
```

Or use PowerShell as Administrator:
```powershell
# Set system environment variable
[Environment]::SetEnvironmentVariable("GITHUB_PERSONAL_ACCESS_TOKEN", "your-github-token-here", "Machine")

# Verify
$env:GITHUB_PERSONAL_ACCESS_TOKEN
```

### **Step 2: Windows MCP Configuration**

Use the Windows-optimized configuration file: `.opencode\mcp-windows.json`

Key differences for Windows:
- `npx.cmd` instead of `npx`
- `docker.exe` instead of `docker`
- Full paths when needed

### **Step 3: Verify Prerequisites**

```cmd
# Check Node.js
node --version

# Check Docker
docker --version

# Check npx
where npx

# Check environment variables
echo %GITHUB_PERSONAL_ACCESS_TOKEN%
```

### **Step 4: Test MCP Servers**

```cmd
# Test Supabase MCP
npx.cmd -y @supabase/mcp-server-supabase@0.5.5 --help

# Test Playwright MCP
npx.cmd -y @playwright/mcp@0.0.38 --help

# Test GitHub MCP (Docker required)
docker.exe run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server --help
```

---

## 🔄 Restart Requirements

### **Do I need to restart OpenCode?**

**YES** - Here's why:

1. **MCP Configuration Loading**: OpenCode loads MCP configurations at startup
2. **Environment Variables**: System environment variables are read at initialization
3. **Docker Daemon**: If Docker was just installed, restart may be needed

### **How to Restart OpenCode:**

Since you're using OpenCode through this interface, you would need to:

1. **Refresh the conversation** (start a new session)
2. **Verify MCP loading**: Check if `/mcp` commands now show options
3. **Test basic operations**: Try simple MCP commands

### **Verification Steps:**

After restart, test with:
```
/mcp
```

You should see available MCP operations for:
- Supabase (database operations)
- Playwright (browser automation)
- GitHub (repository operations)

---

## 🚨 Common Windows Issues

### **Issue 1: Docker not running**
```cmd
# Start Docker Desktop
cmd /c "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

### **Issue 2: Environment variables not recognized**
```cmd
# Restart Command Prompt
# Or log out/in to Windows
# Or restart Docker Desktop
```

### **Issue 3: Permission denied**
- Run Command Prompt as Administrator
- Check Docker Desktop is running with proper permissions

### **Issue 4: MCP commands not found**
- Verify `.opencode\mcp-windows.json` exists
- Check file permissions
- Ensure Docker and Node.js are in PATH

---

## ✅ Success Indicators

When MCP is properly configured, you should be able to:

1. **See MCP options** when typing `/mcp`
2. **Access Supabase** database operations
3. **Use Playwright** for browser automation
4. **Perform GitHub** repository operations
5. **Execute cross-platform** commands through MCP

---

## 🎯 Quick Test Commands

After setup, test with:

```
# List available MCP operations
/mcp

# Test Supabase connection
/mcp supabase list_tables

# Test GitHub connection  
/mcp github get_me

# Test Playwright
/mcp playwright browser_install
```

**Note**: The exact command syntax may vary based on how OpenCode interfaces with MCP servers.