# AI API Endpoint Investigation Report

**Date:** 2026-01-09  
**Status:** COMPLETED - Critical Issues Found  

---

## Executive Summary

The investigation revealed that while the documented AI API corrections were accurate, there are critical blocking issues:

1. **Kimi API endpoint is RESTRICTED** - Only available for coding agents
2. **Z.AI API key is invalid/expired** - Requires renewal

---

## API Endpoint Test Results

### Kimi (Kimi K2)

| Test | Endpoint | Result |
|------|----------|--------|
| Old endpoint | `https://api.moonshot.cn/v1/chat/completions` | ❌ 401 Invalid Authentication |
| New endpoint | `https://api.kimi.com/coding/v1/chat/completions` | ❌ 403 Forbidden - "Kimi For Coding is currently only available for Coding Agents" |

**CRITICAL FINDING:** The new Kimi endpoint is RESTRICTED to coding agents only and CANNOT be used from:
- Browser JavaScript
- Supabase Edge Functions
- Any web application

### Z.AI (GLM-4.7)

| Test | Endpoint | Result |
|------|----------|--------|
| Old endpoint | `https://open.bigmodel.cn/api/paas/v3/modelapi/chatglm_pro/completions` | ❌ 身份验证失败 (Auth Failed) |
| New endpoint | `https://api.z.ai/api/coding/paas/v4` | ❌ 401 Authorization Failure |
| v4 via bigmodel | `https://open.bigmodel.cn/api/paas/v4/chat/completions` | ❌ 401 Token expired |

**FINDING:** The Z.AI API key in `.env.local` is invalid or expired.

---

## Files Updated

### Local Updates (Source Files)

| File | Changes |
|------|---------|
| `supabase/functions/test-kimi/index.ts` | Updated to `api.kimi.com/coding/v1/chat/completions`, model `kimi-k2-thinking` |
| `supabase/functions/test-zai/index.ts` | Updated to `api.z.ai/api/coding/paas/v4`, model `glm-4-7`, messages format |
| `supabase/functions/game-reveal/index.ts` | Updated to Kimi new endpoint (needs local deploy) |
| `supabase/functions/game-scenario/index.ts` | ✅ Already using correct Z.AI endpoint |

### Deployed Functions

| Function | Status |
|----------|--------|
| `test-kimi` | ✅ Deployed (v3) - Returns 403 |
| `test-zai` | ✅ Deployed (v2) - Returns 401 |
| `game-reveal` | ❌ Failed - Requires local Supabase CLI deployment |
| `game-scenario` | ✅ Already using correct endpoint |

---

## API Keys in .env.local

```
KIMI_API_KEY=4bbaa24e1ee654c736799e49f4420372272769288d3ed520369ca6aeaee0308e
Z_AI_API_KEY=5c955c8a44d93ef1953338447ee29f9e23d3b23a417a8aca7bd15ab783829528
KIMI_CODING_API_KEY=sk-kimi-i6dBNfeBvdXkjJgTcApe77hQbMLO3BnlyiaVPW4HEb4gcWefGC6qnkv7benkHqWe
```

**Note:** `KIMI_CODING_API_KEY` might be the correct format for Kimi K2 but needs verification.

---

## Critical Issues

### Issue 1: Kimi Endpoint Restriction

**Problem:** The `api.kimi.com/coding/v1` endpoint is restricted to coding agents only.

**Impact:** Cannot be used from Supabase Edge Functions or browser.

**Possible Solutions:**
1. Use Moonshot's non-coding endpoint (if available)
2. Switch to a different AI provider (OpenAI, Anthropic, etc.)
3. Use a proxy service that acts as a coding agent
4. Use Kimi K2 via Zen gateway (if available)

### Issue 2: Invalid Z.AI API Key

**Problem:** The Z.AI API key returns "Authorization Failure".

**Impact:** Cannot generate game scenarios.

**Solution:** Obtain a new valid API key from Z.AI.

---

## Recommendations

### Immediate Actions Required

1. **For Kimi:**
   - Contact Kimi/Moonshot to get a web-accessible API endpoint
   - OR switch to alternative AI provider for roast commentary
   - Consider using the existing fallback roast system

2. **For Z.AI:**
   - Generate a new API key from Z.AI dashboard
   - Update `.env.local` with new key
   - Redeploy test functions to verify

3. **For game-reveal:**
   - Deploy via Supabase CLI locally:
   ```bash
   cd supabase/functions/game-reveal
   supabase functions deploy game-reveal --project-ref bkszmvfsfgvdwzacgmfz
   ```

### Long-term Recommendations

1. Consider using OpenAI or Anthropic as backup providers
2. Implement proper error handling for AI API failures
3. Document all API key rotation procedures
4. Set up monitoring for API endpoint availability

---

## Testing Commands

After fixing API keys, test with:

```bash
# Test Kimi
curl -X POST "https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/test-kimi" \
  -H "Authorization: Bearer $ANON_KEY"

# Test Z.AI
curl -X POST "https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/test-zai" \
  -H "Authorization: Bearer $ANON_KEY"
```

---

## Document Version

**Version:** 1.0  
**Created:** 2026-01-09  
**Author:** OpenCode Agent
