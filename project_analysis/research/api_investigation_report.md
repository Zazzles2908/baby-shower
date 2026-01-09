# API Investigation Report - Baby Shower V2 Project

**Date:** 2026-01-09  
**Status:** In Progress  
**Investigator:** OpenCode AI Assistant

---

## Executive Summary

This report documents the investigation into new API endpoints and secrets for the Mom vs Dad game functionality. Key findings indicate that while the infrastructure has been updated to support new endpoints, **all AI API keys are currently experiencing authentication failures**.

---

## Current API Configuration Status

### Environment Variables (from `.env.local`)

| API Key | Status | Length | Notes |
|---------|--------|--------|-------|
| `Z_AI_API_KEY` | ✅ Configured | 49 chars | Primary key for Z.AI |
| `KIMI_API_KEY` | ✅ Configured | 72 chars | Starts with "sk-kimi-" |
| `KIMI_CODING_API_KEY` | ✅ Configured | 72 chars | Same format as KIMI_API_KEY |
| `MINIMAX_API_KEY` | ✅ Configured | 125 chars | For fallback AI |
| `ZEN_API_KEY` | ✅ Configured | ~50 chars | For Zen gateway |
| `Kimi_Base_API` | ❌ **NOT FOUND** | - | User mentioned this secret but it's not in environment |

### Key Finding
**`Kimi_Base_API` is not present in the environment files.** The user mentioned adding this new secret, but it was not found in `.env.local` or `supabase/functions/.env`.

---

## Endpoint Testing Results

### 1. Z.AI Endpoint Test

**Endpoint:** `https://api.z.ai/api/paas/v4/chat/completions`  
**Status:** ❌ **FAILED**  
**HTTP Status:** 401 Unauthorized  
**Error:** `{"error":{"code":"1000","message":"Authorization Failure"}}`

**Analysis:**
- The new Z.AI endpoint was successfully integrated into:
  - `test-zai` function (version 4)
  - `game-scenario` function (version 18)
- However, the API key is not authenticating correctly
- Possible causes:
  1. API key has been revoked or expired
  2. API key doesn't have access to the new `/paas/v4/chat/completions` endpoint
  3. API key format may have changed

**Previous Working Endpoint:** `https://api.z.ai/api/coding/paas/v4` (no longer used)

### 2. Kimi API Test

**Endpoint:** `https://api.kimi.com/coding/v1/chat/completions`  
**Status:** ❌ **FAILED**  
**HTTP Status:** 403 Forbidden  
**Error:** `{"error":{"message":"Kimi For Coding is currently only available for Coding Agents such as Kimi CLI, Claude Code, Roo Code, Kilo Code, etc.","type":"access_terminated_error"}}`

**Analysis:**
- The Kimi API key (`KIMI_API_KEY`) is specifically for "Kimi for Coding" agents
- This key type is restricted to coding assistants like Kimi CLI, Claude Code, Roo Code, etc.
- **Cannot be used for general API access** as required by the game-reveal function

**Key Issue:** The Kimi key we have is the wrong type for general API usage.

### 3. Fallback API Tests

#### OpenRouter Test (for Z.AI fallback)
**Endpoint:** `https://openrouter.ai/api/v1/chat/completions`  
**Status:** ❌ **FAILED**  
**Error:** `{"error":{"message":"No cookie auth credentials found","code":401}}`

#### Moonshot Direct Test (for Kimi fallback)
**Endpoint:** `https://api.moonshot.cn/v1/chat/completions`  
**Status:** ❌ **FAILED**  
**Error:** `{"error":{"message":"Invalid Authentication","type":"invalid_authentication_error"}}`

#### MiniMax Test (for all fallback)
**Endpoint:** `https://api.minimax.chat/v1/text/chatcompletion_v2`  
**Status:** ❌ **FAILED**  
**Error:** `{"base_resp":{"status_code":2049,"status_msg":"invalid api key"}}`

---

## Functions Updated

### Successfully Deployed

1. **test-zai** (version 4)
   - ✅ Updated to use new endpoint: `https://api.z.ai/api/paas/v4/chat/completions`
   - ✅ Deployed successfully
   - ⚠️ Testing failed (401 auth error)

2. **test-kimi** (version 5)
   - ✅ Kept existing endpoint: `https://api.kimi.com/coding/v1/chat/completions`
   - ✅ Deployed successfully
   - ⚠️ Testing failed (403 access denied)

3. **game-scenario** (version 18)
   - ✅ Updated to use new Z.AI endpoint
   - ✅ Added `_shared/security.ts` to deployment
   - ✅ Deployed successfully
   - ⚠️ Will fall back to OpenRouter if Z.AI fails

4. **game-reveal** (version 21)
   - ✅ Updated to support multiple Kimi API key formats:
     - `KIMI_API_KEY`
     - `KIMI_CODING_API_KEY`
     - `Kimi_Base_API` (if added)
   - ✅ Deployed successfully
   - ⚠️ Will fall back to template roasts if AI fails

---

## Fallback Mechanisms

### game-scenario Function
The function now has a multi-tier fallback system:
1. **Primary:** Z.AI API (`https://api.z.ai/api/paas/v4/chat/completions`)
2. **Secondary:** OpenRouter API (`https://openrouter.ai/api/v1/chat/completions`)
3. **Tertiary:** Fallback scenario template

