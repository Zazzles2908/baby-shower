# MCP Tools Guide - Baby Shower Project

This guide explains how to use the 5 MCP (Model Context Protocol) tools available for managing and implementing the Baby Shower project with better oversight.

## 🔧 Available MCP Tools

### 1. **kimi-filesystem** - File System Operations
**What it does**: Direct file system access for reading, writing, and managing files

**Useful Commands**:
```bash
# Read any project file
file_read scripts/config.js

# Write or update files
file_write scripts/config.js "new content"

# List directory contents
directory_list scripts/

# Execute bash commands
bash_execute "ls -la"

# Search for files
file_search "*.js" scripts/
```

**Best for**:
- Quick file edits without opening an editor
- Checking file contents during debugging
- Batch file operations
- Directory structure exploration

---

### 2. **kimi-minimax** - AI-Powered Research & Planning
**What it does**: Web search, AI planning, and research capabilities

**Useful Commands**:
```bash
# Search for information
web_search "Supabase RLS policies 2025"

# Research a topic comprehensively
research "best practices for baby shower web apps"

# AI planning for features
mcp_planning "Implement real-time updates for baby shower app"
```

**Best for**:
- Looking up latest documentation
- Researching new features before implementation
- Finding solutions to technical problems
- Staying current with best practices

---

### 3. **kimi-indexed-agent** - Code Operations
**What it does**: Intelligent code reading, writing, and management

**Useful Commands**:
```bash
# Read files with context
file_read scripts/api.js

# Write files with automatic formatting
file_write scripts/new-feature.js "code content"

# Execute commands in project context
bash_execute "npm run test"

# List and explore
.directory_list scripts/
```

**Best for**:
- Creating new features
- Refactoring code
- Understanding code structure
- Running project-specific commands

---

### 4. **kimi-qdrant-search** - Semantic Code Search
**What it does**: Find code by meaning, not just text matching

**Useful Commands**:
```bash
# Find related functions semantically
search_code_semantic "photo upload handling"

# Find similar implementations
search_code_semantic "milestone tracking system"

# Get codebase statistics
get_codebase_stats
```

**Best for**:
- Finding where a feature is implemented
- Discovering similar code patterns
- Understanding code relationships
- Navigating large codebases efficiently

**Example Searches**:
- "form submission handlers" → Finds all submit functions
- "milestone celebration logic" → Finds confetti/trigger code
- "photo upload to Supabase" → Finds uploadPhoto function
- "vote counting algorithm" → Finds voting logic

---

### 5. **supabase** - Database & Backend Management
**What it does**: Direct Supabase project management

**Useful Commands**:

**Database Operations**:
```bash
# List all tables
list_tables

# Execute SQL queries
execute_sql "SELECT COUNT(*) FROM baby_shower.submissions;"

# Apply migrations
apply_migration "add_guestbook_index" "CREATE INDEX idx_guestbook ON baby_shower.submissions(created_at);"

# List migrations
list_migrations
```

**Storage & Functions**:
```bash
# List storage buckets
list_storage_buckets

# List Edge Functions
list_edge_functions

# Get function code
get_edge_function "function-name"
```

**Debugging**:
```bash
# Get logs
get_logs postgres
get_logs edge-function

# Get project advisors
get_advisors security
get_advisors performance
```

**Best for**:
- Checking database state
- Running diagnostic queries
- Managing schema changes
- Debugging backend issues
- Monitoring project health

---

## 🎯 Workflow Examples

### Example 1: Debug Form Submission Issue

```bash
# Step 1: Check the API code
file_read scripts/api.js

# Step 2: Search for related submission handlers
search_code_semantic "form submission to Supabase"

# Step 3: Check database for recent submissions
execute_sql "SELECT * FROM baby_shower.submissions ORDER BY created_at DESC LIMIT 10;"

# Step 4: Check Supabase logs
get_logs postgres

# Step 5: Fix issue by updating code
file_write scripts/api.js "fixed code"
```

### Example 2: Add New Milestone

```bash
# Step 1: Read current config
file_read scripts/config.js

# Step 2: Research milestone ideas
web_search "creative baby shower milestone ideas"

# Step 3: Update config with new milestone
file_write scripts/config.js "updated config with new milestone"

# Step 4: Test the milestone logic
search_code_semantic "milestone trigger logic"
file_read scripts/surprises.js
```

### Example 3: Optimize Database Queries

