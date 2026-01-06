# Standardized Edge Function Pattern

**Purpose:** This document establishes the official pattern for all Supabase Edge Functions in the Baby Shower V2 project. Following this pattern ensures consistency, security, and maintainability.

**Status:** ✅ **MANDATORY** - All new Edge Functions must follow this pattern.

---

## Table of Contents

1. [The Problem](#the-problem)
2. [The Solution](#the-solution)
3. [Standard Pattern](#standard-pattern)
4. [Implementation Checklist](#implementation-checklist)
5. [Code Templates](#code-templates)
6. [Common Mistakes](#common-mistakes)
7. [Best Practices](#best-practices)
8. [Migration Guide](#migration-guide)

---

## The Problem

### Before: Inconsistent Security Implementation

Some Edge Functions used **direct PostgreSQL clients** with **weak security headers**:

```typescript
// ❌ BAD PATTERN - Direct PostgreSQL client
import { Client } from 'https://deno.land/x/postgres@v0.17.0/mod.ts'

function getDbClient(): Client {
  const connectionString = Deno.env.get('POSTGRES_URL') ?? ''
  return new Client(connectionString)
}

const headers = new Headers({
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
  // Missing: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
})
```

**Issues:**
- No environment variable validation
- Missing security headers
- Manual error handling (inconsistent responses)
- Direct SQL queries instead of Supabase client
- Connection management complexity

### After: Consistent Security Implementation

All Edge Functions now use **Supabase client** with **standardized security utilities**:

```typescript
// ✅ GOOD PATTERN - Supabase client with security utilities
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { 
  validateEnvironmentVariables, 
  createErrorResponse, 
  createSuccessResponse,
  validateInput,
  CORS_HEADERS,
  SECURITY_HEADERS
} from '../_shared/security.ts'

const headers = new Headers({ 
  ...CORS_HEADERS, 
  ...SECURITY_HEADERS, 
  'Content-Type': 'application/json' 
})
```

---

## The Solution

### Core Components

1. **Supabase Client** - Instead of direct PostgreSQL
2. **Security Utilities** - Standardized imports from `../_shared/security.ts`
3. **Consistent Response Patterns** - `createErrorResponse()` and `createSuccessResponse()`
4. **Input Validation** - `validateInput()` for all user inputs
5. **Environment Validation** - `validateEnvironmentVariables()` at startup

### Files Modified

| File | Status | Changes |
|------|--------|---------|
| `game-session/index.ts` | ✅ Fixed | Direct Postgres → Supabase client + security utilities |
| `game-scenario/index.ts` | ✅ Fixed | Direct Postgres → Supabase client + security utilities |
| `game-vote/index.ts` | ✅ Reference | Already uses correct pattern |
| `_shared/security.ts` | ✅ Reference | Security utilities implementation |

---

## Standard Pattern

### Required Imports

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { 
  validateEnvironmentVariables, 
  createErrorResponse, 
  createSuccessResponse,
  validateInput,
  CORS_HEADERS,
  SECURITY_HEADERS
} from '../_shared/security.ts'
```

### Required Response Headers

```typescript
const headers = new Headers({ 
  ...CORS_HEADERS, 
  ...SECURITY_HEADERS, 
  'Content-Type': 'application/json' 
})
```

### Standard Function Structure

```typescript
serve(async (req: Request) => {
  // 1. Build headers first
  const headers = new Headers({ 
    ...CORS_HEADERS, 
    ...SECURITY_HEADERS, 
    'Content-Type': 'application/json' 
  })

  // 2. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  // 3. Validate HTTP method
  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405)
  }

  try {
    // 4. Validate environment variables
    const envValidation = validateEnvironmentVariables([
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ])

    if (!envValidation.isValid) {
      console.error('Function - Environment validation failed:', envValidation.errors)
      return createErrorResponse('Server configuration error', 500)
    }

    // 5. Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 6. Parse and validate request body
    let body: YourRequestType
    try {
      body = await req.json()
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400)
    }

    // 7. Input validation
    const validation = validateInput(body, {
      field1: { type: 'string', required: true, minLength: 1, maxLength: 100 },
      field2: { type: 'number', required: true, min: 0, max: 100 },
      // ... validation rules
    })

    if (!validation.isValid) {
      console.error('Function - Validation failed:', validation.errors)
      return createErrorResponse('Validation failed', 400, validation.errors)
    }

    // 8. Business logic using Supabase client
    const { data, error } = await supabase
      .from('your_table')
      .select('*')
      .eq('field', validation.sanitized.field1)
      .single()

    if (error) {
      throw error
    }

    // 9. Return success response
    return createSuccessResponse({
      message: 'Operation completed successfully',
      data: data
    }, 200)

  } catch (error) {
    console.error('Function - Unexpected error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})
```

---

## Implementation Checklist

When creating a new Edge Function or refactoring an existing one:

### Step 1: Imports ✅
- [ ] Import `serve` from `https://deno.land/std@0.168.0/http/server.ts`
- [ ] Import `createClient` from `https://esm.sh/@supabase/supabase-js@2`
- [ ] Import all security utilities from `../_shared/security.ts`

### Step 2: Headers ✅
- [ ] Build headers with `CORS_HEADERS`, `SECURITY_HEADERS`, and `'Content-Type': 'application/json'`
- [ ] Handle CORS preflight (OPTIONS method)

### Step 3: Environment Validation ✅
- [ ] Call `validateEnvironmentVariables()` with required and optional variables
- [ ] Handle invalid environment (return 500)
- [ ] Log warnings for optional missing variables

### Step 4: Supabase Client ✅
- [ ] Initialize with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Configure auth: `{ autoRefreshToken: false, persistSession: false }`

### Step 5: Request Handling ✅
- [ ] Validate HTTP method (typically POST)
- [ ] Parse JSON body with error handling
- [ ] Return 400 for invalid JSON

### Step 6: Input Validation ✅
- [ ] Use `validateInput()` for all user inputs
- [ ] Define validation rules for each field
- [ ] Handle validation errors (return 400 with details)

### Step 7: Database Operations ✅
- [ ] Use Supabase client instead of direct PostgreSQL
- [ ] Use `.select()`, `.insert()`, `.update()`, `.delete()` methods
- [ ] Handle errors with proper error messages

### Step 8: Responses ✅
- [ ] Use `createSuccessResponse()` for successful operations
- [ ] Use `createErrorResponse()` for all error cases
- [ ] Include appropriate HTTP status codes

### Step 9: Error Handling ✅
- [ ] Wrap all logic in try-catch
- [ ] Log errors with context
- [ ] Return generic error message to client (don't expose internal details)

---

## Code Templates

### Template 1: Simple CRUD Function

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { 
  validateEnvironmentVariables, 
  createErrorResponse, 
  createSuccessResponse,
  validateInput,
  CORS_HEADERS,
  SECURITY_HEADERS
} from '../_shared/security.ts'

interface CreateItemRequest {
  name: string
  description?: string
  quantity: number
}

serve(async (req: Request) => {
  const headers = new Headers({ 
    ...CORS_HEADERS, 
    ...SECABASE_HEADERS, 
    'Content-Type': 'application/json' 
  })

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405)
  }

  try {
    // Validate environment
    const envValidation = validateEnvironmentVariables([
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ])

    if (!envValidation.isValid) {
      return createErrorResponse('Server configuration error', 500)
    }

    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Parse and validate body
    let body: CreateItemRequest
    try {
      body = await req.json()
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400)
    }

    const validation = validateInput(body, {
      name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
      description: { type: 'string', required: false, maxLength: 500 },
      quantity: { type: 'number', required: true, min: 1, max: 1000 }
    })

    if (!validation.isValid) {
      return createErrorResponse('Validation failed', 400, validation.errors)
    }

    // Create item
    const { data, error } = await supabase
      .from('items')
      .insert(validation.sanitized)
      .select()
      .single()

    if (error) {
      console.error('Create item error:', error)
      return createErrorResponse('Failed to create item', 500)
    }

    return createSuccessResponse({ item: data }, 201)

  } catch (error) {
    console.error('Unexpected error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})
```

### Template 2: Function with Multiple Actions

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { 
  validateEnvironmentVariables, 
  createErrorResponse, 
  createSuccessResponse,
  validateInput,
  CORS_HEADERS,
  SECURITY_HEADERS
} from '../_shared/security.ts'

interface BaseRequest {
  action: 'create' | 'read' | 'update' | 'delete'
}

interface CreateRequest extends BaseRequest {
  action: 'create'
  name: string
  value: number
}

interface ReadRequest extends BaseRequest {
  action: 'read'
  id: string
}

type ItemRequest = CreateRequest | ReadRequest

serve(async (req: Request) => {
  const headers = new Headers({ 
    ...CORS_HEADERS, 
    ...SECURITY_HEADERS, 
    'Content-Type': 'application/json' 
  })

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405)
  }

  try {
    const envValidation = validateEnvironmentVariables([
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ])

    if (!envValidation.isValid) {
      return createErrorResponse('Server configuration error', 500)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    let body: ItemRequest
    try {
      body = await req.json()
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400)
    }

    if (!body.action) {
      return createErrorResponse('Action is required', 400)
    }

    switch (body.action) {
      case 'create':
        return handleCreate(supabase, body as CreateRequest, headers)
      case 'read':
        return handleRead(supabase, body as ReadRequest, headers)
      default:
        return createErrorResponse('Invalid action', 400)
    }

  } catch (error) {
    console.error('Unexpected error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})

async function handleCreate(supabase: any, body: CreateRequest, headers: Headers): Promise<Response> {
  const validation = validateInput(body, {
    action: { type: 'string', required: true },
    name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
    value: { type: 'number', required: true, min: 0 }
  })

  if (!validation.isValid) {
    return createErrorResponse('Validation failed', 400, validation.errors)
  }

  const { data, error } = await supabase
    .from('items')
    .insert({ name: body.name, value: body.value })
    .select()
    .single()

  if (error) {
    return createErrorResponse('Failed to create item', 500)
  }

  return createSuccessResponse({ item: data }, 201)
}

async function handleRead(supabase: any, body: ReadRequest, headers: Headers): Promise<Response> {
  const validation = validateInput(body, {
    action: { type: 'string', required: true },
    id: { type: 'string', required: true }
  })

  if (!validation.isValid) {
    return createErrorResponse('Validation failed', 400, validation.errors)
  }

  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('id', body.id)
    .single()

  if (error || !data) {
    return createErrorResponse('Item not found', 404)
  }

  return createSuccessResponse({ item: data }, 200)
}
```

---

## Common Mistakes

### Mistake 1: Direct PostgreSQL Client

```typescript
// ❌ WRONG
import { Client } from 'https://deno.land/x/postgres@v0.17.0/mod.ts'
const client = new Client(connectionString)
await client.connect()
await client.queryObject(...)
await client.end()

// ✅ CORRECT
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const supabase = createClient(url, key)
const { data, error } = await supabase.from('table').select('*')
```

### Mistake 2: Manual Security Headers

```typescript
// ❌ WRONG - Manual, incomplete headers
const headers = new Headers({
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
})

// ✅ CORRECT - Using security utilities
const headers = new Headers({ 
  ...CORS_HEADERS, 
  ...SECURITY_HEADERS, 
  'Content-Type': 'application/json' 
})
```

### Mistake 3: Manual Error Responses

```typescript
// ❌ WRONG - Inconsistent error format
return new Response(
  JSON.stringify({ error: 'Something went wrong' }),
  { status: 500, headers }
)

// ✅ CORRECT - Standardized error response
return createErrorResponse('Something went wrong', 500)
```

### Mistake 4: Missing Environment Validation

```typescript
// ❌ WRONG - Assumes env vars exist
const url = Deno.env.get('SUPABASE_URL')!
const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// ✅ CORRECT - Validates env vars
const envValidation = validateEnvironmentVariables([
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
])

if (!envValidation.isValid) {
  return createErrorResponse('Server configuration error', 500)
}

const url = Deno.env.get('SUPABASE_URL')!
const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
```

### Mistake 5: Manual Input Validation

```typescript
// ❌ WRONG - Manual validation, easy to miss edge cases
if (!body.name || body.name.length > 100) {
  return new Response(JSON.stringify({ error: 'Invalid name' }), { status: 400 })
}

// ✅ CORRECT - Using standardized validation
const validation = validateInput(body, {
  name: { type: 'string', required: true, minLength: 1, maxLength: 100 }
})

if (!validation.isValid) {
  return createErrorResponse('Validation failed', 400, validation.errors)
}
```

### Mistake 6: Missing CORS Preflight Handling

```typescript
// ❌ WRONG - No OPTIONS handling
if (req.method !== 'POST') {
  return createErrorResponse('Method not allowed', 405)
}

// ✅ CORRECT - Handles preflight
if (req.method === 'OPTIONS') {
  return new Response(null, { status: 204, headers })
}

if (req.method !== 'POST') {
  return createErrorResponse('Method not allowed', 405)
}
```

### Mistake 7: Exposing Internal Errors

```typescript
// ❌ WRONG - Exposes internal error details
catch (error) {
  return createErrorResponse(error.message, 500)  // Don't do this!
}

// ✅ CORRECT - Generic error message
catch (error) {
  console.error('Internal error:', error)
  return createErrorResponse('Internal server error', 500)
}
```

---

## Best Practices

### 1. Always Validate Early

Validate environment variables and inputs as early as possible in the function execution. This fails fast and reduces unnecessary database operations.

### 2. Use TypeScript Interfaces

Define interfaces for request bodies and responses. This provides:
- Type safety during development
- Better IDE autocomplete
- Self-documenting code

### 3. Log Meaningful Context

```typescript
// ❌ Too verbose
console.log('Processing request')

// ✅ Good context
console.log(`[function-name] Processing item ${itemId} for user ${userId}`)
```

### 4. Keep Functions Focused

Each Edge Function should do one thing well. If you need multiple operations, create multiple functions or use action dispatch pattern.

### 5. Use Appropriate HTTP Status Codes

| Status | Usage |
|--------|-------|
| 200 | Success (GET, PUT, DELETE) |
| 201 | Created (POST) |
| 400 | Bad request (validation failed) |
| 401 | Unauthorized (invalid credentials) |
| 404 | Not found (resource doesn't exist) |
| 405 | Method not allowed |
| 500 | Server error |

### 6. Test All Code Paths

Ensure you test:
- Happy path (successful operations)
- Validation failures
- Not found scenarios
- Server errors
- CORS preflight requests

### 7. Document Your Functions

Add JSDoc comments at the top of each function:

```typescript
/**
 * Function Name - Brief Description
 * 
 * Purpose: What this function does
 * Trigger: POST /function-name
 * 
 * Request Body:
 *   - field1: Description and constraints
 *   - field2: Description and constraints
 * 
 * Response:
 *   - success: true/false
 *   - data: Response payload on success
 *   - error: Error message on failure
 */
```

---

## Migration Guide

### For Existing Functions

If you have an existing Edge Function that doesn't follow this pattern:

1. **Read the current implementation**
2. **Read the reference implementation** (`game-vote/index.ts`)
3. **Create a backup** (git commit)
4. **Refactor following this pattern**
5. **Test thoroughly**
6. **Deploy and verify**

### Step-by-Step Migration

**Step 1: Update Imports**
```typescript
// Before
import { Client } from 'https://deno.land/x/postgres@v0.17.0/mod.ts'

// After
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { 
  validateEnvironmentVariables, 
  createErrorResponse, 
  createSuccessResponse,
  validateInput,
  CORS_HEADERS,
  SECURITY_HEADERS
} from '../_shared/security.ts'
```

**Step 2: Replace Database Connection**
```typescript
// Before
function getDbClient(): Client {
  const connectionString = Deno.env.get('POSTGRES_URL') ?? ''
  return new Client(connectionString)
}

// ... later in code ...
const client = getDbClient()
await client.connect()
// ... queries ...
await client.end()

// After
const envValidation = validateEnvironmentVariables([
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
])

if (!envValidation.isValid) {
  return createErrorResponse('Server configuration error', 500)
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ... queries using supabase ...
```

**Step 3: Update Headers**
```typescript
// Before
const headers = new Headers({
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
})

// After
const headers = new Headers({ 
  ...CORS_HEADERS, 
  ...SECURITY_HEADERS, 
  'Content-Type': 'application/json' 
})
```

**Step 4: Add CORS Preflight**
```typescript
// Add after headers definition
if (req.method === 'OPTIONS') {
  return new Response(null, { status: 204, headers })
}
```

**Step 5: Replace Manual Validation**
```typescript
// Before
const errors = []
if (!body.name) errors.push('Name is required')
if (body.name && body.name.length > 100) errors.push('Name too long')
if (errors.length > 0) {
  return new Response(JSON.stringify({ error: errors }), { status: 400 })
}

// After
const validation = validateInput(body, {
  name: { type: 'string', required: true, minLength: 1, maxLength: 100 }
})

if (!validation.isValid) {
  return createErrorResponse('Validation failed', 400, validation.errors)
}
```

**Step 6: Replace Response Patterns**
```typescript
// Before
return new Response(
  JSON.stringify({ success: true, data: result }),
  { status: 200, headers }
)

// After
return createSuccessResponse({ data: result }, 200)
```

**Step 7: Test Thoroughly**
- Run all existing tests
- Verify error cases
- Check security headers
- Test CORS preflight

---

## Related Documentation

- **Security Utilities:** `supabase/functions/_shared/security.ts`
- **Reference Implementation:** `supabase/functions/game-vote/index.ts`
- **Testing Guide:** `docs/technical/EDGE_FUNCTIONS_FIX_TESTING.md`
- **Database Schema:** `docs/reference/SCHEMA.md`
- **Project Analysis:** `docs/PROJECT_ANALYSIS_SUMMARY.md`

---

## Quick Reference

### Import Pattern
```typescript
import { 
  validateEnvironmentVariables, 
  createErrorResponse, 
  createSuccessResponse,
  validateInput,
  CORS_HEADERS,
  SECURITY_HEADERS
} from '../_shared/security.ts'
```

### Headers Pattern
```typescript
const headers = new Headers({ 
  ...CORS_HEADERS, 
  ...SECURITY_HEADERS, 
  'Content-Type': 'application/json' 
})
```

### Validation Pattern
```typescript
const validation = validateInput(body, {
  field: { type: 'string', required: true, minLength: 1, maxLength: 100 }
})

if (!validation.isValid) {
  return createErrorResponse('Validation failed', 400, validation.errors)
}

const { field } = validation.sanitized
```

### Success Response
```typescript
return createSuccessResponse({ data: payload }, 200)  // or 201
```

### Error Response
```typescript
return createErrorResponse('Human-readable message', 400)  // status code
```

### Database Query
```typescript
const { data, error } = await supabase
  .from('table_name')
  .select('column1, column2')
  .eq('column', value)
  .single()

if (error) {
  return createErrorResponse('Database error', 500)
}
```

---

**Document Version:** 1.0  
**Created:** 2026-01-06  
**Status:** Active - Required for all Edge Functions
