# Edge Function Development Guide

## Overview

This guide provides comprehensive instructions for developing secure, consistent, and maintainable Edge Functions for the Baby Shower application. All Edge Functions must follow the established patterns and use the shared security utilities.

## Quick Start

1. Copy the template: `cp supabase/functions/_template/index.ts supabase/functions/your-function/index.ts`
2. Update interfaces and validation rules
3. Implement your business logic
4. Test thoroughly with edge cases
5. Deploy: `supabase functions deploy your-function`

## Architecture Principles

### Security First
- **Never trust user input** - Always validate and sanitize
- **Environment validation** - Check required variables before processing
- **Standardized responses** - Consistent error/success formats
- **Timeout protection** - Prevent hanging requests
- **Comprehensive logging** - Monitor without exposing sensitive data

### Consistency
- **Shared utilities** - Use standardized functions from `_shared/security.ts`
- **Response formats** - Always use `createErrorResponse()` and `createSuccessResponse()`
- **Validation patterns** - Use `validateInput()` for all user data
- **Error handling** - Try-catch with specific error messages

### Performance
- **Async/await** - Proper promise handling
- **Timeout controls** - Prevent infinite waits
- **Resource cleanup** - Clear timeouts and abort controllers
- **Efficient queries** - Optimize database operations

## File Structure

```
supabase/functions/
├── _shared/
│   └── security.ts          # Shared security utilities
├── _template/
│   └── index.ts            # Template for new functions
├── your-function/
│   ├── index.ts            # Main function implementation
│   └── config.toml         # Function configuration
└── another-function/
    └── index.ts
```

## Core Patterns

### 1. Standard Function Structure

Every Edge Function should follow this exact pattern:

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

// Define interfaces for type safety
interface RequestData { /* your structure */ }
interface ResponseData { /* your structure */ }

serve(async (req: Request) => {
  // Standard headers
  const headers = new Headers({
    ...CORS_HEADERS,
    ...SECURITY_HEADERS,
    'Content-Type': 'application/json',
  })

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  // Method validation
  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405)
  }

  try {
    // Environment validation
    const envValidation = validateEnvironmentVariables([
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ])

    if (!envValidation.isValid) {
      console.error('Environment validation failed:', envValidation.errors)
      return createErrorResponse('Server configuration error', 500)
    }

    // Initialize Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Parse and validate request
    let body: RequestData
    try {
      body = await req.json()
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400)
    }

    // Input validation
    const validation = validateInput(body, { /* rules */ })
    if (!validation.isValid) {
      return createErrorResponse('Validation failed', 400, validation.errors)
    }

    // Business logic
    const result = await yourBusinessLogic(supabase, validation.sanitized)

    // Return success
    return createSuccessResponse(result, 201)

  } catch (error) {
    console.error('Edge Function error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})
```

### 2. Environment Variable Validation

Always validate environment variables before use:

```typescript
const envValidation = validateEnvironmentVariables([
  'SUPABASE_URL',           // Required
  'SUPABASE_SERVICE_ROLE_KEY'  // Required
], [
  'MINIMAX_API_KEY',        // Optional
  'Z_AI_API_KEY'           // Optional
])

if (!envValidation.isValid) {
  console.error('Environment validation failed:', envValidation.errors)
  return createErrorResponse('Server configuration error', 500)
}

// Access validated variables
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const apiKey = Deno.env.get('MINIMAX_API_KEY') // May be undefined
```

### 3. Input Validation Patterns

Use the standardized validation function:

```typescript
const validation = validateInput(body, {
  name: { 
    type: 'string', 
    required: true, 
    minLength: 1, 
    maxLength: 100 
  },
  email: { 
    type: 'string', 
    required: true, 
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ 
  },
  age: {
    type: 'number',
    required: false,
    min: 0,
    max: 120
  },
  category: { 
    type: 'string', 
    required: true, 
    enum: ['general', 'specific', 'other'] 
  }
})

if (!validation.isValid) {
  return createErrorResponse('Validation failed', 400, validation.errors)
}

// Use sanitized data
const sanitizedData = validation.sanitized
```

### 4. AI Integration with Timeout Protection

Always use timeout protection for external API calls:

```typescript
async function callAIAPI(prompt: string, apiKey: string): Promise<string> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch('https://api.ai-provider.com/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'ai-model-name',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 200,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error('AI API error:', response.status)
      throw new Error(`AI service returned status ${response.status}`)
    }

    const aiData = await response.json()
    return aiData.choices?.[0]?.message?.content || 'AI response unavailable'

  } catch (error) {
    console.error('AI request failed:', error)
    throw new Error('Failed to generate AI response')
  }
}
```

### 5. Database Operations

Follow these patterns for database operations:

```typescript
// Count operations (use for milestones)
const { count } = await supabase
  .from('your_table')
  .select('*', { count: 'exact', head: true })

// Insert operations
const { data, error } = await supabase
  .from('your_table')
  .insert({
    field1: value1,
    field2: value2,
    created_at: new Date().toISOString()
  })
  .select()
  .single()

if (error) {
  console.error('Database operation failed:', error)
  throw new Error('Database operation failed')
}

// Update operations
const { data, error } = await supabase
  .from('your_table')
  .update({ updated_field: new_value })
  .eq('id', record_id)
  .select()
  .single()
```

## Response Formats

### Success Responses

Always use `createSuccessResponse()`:

```typescript
return createSuccessResponse({
  id: data.id,
  message: 'Operation completed successfully',
  created_at: data.created_at
}, 201)
```

This generates:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "message": "Operation completed successfully",
    "created_at": "2026-01-03T12:00:00.000Z"
  },
  "timestamp": "2026-01-03T12:00:00.000Z"
}
```

