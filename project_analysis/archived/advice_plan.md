# Advice Component Strategic Plan

**Date:** January 9, 2026  
**Component:** Advice (Wisdom Capsule)  
**Status:** Partially Implemented - Requires Configuration and Cleanup

---

## 1. Executive Summary

The Advice component enables guests to share parenting wisdom with two delivery options: immediate sharing with parents ("For Parents") or time capsule storage for the child's 18th birthday ("For Baby"). The component has a well-structured Edge Function with AI roast capabilities but contains configuration inconsistencies that need resolution.

**Current State Assessment:**
- ✅ Functional Edge Function with proper security headers
- ✅ AI roast feature using MiniMax API
- ✅ Frontend with toggle interaction and success animations
- ⚠️ API model name inconsistency in MiniMax call
- ⚠️ No milestone detection in backend
- ⚠️ Frontend/backend character limit mismatch (500 vs 2000)
- ⚠️ Missing primary key constraint on advice table

**Priority Actions:**
1. Fix MiniMax API model name configuration
2. Align character limits between frontend and backend
3. Add milestone detection to Edge Function
4. Verify database schema has proper constraints
5. Configure `MINIMAX_API_KEY` environment variable

---

## 2. Current Implementation Analysis

### 2.1 Edge Function (`supabase/functions/advice/index.ts`)

**Architecture:**
- Deno runtime with TypeScript
- Uses shared security utilities (`../_shared/security.ts`)
- Direct Supabase client with service role for admin operations
- Schema set to `baby_shower` for proper table access

**Key Functions:**
| Function | Purpose |
|----------|---------|
| `handleAIRoast()` | AI roast generation via MiniMax API |
| `validateInput()` | Standardized input validation |
| Category normalization | Maps frontend values to database values |

**API Endpoint:** `POST /functions/v1/advice`

**Request Format:**
```typescript
{
  name?: string,        // Advice giver name
  advice?: string,      // Advice text (primary)
  message?: string,     // Advice text (alternative)
  category?: string,    // Delivery option (primary)
  adviceType?: string   // Delivery option (alternative)
}
```

**Category Mapping:**
| Frontend Value | Database Value |
|----------------|----------------|
| "For Parents" / "parents" / "general" | "general" |
| "For Baby" / "baby" / "fun" | "fun" |
| "18th birthday" / "time capsule" | "fun" |
| "AI Roast" | "ai_roast" |

### 2.2 Frontend Script (`scripts/advice.js`)

**Public API (`window.Advice`):**
```javascript
window.Advice = {
    init: initializeAdvice,
    validateAdviceForm: validateAdviceForm,
    getAdviceFormData: getAdviceFormData,
    resetAdviceForm: resetAdviceForm,
    getAdviceSuccessMessage: getAdviceSuccessMessage,
    getAdviceProgress: getAdviceProgress,
    checkAdviceMilestone: checkAdviceMilestone,
    getAdviceMilestoneMessage: getAdviceMilestoneMessage,
    getParentingTip: getParentingTip
}
```

**UI Components:**
- Toggle switch for delivery method (For Parents / For Baby)
- Success modal with envelope or time capsule animation
- Confetti particle effects for time capsule submissions
- Parenting tips display

**Form Validation:**
- Name: Required
- Advice Type: Required (toggle selection)
- Message: 2-500 characters

### 2.3 Database Schema (`baby_shower.advice`)

**Table Definition:**
```sql
CREATE TABLE IF NOT EXISTS "baby_shower"."advice" (
    "id" bigint NOT NULL,
    "advice_giver" "text" NOT NULL,
    "advice_text" "text" NOT NULL,
    "delivery_option" "text" NOT NULL,
    "is_approved" boolean DEFAULT false,
    "ai_generated" boolean DEFAULT false,
    "submitted_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);
```

**Issues:**
1. No explicit primary key constraint
2. No auto-increment (SERIAL) defined
3. Missing indexes for performance optimization

---

## 3. Identified Issues

### 3.1 Critical Issues

| Issue | Location | Impact | Severity |
|-------|----------|--------|----------|
| Incorrect MiniMax model name | `advice/index.ts:207` | AI roast may fail | High |
| Missing primary key on advice table | Database schema | Data integrity risk | High |
| No milestone detection in backend | `advice/index.ts` | No celebration at 10/20 entries | Medium |

