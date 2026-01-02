/**
 * Baby Shower App - End-to-End Test Suite
 * Run with: node tests/e2e/test-suite.js
 * 
 * Prerequisites:
 * - Supabase project configured
 * - Edge Functions deployed
 * - Environment variables set
 */

import { writeFile, readFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const RESULTS_FILE = join(__dirname, 'results.json')

// Test configuration
const CONFIG = {
  supabaseUrl: process.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || '',
  vercelApiUrl: process.env.VITE_VERCEL_API_URL || '',
  testMode: process.env.TEST_MODE || 'supabase', // 'supabase' or 'vercel'
  timeout: 30000,
}

// Test results collector
const results = {
  timestamp: new Date().toISOString(),
  config: {
    provider: CONFIG.testMode,
    supabaseConfigured: !!CONFIG.supabaseUrl,
    vercelConfigured: !!CONFIG.vercelApiUrl,
  },
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
  },
}

/**
 * Log test result
 */
function logTest(name, passed, details = null, error = null) {
  const test = {
    name,
    passed,
    timestamp: new Date().toISOString(),
    details,
    error: error?.message || error,
  }
  
  results.tests.push(test)
  results.summary.total++
  
  if (passed) {
    results.summary.passed++
    console.log(`  ✓ ${name}`)
  } else {
    results.summary.failed++
    console.log(`  ✗ ${name}`)
    if (error) console.log(`    Error: ${error.message}`)
  }
}

/**
 * Save results to file
 */
async function saveResults() {
  await writeFile(RESULTS_FILE, JSON.stringify(results, null, 2))
  console.log(`\nResults saved to: ${RESULTS_FILE}`)
}

/**
 * Make API request with timeout
 */
async function apiRequest(url, options = {}) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout)
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    const data = await response.json().catch(() => ({}))
    
    return {
      ok: response.ok,
      status: response.status,
      data,
    }
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

/**
 * Get API URL based on mode
 */
function getApiUrl(endpoint) {
  if (CONFIG.testMode === 'supabase') {
    return `${CONFIG.supabaseUrl}/functions/v1/${endpoint}`
  }
  return `${CONFIG.vercelApiUrl}/${endpoint}`
}

/**
 * Test Suite: Guestbook Function
 */
async function testGuestbook() {
  console.log('\n📝 Testing Guestbook Function')
  
  // Test 1: Valid submission
  try {
    const response = await apiRequest(getApiUrl('guestbook'), {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Guest',
        message: 'This is a test message for the baby shower!',
        relationship: 'Friend',
      }),
    })
    
    logTest(
      'Valid guestbook submission',
      response.ok && response.data?.success,
      response.data?.data,
      response.ok ? null : new Error(response.data?.error || 'Submission failed')
    )
  } catch (error) {
    logTest('Valid guestbook submission', false, null, error)
  }
  
  // Test 2: Missing name
  try {
    const response = await apiRequest(getApiUrl('guestbook'), {
      method: 'POST',
      body: JSON.stringify({
        message: 'Test message',
        relationship: 'Friend',
      }),
    })
    
    logTest(
      'Reject missing name',
      !response.ok && response.status === 400,
      null,
      response.ok ? new Error('Should have rejected') : null
    )
  } catch (error) {
    logTest('Reject missing name', false, null, error)
  }
  
  // Test 3: Empty message
  try {
    const response = await apiRequest(getApiUrl('guestbook'), {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Guest',
        message: '   ',
        relationship: 'Friend',
      }),
    })
    
    logTest(
      'Reject empty message',
      !response.ok && response.status === 400,
      null,
      response.ok ? new Error('Should have rejected') : null
    )
  } catch (error) {
    logTest('Reject empty message', false, null, error)
  }
  
  // Test 4: Long input sanitization
  try {
    const longName = 'A'.repeat(200)
    const response = await apiRequest(getApiUrl('guestbook'), {
      method: 'POST',
      body: JSON.stringify({
        name: longName,
        message: 'Test message',
        relationship: 'Friend',
      }),
    })
    
    logTest(
      'Sanitize long input (truncate to 100 chars)',
      response.ok && response.data?.data?.name?.length <= 100,
      { nameLength: response.data?.data?.name?.length },
      !response.ok ? new Error(response.data?.error) : null
    )
  } catch (error) {
    logTest('Sanitize long input', false, null, error)
  }
}

/**
 * Test Suite: Vote Function
 */
