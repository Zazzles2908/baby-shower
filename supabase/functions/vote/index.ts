/**
 * Baby Shower Vote Function - Name preservation fix
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
  'Access-Control-Max-Age': '86400'
}

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'"
}

function createErrorResponse(message: string, status: number = 500): Response {
  const headers = new Headers({ ...CORS_HEADERS, ...SECURITY_HEADERS, 'Content-Type': 'application/json' })
  return new Response(JSON.stringify({ success: false, error: message, timestamp: new Date().toISOString() }), { status, headers })
}

function createSuccessResponse(data: unknown, status: number = 200): Response {
  const headers = new Headers({ ...CORS_HEADERS, ...SECURITY_HEADERS, 'Content-Type': 'application/json' })
  return new Response(JSON.stringify({ success: true, data, timestamp: new Date().toISOString() }), { status, headers })
}

interface VoteRequest {
  name?: string
  selected_names: string[]
}

serve(async (req: Request) => {
  const headers = new Headers({ ...CORS_HEADERS, ...SECURITY_HEADERS, 'Content-Type': 'application/json' })
  
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })
  if (req.method !== 'POST') return createErrorResponse('Method not allowed', 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } })

    let body: VoteRequest
    try { body = await req.json() } catch { return createErrorResponse('Invalid JSON in request body', 400) }

    const name = (body.name as string)?.trim() || 'Anonymous Voter'
    const selected_names = (body.selected_names as string[])?.filter((n: string) => n?.trim()).map((n: string) => n.trim().slice(0, 50)) || []

    if (selected_names.length === 0) return createErrorResponse('At least one name is required', 400)
    if (selected_names.length > 4) return createErrorResponse('Maximum 4 names allowed', 400)

    console.log(`[vote] POST: Writing vote with name: ${name}`)

    const { data, error } = await supabase
      .from('baby_shower.votes')
      .insert({ voter_name: name, selected_names, submitted_by: name })
      .select()
      .single()

    if (error) return createErrorResponse(`Database operation failed: ${error.message}`, 500)

    const { data: allVotes } = await supabase.from('baby_shower.votes').select('selected_names')
    const nameCounts: Record<string, number> = {}
    let totalVotes = 0

    for (const vote of allVotes || []) {
      const names = Array.isArray(vote.selected_names) ? vote.selected_names : []
      for (const n of names) {
        if (n && typeof n === 'string') {
          const normalizedName = n.trim()
          if (normalizedName) {
            nameCounts[normalizedName] = (nameCounts[normalizedName] || 0) + 1
            totalVotes++
          }
        }
      }
    }

    const results = Object.entries(nameCounts)
      .map(([name, count]) => ({ name, count, percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0 }))
      .sort((a, b) => b.count - a.count)

    return createSuccessResponse({
      id: data.id,
      selected_names,
      vote_count: selected_names.length,
      created_at: data.created_at,
      progress: { totalVotes, results, lastUpdated: new Date().toISOString() }
    }, 201)

  } catch (err) {
    console.error('Edge Function error:', err)
    return createErrorResponse('Internal server error', 500)
  }
})