### 3.2 Configuration Issues

| Issue | Current | Expected | Impact |
|-------|---------|----------|--------|
| Character limit mismatch | Frontend: 500, Backend: 2000 | Unified at 1000 | UX confusion |
| AI API key not verified | `MINIMAX_API_KEY` reference | Must be configured | AI feature unavailable |
| Missing database indexes | No indexes defined | Add `created_at` index | Query performance |

### 3.3 Code Quality Issues

| Issue | Location | Description |
|-------|----------|-------------|
| Hardcoded model name | `advice/index.ts:207` | `"MiniMax-M2.1"` should be `"abab6.5s-chat"` |
| No error recovery for AI | `handleAIRoast()` | Fails entirely if AI unavailable |
| Missing logging | Database insert | No success logging for non-AI submissions |

---

## 4. Configuration Requirements

### 4.1 Environment Variables

**Required for AI Roast Feature:**
```bash
# Supabase Environment Variables
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# AI API Key (Optional - feature works without it)
MINIMAX_API_KEY=your-minimax-api-key
```

**Configuration Location:** Supabase Dashboard → Settings → Edge Functions → Environment Variables

### 4.2 AI Model Configuration

**Current (Incorrect):**
```typescript
model: 'MiniMax-M2.1'
```

**Correct (Per AGENTS.md and pool function):**
```typescript
model: 'abab6.5s-chat'
```

**Recommended System Prompt:**
```typescript
content: `You are a witty, playful roast master for a baby shower. 
Keep it light-hearted, funny, and appropriate for all ages. 
Roast the parents or baby in a loving way. 
Max 280 characters. No profanity or offensive content.`
```

### 4.3 Frontend/Backend Alignment

**Recommended Character Limits:**
```javascript
// Frontend (advice.js)
const MAX_MESSAGE_LENGTH = 1000;  // Increased from 500

// Backend (advice/index.ts)
const validation = validateInput(body, {
  advice: { type: 'string', required: false, maxLength: 1000 },
  message: { type: 'string', required: false, maxLength: 1000 },
})
```

---

## 5. Implementation Plan

### 5.1 Phase 1: Critical Fixes (Day 1)

#### 5.1.1 Fix MiniMax API Model Name
**File:** `supabase/functions/advice/index.ts`
**Line:** 207

**Change:**
```typescript
// Before
model: 'MiniMax-M2.1',

// After
model: 'abab6.5s-chat',
```

**Risk:** Low - Simple string change
**Verification:** Test AI roast feature after change

#### 5.1.2 Add Primary Key to Advice Table
**File:** Database migration
**SQL:**
```sql
ALTER TABLE baby_shower.advice 
ADD CONSTRAINT advice_pkey PRIMARY KEY (id);

-- Add missing index
CREATE INDEX idx_advice_created_at 
ON baby_shower.advice(created_at DESC);
```

**Risk:** Medium - Requires table lock during constraint addition
**Timing:** Execute during low-traffic period

### 5.2 Phase 2: Configuration Alignment (Day 2)

#### 5.2.1 Align Character Limits
**File:** `scripts/advice.js`
**Change:** Lines 185-188

```typescript
// Before
if (message.length > 500) {
    alert('Message is too long (maximum 500 characters)');
    return false;
}

// After
if (message.length > 1000) {
    alert('Message is too long (maximum 1000 characters)');
    return false;
}
```

**File:** `supabase/functions/advice/index.ts`
**Change:** Lines 82-83

```typescript
// Before
advice: { type: 'string', required: false, maxLength: 2000 },
message: { type: 'string', required: false, maxLength: 2000 },

// After
advice: { type: 'string', required: false, maxLength: 1000 },
message: { type: 'string', required: false, maxLength: 1000 },
```

**Risk:** Low - Validation alignment

#### 5.2.2 Add Success Logging
**File:** `supabase/functions/advice/index.ts`
**Location:** After successful insert (around line 165)

```typescript
// Add logging for non-AI submissions
console.log(`[advice] Successfully inserted advice with id: ${data[0]?.id}`)
```

