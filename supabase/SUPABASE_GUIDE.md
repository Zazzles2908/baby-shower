# Baby_Shower Project - Supabase Configuration Guide

## Project Details

- **Project Name**: Baby
- **Supabase URL**: https://bkszmvfsfgvdwzacgmfz.supabase.co
- **Project Reference ID**: `bkszmvfsfgvdwzacgmfz`
- **Access Token**: `sbp_fdca3aaba5d2ca76cc938e4b7c44c4599ac97812`

## Directory Structure

```
C:/Project/Baby_Shower/
├── supabase/
│   ├── supabase/           # Main Supabase config directory
│   │   └── config.toml     # Supabase CLI configuration (project_id = "supabase")
│   ├── functions/          # Edge Functions
│   │   ├── game-reveal/
│   │   ├── game-scenario/
│   │   ├── game-session/
│   │   └── game-vote/
│   ├── migrations/         # Database migrations
│   └── supabase-helper.sh  # This helper script
├── .env.local              # Contains Supabase credentials
└── ...
```

## Common Commands for This Project

### Authentication & Linking
```bash
# Set the correct access token for this project
export SUPABASE_ACCESS_TOKEN="sbp_fdca3aaba5d2ca76cc938e4b7c44c4599ac97812"

# Verify token and list projects
supabase projects list

# Link to the remote project
supabase link --project-ref bkszmvfsfgvdwzacgmfz

# Or use the helper script
source supabase/supabase-helper.sh
```

### Database Operations
```bash
# Start local development
supabase start

# Stop local development
supabase stop

# Check status
supabase status

# View logs
supabase logs

# Push local migrations to remote
supabase db push

# Show local schema changes
supabase db diff

# Create new migration
supabase migration new <migration_name>
```

### Edge Functions
```bash
# List all functions
supabase functions list

# Deploy a specific function
supabase functions deploy game-reveal

# Deploy all functions
supabase functions deploy --all

# Test a function locally
supabase functions serve game-reveal
```

### Troubleshooting

#### Token Issues
If you get "Unauthorized" errors:
```bash
# Verify which token is being used
echo $SUPABASE_ACCESS_TOKEN

# Use this project's token
export SUPABASE_ACCESS_TOKEN="sbp_fdca3aaba5d2ca76cc938e4b7c44c4599ac97812"

# Re-link the project
supabase link --project-ref bkszmvfsfgvdwzacgmfz
```

#### Docker Issues
If local development fails:
```bash
# Check Docker status
docker ps

# Restart Docker services
supabase stop
supabase start

# View detailed logs
supabase logs --debug
```

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL="https://bkszmvfsfgvdwzacgmfz.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_ACCESS_TOKEN="sbp_fdca3aaba5d2ca76cc938e4b7c44c4599ac97812"
```

## Important Notes

1. **Use the Correct Token**: This project has its own Supabase access token in `.env.local`. Do not use tokens from other projects or the home directory.

2. **Project Reference**: The `project_id` in `supabase/supabase/config.toml` is set to "supabase" (default), but the actual remote project reference is `bkszmvfsfgvdwzacgmfz`.

3. **Nested Directory**: Note that the main config.toml is in `supabase/supabase/config.toml` (nested structure), not directly in the `supabase/` folder.

4. **Migration Location**: Database migrations should be placed in `supabase/migrations/` directory.

5. **Edge Functions**: Individual function configs are in `supabase/functions/<function-name>/config.toml`.

## For OpenCode Agents

When working with this project:

1. **Always use the project's token** from `.env.local`:
   ```bash
   export SUPABASE_ACCESS_TOKEN="sbp_fdca3aaba5d2ca76cc938e4b7c44c4599ac97812"
   ```

2. **Always work from the project directory**:
   ```bash
   cd C:/Project/Baby_Shower
   ```

3. **Link before database operations**:
   ```bash
   supabase link --project-ref bkszmvfsfgvdwzacgmfz
   ```

4. **Use debug mode for troubleshooting**:
   ```bash
   supabase --debug <command>
   ```

5. **Quick reference commands**:
   ```bash
   # Check status
   supabase status
   
   # Push migrations
   supabase db push
   
   # Deploy functions
   supabase functions deploy --all
   ```
