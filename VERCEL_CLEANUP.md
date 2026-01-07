# Vercel Project Cleanup - January 8, 2026

## Purpose
Consolidate 3 Vercel projects into 1 (baby-shower-v2) for simplified maintenance.

## Current State

| Project | Status | Keep? |
|---------|--------|-------|
| baby-shower-v2 | Active, last deployed ~10h ago | ✅ YES |
| baby-shower-app | Active, identical content | ❌ DELETE |
| baby-shower-qr-app | Active, identical content | ❌ DELETE |

---

## Step 1: Document Environment Variables

**From baby-shower-v2 (KEEP):**
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY

**From baby-shower-app (DELETE):**
- [ ] Copy all env vars before deletion

**From baby-shower-qr-app (DELETE):**
- [ ] Copy all env vars before deletion

---

## Step 2: Delete Duplicate Projects (Vercel Dashboard)

### Delete baby-shower-app:
1. Go to: https://vercel.com/baby-shower-app/settings/general
2. Scroll to "Danger Zone"
3. Click "Delete Project"
4. Type project name to confirm

### Delete baby-shower-qr-app:
1. Go to: https://vercel.com/baby-shower-qr-app/settings/general
2. Scroll to "Danger Zone"
3. Click "Delete Project"
4. Type project name to confirm

---

## Step 3: Verify baby-shower-v2

1. Go to: https://vercel.com/baby-shower-v2
2. Confirm deployment history is intact
3. Verify environment variables are set
4. Test production URL: https://baby-shower-v2.vercel.app

---

## Step 4: Update Custom Domain (if needed)

If you had custom domains pointing to deleted projects:
1. Go to https://vercel.com/baby-shower-v2/settings/domains
2. Add any custom domains from deleted projects
3. Update DNS records accordingly

---

## Step 5: Update Integrations

- [ ] GitHub webhooks (should auto-remove with project deletion)
- [ ] Slack/Discord notifications
- [ ] Analytics tools
- [ ] Any external services pointing to old URLs

---

## Step 6: Update Local Documentation

✅ README.md - to be updated
✅ docs/DEPLOYMENT.md - to be updated
✅ docs/README.md - to be updated

---

## Post-Cleanup Verification

- [ ] Production URL works: https://baby-shower-v2.vercel.app
- [ ] Git push triggers new deployment
- [ ] Environment variables are correct
- [ ] No broken links to old URLs

---

## Rollback (if needed)

If something goes wrong:
1. Redeploy from Vercel dashboard: Deployments → ellipsis → Redeploy
2. Environment variables can be re-added from `.env.local`
3. Old projects cannot be recovered after deletion

---

**Created:** 2026-01-08
**Status:** Pending user action in Vercel Dashboard
