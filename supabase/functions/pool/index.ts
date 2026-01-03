import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface PoolRequest {
  name: string
  prediction: string
  dueDate: string
  weight: number
  length: number
  gender?: string
  hairColor?: string
  eyeColor?: string
  personality?: string
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
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  })

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Missing env vars')

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const body: PoolRequest = await req.json()

    // Validation
    const errors: string[] = []
    if (!body.name || body.name.trim().length === 0) errors.push('Name is required')
    if (body.name?.length > 100) errors.push('Name must be 100 chars or less')
    if (!body.prediction || body.prediction.trim().length === 0) errors.push('Prediction is required')
    if (body.prediction?.length > 500) errors.push('Prediction must be 500 chars or less')
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!body.dueDate || !dateRegex.test(body.dueDate)) {
      errors.push('Due date must be in YYYY-MM-DD format')
    }

    // Validate weight and length
    if (typeof body.weight !== 'number' || body.weight < 1 || body.weight > 6) {
      errors.push('Weight must be between 1 and 6 kg')
    }
    if (typeof body.length !== 'number' || body.length < 30 || body.length > 60) {
      errors.push('Length must be between 30 and 60 cm')
    }

    // Validate optional gender field
    if (body.gender && !['boy', 'girl', 'surprise'].includes(body.gender.toLowerCase())) {
      errors.push('Gender must be boy, girl, or surprise')
    }

    if (errors.length > 0) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: errors }), { status: 400, headers })
    }

    const sanitizedName = body.name.trim().slice(0, 100)
    const sanitizedPrediction = body.prediction.trim().slice(0, 500)

    // Calculate averages for AI roast
    const { avgWeight, avgLength } = await calculateAverages(supabase)

    // Count total submissions in baby_shower.pool_predictions BEFORE insert to check milestone
    const { count: totalCount } = await supabase
      .from('baby_shower.pool_predictions')
      .select('*', { count: 'exact', head: true })
    const currentCount = totalCount || 0
    const isMilestone = currentCount + 1 === 50

    console.log(`[pool] Writing prediction to baby_shower.pool_predictions, current count: ${currentCount}`)

    // Insert into baby_shower.pool_predictions with dedicated columns
    const { data, error } = await supabase
      .from('baby_shower.pool_predictions')
      .insert({
        predictor_name: sanitizedName,
        gender: body.gender?.toLowerCase() || 'surprise',
        birth_date: body.dueDate,
        weight_kg: body.weight,
        length_cm: body.length,
        hair_color: body.hairColor?.trim().slice(0, 50) || null,
        eye_color: body.eyeColor?.trim().slice(0, 50) || null,
        personality: body.personality?.trim().slice(0, 200) || null,
        submitted_by: sanitizedName,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    console.log(`[pool] Successfully inserted prediction with id: ${data.id}`)

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

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Prediction recorded!',
        data: { 
          id: data.id, 
          predictor_name: sanitizedName, 
          gender: body.gender?.toLowerCase() || 'surprise',
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
      }),
      { status: 201, headers }
    )

  } catch (err) {
    console.error('Edge Function error:', err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }), { status: 500, headers })
  }
})
