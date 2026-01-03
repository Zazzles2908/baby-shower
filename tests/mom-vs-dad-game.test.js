/**
 * Mom vs Dad Game - Comprehensive Test Suite
 * Tests all Edge Functions for the Mom vs Dad game
 * 
 * Usage: Run in browser console or via Node.js
 */

const API_BASE = window.API?.baseUrl || window.CONFIG?.apiBaseUrl || ''

// Test configuration
const TEST_CONFIG = {
  sessionCode: null,
  adminCode: null,
  sessionId: null,
  scenarioId: null,
  momName: 'Sarah',
  dadName: 'Mike',
  testGuest: 'Test Guest'
}

// Utility functions
function log(message, type = 'info') {
  const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warn' ? '⚠️' : 'ℹ️'
  console.log(`[MomVsDad Test] ${prefix} ${message}`)
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
}

function recordTest(name, passed, details = '') {
  if (passed) {
    testResults.passed++
    log(`${name}: PASSED ${details}`, 'success')
  } else {
    testResults.failed++
    log(`${name}: FAILED ${details}`, 'error')
  }
  testResults.tests.push({ name, passed, details })
}

// ============================================================================
// GAME-SESSION TESTS
// ============================================================================

async function testGameSession() {
  log('Starting Game Session Tests...', 'info')
  
  // Test 1: Create Session
  try {
    const createResponse = await fetch(`${API_BASE}/game-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        mom_name: TEST_CONFIG.momName,
        dad_name: TEST_CONFIG.dadName,
        total_rounds: 5
      })
    })
    
    const createData = await createResponse.json()
    
    if (createResponse.ok && createData.success) {
      TEST_CONFIG.sessionCode = createData.data.session_code
      TEST_CONFIG.adminCode = createData.data.admin_code
      TEST_CONFIG.sessionId = createData.data.session_id
      
      recordTest('Create Session', true, `Code: ${TEST_CONFIG.sessionCode}`)
      
      // Test 2: Get Session
      const getResponse = await fetch(`${API_BASE}/game-session?code=${TEST_CONFIG.sessionCode}`)
      const getData = await getResponse.json()
      
      recordTest('Get Session', getResponse.ok && getData.success, 
        `Status: ${getData.data?.status}`)
      
    } else {
      recordTest('Create Session', false, createData.error || 'Unknown error')
      return false
    }
    
    // Test 3: Admin Login
    const loginResponse = await fetch(`${API_BASE}/game-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'admin_login',
        session_code: TEST_CONFIG.sessionCode,
        admin_code: TEST_CONFIG.adminCode
      })
    })
    
    const loginData = await loginResponse.json()
    recordTest('Admin Login', loginResponse.ok && loginData.success)
    
    // Test 4: Update Session to Voting
    const updateResponse = await fetch(`${API_BASE}/game-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update',
        session_code: TEST_CONFIG.sessionCode,
        admin_code: TEST_CONFIG.adminCode,
        status: 'voting'
      })
    })
    
    const updateData = await updateResponse.json()
    recordTest('Update Session Status', updateResponse.ok && updateData.success,
      `New status: ${updateData.data?.status}`)
    
    return true
    
  } catch (error) {
    recordTest('Game Session Tests', false, error.message)
    return false
  }
}

// ============================================================================
// GAME-SCENARIO TESTS
// ============================================================================

async function testGameScenario() {
  log('Starting Game Scenario Tests...', 'info')
  
  try {
    // Test 1: Generate Scenario
    const createResponse = await fetch(`${API_BASE}/game-scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: TEST_CONFIG.sessionId,
        mom_name: TEST_CONFIG.momName,
        dad_name: TEST_CONFIG.dadName,
        theme: 'funny'
      })
    })
    
    const createData = await createResponse.json()
    
    if (createResponse.ok && createData.success && createData.data) {
      TEST_CONFIG.scenarioId = createData.data.scenario_id
      
      recordTest('Generate Scenario', true, 
        `ID: ${TEST_CONFIG.scenarioId}, AI: ${createData.ai_generated}`)
      
      // Test 2: Get Scenario
      const getResponse = await fetch(`${API_BASE}/game-scenario?session_id=${TEST_CONFIG.sessionId}`)
      const getData = await getResponse.json()
      
      recordTest('Get Scenario', getResponse.ok && getData.success && getData.data,
        `Has text: ${!!getData.data?.scenario_text}`)
      
      return true
      
    } else {
      recordTest('Generate Scenario', false, createData.error || 'No data returned')
      return false
    }
    
  } catch (error) {
    recordTest('Game Scenario Tests', false, error.message)
    return false
  }
}

// ============================================================================
// GAME-VOTE TESTS
// ============================================================================

