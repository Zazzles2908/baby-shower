# Troubleshooting Guide - Baby Shower App

**Last Updated**: 2026-01-02  
**Version**: 1.0  
**Purpose**: Common issues and solutions for the Baby Shower application

---

## Table of Contents

1. [Quick Fix Reference](#quick-fix-reference)
2. [Database Issues](#database-issues)
3. [API and Edge Function Issues](#api-and-edge-function-issues)
4. [Frontend Issues](#frontend-issues)
5. [Google Sheets Integration Issues](#google-sheets-integration-issues)
6. [Deployment Issues](#deployment-issues)
7. [Performance Issues](#performance-issues)
8. [Security Issues](#security-issues)
9. [Emergency Procedures](#emergency-procedures)

---

## Quick Fix Reference

| Problem | Quick Solution |
|---------|----------------|
| "Supabase URL is required" | Check environment variables in Vercel dashboard |
| Data not appearing | Check Edge Functions deployment and RLS policies |
| Vote counts showing 0 | Verify activity_type is 'voting' not 'vote' |
| Pool stats not updating | Verify activity_type is 'baby_pool' not 'pool' |
| Google Sheets not receiving data | Check webhook URL and Apps Script deployment |
| Milestones not unlocking | Check milestone thresholds in config.js |

---

## Database Issues

### Issue: "Supabase URL is required"

**Symptoms**: App shows error message on load

**Causes**:
- Environment variables not set in Vercel
- Incorrect URL in [`scripts/config.js`](scripts/config.js)

**Solutions**:
1. Check Vercel environment variables:
   - Go to Settings > Environment Variables
   - Verify `VITE_SUPABASE_URL` is set
   - Verify value is correct

2. Check [`scripts/config.js`](scripts/config.js:20):
   - Confirm `SUPABASE.URL` matches project URL
   - Should be: `https://bkszmvfsfgvdwzacgmfz.supabase.co`

3. Redeploy Vercel:
   ```bash
   vercel --prod
   ```

---

### Issue: Data Not Appearing in Database

**Symptoms**: Form submits successfully but no data in Supabase

**Causes**:
- Edge Function not deployed
- RLS policy blocking INSERT
- Network timeout

**Solutions**:
1. Check Edge Function status:
   ```bash
   supabase functions list
   ```
   Verify all 5 functions show "Active"

2. Check RLS policies:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'submissions';
   ```
   Ensure `allow_insert_submissions` policy exists

3. Check browser console:
   - Press F12
   - Look for network errors
   - Check API response status

4. Test API directly with cURL:
   ```bash
   curl -X POST https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/guestbook \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -d '{"name":"Test","message":"Test","relationship":"friend"}'
   ```

---

### Issue: Milestones Not Unlocking

**Symptoms**: Confetti doesn't trigger, milestones don't show

**Causes**:
- Incorrect milestone thresholds in config
- Counting logic error
- Realtime not enabled

**Solutions**:
1. Check [`scripts/config.js`](scripts/config.js:40-51):
   ```javascript
   MILESTONES: {
       GUESTBOOK_5: 5,
       GUESTBOOK_10: 10,
       // ... etc
   }
   ```
   Verify thresholds are correct

2. Check database counts:
   ```sql
   SELECT activity_type, COUNT(*) as count 
   FROM public.submissions 
   GROUP BY activity_type;
   ```
   Compare counts to milestone thresholds

3. Check browser console for JavaScript errors:
   - Look for milestone calculation errors
   - Check if `CONFIG.MILESTONES` is accessible

---

## API and Edge Function Issues

### Issue: Vote Counts Showing 0

**Symptoms**: Votes submitted but counts don't update

**Causes**:
- Activity type mismatch (known bug)
- Array format incorrect
- Counting query error

**Solutions**:
1. Verify activity_type is 'voting' (not 'vote'):
   ```sql
   SELECT activity_type, COUNT(*) 
   FROM public.submissions 
   WHERE activity_type = 'voting';
   ```

2. Check vote data format:
   ```sql
   SELECT activity_data->'names' 
   FROM public.submissions 
   WHERE activity_type = 'voting'
   LIMIT 1;
   ```
   Should return: `["Emma","Olivia","Sophia"]`

3. Test counting query:
   ```sql
   SELECT 
       jsonb_array_elements_text(activity_data->'names') as name,
       COUNT(*) as votes
   FROM public.submissions
   WHERE activity_type = 'voting'
   GROUP BY name;
   ```

---

### Issue: Pool Stats Not Updating

**Symptoms**: Predictions submitted but statistics don't calculate

**Causes**:
- Activity type mismatch (known bug - was 'pool' instead of 'baby_pool')
- Data type conversion error
- Missing fields

**Solutions**:
1. Verify activity_type is correct:
   ```sql
   SELECT DISTINCT activity_type 
   FROM public.submissions 
   WHERE activity_type LIKE '%pool%';
   ```
   Should return: `baby_pool`

2. Check data structure:
   ```sql
   SELECT activity_data 
   FROM public.submissions 
   WHERE activity_type = 'baby_pool'
   LIMIT 1;
   ```
   Should contain: `prediction`, `dueDate`, `weight`, `length`

3. Update if using old format:
   ```sql
   UPDATE public.submissions 
   SET activity_type = 'baby_pool' 
   WHERE activity_type = 'pool';
   ```

---

### Issue: Edge Function Errors

```
Error: Missing environment variables
→ Check Supabase Settings > Edge Functions > Environment Variables

Error: Database error
→ Verify service role key is correct
→ Check RLS policies allow INSERT
```

**Solutions**:
1. Check Edge Function CORS headers:
   ```typescript
   // Should include in all Edge Functions
   return new Response(JSON.stringify(data), {
       headers: {
           'Content-Type': 'application/json',
           'Access-Control-Allow-Origin': '*',
           'Access-Control-Allow-Methods': 'POST, OPTIONS',
           'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
       }
   });
   ```

2. Test with CORS preflight:
   ```bash
   curl -X OPTIONS https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/guestbook \
     -H "Origin: https://baby-shower-qr-app.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -v
   ```
   Should return 200 OK with proper headers

---

## Frontend Issues

### Issue: CORS Errors in Browser

**Symptoms**: Browser console shows "CORS policy" errors

**Causes**:
- Missing CORS headers in Edge Functions
- Incorrect origin in request
- Preflight request failure

**Solutions**:
1. Verify Edge Functions include CORS headers (see above)
2. Check browser network tab for failed OPTIONS request
3. Verify frontend URL matches allowed origin

---

### Issue: Page Load Slow (> 5 seconds)

**Symptoms**: App takes > 5 seconds to load

**Causes**:
- Large assets not optimized
- CDN cache miss
- Network latency

**Solutions**:
1. Check asset sizes:
   - Open DevTools > Network tab
   - Look for large files (> 500KB)
   - Optimize images if needed

2. Clear CDN cache:
   - Go to Vercel Dashboard > baby-shower-qr-app
   - Click "Redeploy" to clear cache

3. Test from different locations:
   - Use tools like https://tools.keycdn.com/speed
   - Test from multiple regions
   - Check if issue is location-specific

---

## Google Sheets Integration Issues

### Issue: Google Sheets Not Receiving Data

**Symptoms**: Webhook configured but no rows in sheet

**Causes**:
- Webhook URL incorrect
- Apps Script not deployed as web app
- Access permissions issue

**Solutions**:
1. Check Apps Script deployment:
   - Go to Extensions > Apps Script
   - Click "Deployments"
   - Verify "Web app" deployment exists
   - Copy Web App URL

2. Check webhook configuration:
   - Go to Supabase Dashboard > Database > Webhooks
   - Verify URL matches Apps Script URL
   - Check webhook status is "Active"

3. Check Apps Script executions:
   - Go to Extensions > Apps Script > Executions
   - Look for recent executions
   - Check for error messages

4. Test webhook manually:
   ```bash
   curl -X POST <WEBHOOK_URL> \
     -H "Content-Type: application/json" \
     -d '{"event":{"type":"INSERT","record":{"id":999,"guest_name":"Test","activity_type":"guestbook","raw_data":{}}}}'
   ```

---

## Deployment Issues

### Issue: Git push fails

```bash
# If you get authentication error:
# 1. Check git remote
$ git remote -v
# Should show: https://github.com/Zazzles2908/baby-shower.git

# 2. Check credentials
$ git config --global user.email  # Should be your GitHub email

# 3. Try logging in to GitHub CLI
$ gh auth login
```

---

### Issue: Vercel not deploying after push

1. Check Vercel dashboard → Settings → Git
   - Confirm GitHub connection is active
2. Check if deployment is paused:
   - Vercel dashboard → Deployments → Check status
3. Manually redeploy if needed:
   - Find last deployment → Click "Redeploy"

---

### Issue: Deployment failed

1. Check build logs in Vercel dashboard
2. Common issues:
   - Missing environment variables
   - Build command errors
   - Missing files
3. Fix the issue → commit → push again

---

## Performance Issues

### API Response Time

**Expected**: < 2 seconds end-to-end

**Measure API Response Times**:
```bash
# Time API response
curl -X POST https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/guestbook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"name":"Perf Test","message":"Test","relationship":"friend"}' \
  -w "\nTime Total: %{time_total}s\nTime Connect: %{time_connect}s\n"
```

**Test all endpoints**:
```bash
for endpoint in guestbook vote pool quiz advice; do
    echo "Testing $endpoint..."
    curl -X POST https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/$endpoint \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer YOUR_ANON_KEY" \
      -H "apikey: YOUR_ANON_KEY" \
      -d '{"name":"Perf Test","test":"data"}' \
      -w "\nTime: %{time_total}s\n"
done
```

---

## Security Issues

### Issue: No Exposed Secrets in Code

**Action**: Search for hardcoded secrets

**Command**:
```bash
# Search for service role keys in code
grep -r "service_role" . --include="*.js" --include="*.html" --include="*.ts"

# Search for API keys in code
grep -r "api_key\|apikey\|secret" . --include="*.js" --include="*.html" --include="*.ts"
```

**Expected Result**: No results (except in config files with placeholders)

**If secrets found**:
- Remove from code
- Move to environment variables
- Rotate compromised keys

---

### Issue: Verify HTTPS Everywhere

**Action**: Check all URLs in configuration

**Command**:
```bash
# Check for HTTP URLs (should all be HTTPS)
grep -r "http://" . --include="*.js" --include="*.html" --include="*.json"
```

**Expected Result**: No results (all URLs should use HTTPS)

---

## Emergency Procedures

### Rollback: Database

```sql
-- Disable migration trigger
DROP TRIGGER IF EXISTS on_submission_insert ON public.submissions;

-- Verify trigger is disabled
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'on_submission_insert';
-- Should return 0 rows
```

**Re-enable trigger**:
```sql
-- Re-enable migration trigger
CREATE TRIGGER on_submission_insert
    AFTER INSERT ON public.submissions
    FOR EACH ROW
    EXECUTE FUNCTION internal.handle_submission_migration();
```

---

### Rollback: Vercel Frontend

1. Go to https://vercel.com/baby-shower-qr-app/deployments
2. Find previous successful deployment
3. Click "..." menu on that deployment
4. Select "Promote to Production"

---

### Rollback: Google Sheets Webhook

1. Go to Supabase Dashboard > Database > Webhooks
2. Find webhook: `google-sheets-export`
3. Click "Disable"
4. Test app to ensure it still works

---

### Emergency Contacts

| Issue Type | Contact | Response Time |
|------------|---------|---------------|
| Vercel Deployment Issues | Vercel Support | < 1 hour |
| Supabase Database Issues | Supabase Support | < 1 hour |
| Edge Function Errors | Check logs first, then Supabase Support | < 2 hours |
| Google Sheets Issues | Google Workspace Support | < 4 hours |
| Critical App Failure | All of above + rollback | Immediate |

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-02  
**Maintained By**: Development Team
