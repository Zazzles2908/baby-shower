import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface AdviceRequest {
  name?: string
  adviceType?: string
  advice?: string
  message?: string
  category?: string
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
    const validCategories = ['general', 'naming', 'feeding', 'sleeping', 'safety', 'fun']
    
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

    // Count total submissions BEFORE insert to check milestone
    const { count: totalCount } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
    const currentCount = totalCount || 0
    const isMilestone = currentCount + 1 === 50

    const { data, error } = await supabase
      .from('submissions')
      .insert({
        name: name,
        activity_type: 'advice',
        activity_data: {
          advice: sanitizedAdvice,
          category: finalCategory,
          is_approved: false,
          submitted_at: new Date().toISOString(),
        },
      })
      .select()
      .single()

    if (error) throw new Error(`Database error: ${error.message}`)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: data.id,
          advice: sanitizedAdvice,
          category: finalCategory,
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
