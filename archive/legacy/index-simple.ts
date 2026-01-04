/**
 * Baby Shower Vote Function - Fixed Schema Configuration
 * Fixed: Now uses db: { schema: 'baby_shower' } to access correct table
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface VoteRequest {
  selected_names: string[]
}

// Security utilities (inlined to avoid import path issues)
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
  'Access-Control-Max-Age': '86400'
}

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block'
}

function createErrorResponse(message: string, status: number = 500): Response {
  return new Response(JSON.stringify({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  }), {
    status,
    headers: { ...CORS_HEADERS, ...SECURITY_HEADERS, 'Content-Type': 'application/json' }
  })
}

function createSuccessResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify({
    success: true,
    data,
    timestamp: new Date().toISOString()
  }), {
    status,
    headers: { ...CORS_HEADERS, ...SECURITY_HEADERS, 'Content-Type': 'application/json' }
  })
}

function validateInput(input: Record<string, unknown>, rules: Record<string, { type: string; required?: boolean }>): { isValid: boolean; errors: string[]; sanitized: Record<string, unknown> } {
  const errors: string[] = []
  const sanitized: Record<string, unknown> = {}
  
  for (const [field, rule] of Object.entries(rules)) {
    const value = input[field]
    
    if (rule.required && (value === undefined || value === null)) {
      errors.push(`${field} is required`)
      continue
    }
    
    if (rule.type === 'array') {
      if (!Array.isArray(value)) {
        errors.push(`${field} must be an array`)
        continue
      }
    }
    
    sanitized[field] = value
  }
  
  return { isValid: errors.length === 0, errors, sanitized }
}

serve(async (req: Request) => {
  const headers = new Headers({
    ...CORS_HEADERS,
    ...SECURITY_HEADERS,
    'Content-Type': 'application/json',
  })

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  // GET endpoint
  if (req.method === 'GET') {
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      
      if (!supabaseUrl || !supabaseServiceKey) {
        return createErrorResponse('Server configuration error', 500)
      }

      // ✅ FIXED: Added db: { schema: 'baby_shower' }
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
        db: { schema: 'baby_shower' }
      })

      console.log('[vote] GET: Fetching from baby_shower.votes')

      const { data: votes, error } = await supabase
        .from('votes')
        .select('id, voter_name, selected_names, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase query error:', error.message)
        return createErrorResponse(`Database operation failed: ${error.message}`, 500)
      }

      const nameCounts: Record<string, number> = {}
      let totalVotes = 0

      for (const vote of votes || []) {
        let selectedNames: string[] = []
        
        if (vote.selected_names) {
          if (Array.isArray(vote.selected_names)) {
            selectedNames = vote.selected_names
          } else if (typeof vote.selected_names === 'string') {
            try {
              selectedNames = JSON.parse(vote.selected_names)
            } catch (e) {
              selectedNames = []
            }
          }
        }
        
        for (const name of selectedNames) {
          if (name && typeof name === 'string') {
            const normalizedName = name.trim()
            if (normalizedName) {
              nameCounts[normalizedName] = (nameCounts[normalizedName] || 0) + 1
              totalVotes++
            }
          }
        }
      }

      const results = Object.entries(nameCounts)
        .map(([name, count]) => ({
          name,
          count,
          percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)

      return createSuccessResponse({
        totalVotes,
        results,
        lastUpdated: new Date().toISOString(),
      }, 200)

    } catch (err) {
      console.error('Edge Function error:', err)
      return createErrorResponse('Internal server error', 500)
    }
  }

  // POST endpoint
  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405)
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return createErrorResponse('Server configuration error', 500)
    }

    // ✅ FIXED: Added db: { schema: 'baby_shower' }
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: 'baby_shower' }
    })

    let body: VoteRequest
    try {
      body = await req.json()
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400)
    }

    const validation = validateInput(body, {
      selected_names: { type: 'array', required: true }
    })

    if (!validation.isValid) {
      return createErrorResponse('Validation failed', 400, validation.errors)
    }

    const names = validation.sanitized.selected_names as string[]
    
    if (names.length === 0 || names.length > 4) {
      return createErrorResponse('Between 1-4 names required', 400)
    }

    const sanitizedNames = names
      .map((n: string) => n.trim().slice(0, 50))
      .filter((n: string) => n.length > 0)

    // Count before insert
    const { count: totalCount } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
    
    const currentCount = totalCount || 0
    const isMilestone = currentCount + 1 === 50

    console.log(`[vote] POST: Inserting into baby_shower.votes, count: ${currentCount}`)

    // Insert
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
      console.error('Supabase insert error:', error.message)
      return createErrorResponse(`Database operation failed: ${error.message}`, 500)
    }

    console.log(`[vote] POST: Success, id: ${data.id}`)

    return createSuccessResponse({
      id: data.id,
      selected_names: sanitizedNames,
      vote_count: sanitizedNames.length,
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