```bash
# Step 1: Check current query performance
execute_sql "\dt baby_shower.*"
execute_sql "\d baby_shower.submissions"

# Step 2: Get advisor recommendations
get_advisors performance

# Step 3: Research best practices
research "Supabase query optimization for event apps"

# Step 4: Apply migration with indexes
apply_migration "optimize_submissions_query" "CREATE INDEX IF NOT EXISTS idx_activity_type ON baby_shower.submissions(activity_type, created_at);"

# Step 5: Verify improvement
execute_sql "EXPLAIN ANALYZE SELECT * FROM baby_shower.submissions WHERE activity_type = 'guestbook';"
```

---

## 📋 Common Tasks Cheat Sheet

### Check Project Health
```bash
# Get stats
execute_sql "SELECT activity_type, COUNT(*) FROM baby_shower.submissions GROUP BY activity_type;"

# Check for errors
get_logs postgres

# Check storage usage
get_storage_config
```

### Debug Data Issues
```bash
# Find missing data
execute_sql "SELECT * FROM baby_shower.submissions WHERE name IS NULL OR name = '';"

# Check for duplicate submissions
execute_sql "SELECT name, activity_type, COUNT(*) FROM baby_shower.submissions GROUP BY name, activity_type HAVING COUNT(*) > 1;"

# Validate data integrity
file_read backend/supabase-check.sql
execute_sql "-- paste validation queries"
```

### Implement Features
```bash
# Create new table
apply_migration "create_feature_table" "CREATE TABLE baby_shower.new_feature (...)"

# Add column to existing table
apply_migration "add_new_column" "ALTER TABLE baby_shower.submissions ADD COLUMN new_field TEXT;"

# Deploy Edge Function
deploy_edge_function "function-name" files entrypoint verify_jwt
```

### Monitor Performance
```bash
# Get database size
execute_sql "SELECT pg_size_pretty(pg_database_size(current_database()));"

# Check for slow queries
get_logs postgres | grep -i "duration"

# Check API performance
get_logs api
```

---

## 🚀 Best Practices

1. **Always check before changing**
   ```bash
   # Read current state first
   file_read scripts/config.js
   # Then make changes
   file_write scripts/config.js "new content"
   ```

2. **Use semantic search to find related code**
   ```bash
   # Better than grep - finds conceptually related code
   search_code_semantic "photo upload handling"
   ```

3. **Test queries before running on production**
   ```bash
   # Run on local/dev first if possible
   execute_sql "SELECT COUNT(*) FROM table;"  # Safe
   # Then run actual query
   execute_sql "UPDATE table SET ...;"  # Careful!
   ```

4. **Use migrations for schema changes**
   ```bash
   # Good
   apply_migration "descriptive_name" "SQL"
   
   # Avoid running raw DDL without migration
   execute_sql "ALTER TABLE ..."  # Use only for queries
   ```

5. **Check logs when debugging**
   ```bash
   # Always check logs for errors
   get_logs postgres
   get_logs api
   ```

---

## 📖 Learning Resources

- **Supabase Docs**: https://supabase.com/docs
- **PostgreSQL Tutorial**: https://www.postgresqltutorial.com/
- **Vercel Docs**: https://vercel.com/docs
- **MCP Protocol**: https://modelcontextprotocol.io/

---

## 🔍 Pro Tips

### Use Tool Chaining
You can use multiple tools in sequence to solve complex problems:

```bash
# Find an issue → Research → Fix → Verify
search_code_semantic "error in photo upload"
research "Supabase storage upload errors"
file_read scripts/api.js
file_write scripts/api.js "fixed code"
execute_sql "SELECT * FROM storage.objects LIMIT 5;"
```

### Leverage Context
Each tool has access to the broader project context:

- **filesystem tools**: Know the project directory structure
- **indexed-agent**: Understands codebase semantics
- **qdrant-search**: Has vector embeddings of all code
- **supabase**: Connected to your live project

### Document Your Changes
When making significant changes, use the tools to verify:

```bash
# Before change: document current state
file_read scripts/config.js > before_change.txt

# Make change
file_write scripts/config.js "new config"

# After change: verify
file_read scripts/config.js > after_change.txt
bash_execute "diff before_change.txt after_change.txt"
```

---

## 🆘 Getting Help

If a tool fails:

1. **Check syntax** - Make sure command format is correct
2. **Check permissions** - Some operations require auth
3. **Check connection** - Ensure Supabase/Vercel are online
4. **Check limits** - Free tiers have rate limits
5. **Use alternative tools** - Try a different approach

Example error handling:
```bash
# If execute_sql fails, check logs
execute_sql "SELECT * FROM nonexistent_table;"  # Might fail
get_logs postgres  # Check why it failed

# If file_read fails, check permissions
bash_execute "ls -la scripts/"  # Check file exists and permissions
```
