# Edge Function Debugging - Lobby Status 404 Error

**Date:** January 4, 2026  
**Issue:** `lobby-status` Edge Function consistently returns 404 "Lobby not found" even though lobbies exist in database

---

## 🔍 INVESTIGATION RESULTS

### Database Verification ✅
```sql
SELECT lobby_key, lobby_name FROM baby_shower.mom_dad_lobbies WHERE lobby_key = 'LOBBY-A'

Result:
[{"lobby_key":"LOBBY-A","lobby_name":"Sunny Meadows"}]

✅ Direct SQL queries work fine
✅ All 4 lobbies exist
✅ Table has all required columns
```

### Edge Function Logs
```
POST | 404 | https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/lobby-status
Execution time: ~450ms
```

### Supabase Client Initialization
The Edge Function uses:
```typescript
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
```

---

## 🎯 ROOT CAUSE ANALYSIS

### Possible Causes:
1. **Environment Variables Not Set** ❓
   - Edge Function might not have access to `SUPABASE_SERVICE_ROLE_KEY`
   - Or the key has expired/been rotated

2. **RLS Policy Issue** ❓
   - Even with Service Role, RLS might be interfering
   - Need to verify RLS policies allow Service Role access

3. **Table/Column Name Mismatch** ❓
   - Maybe the table name or column names don't match exactly
   - Case sensitivity issues?

4. **Network/Timeout Issue** ❓
   - Edge Function can't reach the database
   - Very unlikely given the execution time (~450ms)

---

## 🔧 DIAGNOSIS STEPS

### Step 1: Check Edge Function Environment Variables
```typescript
// Add this to lobby-status function temporarily:
console.log('Environment variables check:')
console.log('SUPABASE_URL set:', !!Deno.env.get('SUPABASE_URL'))
console.log('SUPABASE_SERVICE_ROLE_KEY set:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))
console.log('SUPABASE_SERVICE_ROLE_KEY length:', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.length)
```

### Step 2: Test Supabase Client Connection
```typescript
// Add this test query:
const { data: testData, error: testError } = await supabase
  .from('baby_shower.mom_dad_lobbies')
  .select('lobby_key')
  .limit(1)

console.log('Test query result:', { data: testData, error: testError })
```

### Step 3: Check RLS Policies
```sql
-- Check if there are any RLS policies blocking Service Role:
SELECT * FROM pg_policies WHERE tablename = 'mom_dad_lobbies';

-- Check RLS status:
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'baby_shower';
```

---

## 💡 IMMEDIATE SOLUTIONS

### Solution 1: Add Debug Logging to Edge Function
Create a new version with extensive logging to identify where it fails.

### Solution 2: Use anon key instead of service role key
The frontend uses the anon key successfully. Maybe the Edge Function should too (with proper RLS policies).

### Solution 3: Create a Database Function
Create a Postgres function that the Edge Function can call directly, bypassing Supabase client issues.

### Solution 4: Use Direct SQL Execution
Instead of using the Supabase JS client, use raw SQL in the Edge Function.

---

## 📋 NEXT STEPS

### Immediate Actions:
1. ⏳ **Wait and Retry**: Sometimes newly created lobbies need time to become visible
2. 🔄 **Redeploy Edge Function**: Maybe the deployment had an issue
3. 🐛 **Add Debug Logging**: Temporarily modify function to log more details
4. 🔐 **Verify Environment Variables**: Check that keys are correctly set

### If Issue Persists:
1. Create a test Edge Function with minimal code to isolate the issue
2. Check Supabase dashboard for any alerts or issues
3. Contact Supabase support if needed

---

## 🎯 ALTERNATIVE APPROACH: Direct SQL Edge Function

If the Supabase client continues to have issues, create a new version that uses direct SQL:

```typescript
// Alternative approach using Deno database connection
import { Client } from 'https://deno.land/x/postgres@v0.17.0/client.ts'

const client = new Client({
  database: Deno.env.get('PGDATABASE'),
  hostname: Deno.env.get('PGHOST'),
  user: Deno.env.get('PGUSER'),
  password: Deno.env.get('PGPASSWORD'),
  port: 5432,
})

// Use client.query directly instead of Supabase client
```

---

## 📊 CURRENT STATUS

- **Database**: ✅ Working (verified via SQL)
- **Edge Function**: ❌ Returning 404 (needs investigation)
- **Frontend**: ✅ Code is correct, waiting for API response
- **RLS Policies**: ⚠️ Need verification

---

## 🔗 RELATED FILES

- `supabase/functions/lobby-status/index.ts` - The problematic Edge Function
- `supabase/migrations/20260104_simplified_lobby_schema.sql` - Database schema
- `docs/technical/FINAL_SYSTEM_STATUS.md` - System status overview

---

**Last Updated:** January 4, 2026  
**Status:** 🔍 UNDER INVESTIGATION
