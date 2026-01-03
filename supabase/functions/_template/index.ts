/**
 * Edge Function Template
 * Copy this file to create new Supabase Edge Functions
 * 
 * Usage:
 * 1. Copy this file to `supabase/functions/your-function-name/index.ts`
 * 2. Update the interface definitions for your specific use case
 * 3. Implement your business logic in the main function
 * 4. Add environment variables to your Supabase project settings
 * 5. Deploy with: `supabase functions deploy your-function-name`
 */

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

// Define your request data structure
interface YourRequestData {
  // Example fields - customize for your use case
  name?: string
  email?: string
  message?: string
  category?: string
  // Add your specific fields here
}

// Define your response data structure
interface YourResponseData {
  // Example fields - customize for your use case
  id: string
  message: string
  created_at: string
  // Add your specific fields here
}

serve(async (req: Request) => {
  // Combine CORS and security headers for all responses
  const headers = new Headers({
    ...CORS_HEADERS,
    ...SECURITY_HEADERS,
    'Content-Type': 'application/json',
  })

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  // Validate HTTP method
  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405)
  }

  try {
    // 1. Validate environment variables first
    const envValidation = validateEnvironmentVariables([
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
      // Add your required environment variables here
    ], [
      // Add optional environment variables here (AI keys, etc.)
    ])

    if (!envValidation.isValid) {
      console.error('Environment validation failed:', envValidation.errors)
      return createErrorResponse('Server configuration error', 500)
    }

    if (envValidation.warnings.length > 0) {
      console.warn('Environment warnings:', envValidation.warnings)
    }

    // 2. Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 3. Parse and validate request body
    let body: YourRequestData
    try {
      body = await req.json()
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400)
    }

    // 4. Input validation using standardized function
    const validation = validateInput(body, {
      // Customize validation rules for your specific fields
      name: { 
        type: 'string', 
        required: true, 
        minLength: 1, 
        maxLength: 100 
      },
      email: { 
        type: 'string', 
        required: false, 
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ 
      },
      message: { 
        type: 'string', 
        required: true, 
        minLength: 5, 
        maxLength: 2000 
      },
      category: { 
        type: 'string', 
        required: false, 
        enum: ['general', 'specific', 'other'] 
      }
      // Add your specific validation rules here
    })

    if (!validation.isValid) {
      return createErrorResponse('Validation failed', 400, validation.errors)
    }

    // 5. Your business logic here
    const result = await yourBusinessLogic(supabase, validation.sanitized)

    // 6. Return standardized success response
    return createSuccessResponse(result, 201)

  } catch (error) {
    console.error('Edge Function error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})

/**
 * Your main business logic function
 * Implement your specific functionality here
 */
async function yourBusinessLogic(
  supabase: any, 
  data: Record<string, unknown>
): Promise<YourResponseData> {
  
  // Example: Insert into database
  const { data: insertData, error } = await supabase
    .from('your_table_name')
    .insert({
      name: data.name,
      email: data.email,
      message: data.message,
      category: data.category || 'general',
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Database operation failed:', error)
    throw new Error('Database operation failed')
  }

  return {
    id: insertData.id,
    message: `Successfully processed: ${data.name}`,
    created_at: insertData.created_at
  }
}

/**
 * AI Integration Helper (if needed)
 * Use this pattern for external API calls with timeout protection
 */
async function callExternalAPI(
  prompt: string, 
  apiKey: string, 
  apiUrl: string
): Promise<string> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'your-model-name',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 200,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error('External API error:', response.status)
      throw new Error(`External service returned status ${response.status}`)
    }

    const apiData = await response.json()
    return apiData.choices?.[0]?.message?.content || 'API response unavailable'

  } catch (error) {
    console.error('External API request failed:', error)
    throw new Error('Failed to process external API request')
  }
}