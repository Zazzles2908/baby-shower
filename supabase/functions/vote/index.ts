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

interface VoteRequest {
  selected_names: string[]
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
  // Combine CORS and security headers
  const headers = new Headers({
    ...CORS_HEADERS,
    ...SECURITY_HEADERS,
    'Content-Type': 'application/json',
  })

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  // GET endpoint: Retrieve vote progress data with percentages
  if (req.method === 'GET') {
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

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      console.log('[vote] GET: Fetching all votes from baby_shower.votes')

      // Fetch all vote submissions from baby_shower.votes
      // Use just 'votes' since schema is set in Supabase client config
      const { data: votes, error } = await supabase
        .from('votes')
        .select('id, voter_name, selected_names, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase query error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        return createErrorResponse(`Database operation failed: ${error.message}`, 500)
      }

      // Calculate vote counts and percentages from selected_names JSONB
      const nameCounts: Record<string, number> = {}
      let totalVotes = 0

      for (const vote of votes || []) {
        const selectedNames = vote.selected_names as string[] | undefined
        if (selectedNames && Array.isArray(selectedNames)) {
          for (const name of selectedNames) {
            const normalizedName = name.trim()
            if (normalizedName) {
              nameCounts[normalizedName] = (nameCounts[normalizedName] || 0) + 1
              totalVotes++
            }
          }
        }
      }

      console.log(`[vote] GET: Calculated ${totalVotes} votes across ${Object.keys(nameCounts).length} names`)

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

      return createSuccessResponse(progressData, 200)

    } catch (err) {
      console.error('Edge Function error:', err)
      return createErrorResponse('Internal server error', 500)
    }
  }

  // POST endpoint: Submit a vote
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

    // Parse and validate request body
    let body: VoteRequest
    try {
      body = await req.json()
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400)
    }

    // Input validation using standardized function
    const validation = validateInput(body, {
      selected_names: { type: 'array', required: true }
    })

    // Additional validation
    const errors: string[] = [...validation.errors]
    
    const names = validation.sanitized.selected_names as string[]
    
    if (names.length === 0) {
      errors.push('At least one name is required')
    }
    if (names.length > 4) {
      errors.push('Maximum 4 names allowed')
    }
    
    // Validate each name
    names.forEach((name: string, index: number) => {
      if (!name || name.trim().length === 0) {
        errors.push(`Name at index ${index} cannot be empty`)
      }
      if (name && name.length > 50) {
        errors.push(`Name at index ${index} must be 50 characters or less`)
      }
    })

    if (errors.length > 0) {
      return createErrorResponse('Validation failed', 400, errors)
    }

    // Sanitize names
    const sanitizedNames = names
      .map((n: string) => n.trim().slice(0, 50))
      .filter((n: string) => n.length > 0)

      // Count total submissions in baby_shower.votes BEFORE insert to check milestone
      // Use just 'votes' since schema is set in Supabase client config
      const { count: totalCount } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
      const currentCount = totalCount || 0
      const isMilestone = currentCount + 1 === 50

      console.log(`[vote] POST: Writing vote to baby_shower.votes, current count: ${currentCount}`)

      // Insert into baby_shower.votes table with dedicated columns
      // Use just 'votes' since schema is set in Supabase client config
      const { data, error } = await supabase
        .from('votes')
        .insert({
          voter_name: 'Anonymous Voter',
          selected_names: sanitizedNames,
          submitted_by: 'Anonymous Voter',
        })
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return createErrorResponse(`Database operation failed: ${error.message}`, 500)
    }

    console.log(`[vote] POST: Successfully inserted vote with id: ${data.id}`)

      // Calculate updated progress data from baby_shower.votes
      // Use just 'votes' since schema is set in Supabase client config
      const allVotes = await supabase
        .from('votes')
        .select('id, selected_names, created_at')

    const nameCounts: Record<string, number> = {}
    let totalVotes = 0

    for (const vote of allVotes.data || []) {
      const selectedNames = vote.selected_names as string[] | undefined
      if (selectedNames && Array.isArray(selectedNames)) {
        for (const name of selectedNames) {
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

    return createSuccessResponse({
      id: data.id,
      selected_names: sanitizedNames,
      vote_count: sanitizedNames.length,
      created_at: data.created_at,
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
    }, 201)

  } catch (err) {
    console.error('Edge Function error:', err)
    return createErrorResponse('Internal server error', 500)
  }
})
