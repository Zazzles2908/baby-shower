/**
 * Baby Shower Vote Function
 * Self-contained version with inline security utilities (matches deployed version)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============ INLINE SECURITY UTILITIES ============

interface EnvValidationResult {
  isValid: boolean
  missing: string[]
  warnings: string[]
  errors: string[]
}

function validateEnvironmentVariables(
  requiredVars: string[],
  optionalVars: string[] = []
): EnvValidationResult {
  const missing: string[] = []
  const warnings: string[] = []
  const errors: string[] = []

  for (const varName of requiredVars) {
    const value = Deno.env.get(varName)
    if (!value || value.trim() === '') {
      missing.push(varName)
      errors.push(`Missing required environment variable: ${varName}`)
    } else {
      if (varName.includes('KEY') || varName.includes('SECRET') || varName.includes('PASSWORD')) {
        if (value.length < 10) {
          warnings.push(`Environment variable ${varName} appears to be too short`)
        }
        if (value.includes('test') || value.includes('demo') || value.includes('example')) {
          warnings.push(`Environment variable ${varName} appears to contain test/demo value`)
        }
      }
    }
  }

  for (const varName of optionalVars) {
    const value = Deno.env.get(varName)
    if (!value || value.trim() === '') {
      warnings.push(`Optional environment variable ${varName} is not set`)
    }
  }

  return { isValid: missing.length === 0, missing, warnings, errors }
}

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

function createErrorResponse(
  message: string,
  status: number = 500,
  details?: unknown
): Response {
  const headers = new Headers({
    ...CORS_HEADERS,
    ...SECURITY_HEADERS,
    'Content-Type': 'application/json',
  })

  const errorResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    ...(details && { details })
  }

  console.error(`Error ${status}: ${message}`, details || '')

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers
  })
}

function createSuccessResponse(
  data: unknown,
  status: number = 200
): Response {
  const headers = new Headers({
    ...CORS_HEADERS,
    ...SECURITY_HEADERS,
    'Content-Type': 'application/json',
  })

  const successResponse = {
    success: true,
    data,
    timestamp: new Date().toISOString()
  }

  return new Response(JSON.stringify(successResponse), {
    status,
    headers
  })
}

function validateInput(
  input: Record<string, unknown>,
  rules: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object'
    required?: boolean
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    pattern?: RegExp
    enum?: unknown[]
  }>
): { isValid: boolean; errors: string[]; sanitized: Record<string, unknown> } {
  const errors: string[] = []
  const sanitized: Record<string, unknown> = {}

  for (const [field, rule] of Object.entries(rules)) {
    const value = input[field]

    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`)
      continue
    }

    if (!rule.required && (value === undefined || value === null || value === '')) {
      sanitized[field] = value
      continue
    }

    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${field} must be a string`)
          continue
        }
        
        let stringValue = value.trim()
        
        if (rule.minLength && stringValue.length < rule.minLength) {
          errors.push(`${field} must be at least ${rule.minLength} characters`)
          continue
        }
        if (rule.maxLength && stringValue.length > rule.maxLength) {
          stringValue = stringValue.substring(0, rule.maxLength).trim()
        }
        
        if (rule.pattern && !rule.pattern.test(stringValue)) {
          errors.push(`${field} format is invalid`)
          continue
        }
        
        if (rule.enum && !rule.enum.includes(stringValue)) {
          errors.push(`${field} must be one of: ${rule.enum.join(', ')}`)
          continue
        }
        
        sanitized[field] = stringValue
        break

      case 'number':
        const numValue = Number(value)
        if (isNaN(numValue)) {
          errors.push(`${field} must be a number`)
          continue
        }
        
        if (rule.min !== undefined && numValue < rule.min) {
          errors.push(`${field} must be at least ${rule.min}`)
          continue
        }
        if (rule.max !== undefined && numValue > rule.max) {
          errors.push(`${field} must be at most ${rule.max}`)
          continue
        }
        
        sanitized[field] = numValue
        break

      case 'boolean':
        sanitized[field] = Boolean(value)
        break

      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`${field} must be an array`)
          continue
        }
        sanitized[field] = value
        break

      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) {
          errors.push(`${field} must be an object`)
          continue
        }
        sanitized[field] = value
        break

      default:
        errors.push(`Unknown validation type for field ${field}`)
    }
  }

  return { isValid: errors.length === 0, errors, sanitized }
}

// ============ MAIN FUNCTION ============

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
  const headers = new Headers({
    ...CORS_HEADERS,
    ...SECURITY_HEADERS,
    'Content-Type': 'application/json',
  })

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  // GET endpoint: Retrieve vote progress data
  if (req.method === 'GET') {
    try {
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

      // Calculate vote counts and percentages with DEFENSIVE data handling
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
              console.warn(`[vote] Failed to parse selected_names for vote ${vote.id}`)
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

      console.log(`[vote] GET: Calculated ${totalVotes} votes across ${Object.keys(nameCounts).length} names`)

      const results: VoteResult[] = Object.entries(nameCounts)
        .map(([name, count]) => ({
          name,
          count,
          percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)

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

    let body: VoteRequest
    try {
      body = await req.json()
    } catch {
      return createErrorResponse('Invalid JSON in request body', 400)
    }

    const validation = validateInput(body, {
      name: { type: 'string', required: false, maxLength: 100 },
      selected_names: { type: 'array', required: true }
    })

    const errors: string[] = [...validation.errors]
    const names = validation.sanitized.selected_names as string[]
    const voterName = (validation.sanitized.name as string) || 'Anonymous Voter'
    
    if (names.length === 0) {
      errors.push('At least one name is required')
    }
    if (names.length > 4) {
      errors.push('Maximum 4 names allowed')
    }
    
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

    const sanitizedNames = names
      .map((n: string) => n.trim().slice(0, 50))
      .filter((n: string) => n.length > 0)

    const { count: totalCount } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
    const currentCount = totalCount || 0
    const isMilestone = currentCount + 1 === 50

    console.log(`[vote] POST: Writing vote to baby_shower.votes, current count: ${currentCount}`)

    const { data, error } = await supabase
      .from('votes')
      .insert({
        voter_name: voterName,
        selected_names: sanitizedNames,
        submitted_by: voterName,
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

    const allVotes = await supabase
      .from('votes')
      .select('id, selected_names, created_at')

    const nameCounts: Record<string, number> = {}
    let totalVotes = 0

    for (const vote of allVotes.data || []) {
      let selectedNames: string[] = []
      
      if (vote.selected_names) {
        if (Array.isArray(vote.selected_names)) {
          selectedNames = vote.selected_names
        } else if (typeof vote.selected_names === 'string') {
          try {
            selectedNames = JSON.parse(vote.selected_names)
          } catch (e) {
            console.warn(`[vote] Failed to parse selected_names for vote ${vote.id}`)
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