### game-reveal Function
The function now supports multiple API keys:
1. **Primary:** `KIMI_API_KEY`
2. **Secondary:** `KIMI_CODING_API_KEY`
3. **Tertiary:** `Kimi_Base_API` (if added to environment)
4. **Fallback:** Template-based roast commentary

---

## Issues Identified

### Critical Issues

1. **All AI API Keys Are Invalid**
   - Z.AI API key returns 401 (authorization failure)
   - Kimi API key returns 403 (access denied for coding agents only)
   - OpenRouter returns 401 (no cookie credentials)
   - Moonshot returns invalid authentication
   - MiniMax returns invalid API key

2. **Missing Kimi_Base_API Secret**
   - User mentioned adding this secret but it's not in environment files
   - Need to verify if this secret exists and has correct permissions

### High Priority Issues

1. **Z.AI Endpoint Format**
   - New endpoint `/paas/v4/chat/completions` may require different authentication
   - Legacy endpoint `/coding/paas/v4` is no longer supported

2. **Kimi API Key Type**
   - Current key is for "Kimi for Coding" only
   - Need general-purpose Kimi API key for game-reveal function

### Medium Priority Issues

1. **Environment Variable Consistency**
   - `supabase/functions/.env` uses different key names (`Z_AI`, `KIMI_CODING`)
   - Edge Functions expect standard names (`Z_AI_API_KEY`, `KIMI_API_KEY`)

---

## Recommendations

### Immediate Actions Required

1. **Obtain Valid Z.AI API Credentials**
   - Contact Z.AI support to verify API key status
   - Request new API key with access to `/paas/v4/chat/completions` endpoint
   - Alternatively, use OpenRouter with working credentials

2. **Obtain General-Purpose Kimi API Key**
   - Current `KIMI_API_KEY` is restricted to coding agents
   - Request/generate a general-purpose API key for game-reveal function
   - Or switch to alternative AI provider (Anthropic, OpenAI, etc.)

3. **Add Kimi_Base_API to Environment**
   - Verify if user has added this secret
   - If yes, add to `.env.local` and `supabase/functions/.env`
   - If no, clarify which API key should be used

### Medium-Term Improvements

1. **Implement API Key Health Checks**
   - Add automated testing for API endpoints
   - Monitor API key validity and quota usage
   - Implement alerts for authentication failures

2. **Add More AI Provider Options**
   - Implement Anthropic API as additional fallback
   - Add OpenAI API support for game scenarios and roasts
   - Create provider selection based on availability and cost

3. **Environment Variable Standardization**
   - Update `supabase/functions/.env` to use consistent key names
   - Document all required environment variables
   - Add validation for required vs optional keys

### Long-Term Recommendations

1. **API Key Management System**
   - Implement secure API key rotation
   - Use key management service (AWS Secrets Manager, HashiCorp Vault)
   - Separate development and production keys

2. **Monitoring and Logging**
   - Add detailed logging for AI API calls
   - Track success/failure rates per provider
   - Implement retry logic with exponential backoff

3. **Cost Optimization**
   - Monitor AI API usage and costs
   - Implement caching for similar requests
   - Consider using smaller/faster models for simple tasks

---

## Next Steps

### Day 1
- [ ] Verify `Kimi_Base_API` secret status with user
- [ ] Contact Z.AI support for API key verification
- [ ] Request general-purpose Kimi API key
- [ ] Test OpenRouter with working credentials if available

### Day 2
- [ ] Update environment variables with new valid keys
- [ ] Re-test all endpoints
- [ ] Update fallback mechanisms if needed
- [ ] Document working API configuration

### Day 3
- [ ] Implement additional fallback providers
- [ ] Add API key health checks
- [ ] Update deployment documentation
- [ ] Create runbook for API key management

---

## Test Results Summary

| Test | Endpoint | Status | Error |
|------|----------|--------|-------|
| Z.AI Direct | `https://api.z.ai/api/paas/v4/chat/completions` | ❌ 401 | Authorization Failure |
| Kimi Direct | `https://api.kimi.com/coding/v1/chat/completions` | ❌ 403 | Access Denied (Coding Agent Only) |
| OpenRouter | `https://openrouter.ai/api/v1/chat/completions` | ❌ 401 | No cookie auth credentials |
| Moonshot | `https://api.moonshot.cn/v1/chat/completions` | ❌ 401 | Invalid Authentication |
| MiniMax | `https://api.minimax.chat/v1/text/chatcompletion_v2` | ❌ 2049 | Invalid API Key |

**Success Rate:** 0/5 (0%)

---

## Appendix

### Updated Files

1. `supabase/functions/test-zai/index.ts` - Version 4
2. `supabase/functions/test-kimi/index.ts` - Version 5
3. `supabase/functions/game-scenario/index.ts` - Version 18
4. `supabase/functions/game-reveal/index.ts` - Version 21

### Environment Files Modified

- `.env.local` - Already has Z_AI_API_KEY and KIMI_API_KEY
- `supabase/functions/.env` - Needs update to match standard names

### Deployment Status

All functions deployed successfully with `verify_jwt: false` for testing purposes.

---

**Report Version:** 1.0  
**Last Updated:** 2026-01-09  
**Next Review:** 2026-01-10 (after API key resolution)