**Risk:** None - Logging only

### 5.3 Phase 3: Enhancement (Day 3)

#### 5.3.1 Add Milestone Detection
**File:** `supabase/functions/advice/index.ts`
**Location:** After database insert, before response

```typescript
// Check for milestone (10 submissions)
const { count: adviceCount } = await supabase
    .from('advice')
    .select('*', { count: 'exact', head: true })

let milestone = undefined
if (adviceCount === 10) {
    milestone = 'ADVICE_10'
    console.log('[advice] Milestone reached: 10 submissions!')
} else if (adviceCount === 20) {
    milestone = 'ADVICE_20'
    console.log('[advice] Milestone reached: 20 submissions!')
}
```

**Risk:** Low - Additional query, minimal performance impact

#### 5.3.2 Configure AI API Key
**Location:** Supabase Dashboard → Settings → Edge Functions

```bash
MINIMAX_API_KEY=your-minimax-api-key-here
```

**Verification:**
1. Deploy updated Edge Function
2. Test AI Roast option
3. Verify success response with `ai_generated: true`

---

## 6. Integration Points

### 6.1 API Integration

**Frontend API Call (`scripts/api-supabase-enhanced.js`):**
```javascript
async function submitAdvice(data) {
    const response = await fetch('/functions/v1/advice', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
            name: data.name,
            advice: data.message,
            category: data.category  // 'general' or 'fun'
        })
    })
    return handleResponse(response)
}
```

### 6.2 Database Operations

**Insert Query:**
```typescript
const { data, error } = await supabase
    .from('advice')
    .insert({
        advice_giver: name,
        advice_text: sanitizedAdvice,
        delivery_option: finalCategory,
        submitted_by: name,
    })
    .select()
    .single()
```

### 6.3 Real-time Updates

**Subscription Channel:** Not currently implemented for advice
**Recommendation:** Add Supabase subscription for live advice updates (future enhancement)

---

## 7. Success Criteria

### 7.1 Functional Requirements

| Criteria | Status | Verification Method |
|----------|--------|---------------------|
| Submit advice with "For Parents" option | ✅ | Manual test |
| Submit advice with "For Baby" option | ✅ | Manual test |
| AI Roast generates witty commentary | ⚠️ | Test with API key configured |
| Form validation works correctly | ✅ | Test with invalid inputs |
| Success animations display | ✅ | Visual verification |
| Advice stored in database | ✅ | Check baby_shower.advice table |

### 7.2 Performance Requirements

| Criteria | Target | Current |
|----------|--------|---------|
| API response time | < 500ms | Unknown |
| Database insert time | < 200ms | Unknown |
| AI roast generation | < 10s | Unknown (timeout set) |

### 7.3 Quality Requirements

| Criteria | Target | Verification |
|----------|--------|--------------|
| Character limit enforcement | 1000 chars | Test overflow input |
| XSS prevention | Sanitized input | Security review |
| SQL injection prevention | Parameterized queries | Code review |
| Error messages | User-friendly | Test error scenarios |

---

## 8. Dependencies

### 8.1 External Dependencies

| Dependency | Version | Purpose | Status |
|------------|---------|---------|--------|
| Deno Runtime | 1.x | Edge Function execution | ✅ Available |
| Supabase JS | v2 | Database client | ✅ Installed |
| MiniMax API | abab6.5s-chat | AI roast generation | ⚠️ API key required |
| Security Utilities | shared/security.ts | Validation, CORS, errors | ✅ Available |

### 8.2 Internal Dependencies

| Component | Dependency Type | Details |
|-----------|-----------------|---------|
| `scripts/config.js` | Configuration | Milestone thresholds |
| `scripts/main.js` | Integration | Form submission handler |
| `scripts/api-supabase-enhanced.js` | API Client | HTTP calls to Edge Function |
| `supabase/functions/_shared/security.ts` | Utilities | Validation, headers |

---

## 9. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| AI API key not configured | Medium | Feature unavailable | Graceful fallback with user message |
| Database constraint addition fails | Low | Data integrity issue | Test on staging first, backup data |
| MiniMax API model deprecation | Medium | AI feature breaks | Monitor API changes, have fallback model |
| Character limit change breaks UI | Low | UX issue | Update both frontend and backend together |

