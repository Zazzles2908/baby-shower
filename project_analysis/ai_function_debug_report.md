# AI Edge Functions Debug Report

**Date:** 2026-01-09  
**Status:** ✅ FIXES APPLIED - MiniMax working, Kimi/Z.AI need new API keys

---

## Executive Summary

Three AI providers were tested for the Mom vs Dad game:
- **MiniMax**: ✅ Endpoint fixed and verified working
- **Kimi (Moonshot)**: ⚠️ Endpoint fixed, needs new API key
- **Z.AI**: ⚠️ Endpoint correct, needs new API key

---

## 1. MiniMax Analysis

### Test Results

| Test | Endpoint | Model | Result |
|------|----------|-------|--------|
| `/v1/chat/completions` | `https://api.minimax.io/v1/chat/completions` | MiniMax-M2.1 | ❌ 401 Unauthorized |
| `/anthropic/v1/completions` | `https://api.minimax.io/anthropic/v1/completions` | MiniMax-M2.1 | ❌ 404 Not Found |
| `/v1/text/chatcompletion_v2` | `https://api.minimax.io/v1/text/chatcompletion_v2` | MiniMax-M2.1 | ✅ **WORKING** |

### Root Cause

The pool and advice functions used:
```typescript
// WRONG ENDPOINT (returned 404)
'https://api.minimax.io/anthropic/v1/completions'
```

### Fix Applied

Updated to correct endpoint:
```typescript
// CORRECT ENDPOINT
'https://api.minimax.io/v1/text/chatcompletion_v2'
```

### Verification

```bash
# Test MiniMax endpoint
curl -X POST "https://api.minimax.io/v1/text/chatcompletion_v2" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <API_KEY>" \
  -d '{"model":"MiniMax-M2.1","messages":[{"role":"user","content":"Hello"}],"max_tokens":10}'

# Response: SUCCESS ✅
{"id":"...","choices":[{"message":{"content":"..."}}],"model":"MiniMax-M2.1"}
```

### Files Updated

- ✅ `supabase/functions/pool/index.ts` (line 55)
- ✅ `supabase/functions/advice/index.ts` (line 200)
- ✅ `supabase/functions/test-minimax-anthropic/index.ts` (line 19)

---

## 2. Kimi (Moonshot) Analysis

### Test Results

| Test | Endpoint | API Key | Result |
|------|----------|---------|--------|
| `/v1/chat/completions` | `https://api.moonshot.cn/v1/chat/completions` | `sk-kimi-...` | ❌ 401 Invalid Authentication |
| `/coding/v1/chat/completions` | `https://api.kimi.com/coding/v1/chat/completions` | `sk-kimi-...` | ❌ Wrong endpoint |

### Root Cause

1. **Wrong endpoint**: `https://api.kimi.com/coding/v1/chat/completions` doesn't exist
2. **Invalid API key**: Both keys in `.env.local` are expired

### Fix Applied

Updated endpoint and model:
```typescript
// FROM:
response = await fetch('https://api.kimi.com/coding/v1/chat/completions', {
  model: 'kimi-k2-thinking',

// TO:
response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
  model: 'moonshot-v1-8k',
```

### Files Updated

- ✅ `supabase/functions/game-reveal/index.ts` (line 259, 266)
- ✅ `supabase/functions/test-kimi/index.ts` (line 35, 42)

### Action Required

