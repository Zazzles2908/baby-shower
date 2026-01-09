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

interface AdviceRequest {
  name?: string
  adviceType?: string
  advice?: string
  message?: string
  category?: string
}

interface AIResponse {
  generated_advice: string
  roast_level: string
}

serve(async (req: Request) => {
  // Combine CORS and security headers
  const headers = new Headers({
    ...CORS_HEADERS,
    ...SECURITY_HEADERS,
    'Content-Type': 'application/json',
  })

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405)
  }

  try {
    // Validate environment variables
    const envValidation = validateEnvironmentVariables([
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ])

    if (!envValidation.isValid) {
      console.error('Environment validation failed:', envValidation.errors)
      return createErrorResponse('Server configuration error', 500)
    }

    if (envValidation.warnings.length > 0) {
      console.warn('Environment warnings:', envValidation.warnings)
    }

    // Initialize Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'baby_shower'
      }
    })

    // Parse and validate request body
    let body: AdviceRequest
    try {
      body = await req.json()
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400)
    }

    // Input validation using standardized function
    const validation = validateInput(body, {
      name: { type: 'string', required: false, maxLength: 100 },
      advice: { type: 'string', required: false, maxLength: 2000 },
      message: { type: 'string', required: false, maxLength: 2000 },
      category: { type: 'string', required: false, maxLength: 50 },
      adviceType: { type: 'string', required: false, maxLength: 50 }
    })

    // Additional manual validation for complex rules
    const errors: string[] = [...validation.errors]
    
    // Get advice text from either 'advice' or 'message' field
    const adviceText = (validation.sanitized.advice as string) || (validation.sanitized.message as string) || ''
    
    // Get category - normalize both 'category' and 'adviceType' fields
    // Use 'For Parents' as default if neither is provided
    const categoryFromBody = (validation.sanitized.category as string) || (validation.sanitized.adviceType as string) || ''
    const category = categoryFromBody.trim() || 'For Parents'
    
    const name = (validation.sanitized.name as string) || 'Anonymous Advisor'

    // Advice text validation
    if (!adviceText || adviceText.trim().length === 0) {
      errors.push('Please enter your advice or message')
    } else if (adviceText.length < 2) {
      errors.push('Message must be at least 2 characters long')
    }
    
    // Category validation
    if (!category || category.trim().length === 0) {
      errors.push('Please select a delivery method (For Parents or For Baby)')
    } else {
      // Normalize and validate category
      const normalizedCategory = category.toLowerCase().trim()
      const validCategories = ['general', 'naming', 'feeding', 'sleeping', 'safety', 'fun', 'ai_roast']
      
      // Map frontend values to valid categories
      let finalCategory = normalizedCategory
      if (normalizedCategory === 'for parents' || normalizedCategory === 'parents' || normalizedCategory === 'general') {
        finalCategory = 'general'
      } else if (normalizedCategory === 'for baby' || normalizedCategory === 'baby' || normalizedCategory === 'fun') {
        finalCategory = 'fun'
      } else if (normalizedCategory === '18th birthday' || normalizedCategory === 'time capsule') {
        finalCategory = 'fun'
      } else if (!validCategories.includes(finalCategory)) {
        errors.push(`Invalid delivery method. Please choose "For Parents" or "For Baby"`)
      }
      (validation.sanitized as any).finalCategory = finalCategory
    }

    if (errors.length > 0) {
      return createErrorResponse('Validation failed', 400, errors)
    }

    const sanitizedAdvice = adviceText.trim().slice(0, 2000)
    const finalCategory = (validation.sanitized as any).finalCategory

    // Handle AI Roast feature
    if (finalCategory === 'ai_roast') {
      return await handleAIRoast(supabase, name, sanitizedAdvice, headers)
    }

    console.log(`[advice] Inserting advice via RPC with submitted_by: ${name}`)

    // Insert into baby_shower.advice table (schema configured in Supabase client)
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

    if (error) {
      console.error('Supabase RPC error:', JSON.stringify(error, null, 2))
      return createErrorResponse('Database operation failed', 500, { 
        message: error.message,
        details: error,
        hint: error.hint || 'Check RPC function'
      })
    }

    console.log(`[advice] Successfully inserted advice with id: ${data?.id}`)

    return createSuccessResponse({
      id: data?.id,
      advice_text: sanitizedAdvice,
      delivery_option: finalCategory,
      created_at: data?.created_at,
      milestone: undefined
    }, 201)

  } catch (err) {
    console.error('Edge Function error:', err)
    return createErrorResponse('Internal server error', 500)
  }
})

async function handleAIRoast(supabase: any, name: string, topic: string, headers: Headers) {
  // Validate environment variables for AI
  const envValidation = validateEnvironmentVariables([], ['MINIMAX_API_KEY'])
  
  if (!envValidation.isValid || !Deno.env.get('MINIMAX_API_KEY')) {
    console.warn('MINIMAX_API_KEY not configured for AI roast')
    return createErrorResponse('AI Roast feature not configured', 503, {
      configured: false,
      message: 'MINIMAX_API_KEY environment variable is required for AI roast functionality'
    })
  }

  const minimaxApiKey = Deno.env.get('MINIMAX_API_KEY')!

  try {
    // Call MiniMax API for AI-generated roast with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch('https://api.minimax.io/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${minimaxApiKey}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.1',
        messages: [
          {
            role: 'system',
            content: 'You are a witty, playful roast master for a baby shower. Keep it light-hearted, funny, and appropriate. Roast the parents or baby in a loving way. Max 280 characters.'
          },
          {
            role: 'user',
            content: `Roast this baby shower topic with humor: ${topic} (from ${name})`
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error('MiniMax API error:', response.status)
      return createErrorResponse('AI service unavailable', 503, {
        error: `MiniMax API returned status ${response.status}`
      })
    }

    const aiData = await response.json()
    const generatedAdvice = aiData.choices?.[0]?.message?.content || 'Sorry, the roast generator is on break!'

    console.log(`[advice] AI generated roast: ${generatedAdvice}`)

    // Save to baby_shower.advice table (schema configured in Supabase client)
    const { data, error } = await supabase
      .from('advice')
      .insert({
        advice_giver: name,
        advice_text: generatedAdvice,
        delivery_option: 'ai_roast',
        submitted_by: name,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase RPC error:', JSON.stringify(error, null, 2))
      return createErrorResponse('Database operation failed', 500, { 
        message: error.message,
        details: error,
        hint: error.hint || 'Check RPC function'
      })
    }

    console.log(`[advice] Successfully inserted AI roast with id: ${data?.id}`)

    return createSuccessResponse({
      id: data?.id,
      advice_text: generatedAdvice,
      delivery_option: 'ai_roast',
      created_at: data?.created_at,
      ai_generated: true,
    }, 201)

  } catch (err) {
    console.error('AI Roast error:', err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return createErrorResponse('Failed to generate AI roast', 500, { details: errorMessage })
  }
}