---

## 10. Testing Plan

### 10.1 Unit Tests

**Test File:** `tests/unit/advice-validation.test.js`
```javascript
describe('Advice Form Validation', () => {
    test('rejects empty name', () => {
        const result = validateAdviceForm(mockForm)
        expect(result).toBe(false)
    })
    
    test('rejects message under 2 characters', () => {
        const result = validateAdviceForm(mockForm)
        expect(result).toBe(false)
    })
    
    test('rejects message over 1000 characters', () => {
        const result = validateAdviceForm(mockForm)
        expect(result).toBe(false)
    })
})
```

### 10.2 Integration Tests

**Test File:** `tests/e2e/advice.test.js`
```javascript
describe('Advice E2E Tests', () => {
    test('submit advice to parents', async () => {
        const response = await apiHelpers.advice.submitAdvice({
            name: 'Test Advisor',
            category: 'general',
            message: 'Trust your instincts!'
        })
        expect(response.success).toBe(true)
    })
    
    test('submit advice to baby', async () => {
        const response = await apiHelpers.advice.submitAdvice({
            name: 'Test Advisor',
            category: 'fun',
            message: 'Welcome to the world!'
        })
        expect(response.success).toBe(true)
    })
})
```

### 10.3 Manual Testing Checklist

- [ ] Submit advice with "For Parents" option
- [ ] Submit advice with "For Baby" option
- [ ] Test AI Roast (if API key configured)
- [ ] Verify success animation displays
- [ ] Test with 1000 character message (should pass)
- [ ] Test with 1001 character message (should fail)
- [ ] Verify advice appears in database
- [ ] Test error handling with invalid JSON
- [ ] Test with missing required fields

---

## 11. Timeline Estimate

| Phase | Task | Effort | Duration |
|-------|------|--------|----------|
| Phase 1 | Fix MiniMax model name | 1 hour | Day 1 |
| Phase 1 | Add database constraints | 2 hours | Day 1 |
| Phase 2 | Align character limits | 1 hour | Day 2 |
| Phase 2 | Add success logging | 30 min | Day 2 |
| Phase 3 | Add milestone detection | 2 hours | Day 3 |
| Phase 3 | Configure API key | 1 hour | Day 3 |
| **Total** | | **7.5 hours** | **3 days** |

---

## 12. Recommendations

### 12.1 Immediate Actions

1. **Fix MiniMax model name** - Change `"MiniMax-M2.1"` to `"abab6.5s-chat"` in `advice/index.ts:207`

2. **Align character limits** - Update frontend to 1000 characters to match backend

3. **Add database constraints** - Execute SQL to add primary key and index

### 12.2 Short-term Enhancements

1. **Add milestone celebration** - Backend detection of 10/20 submissions with frontend confetti

2. **Implement AI fallback** - Graceful degradation when MiniMax API unavailable

3. **Add real-time updates** - Supabase subscription for live advice feed

### 12.3 Long-term Improvements

1. **AI personality options** - Allow users to choose roast style (gentle, funny, sarcastic)

2. **Advice analytics** - Show most common advice themes

3. **Photo attachments** - Allow photos with advice submissions (time capsule feature)

---

## 13. Appendix

### 13.1 Related Files

| File | Purpose |
|------|---------|
| `supabase/functions/advice/index.ts` | Main Edge Function |
| `scripts/advice.js` | Frontend feature script |
| `scripts/main.js` | Main application (form handler) |
| `scripts/api-supabase-enhanced.js` | API client |
| `supabase/functions/_shared/security.ts` | Security utilities |

### 13.2 Database Tables

| Table | Purpose |
|-------|---------|
| `baby_shower.advice` | Advice submissions |
| `baby_shower.submissions` | Unified activity submissions |
| `baby_shower.advice_entries` | View for aggregated advice |

### 13.3 API Keys Required

| Key | Purpose | Provider |
|-----|---------|----------|
| `MINIMAX_API_KEY` | AI roast generation | MiniMax |
| `SUPABASE_URL` | Database connection | Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin database access | Supabase |

---

**Document Version:** 1.0  
**Created:** January 9, 2026  
**Author:** Strategic Planning Agent
