/**
 * Baby Shower App - Supabase Edge Functions API Client
 * Production-ready integration with comprehensive error handling
 * 
 * Usage:
 *   import { submitGuestbook, submitVote, submitPool, submitQuiz, submitAdvice } from './api-supabase.js'
 *   
 *   // Submit to guestbook
 *   const result = await submitGuestbook({ name: 'John', message: 'Happy Baby Shower!', relationship: 'Friend' })
 *   
 *   // Submit a vote
 *   const result = await submitVote({ names: ['Emma', 'Olivia'] })
 */

// Configuration - Replace with your Supabase project details
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Fallback to Vercel API if Supabase not configured
const USE_SUPABASE = SUPABASE_URL && SUPABASE_ANON_KEY
const VERCEL_API_URL = import.meta.env.VITE_VERCEL_API_URL || ''

/**
 * Build Supabase Edge Function URL
 */
function getSupabaseFunctionUrl(functionName) {
  return `${SUPABASE_URL}/functions/v1/${functionName}`
}

/**
 * Build Vercel API URL (fallback)
 */
function getVercelApiUrl(endpoint) {
  return `${VERCEL_API_URL}/${endpoint}`
}

/**
 * Get the appropriate API URL based on configuration
 */
function getApiUrl(functionName, vercelEndpoint) {
  return USE_SUPABASE ? getSupabaseFunctionUrl(functionName) : getVercelApiUrl(vercelEndpoint)
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Add Supabase authorization header if using Supabase
  if (USE_SUPABASE) {
    headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (err) {
    clearTimeout(timeoutId)
    
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    throw err
  }
}

/**
 * Submit guestbook entry
 */
export async function submitGuestbook(data) {
  const url = getApiUrl('guestbook', 'guestbook')
  
  return apiFetch(url, {
    method: 'POST',
    body: JSON.stringify({
      name: data.name?.trim() || '',
      message: data.message?.trim() || '',
      relationship: data.relationship?.trim() || '',
    }),
  })
}

/**
 * Submit baby name vote
 */
export async function submitVote(data) {
  const url = getApiUrl('vote', 'vote')
  
  return apiFetch(url, {
    method: 'POST',
    body: JSON.stringify({
      names: Array.isArray(data.names) ? data.names : [],
    }),
  })
}

/**
 * Submit due date prediction
 */
export async function submitPool(data) {
  const url = getApiUrl('pool', 'pool')
  
  return apiFetch(url, {
    method: 'POST',
    body: JSON.stringify({
      name: data.name?.trim() || '',
      prediction: data.prediction?.trim() || '',
      dueDate: data.dueDate || '',
    }),
  })
}

/**
 * Submit quiz answers
 */
export async function submitQuiz(data) {
  const url = getApiUrl('quiz', 'quiz')
  
  return apiFetch(url, {
    method: 'POST',
    body: JSON.stringify({
      answers: data.answers || {},
      score: Number(data.score) || 0,
      totalQuestions: Number(data.totalQuestions) || 0,
    }),
  })
}

/**
 * Submit parenting advice
 */
export async function submitAdvice(data) {
  const url = getApiUrl('advice', 'advice')
  
  return apiFetch(url, {
    method: 'POST',
    body: JSON.stringify({
      advice: data.advice?.trim() || '',
      category: data.category?.trim() || 'general',
    }),
  })
}

/**
 * Get submissions for realtime updates
 */
export async function getSubmissions(activityType) {
  if (!SUPABASE_URL) {
    throw new Error('Supabase URL not configured')
  }

  const url = `${SUPABASE_URL}/rest/v1/submissions?activity_type=eq.${activityType}&order=created_at.desc`
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'apikey': SUPABASE_ANON_KEY,
  }

  const response = await fetch(url, { headers })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Subscribe to realtime updates
 */
export function subscribeToSubmissions(activityType, callback) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Realtime subscriptions require Supabase configuration')
    return () => {}
  }

  const subscription = {
    channel: null,
    unsubscribe: () => {
      if (subscription.channel) {
        subscription.channel.unsubscribe()
      }
    },
  }

  // Note: Full realtime implementation requires @supabase/supabase-js
  // This is a placeholder for the subscription pattern
  console.log(`Subscribed to ${activityType} submissions`)

  return subscription.unsubscribe
}

// Export configuration for debugging
export function getApiConfig() {
  return {
    provider: USE_SUPABASE ? 'supabase' : 'vercel',
    supabaseUrl: SUPABASE_URL ? '***configured***' : 'not configured',
    vercelUrl: VERCEL_API_URL ? '***configured***' : 'not configured',
  }
}