### Error Responses

Always use `createErrorResponse()`:

```typescript
return createErrorResponse('Validation failed', 400, validation.errors)
```

This generates:
```json
{
  "success": false,
  "error": "Validation failed",
  "timestamp": "2026-01-03T12:00:00.000Z",
  "details": ["Name is required", "Email format is invalid"]
}
```

## Security Headers

All responses include comprehensive security headers:

```typescript
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'"
}

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}
```

## Testing Guidelines

### Unit Testing
Test individual functions with mock data:

```typescript
// Test your business logic
const mockSupabase = {
  from: () => ({
    insert: () => ({
      select: () => ({
        single: () => Promise.resolve({ 
          data: { id: 'test-id' }, 
          error: null 
        })
      })
    })
  })
}

const result = await yourBusinessLogic(mockSupabase, testData)
assertEquals(result.id, 'test-id')
```

### Integration Testing
Test with actual Supabase instance:

```typescript
// Test with real Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey)
const result = await yourBusinessLogic(supabase, testData)

// Verify database state
const { data: dbData } = await supabase
  .from('your_table')
  .select('*')
  .eq('id', result.id)
  .single()

assertEquals(dbData.field, expectedValue)
```

### Error Scenario Testing
Test all error conditions:

```typescript
// Test missing environment variables
Deno.env.delete('SUPABASE_URL')
const response = await serve(testRequest)
assertEquals(response.status, 500)

// Test invalid input
const invalidRequest = new Request('http://localhost', {
  method: 'POST',
  body: JSON.stringify({ invalid: 'data' })
})
const response = await serve(invalidRequest)
assertEquals(response.status, 400)

// Test database errors
const failingSupabase = {
  from: () => ({
    insert: () => ({
      select: () => ({
        single: () => Promise.resolve({ 
          data: null, 
          error: new Error('Database error') 
        })
      })
    })
  })
}
```

## Deployment Checklist

Before deploying any Edge Function:

- [ ] **Code Review**: Follow all patterns in this guide
- [ ] **Environment Variables**: Configure in Supabase dashboard
- [ ] **Database Schema**: Ensure tables and RLS policies exist
- [ ] **Input Validation**: Test with invalid data
- [ ] **Error Handling**: Verify all error scenarios
- [ ] **Timeout Testing**: Ensure external calls have timeouts
- [ ] **CORS Testing**: Verify cross-origin requests work
- [ ] **Security Headers**: Confirm headers are present
- [ ] **Logging**: Check error messages are informative
- [ ] **Performance**: Test with realistic load

## Common Issues and Solutions

### Issue: CORS Errors
**Solution**: Ensure all responses include CORS headers:
```typescript
const headers = new Headers({
  ...CORS_HEADERS,
  ...SECURITY_HEADERS,
  'Content-Type': 'application/json',
})
```

### Issue: Environment Variables Not Found
**Solution**: Always validate environment variables first:
```typescript
const envValidation = validateEnvironmentVariables([
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
])

if (!envValidation.isValid) {
  return createErrorResponse('Server configuration error', 500)
}
```

### Issue: Hanging Requests
**Solution**: Add timeout protection to all external calls:
```typescript
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 10000)

const response = await fetch(url, {
  // ... options
  signal: controller.signal,
})

clearTimeout(timeoutId)
```

### Issue: Inconsistent Error Responses
**Solution**: Always use standardized response functions:
```typescript
return createErrorResponse('Specific error message', 400, details)
return createSuccessResponse(data, 201)
```

## Environment Variables

Configure these in your Supabase project settings:

### Required for All Functions
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin access

### Optional for AI Features
- `MINIMAX_API_KEY`: For MiniMax AI integration
- `Z_AI_API_KEY`: For Z.AI integration  
- `KIMI_API_KEY`: For Moonshot AI integration

### Function-Specific
- Add any custom environment variables your function needs
- Always validate them with `validateEnvironmentVariables()`

## Monitoring and Debugging

### Logging Best Practices
```typescript
// Log important events
console.log(`[function-name] Starting operation for user: ${userId}`)

// Log errors with context
console.error('Database operation failed:', error.message)

// Log AI API calls
console.log(`[function-name] AI request completed in ${duration}ms`)
```

### Error Tracking
All errors are automatically logged with:
- Timestamp
- Error message
- Stack trace (in development)
- Request context (be careful with sensitive data)

### Performance Monitoring
Track these metrics:
- Request duration
- Database query time
- External API call duration
- Error rates

## Security Considerations

### Input Sanitization
The `validateInput()` function automatically:
- Trims string values
- Validates data types
- Enforces length limits
- Applies regex patterns
- Handles enum validation

### SQL Injection Prevention
- Always use Supabase client methods (never raw SQL)
- Use parameterized queries
- Validate all input data
- Apply appropriate RLS policies

### Rate Limiting
Consider implementing rate limiting for:
- AI API calls (expensive)
- Database writes
- Authentication attempts

### Data Exposure
- Never log sensitive data (passwords, API keys)
- Use sanitized data in responses
- Implement proper access controls
- Follow principle of least privilege

## Updates and Maintenance

This guide is a living document. Update it when:
- New security utilities are added
- Best practices evolve
- New patterns are established
- Issues are discovered and resolved

Always refer to the latest version of `supabase/functions/_shared/security.ts` for the most current utility functions.