async function testGameVote() {
  log('Starting Game Vote Tests...', 'info')
  
  try {
    // Test 1: Submit Vote for Mom
    const momVoteResponse = await fetch(`${API_BASE}/game-vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario_id: TEST_CONFIG.scenarioId,
        guest_name: TEST_CONFIG.testGuest,
        vote_choice: 'mom'
      })
    })
    
    const momVoteData = await momVoteResponse.json()
    recordTest('Submit Mom Vote', momVoteResponse.ok && momVoteData.success,
      `Votes: Mom ${momVoteData.data?.vote_counts?.mom_votes || 0}`)
    
    // Test 2: Get Vote Counts
    const getVotesResponse = await fetch(`${API_BASE}/game-vote?scenario_id=${TEST_CONFIG.scenarioId}`)
    const getVotesData = await getVotesResponse.json()
    
    recordTest('Get Vote Counts', getVotesResponse.ok && getVotesData.success,
      `Total: ${getVotesData.data?.total_votes || 0}`)
    
    // Test 3: Lock Mom's Answer
    const lockMomResponse = await fetch(`${API_BASE}/game-vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario_id: TEST_CONFIG.scenarioId,
        parent: 'mom',
        answer: 'mom',
        admin_code: TEST_CONFIG.adminCode
      })
    })
    
    const lockMomData = await lockMomResponse.json()
    recordTest('Lock Mom Answer', lockMomResponse.ok && lockMomData.success,
      `Mom locked: ${lockMomData.data?.mom_locked}`)
    
    // Test 4: Lock Dad's Answer
    const lockDadResponse = await fetch(`${API_BASE}/game-vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario_id: TEST_CONFIG.scenarioId,
        parent: 'dad',
        answer: 'dad',
        admin_code: TEST_CONFIG.adminCode
      })
    })
    
    const lockDadData = await lockDadResponse.json()
    recordTest('Lock Dad Answer', lockDadResponse.ok && lockDadData.success,
      `Dad locked: ${lockDadData.data?.dad_locked}`)
    
    return true
    
  } catch (error) {
    recordTest('Game Vote Tests', false, error.message)
    return false
  }
}

// ============================================================================
// GAME-REVEAL TESTS
// ============================================================================

async function testGameReveal() {
  log('Starting Game Reveal Tests...', 'info')
  
  try {
    // Test 1: Get Reveal Status
    const statusResponse = await fetch(`${API_BASE}/game-reveal?scenario_id=${TEST_CONFIG.scenarioId}`)
    const statusData = await statusResponse.json()
    
    recordTest('Get Reveal Status', statusResponse.ok && statusData.success,
      `Ready: ${statusData.data?.both_parents_locked}`)
    
    // Test 2: Trigger Reveal
    const revealResponse = await fetch(`${API_BASE}/game-reveal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario_id: TEST_CONFIG.scenarioId,
        admin_code: TEST_CONFIG.adminCode
      })
    })
    
    const revealData = await revealResponse.json()
    
    if (revealResponse.ok && revealData.success) {
      recordTest('Trigger Reveal', true,
        `Gap: ${revealData.data?.perception_gap}%, Roast: ${revealData.data?.roast_commentary?.substring(0, 50)}...`)
      
      // Test 3: Get Final Results
      const resultsResponse = await fetch(`${API_BASE}/game-reveal?scenario_id=${TEST_CONFIG.scenarioId}`)
      const resultsData = await resultsResponse.json()
      
      recordTest('Get Final Results', resultsResponse.ok && resultsData.success,
        `Revealed: ${resultsData.data?.is_revealed}`)
      
      return true
      
    } else {
      recordTest('Trigger Reveal', false, revealData.error || 'Unknown error')
      return false
    }
    
  } catch (error) {
    recordTest('Game Reveal Tests', false, error.message)
    return false
  }
}

// ============================================================================
// INTEGRATION TEST
// ============================================================================

async function runIntegrationTests() {
  log('Running Full Integration Test...', 'info')
  console.log('='.repeat(50))
  
  try {
    // Step 1: Create Session
    const sessionCreated = await testGameSession()
    if (!sessionCreated) {
      throw new Error('Failed to create session')
    }
    
    await delay(500)
    
    // Step 2: Generate Scenario
    const scenarioCreated = await testGameScenario()
    if (!scenarioCreated) {
      throw new Error('Failed to generate scenario')
    }
    
    await delay(500)
    
    // Step 3: Submit Votes
    const votesSubmitted = await testGameVote()
    if (!votesSubmitted) {
      throw new Error('Failed to submit votes')
    }
    
    await delay(500)
    
    // Step 4: Trigger Reveal
    const revealCompleted = await testGameReveal()
    if (!revealCompleted) {
      throw new Error('Failed to trigger reveal')
    }
    
    console.log('='.repeat(50))
    log(`Integration Test Complete!`, 'success')
    log(`Passed: ${testResults.passed}, Failed: ${testResults.failed}`, 'info')
    
    return true
    
  } catch (error) {
    log(`Integration Test Failed: ${error.message}`, 'error')
    return false
  }
}

// ============================================================================
// RUN TESTS
// ============================================================================

// Auto-run if in test mode
if (window.CONFIG?.testMode || new URLSearchParams(window.location.search).get('test') === 'true') {
  log('Auto-running Mom vs Dad Game tests...', 'info')
  runIntegrationTests().then(success => {
    console.log('Final Test Results:', testResults)
    if (typeof window !== 'undefined') {
      window.testResults = testResults
    }
  })
}

// Export for manual testing
window.MomVsDadTests = {
  runIntegrationTests,
  testGameSession,
  testGameScenario,
  testGameVote,
  testGameReveal,
  getResults: () => testResults,
  config: TEST_CONFIG
}

console.log('🎮 Mom vs Dad Game Test Suite loaded!')
console.log('Run tests with: MomVsDadTests.runIntegrationTests()')