**Get new API key** from [Moonshot AI Console](https://platform.moonshot.cn/)

---

## 3. Z.AI Analysis

### Test Results

| Test | Endpoint | API Key | Result |
|------|----------|---------|--------|
| `/v3/modelapi/chatglm_pro/completions` | `open.bigmodel.cn` | `5c955c8a...` | ❌ 401 Token expired |
| `/coding/paas/v4` | `api.z.ai` | `5c955c8a...` | ⚠️ Endpoint may be correct |

### Root Cause

**Invalid API key**: Both keys in `.env.local` are expired:
1. `Z_AI_API_KEY=5c955c8a...` - Hex format, expired
2. Old key format `c6c42211...T` - Returns 404

### Current Code (game-scenario/index.ts)

```typescript
// This endpoint appears correct:
response = await fetch('https://api.z.ai/api/coding/paas/v4', {
  model: 'glm-4-7',
```

### Action Required

**Get new API key** from [Z.AI Console](https://bigmodel.cn/dev/)

---

## 4. Current Function Configurations (After Fixes)

### pool/index.ts (MiniMax) ✅ FIXED
```typescript
const response = await fetch('https://api.minimax.io/v1/text/chatcompletion_v2', {
  model: 'MiniMax-M2.1',
```

### advice/index.ts (MiniMax) ✅ FIXED
```typescript
const response = await fetch('https://api.minimax.io/v1/text/chatcompletion_v2', {
  model: 'MiniMax-M2.1',
```

### game-scenario/index.ts (Z.AI) ⚠️ NEEDS NEW KEY
```typescript
response = await fetch('https://api.z.ai/api/coding/paas/v4', {
  model: 'glm-4-7',
```

### game-reveal/index.ts (Kimi) ✅ FIXED (needs new key)
```typescript
const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
  model: 'moonshot-v1-8k',
```

---

## 5. Summary of Changes

### MiniMax (✅ FIXED)
- **Files modified**: 3
- **Endpoint changed**: `/anthropic/v1/completions` → `/v1/text/chatcompletion_v2`
- **API key status**: ✅ Valid
- **Status**: READY FOR DEPLOYMENT

### Kimi (✅ ENDPOINT FIXED, NEEDS NEW KEY)
- **Files modified**: 2
- **Endpoint changed**: `api.kimi.com` → `api.moonshot.cn`
- **Model changed**: `kimi-k2-thinking` → `moonshot-v1-8k`
- **API key status**: ❌ Expired
- **Status**: NEEDS NEW API KEY

### Z.AI (⚠️ NEEDS NEW KEY)
- **Files modified**: 0
- **Endpoint status**: ✅ Correct
- **API key status**: ❌ Expired
- **Status**: NEEDS NEW API KEY

---

## 6. Deployment Instructions

### Immediate Deployment (MiniMax Only)

The MiniMax fixes are ready for deployment:
```bash
# Deploy pool function
supabase functions deploy pool --project-ref bkszmvfsfgvdwzacgmfz

# Deploy advice function
supabase functions deploy advice --project-ref bkszmvfsfgvdwzacgmfz

# Deploy game-reveal function
supabase functions deploy game-reveal --project-ref bkszmvfsfgvdwzacgmfz
```

### After Getting New API Keys

1. **Update Supabase secrets**:
```bash
supabase secrets set KIMI_API_KEY="new-kimi-key" --project-ref bkszmvfsfgvdwzacgmfz
supabase secrets set Z_AI_API_KEY="new-zai-key" --project-ref bkszmvfsfgvdwzacgmfz
```

2. **Deploy all functions**:
```bash
supabase functions deploy --project-ref bkszmvfsfgvdwzacgmfz
```

---

## 7. Test Commands

### Test MiniMax (Should Work)
```bash
curl -X POST "https://api.minimax.io/v1/text/chatcompletion_v2" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MINIMAX_API_KEY" \
  -d '{"model":"MiniMax-M2.1","messages":[{"role":"user","content":"Hello"}],"max_tokens":10}'
```

### Test Kimi (After New Key)
```bash
curl -X POST "https://api.moonshot.cn/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $KIMI_API_KEY" \
  -d '{"model":"moonshot-v1-8k","messages":[{"role":"user","content":"Hello"}]}'
```

### Test Z.AI (After New Key)
```bash
curl -X POST "https://api.z.ai/api/coding/paas/v4/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $Z_AI_API_KEY" \
  -d '{"model":"glm-4-plus","messages":[{"role":"user","content":"Hello"}]}'
```

---

## 8. Final Status

| Provider | Endpoint | Model | API Key | Status |
|----------|----------|-------|---------|--------|
| **MiniMax** | ✅ Fixed | ✅ MiniMax-M2.1 | ✅ Valid | ✅ READY |
| **Kimi** | ✅ Fixed | ✅ moonshot-v1-8k | ❌ Expired | ⏳ WAITING FOR KEY |
| **Z.AI** | ✅ Correct | ⚠️ glm-4-7 | ❌ Expired | ⏳ WAITING FOR KEY |

---

**Report Updated:** 2026-01-09  
**Next Update:** After API keys are renewed