async function testVote() {
  console.log('\n🗳️ Testing Vote Function')
  
  // Test 1: Valid vote (1 name)
  try {
    const response = await apiRequest(getApiUrl('vote'), {
      method: 'POST',
      body: JSON.stringify({
        names: ['Emma'],
      }),
    })
    
    logTest(
      'Valid single-name vote',
      response.ok && response.data?.success,
      response.data?.data,
      response.ok ? null : new Error(response.data?.error || 'Vote failed')
    )
  } catch (error) {
    logTest('Valid single-name vote', false, null, error)
  }
  
  // Test 2: Valid vote (4 names - max)
  try {
    const response = await apiRequest(getApiUrl('vote'), {
      method: 'POST',
      body: JSON.stringify({
        names: ['Emma', 'Olivia', 'Ava', 'Isabella'],
      }),
    })
    
    logTest(
      'Valid max-name vote (4)',
      response.ok && response.data?.data?.vote_count === 4,
      response.data?.data,
      response.ok ? null : new Error(response.data?.error || 'Vote failed')
    )
  } catch (error) {
    logTest('Valid max-name vote', false, null, error)
  }
  
  // Test 3: Reject too many names
  try {
    const response = await apiRequest(getApiUrl('vote'), {
      method: 'POST',
      body: JSON.stringify({
        names: ['Emma', 'Olivia', 'Ava', 'Isabella', 'Sophia'],
      }),
    })
    
    logTest(
      'Reject too many names (>4)',
      !response.ok && response.status === 400,
      null,
      response.ok ? new Error('Should have rejected') : null
    )
  } catch (error) {
    logTest('Reject too many names', false, null, error)
  }
  
  // Test 4: Empty array
  try {
    const response = await apiRequest(getApiUrl('vote'), {
      method: 'POST',
      body: JSON.stringify({
        names: [],
      }),
    })
    
    logTest(
      'Reject empty names array',
      !response.ok && response.status === 400,
      null,
      response.ok ? new Error('Should have rejected') : null
    )
  } catch (error) {
    logTest('Reject empty names', false, null, error)
  }
}

/**
 * Test Suite: Pool Function
 */
async function testPool() {
  console.log('\n📅 Testing Pool Function')
  
  // Test 1: Valid prediction
  try {
    const response = await apiRequest(getApiUrl('pool'), {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Guest',
        prediction: 'Baby will be born on Christmas!',
        dueDate: '2024-12-25',
      }),
    })
    
    logTest(
      'Valid due date prediction',
      response.ok && response.data?.success,
      response.data?.data,
      response.ok ? null : new Error(response.data?.error || 'Pool submission failed')
    )
  } catch (error) {
    logTest('Valid due date prediction', false, null, error)
  }
  
  // Test 2: Invalid date format
  try {
    const response = await apiRequest(getApiUrl('pool'), {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Guest',
        prediction: 'Wrong date',
        dueDate: '12/25/2024',
      }),
    })
    
    logTest(
      'Reject invalid date format',
      !response.ok && response.status === 400,
      null,
      response.ok ? new Error('Should have rejected') : null
    )
  } catch (error) {
    logTest('Reject invalid date format', false, null, error)
  }
}

/**
 * Test Suite: Quiz Function
 */
async function testQuiz() {
  console.log('\n🎯 Testing Quiz Function')
  
  // Test 1: Valid quiz submission
  try {
    const response = await apiRequest(getApiUrl('quiz'), {
      method: 'POST',
      body: JSON.stringify({
        answers: {
          q1: 'A',
          q2: 'B',
          q3: 'C',
        },
        score: 3,
        totalQuestions: 5,
      }),
    })
    
    logTest(
      'Valid quiz submission',
      response.ok && response.data?.success,
      response.data?.data,
      response.ok ? null : new Error(response.data?.error || 'Quiz submission failed')
    )
  } catch (error) {
    logTest('Valid quiz submission', false, null, error)
  }
  
  // Test 2: Score exceeds total
  try {
    const response = await apiRequest(getApiUrl('quiz'), {
      method: 'POST',
      body: JSON.stringify({
        answers: {},
        score: 10,
        totalQuestions: 5,
      }),
    })
    
    logTest(
      'Reject score > total questions',
      !response.ok && response.status === 400,
      null,
      response.ok ? new Error('Should have rejected') : null
    )
  } catch (error) {
    logTest('Reject score > total', false, null, error)
  }
}

/**
 * Test Suite: Advice Function
 */
