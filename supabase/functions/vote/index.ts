import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface VoteRequest {
  names: string[]
}

interface ErrorResponse {
  error: string
  details?: unknown
}

interface VoteResult {
  name: string
  count: number
  percentage: number
}

interface VoteProgressData {
  totalVotes: number
  results: VoteResult[]
  lastUpdated: string
}

serve(async (req: Request) => {
  // CORS headers
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  })

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  // GET endpoint: Retrieve vote progress data with percentages
  if (req.method === 'GET') {
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing environment variables')
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      // Fetch all vote submissions
      const { data: votes, error } = await supabase
        .from('submissions')
        .select('activity_data')
        .eq('activity_type', 'voting')

      if (error) {
        console.error('Supabase query error:', error)
        throw new Error(`Database error: ${error.message}`)
      }

      // Calculate vote counts and percentages
      const nameCounts: Record<string, number> = {}
      let totalVotes = 0

      for (const vote of votes || []) {
        const activityData = vote.activity_data as Record<string, unknown>
        const names = activityData?.names as string[] | undefined
        if (names && Array.isArray(names)) {
          for (const name of names) {
            const normalizedName = name.trim()
            if (normalizedName) {
              nameCounts[normalizedName] = (nameCounts[normalizedName] || 0) + 1
              totalVotes++
            }
          }
        }
      }

      // Build results with percentages
      const results: VoteResult[] = Object.entries(nameCounts)
        .map(([name, count]) => ({
          name,
          count,
          percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count) // Sort by count descending

      const progressData: VoteProgressData = {
        totalVotes,
        results,
        lastUpdated: new Date().toISOString(),
      }

      return new Response(
        JSON.stringify({ success: true, data: progressData }),
        { status: 200, headers }
      )

    } catch (err) {
      console.error('Edge Function error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Internal server error'
      return new Response(
        JSON.stringify({ error: errorMessage } as ErrorResponse),
        { status: 500, headers }
      )
    }
  }

  // POST endpoint: Submit a vote
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' } as ErrorResponse),
      { status: 405, headers }
    )
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Parse request
    const body: VoteRequest = await req.json()

    // Validation
    const errors: string[] = []
    
    if (!body.names || !Array.isArray(body.names)) {
      errors.push('Names array is required')
    }
    
    if (body.names) {
      if (body.names.length === 0) {
        errors.push('At least one name is required')
      }
      if (body.names.length > 4) {
        errors.push('Maximum 4 names allowed')
      }
      
      // Validate each name
      body.names.forEach((name, index) => {
        if (!name || name.trim().length === 0) {
          errors.push(`Name at index ${index} cannot be empty`)
        }
        if (name && name.length > 50) {
          errors.push(`Name at index ${index} must be 50 characters or less`)
        }
      })
    }

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: errors } as ErrorResponse),
        { status: 400, headers }
      )
    }

    // Sanitize names
    const sanitizedNames = body.names
      .map(n => n.trim().slice(0, 50))
      .filter(n => n.length > 0)

    // Count total submissions BEFORE insert to check milestone
    const { count: totalCount } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
    const currentCount = totalCount || 0
    const isMilestone = currentCount + 1 === 50

    // Insert into submissions
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        name: 'Anonymous Voter',
        activity_type: 'voting',
        activity_data: {
          names: sanitizedNames,
          vote_count: sanitizedNames.length,
          submitted_at: new Date().toISOString(),
        },
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    // Calculate updated progress data
    const allVotes = await supabase
      .from('submissions')
      .select('activity_data')
      .eq('activity_type', 'voting')

    const nameCounts: Record<string, number> = {}
    let totalVotes = 0

    for (const vote of allVotes.data || []) {
      const activityData = vote.activity_data as Record<string, unknown>
      const names = activityData?.names as string[] | undefined
      if (names && Array.isArray(names)) {
        for (const name of names) {
          const normalizedName = name.trim()
          if (normalizedName) {
            nameCounts[normalizedName] = (nameCounts[normalizedName] || 0) + 1
            totalVotes++
          }
        }
      }
    }

    const results: VoteResult[] = Object.entries(nameCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: data.id,
          names: sanitizedNames,
          vote_count: sanitizedNames.length,
          created_at: data.created_at,
        },
        progress: {
          totalVotes,
          results,
          lastUpdated: new Date().toISOString(),
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
    const errorMessage = err instanceof Error ? err.message : 'Internal server error'
    
    return new Response(
      JSON.stringify({ error: errorMessage } as ErrorResponse),
      { status: 500, headers }
    )
  }
})
