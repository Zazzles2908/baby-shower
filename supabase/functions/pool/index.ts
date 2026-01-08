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

interface PoolRequest {
  name: string
  prediction: string
  dueDate: string
  weight: number
  length: number
  gender?: string
  hairColor?: string
  eyeColor?: string
  favourite_colour?: string
}

// Baby average statistics for roasts
const AVERAGE_WEIGHT_KG = 3.5
const AVERAGE_LENGTH_CM = 50

/**
 * Call LLM API to generate witty roast
 */
async function generateRoast(
  weight: number,
  length: number,
  prediction: string,
  avgWeight: number,
  avgLength: number
): Promise<string | null> {
  const apiKey = Deno.env.get('MINIMAX_API_KEY')
  if (!apiKey) {
    console.warn('MINIMAX_API_KEY not configured')
    return null
  }

  const prompt = `Write a witty 1-sentence roast about this baby prediction:
- Predicted weight: ${weight}kg (average is ${avgWeight}kg)
- Predicted length: ${length}cm (average is ${avgLength}cm)
- Due date: ${prediction}

Be clever, funny, and family-friendly. Keep it under 100 characters. Return only the roast text, no quotes.`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout

    const response = await fetch('https://api.minimax.chat/v1/chat/completions', {  // UPDATED: OpenAI-compatible endpoint
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.1',  // UPDATED from abab6.5s-chat
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 100,
        temperature: 0.8,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error('MiniMax API error:', response.status)
      return null
    }

    const data = await response.json()
    const roast = data.choices?.[0]?.message?.content?.trim()
    
    // Clean up the roast - remove quotes if present
    return roast?.replace(/^["']|["']$/g, '') || null
  } catch (error) {
    console.error('AI roast generation failed:', error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

/**
 * Calculate average weight and length from baby_shower.pool_predictions
 */
async function calculateAverages(supabase: ReturnType<typeof createClient>): Promise<{ avgWeight: number; avgLength: number }> {
  const { data: predictions, error } = await supabase
    .from('baby_shower.pool_predictions')
    .select('weight_kg, length_cm')
    .not('weight_kg', 'is', null)
    .not('length_cm', 'is', null)

  if (error || !predictions || predictions.length === 0) {
    return { avgWeight: AVERAGE_WEIGHT_KG, avgLength: AVERAGE_LENGTH_CM }
  }

  let totalWeight = 0
  let totalLength = 0
  let count = 0

  for (const pred of predictions) {
    if (pred.weight_kg && pred.length_cm) {
      totalWeight += Number(pred.weight_kg)
      totalLength += Number(pred.length_cm)
      count++
    }
  }

  if (count === 0) {
    return { avgWeight: AVERAGE_WEIGHT_KG, avgLength: AVERAGE_LENGTH_CM }
  }

  return {
    avgWeight: Math.round((totalWeight / count) * 100) / 100,
    avgLength: Math.round((totalLength / count) * 100) / 100,
  }
}

serve(async (req: Request) => {
  const headers = new Headers({
    ...CORS_HEADERS,
    ...SECURITY_HEADERS,
    'Content-Type': 'application/json',
  })

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })
  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405)
  }

  try {
    // Validate environment variables
    const envValidation = validateEnvironmentVariables([
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ], ['MINIMAX_API_KEY']) // Optional for AI roasts

    if (!envValidation.isValid) {
      console.error('Environment validation failed:', envValidation.errors)
      return createErrorResponse('Server configuration error', 500)
    }

    if (envValidation.warnings.length > 0) {
      console.warn('Environment warnings:', envValidation.warnings)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Parse and validate request body
    let body: PoolRequest
    try {
      body = await req.json()
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400)
    }

    // Input validation using standardized function
    const validation = validateInput(body, {
      name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
      prediction: { type: 'string', required: true, minLength: 1, maxLength: 500 },
      dueDate: { type: 'string', required: true, pattern: /^\d{4}-\d{2}-\d{2}$/ },
      weight: { type: 'number', required: true, min: 2.0, max: 6.0 },
      length: { type: 'number', required: true, min: 40, max: 60 },
      gender: { type: 'string', required: false, enum: ['boy', 'girl', 'surprise'] },
      hairColor: { type: 'string', required: false, maxLength: 50 },
      eyeColor: { type: 'string', required: false, maxLength: 50 },
      favourite_colour: { type: 'string', required: false, maxLength: 50 }
    })

    if (!validation.isValid) {
      return createErrorResponse('Validation failed', 400, validation.errors)
    }

    // Additional date validation for 2026 baby shower
    // Today is January 5, 2026, so valid dates are Jan 6 - Dec 31, 2026
    const selectedDate = new Date(body.dueDate)
    const today = new Date('2026-01-05')
    const minDate = new Date(today)
    minDate.setDate(today.getDate() + 1) // Tomorrow (Jan 6, 2026)
    const maxDate = new Date('2026-12-31')
    
    if (selectedDate < minDate || selectedDate > maxDate) {
      return createErrorResponse(`Birth date must be between ${minDate.toISOString().split('T')[0]} and ${maxDate.toISOString().split('T')[0]}`, 400)
    }

    // Use sanitized data from validation
    const { name: sanitizedName, prediction: sanitizedPrediction } = validation.sanitized

    // Calculate averages for AI roast
    const { avgWeight, avgLength } = await calculateAverages(supabase)

    // Count total submissions in baby_shower.pool_predictions BEFORE insert to check milestone
    const { count: totalCount } = await supabase
      .from('baby_shower.pool_predictions')
      .select('*', { count: 'exact', head: true })
    const currentCount = totalCount || 0
    const isMilestone = currentCount + 1 === 50

    console.log(`[pool] Writing prediction to baby_shower.pool_predictions, current count: ${currentCount}`)

    // Direct insert (bypasses RLS using service role)
    const { data, error } = await supabase
      .from('baby_shower.pool_predictions')
      .insert({
        predictor_name: sanitizedName,
        birth_date: body.dueDate,
        prediction: sanitizedPrediction,
        weight_kg: body.weight,
        length_cm: body.length,
        hair_color: body.hairColor,
        eye_color: body.eyeColor,
        favourite_colour: body.favourite_colour,
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

    console.log(`[pool] Successfully inserted prediction with id: ${data?.id}`)

    // Generate AI roast (wrapped in try/catch - never block submission)
    let roast: string | null = null
    try {
      roast = await generateRoast(body.weight, body.length, sanitizedPrediction, avgWeight, avgLength)
      if (roast) {
        console.log(`[pool] Generated AI roast: ${roast}`)
        // Optionally store roast in baby_shower.ai_roasts table with foreign key
        // await supabase.from('baby_shower.ai_roasts').insert({
        //   pool_prediction_id: data.id,
        //   roast_text: roast,
        // })
      }
    } catch (roastError) {
      console.error('Roast generation error:', roastError)
      // Silently continue without roast
    }

    // Return success response
    return createSuccessResponse({
      data: { 
        id: data?.id, 
        predictor_name: sanitizedName, 
        birth_date: body.dueDate,
        weight_kg: body.weight,
        length_cm: body.length,
      },
      roast: roast,
      milestone: isMilestone ? {
        triggered: true,
        threshold: 50,
        message: '🎉 We hit 50 submissions! Cake time!'
      } : undefined
    }, 201)

  } catch (err) {
    console.error('Edge Function error:', err)
    return createErrorResponse('Internal server error', 500)
  }
})
