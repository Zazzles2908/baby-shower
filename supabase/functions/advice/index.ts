import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    const body: AdviceRequest = await req.json()

    // Accept either adviceType (from frontend) or category
    const category = body.category || body.adviceType || ''
    const adviceText = body.advice || body.message || ''
    const name = body.name || 'Anonymous Advisor'

    // Validation
    const errors: string[] = []
    
    if (!adviceText || adviceText.trim().length === 0) {
      errors.push('Advice text is required')
    }
    
    if (adviceText && adviceText.length > 2000) {
      errors.push('Advice must be 2000 characters or less')
    }
    
    if (!category || category.trim().length === 0) {
      errors.push('Category is required')
    }
    
    // Map frontend adviceType to valid categories if needed
    const normalizedCategory = category.toLowerCase().trim()
    const validCategories = ['general', 'naming', 'feeding', 'sleeping', 'safety', 'fun', 'ai_roast']
    
    // Map "For Parents" or "for parents" -> "general", "For Baby" or "for baby" -> "fun"
    let finalCategory = normalizedCategory
    if (normalizedCategory === 'for parents' || normalizedCategory === 'parents' || normalizedCategory === 'for parents\' 18th birthday') {
      finalCategory = 'general'
    } else if (normalizedCategory === 'for baby' || normalizedCategory === 'baby' || normalizedCategory === 'for baby\'s 18th birthday') {
      finalCategory = 'fun'
    }
    
    if (finalCategory && !validCategories.includes(finalCategory)) {
      errors.push(`Category must be one of: ${validCategories.join(', ')}`)
    }

    if (errors.length > 0) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: errors }), { status: 400, headers })
    }

    const sanitizedAdvice = adviceText.trim().slice(0, 2000)

    // Handle AI Roast feature
    if (finalCategory === 'ai_roast') {
      return await handleAIRoast(supabase, name, sanitizedAdvice, headers)
    }

    // Count total submissions in baby_shower.advice BEFORE insert to check milestone
    const { count: totalCount } = await supabase
      .from('baby_shower.advice')
      .select('*', { count: 'exact', head: true })
    const currentCount = totalCount || 0
    const isMilestone = currentCount + 1 === 50

    console.log(`[advice] Writing advice to baby_shower.advice, current count: ${currentCount}`)

    // Insert into baby_shower.advice with dedicated columns
    const { data, error } = await supabase
      .from('baby_shower.advice')
      .insert({
        advice_giver: name,
        advice_text: sanitizedAdvice,
        delivery_option: finalCategory,
        is_approved: false,
        submitted_by: name,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    console.log(`[advice] Successfully inserted advice with id: ${data.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: data.id,
          advice_text: sanitizedAdvice,
          delivery_option: finalCategory,
          created_at: data.created_at,
        },
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

async function handleAIRoast(supabase: any, name: string, topic: string, headers: Headers) {
  const minimaxApiKey = Deno.env.get('MINIMAX_API_KEY') ?? ''
  
  if (!minimaxApiKey) {
    return new Response(
      JSON.stringify({ 
        error: 'AI Roast feature not configured. MINIMAX_API_KEY is missing.',
        configured: false 
      }), 
      { status: 503, headers }
    )
  }

  try {
    // Call MiniMax API for AI-generated roast
    const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${minimaxApiKey}`,
      },
      body: JSON.stringify({
        model: 'abab6.5s-chat',
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
    })

    if (!response.ok) {
      throw new Error(`MiniMax API error: ${response.status}`)
    }

    const aiData = await response.json()
    const generatedAdvice = aiData.choices?.[0]?.message?.content || 'Sorry, the roast generator is on break!'

    console.log(`[advice] AI generated roast: ${generatedAdvice}`)

    // Save to baby_shower.advice table (AI-generated advice)
    const { data, error } = await supabase
      .from('baby_shower.advice')
      .insert({
        advice_giver: name,
        advice_text: generatedAdvice,
        delivery_option: 'ai_roast',
        is_approved: true,
        ai_generated: true,
        submitted_by: name,
      })
      .select()
      .single()

    if (error) throw new Error(`Database error: ${error.message}`)

    console.log(`[advice] Successfully inserted AI roast with id: ${data.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: data.id,
          advice_text: generatedAdvice,
          delivery_option: 'ai_roast',
          created_at: data.created_at,
          ai_generated: true,
        },
      }),
      { status: 201, headers }
    )

  } catch (err) {
    console.error('AI Roast error:', err)
    return new Response(
      JSON.stringify({ error: 'Failed to generate AI roast' }), 
      { status: 500, headers }
    )
  }
}