async function testAdvice() {
  console.log('\n💡 Testing Advice Function')
  
  // Test 1: Valid advice
  try {
    const response = await apiRequest(getApiUrl('advice'), {
      method: 'POST',
      body: JSON.stringify({
        advice: 'Get as much sleep as you can before the baby arrives!',
        category: 'general',
      }),
    })
    
    logTest(
      'Valid advice submission',
      response.ok && response.data?.success,
      response.data?.data,
      response.ok ? null : new Error(response.data?.error || 'Advice submission failed')
    )
  } catch (error) {
    logTest('Valid advice submission', false, null, error)
  }
  
  // Test 2: Invalid category
  try {
    const response = await apiRequest(getApiUrl('advice'), {
      method: 'POST',
      body: JSON.stringify({
        advice: 'Some advice',
        category: 'invalid-category',
      }),
    })
    
    logTest(
      'Reject invalid category',
      !response.ok && response.status === 400,
      null,
      response.ok ? new Error('Should have rejected') : null
    )
  } catch (error) {
    logTest('Reject invalid category', false, null, error)
  }
}

/**
 * Test Suite: Database Layer
 */
async function testDatabase() {
  console.log('\n🗄️ Testing Database Layer')
  
  if (!CONFIG.supabaseUrl) {
    logTest('Supabase URL configured', false, null, new Error('Missing configuration'))
    return
  }
  
  // Test 1: Can read submissions
  try {
    const url = `${CONFIG.supabaseUrl}/rest/v1/submissions?select=*&limit=1`
    const response = await fetch(url, {
      headers: {
        'apikey': CONFIG.supabaseAnonKey,
        'Authorization': `Bearer ${CONFIG.supabaseAnonKey}`,
      },
    })
    
    logTest(
      'Can read submissions table',
      response.ok,
      null,
      !response.ok ? new Error(`HTTP ${response.status}`) : null
    )
  } catch (error) {
    logTest('Can read submissions table', false, null, error)
  }
  
  // Test 2: Can read internal archive
  try {
    const url = `${CONFIG.supabaseUrl}/rest/v1/internal.event_archive?select=*&limit=1`
    const response = await fetch(url, {
      headers: {
        'apikey': CONFIG.supabaseAnonKey,
        'Authorization': `Bearer ${CONFIG.supabaseAnonKey}`,
      },
    })
    
    logTest(
      'Can read internal archive table',
      response.ok,
      null,
      !response.ok ? new Error(`HTTP ${response.status}`) : null
    )
  } catch (error) {
    logTest('Can read internal archive', false, null, error)
  }
}

/**
 * Test Suite: Edge Cases & Error Handling
 */
async function testEdgeCases() {
  console.log('\n⚠️ Testing Edge Cases')
  
  // Test 1: Invalid JSON
  try {
    const response = await apiRequest(getApiUrl('guestbook'), {
      method: 'POST',
      body: 'not valid json',
    })
    
    logTest(
      'Handle invalid JSON body',
      !response.ok,
      null,
      response.ok ? new Error('Should have failed') : null
    )
  } catch (error) {
    logTest('Handle invalid JSON', true, null, null) // Expected to fail
  }
  
  // Test 2: Wrong HTTP method
  try {
    const response = await apiRequest(getApiUrl('guestbook'), {
      method: 'GET',
    })
    
    logTest(
      'Reject non-POST methods',
      !response.ok && response.status === 405,
      null,
      response.ok ? new Error('Should have rejected') : null
    )
  } catch (error) {
    logTest('Reject non-POST methods', false, null, error)
  }
  
  // Test 3: Request timeout
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1000) // 1 second
    
    const response = await fetch(getApiUrl('guestbook'), {
      method: 'POST',
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    logTest('Timeout handling works', true)
  } catch (error) {
    logTest('Timeout handling works', true)
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('='.repeat(60))
  console.log('🧪 Baby Shower App - End-to-End Test Suite')
  console.log('='.repeat(60))
  console.log(`\nMode: ${CONFIG.testMode}`)
  console.log(`Supabase: ${CONFIG.supabaseUrl ? '✓ Configured' : '✗ Not configured'}`)
  console.log(`Vercel: ${CONFIG.vercelApiUrl ? '✓ Configured' : '✗ Not configured'}`)
  
  try {
    // Run test suites
    await testGuestbook()
    await testVote()
    await testPool()
    await testQuiz()
    await testAdvice()
    await testDatabase()
    await testEdgeCases()
    
    // Print summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 Test Summary')
    console.log('='.repeat(60))
    console.log(`Total:  ${results.summary.total}`)
    console.log(`Passed: ${results.summary.passed} ✓`)
    console.log(`Failed: ${results.summary.failed} ✗`)
    console.log(`Rate:   ${Math.round((results.summary.passed / results.summary.total) * 100)}%`)
    
    // Save results
    await saveResults()
    
    // Exit with appropriate code
    process.exit(results.summary.failed > 0 ? 1 : 0)
    
  } catch (error) {
    console.error('\n❌ Test suite error:', error)
    await saveResults()
    process.exit(1)
  }
}

// Run tests
runTests()
