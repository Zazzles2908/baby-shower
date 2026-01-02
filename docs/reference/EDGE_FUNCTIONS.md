# Edge Functions Reference - Baby Shower App

**Last Updated**: 2026-01-02  
**Version**: 1.1  
**Purpose**: Supabase Edge Function specifications and API reference

---

## Quick Links

- [Environment Variable Configuration](../EDGE_FUNCTIONS_ENV_CONFIG.md) - How to configure `MINIMAX_API_KEY` and other variables
- [Deploy Edge Functions](../DEPLOYMENT.md) - Deployment instructions

---

## Table of Contents

1. [Function Overview](#function-overview)
2. [Guestbook Function](#guestbook-function)
3. [Vote Function](#vote-function)
4. [Pool Function](#pool-function)
5. [Quiz Function](#quiz-function)
6. [Advice Function](#advice-function)
7. [Common Patterns](#common-patterns)
8. [Error Handling](#error-handling)
9. [Testing](#testing)

---

## Function Overview

The Baby Shower app uses 5 Supabase Edge Functions built with Deno:

| Function | Endpoint | Purpose |
|----------|----------|---------|
| Guestbook | `/functions/v1/guestbook` | Handle guestbook submissions |
| Vote | `/functions/v1/vote` | Handle name voting submissions |
| Pool | `/functions/v1/pool` | Handle baby pool predictions |
| Quiz | `/functions/v1/quiz` | Handle emoji quiz answers |
| Advice | `/functions/v1/advice` | Handle advice capsule submissions |

### Base URL

```
https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/
```

### Authentication

All functions require:
- `Authorization: Bearer <ANON_KEY>`
- `apikey: <ANON_KEY>`

---

## Guestbook Function

### Endpoint

```
POST /functions/v1/guestbook
```

### Request Headers

```http
Content-Type: application/json
Authorization: Bearer <ANON_KEY>
apikey: <ANON_KEY>
```

### Request Body

```json
{
  "name": "Guest Name",
  "relationship": "Friend",
  "message": "Congratulations on your baby girl!"
}
```

### Validation Rules

| Field | Required | Max Length | Sanitization |
|-------|----------|------------|--------------|
| `name` | Yes | 100 chars | Trim whitespace |
| `relationship` | No | 50 chars | Trim whitespace |
| `message` | Yes | 1000 chars | Trim whitespace |

### Example Response

**Success (200)**:
```json
{
  "success": true,
  "message": "Wish saved successfully!",
  "data": {
    "id": 42,
    "created_at": "2026-01-02T00:15:00Z"
  }
}
```

**Error (400)**:
```json
{
  "success": false,
  "error": "Validation failed: name is required"
}
```

### Database Insert

```sql
INSERT INTO public.submissions (name, activity_type, activity_data)
VALUES (
    'Guest Name',
    'guestbook',
    '{
        "name": "Guest Name",
        "relationship": "Friend",
        "message": "Congratulations on your baby girl!"
    }'::jsonb
);
```

---

## Vote Function

### Endpoint

```
POST /functions/v1/vote
```

### Request Body

```json
{
  "names": ["Emma", "Olivia", "Sophia"],
  "name": "Voter Name"
}
```

### Validation Rules

| Field | Required | Rules | Sanitization |
|-------|----------|-------|--------------|
| `names` | Yes | Array, 1-3 items, max 50 chars each | Trim whitespace |
| `name` | Yes | Max 100 chars | Trim whitespace |

### Example Response

**Success (200)**:
```json
{
  "success": true,
  "message": "Your votes have been recorded!",
  "data": {
    "id": 43,
    "created_at": "2026-01-02T00:15:01Z"
  }
}
```

### Database Insert

```sql
INSERT INTO public.submissions (name, activity_type, activity_data)
VALUES (
    'Voter Name',
    'voting',
    '{
        "names": ["Emma", "Olivia", "Sophia"]
    }'::jsonb
);
```

---

## Pool Function

### Endpoint

```
POST /functions/v1/pool
```

### Request Body

```json
{
  "name": "Predictor Name",
  "date_guess": "2026-03-15",
  "time_guess": "14:30",
  "weight_guess": 3.4,
  "length_guess": 51
}
```

### Validation Rules

| Field | Required | Rules | Sanitization |
|-------|----------|-------|--------------|
| `name` | Yes | Max 100 chars | Trim whitespace |
| `date_guess` | Yes | Date format YYYY-MM-DD | - |
| `time_guess` | No | Time format HH:MM | - |
| `weight_guess` | No | Number, 1-10 kg | - |
| `length_guess` | No | Number, 30-70 cm | - |

### Example Response

**Success (200)**:
```json
{
  "success": true,
  "message": "Your prediction has been recorded!",
  "data": {
    "id": 44,
    "created_at": "2026-01-02T00:15:02Z"
  }
}
```

### Database Insert

```sql
INSERT INTO public.submissions (name, activity_type, activity_data)
VALUES (
    'Predictor Name',
    'baby_pool',
    '{
        "name": "Predictor Name",
        "date_guess": "2026-03-15",
        "time_guess": "14:30",
        "weight_guess": 3.4,
        "length_guess": 51
    }'::jsonb
);
```

---

## Quiz Function

### Endpoint

```
POST /functions/v1/quiz
```

### Request Body

```json
{
  "name": "Quizzer Name",
  "answers": ["Baby Shower", "Three Little Pigs", "Rock a Bye Baby", "Baby Bottle", "Diaper Change"],
  "score": 5,
  "totalQuestions": 5
}
```

### Validation Rules

| Field | Required | Rules | Sanitization |
|-------|----------|-------|--------------|
| `name` | Yes | Max 100 chars | Trim whitespace |
| `answers` | Yes | Array of 5 strings | Trim each |
| `score` | Yes | Integer 0-5 | - |
| `totalQuestions` | Yes | Integer 5 | - |

### Example Response

**Success (200)**:
```json
{
  "success": true,
  "message": "Your answers have been submitted!",
  "data": {
    "id": 45,
    "created_at": "2026-01-02T00:15:03Z"
  }
}
```

### Database Insert

```sql
INSERT INTO public.submissions (name, activity_type, activity_data)
VALUES (
    'Quizzer Name',
    'quiz',
    '{
        "name": "Quizzer Name",
        "answers": ["Baby Shower", "Three Little Pigs", "Rock a Bye Baby", "Baby Bottle", "Diaper Change"],
        "score": 5,
        "totalQuestions": 5
    }'::jsonb
);
```

---

## Advice Function (with AI Roasts)

### Endpoint

```
POST /functions/v1/advice
```

### AI Roasts Feature

The advice function now supports **AI-generated roasts** using MiniMax API. This feature generates witty, playful roasts for baby shower topics.

#### AI Roast Request

```json
{
  "name": "Advisor Name",
  "advice": "Any topic to roast about",
  "category": "ai_roast"
}
```

#### AI Roast Response

```json
{
  "success": true,
  "data": {
    "id": 46,
    "advice": "Oh look, another parent who thinks their baby will sleep through the night! 💤😅",
    "category": "ai_roast",
    "created_at": "2026-01-02T00:15:04Z",
    "ai_generated": true
  }
}
```

#### Environment Variables Required

| Variable | Description |
|----------|-------------|
| `MINIMAX_API_KEY` | API key for MiniMax AI service |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key for database operations |

**Configuration**: See [Edge Functions Environment Configuration](../EDGE_FUNCTIONS_ENV_CONFIG.md)

### Standard Advice Request

```json
{
  "name": "Advisor Name",
  "advice": "Sleep when the baby sleeps!",
  "category": "For Parents"
}
```

### Validation Rules

| Field | Required | Rules | Sanitization |
|-------|----------|-------|--------------|
| `name` | Yes | Max 100 chars | Trim whitespace |
| `advice` | Yes | Max 2000 chars | Trim whitespace |
| `category` | Yes | Valid category (see below) | - |

### Valid Categories

| Category | Description |
|----------|-------------|
| `For Parents` or `general` | Parenting advice |
| `For Baby` or `fun` | Fun activities for baby |
| `ai_roast` | AI-generated roast |
| `naming` | Baby name advice |
| `feeding` | Feeding tips |
| `sleeping` | Sleep training advice |
| `safety` | Safety recommendations |

### Example Response

**Success (200)**:
```json
{
  "success": true,
  "message": "Thank you for sharing your wisdom!",
  "data": {
    "id": 46,
    "created_at": "2026-01-02T00:15:04Z"
  }
}
```

### Database Insert

```sql
INSERT INTO public.submissions (name, activity_type, activity_data)
VALUES (
    'Advisor Name',
    'advice',
    '{
        "name": "Advisor Name",
        "advice": "Sleep when the baby sleeps!",
        "category": "For Parents"
    }'::jsonb
);
```

---

## Common Patterns

### CORS Headers

All functions include standard CORS headers:

```typescript
return new Response(JSON.stringify(response), {
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
    }
});
```

### Input Validation

```typescript
function validateInput(data: any, requiredFields: string[]): string[] {
    const errors: string[] = [];
    
    for (const field of requiredFields) {
        if (!data[field]) {
            errors.push(`${field} is required`);
        }
    }
    
    if (data.name && data.name.length > 100) {
        errors.push('name must be 100 characters or less');
    }
    
    return errors;
}
```

### Database Insert

```typescript
const { data, error } = await supabase
    .from('submissions')
    .insert({
        name: validatedData.name,
        activity_type: ACTIVITY_TYPE,
        activity_data: validatedData
    })
    .select()
    .single();
```

---

## Error Handling

### HTTP Status Codes

| Status | Meaning | Example |
|--------|---------|---------|
| 200 | Success | Request processed successfully |
| 400 | Bad Request | Validation failed |
| 401 | Unauthorized | Missing or invalid API key |
| 404 | Not Found | Function not found |
| 500 | Server Error | Database error |

### Error Response Format

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

---

## Testing

### Test Each Function

```bash
# Test guestbook function
curl -X POST https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/guestbook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"name":"Test","message":"Test message","relationship":"Friend"}'

# Test vote function
curl -X POST https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/vote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"names":["Emma","Olivia"],"name":"Test Voter"}'

# Test pool function
curl -X POST https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/pool \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"name":"Test Pooler","date_guess":"2026-03-15","weight_guess":3.4,"length_guess":51}'

# Test quiz function
curl -X POST https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/quiz \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"name":"Test Quizzer","answers":["a","b","c","d","e"],"score":5,"totalQuestions":5}'

# Test advice function (standard)
curl -X POST https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/advice \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"name":"Test Advisor","advice":"Test advice","category":"For Parents"}'

# Test AI Roast function
curl -X POST https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/advice \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"name":"Test Roaster","advice":"Sleep training","category":"ai_roast"}'
```

---

**Document Version**: 1.1  
**Last Updated**: 2026-01-02  
**Maintained By**: Development Team
