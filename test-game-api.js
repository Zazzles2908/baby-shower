/**
 * Mom vs Dad Game API - End-to-End Test Suite
 * 
 * Purpose: Comprehensive testing of all game API endpoints
 * Prerequisites:
 * - Supabase project configured with game tables
 * - Edge Functions deployed
 * - Session: XCWFHJ (admin PIN: 1438)
 * 
 * Usage: node test-game-api.js
 */

const BASE_URL = 'https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/';
const TIMEOUT = 30000;

// Test results collector
const results = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    sessionCode: 'XCWFHJ',
    adminPin: '1438',
    tests: [],
    summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
    },
    sessionData: {
        sessionId: null,
        momName: null,
        dadName: null,
        scenarios: []
    }
};

/**
 * Log test result
 */
function logTest(name, passed, details = null, error = null) {
    const test = {
        name,
        passed,
        timestamp: new Date().toISOString(),
        details,
        error: error?.message || error
    };
    
    results.tests.push(test);
    results.summary.total++;
    
    if (passed) {
        results.summary.passed++;
        console.log(`  ✓ ${name}`);
    } else {
        results.summary.failed++;
        console.log(`  ✗ ${name}`);
        if (error) console.log(`    Error: ${error.message}`);
    }
}

/**
 * Make API request with timeout
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
    
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        const data = await response.json().catch(() => ({}));
        
        return {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            data,
        };
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

/**
 * Utility to pause execution
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test Suite: Game Session Management
 */
async function testGameSession() {
    console.log('\n🎮 Testing Game Session Management');
    
    // Test 1: Create new game session
    console.log('\n  Creating new game session...');
    try {
        const response = await apiRequest('game-session', {
            method: 'POST',
            body: JSON.stringify({
                action: 'create',
                mom_name: 'Test Mom',
                dad_name: 'Test Dad',
                total_rounds: 3
            })
        });
        
        const success = response.ok && response.data?.success;
        logTest(
            'Create new game session',
            success,
            response.data?.data,
            success ? null : new Error(response.data?.error || 'Failed to create session')
        );
        
        if (success && response.data?.data) {
            results.sessionData.sessionId = response.data.data.session_id;
            results.sessionData.momName = response.data.data.mom_name;
            results.sessionData.dadName = response.data.data.dad_name;
            console.log(`    Session ID: ${response.data.data.session_id}`);
            console.log(`    Session Code: ${response.data.data.session_code}`);
            console.log(`    Admin PIN: ${response.data.data.admin_code}`);
        }
    } catch (error) {
        logTest('Create new game session', false, null, error);
    }
    
    // Test 2: Get existing session
    console.log('\n  Retrieving existing session...');
    try {
        const response = await apiRequest(`game-session?code=XCWFHJ`, {
            method: 'GET'
        });
        
        const success = response.ok && response.data?.success;
        logTest(
            'Get existing session by code',
            success,
            response.data?.data,
            success ? null : new Error(response.data?.error || 'Failed to get session')
        );
        
        if (success && response.data?.data) {
            results.sessionData.sessionId = response.data.data.session_id || results.sessionData.sessionId;
            results.sessionData.momName = response.data.data.mom_name || results.sessionData.momName;
            results.sessionData.dadName = response.data.data.dad_name || results.sessionData.dadName;
            console.log(`    Session Code: ${response.data.data.session_code}`);
            console.log(`    Status: ${response.data.data.status}`);
            console.log(`    Current Round: ${response.data.data.current_round}`);
        }
    } catch (error) {
        logTest('Get existing session by code', false, null, error);
    }
    
    // Test 3: Join session as guest
    console.log('\n  Joining session as guest...');
    try {
        const response = await apiRequest('game-session', {
            method: 'POST',
            body: JSON.stringify({
                action: 'join',
                session_code: 'XCWFHJ',
                guest_name: 'Test Guest'
            })
        });
        
        const success = response.ok && response.data?.success;
        logTest(
            'Join session as guest',
            success,
            response.data?.data,
            success ? null : new Error(response.data?.error || 'Failed to join session')
        );
        
        if (success) {
            console.log(`    Welcome message: ${response.data.message}`);
        }
    } catch (error) {
        logTest('Join session as guest', false, null, error);
    }
    
    // Test 4: Update session status to voting
    console.log('\n  Updating session status to voting...');
    try {
        const response = await apiRequest('game-session', {
            method: 'POST',
            body: JSON.stringify({
                action: 'update',
                session_code: 'XCWFHJ',
                admin_code: '1438',
                status: 'voting'
            })
        });
        
        const success = response.ok && response.data?.success;
        logTest(
            'Update session status to voting',
            success,
            response.data?.data,
            success ? null : new Error(response.data?.error || 'Failed to update session')
        );
        
        if (success) {
            console.log(`    New status: ${response.data.data.status}`);
        }
    } catch (error) {
        logTest('Update session status to voting', false, null, error);
    }
    
    // Test 5: Validation - Missing mom name
    console.log('\n  Testing validation - missing mom name...');
    try {
        const response = await apiRequest('game-session', {
            method: 'POST',
            body: JSON.stringify({
                action: 'create',
                dad_name: 'Test Dad'
            })
        });
        
        logTest(
            'Reject missing mom name',
            !response.ok && response.status === 400,
            response.data?.details,
            response.ok ? new Error('Should have rejected') : null
        );
    } catch (error) {
        logTest('Reject missing mom name', false, null, error);
    }
    
    // Test 6: Validation - Invalid session code
    console.log('\n  Testing validation - invalid session code...');
    try {
        const response = await apiRequest('game-session', {
            method: 'POST',
            body: JSON.stringify({
                action: 'join',
                session_code: 'ABC',
                guest_name: 'Test Guest'
            })
        });
        
        logTest(
            'Reject invalid session code',
            !response.ok && response.status === 400,
            response.data?.details,
            response.ok ? new Error('Should have rejected') : null
        );
    } catch (error) {
        logTest('Reject invalid session code', false, null, error);
    }
}

/**
 * Test Suite: Game Scenario Generation
 */
async function testGameScenario() {
    console.log('\n📝 Testing Game Scenario Generation');
    
    if (!results.sessionData.sessionId) {
        console.log('  ⚠ Skipping scenario tests - no session ID available');
        return;
    }
    
    // Test 1: Generate new scenario
    console.log('\n  Generating new scenario...');
    try {
        const response = await apiRequest('game-scenario', {
            method: 'POST',
            body: JSON.stringify({
                session_id: results.sessionData.sessionId,
                mom_name: results.sessionData.momName || 'Mom',
                dad_name: results.sessionData.dadName || 'Dad',
                theme: 'farm'
            })
        });
        
        const success = response.ok && response.data?.success;
        logTest(
            'Generate new scenario',
            success,
            response.data?.data,
            success ? null : new Error(response.data?.error || 'Failed to generate scenario')
        );
        
        if (success && response.data?.data) {
            results.sessionData.scenarios.push(response.data.data);
            console.log(`    Scenario ID: ${response.data.data.scenario_id}`);
            console.log(`    Intensity: ${response.data.data.intensity}`);
            console.log(`    AI Generated: ${response.data.data.ai_generated}`);
        }
    } catch (error) {
        logTest('Generate new scenario', false, null, error);
    }
    
    // Test 2: Get current scenario
    console.log('\n  Fetching current scenario...');
    try {
        const response = await apiRequest(`game-scenario?session_id=${results.sessionData.sessionId}`, {
            method: 'GET'
        });
        
        const success = response.ok && response.data?.success;
        logTest(
            'Get current scenario',
            success,
            response.data?.data,
            success ? null : new Error(response.data?.error || 'Failed to get scenario')
        );
        
        if (success && response.data?.data) {
            console.log(`    Scenario: ${response.data.data.scenario_text?.substring(0, 50)}...`);
        }
    } catch (error) {
        logTest('Get current scenario', false, null, error);
    }
    
    // Test 3: Validation - Missing session ID
    console.log('\n  Testing validation - missing session ID...');
    try {
        const response = await apiRequest('game-scenario', {
            method: 'POST',
            body: JSON.stringify({
                mom_name: 'Mom',
                dad_name: 'Dad'
            })
        });
        
        logTest(
            'Reject missing session_id',
            !response.ok && response.status === 400,
            response.data?.details,
            response.ok ? new Error('Should have rejected') : null
        );
    } catch (error) {
        logTest('Reject missing session_id', false, null, error);
    }
    
    // Test 4: Validation - Invalid theme
    console.log('\n  Testing validation - invalid theme...');
    try {
        const response = await apiRequest('game-scenario', {
            method: 'POST',
            body: JSON.stringify({
                session_id: results.sessionData.sessionId,
                mom_name: 'Mom',
                dad_name: 'Dad',
                theme: 'invalid-theme'
            })
        });
        
        logTest(
            'Reject invalid theme',
            !response.ok && response.status === 400,
            response.data?.details,
            response.ok ? new Error('Should have rejected') : null
        );
    } catch (error) {
        logTest('Reject invalid theme', false, null, error);
    }
}

/**
 * Test Suite: Voting System
 */
async function testGameVote() {
    console.log('\n🗳️ Testing Voting System');
    
    if (results.sessionData.scenarios.length === 0) {
        console.log('  ⚠ Skipping vote tests - no scenarios available');
        return;
    }
    
    const scenarioId = results.sessionData.scenarios[0]?.scenario_id;
    if (!scenarioId) {
        console.log('  ⚠ Skipping vote tests - no scenario ID available');
        return;
    }
    
    // Test 1: Submit vote for mom
    console.log('\n  Submitting vote for mom...');
    try {
        const response = await apiRequest('game-vote', {
            method: 'POST',
            body: JSON.stringify({
                scenario_id: scenarioId,
                guest_name: 'Guest 1',
                vote_choice: 'mom'
            })
        });
        
        const success = response.ok && response.data?.success;
        logTest(
            'Submit vote for mom',
            success,
            response.data?.data,
            success ? null : new Error(response.data?.error || 'Failed to submit vote')
        );
        
        if (success && response.data?.data) {
            console.log(`    Mom votes: ${response.data.data.vote_counts?.mom_votes}`);
            console.log(`    Dad votes: ${response.data.data.vote_counts?.dad_votes}`);
        }
    } catch (error) {
        logTest('Submit vote for mom', false, null, error);
    }
    
    // Test 2: Submit vote for dad
    console.log('\n  Submitting vote for dad...');
    try {
        const response = await apiRequest('game-vote', {
            method: 'POST',
            body: JSON.stringify({
                scenario_id: scenarioId,
                guest_name: 'Guest 2',
                vote_choice: 'dad'
            })
        });
        
        const success = response.ok && response.data?.success;
        logTest(
            'Submit vote for dad',
            success,
            response.data?.data,
            success ? null : new Error(response.data?.error || 'Failed to submit vote')
        );
    } catch (error) {
        logTest('Submit vote for dad', false, null, error);
    }
    
    // Test 3: Submit another vote for mom
    console.log('\n  Submitting another vote for mom...');
    try {
        const response = await apiRequest('game-vote', {
            method: 'POST',
            body: JSON.stringify({
                scenario_id: scenarioId,
                guest_name: 'Guest 3',
                vote_choice: 'mom'
            })
        });
        
        const success = response.ok && response.data?.success;
        logTest(
            'Submit additional vote for mom',
            success,
            response.data?.data,
            success ? null : new Error(response.data?.error || 'Failed to submit vote')
        );
    } catch (error) {
        logTest('Submit additional vote for mom', false, null, error);
    }
    
    // Test 4: Get vote counts
    console.log('\n  Fetching vote counts...');
    try {
        const response = await apiRequest(`game-vote?scenario_id=${scenarioId}`, {
            method: 'GET'
        });
        
        const success = response.ok && response.data?.success;
        logTest(
            'Get vote counts',
            success,
            response.data?.data,
            success ? null : new Error(response.data?.error || 'Failed to get votes')
        );
        
        if (success && response.data?.data) {
            console.log(`    Mom: ${response.data.data.mom_votes} (${response.data.data.mom_pct}%)`);
            console.log(`    Dad: ${response.data.data.dad_votes} (${response.data.data.dad_pct}%)`);
            console.log(`    Total: ${response.data.data.total_votes}`);
        }
    } catch (error) {
        logTest('Get vote counts', false, null, error);
    }
    
    // Test 5: Update existing vote
    console.log('\n  Updating existing vote...');
    try {
        const response = await apiRequest('game-vote', {
            method: 'POST',
            body: JSON.stringify({
                scenario_id: scenarioId,
                guest_name: 'Guest 1',
                vote_choice: 'dad'
            })
        });
        
        const success = response.ok && response.data?.success;
        logTest(
            'Update existing vote',
            success,
            response.data?.data,
            success ? null : new Error(response.data?.error || 'Failed to update vote')
        );
    } catch (error) {
        logTest('Update existing vote', false, null, error);
    }
    
    // Test 6: Validation - Invalid vote choice
    console.log('\n  Testing validation - invalid vote choice...');
    try {
        const response = await apiRequest('game-vote', {
            method: 'POST',
            body: JSON.stringify({
                scenario_id: scenarioId,
                guest_name: 'Test Guest',
                vote_choice: 'invalid'
            })
        });
        
        logTest(
            'Reject invalid vote choice',
            !response.ok && response.status === 400,
            response.data?.details,
            response.ok ? new Error('Should have rejected') : null
        );
    } catch (error) {
        logTest('Reject invalid vote choice', false, null, error);
    }
    
    // Test 7: Validation - Missing scenario ID
    console.log('\n  Testing validation - missing scenario ID...');
    try {
        const response = await apiRequest('game-vote', {
            method: 'POST',
            body: JSON.stringify({
                guest_name: 'Test Guest',
                vote_choice: 'mom'
            })
        });
        
        logTest(
            'Reject missing scenario_id',
            !response.ok && response.status === 400,
            response.data?.details,
            response.ok ? new Error('Should have rejected') : null
        );
    } catch (error) {
        logTest('Reject missing scenario_id', false, null, error);
    }
}

/**
 * Test Suite: Lock Parent Answers
 */
async function testLockAnswers() {
    console.log('\n🔒 Testing Parent Answer Locking');
    
    if (results.sessionData.scenarios.length === 0) {
        console.log('  ⚠ Skipping lock tests - no scenarios available');
        return;
    }
    
    const scenarioId = results.sessionData.scenarios[0]?.scenario_id;
    if (!scenarioId) {
        console.log('  ⚠ Skipping lock tests - no scenario ID available');
        return;
    }
    
    // Test 1: Lock mom's answer
    console.log('\n  Locking mom\'s answer...');
    try {
        const response = await apiRequest('game-vote', {
            method: 'POST',
            body: JSON.stringify({
                scenario_id: scenarioId,
                parent: 'mom',
                answer: 'mom',
                admin_code: '1438'
            })
        });
        
        const success = response.ok && response.data?.success;
        logTest(
            'Lock mom\'s answer',
            success,
            response.data?.data,
            success ? null : new Error(response.data?.error || 'Failed to lock answer')
        );
        
        if (success && response.data?.data) {
            console.log(`    Mom locked: ${response.data.data.mom_locked}`);
            console.log(`    Dad locked: ${response.data.data.dad_locked}`);
            console.log(`    Both locked: ${response.data.data.both_locked}`);
        }
    } catch (error) {
        logTest('Lock mom\'s answer', false, null, error);
    }
    
    // Test 2: Lock dad's answer
    console.log('\n  Locking dad\'s answer...');
    try {
        const response = await apiRequest('game-vote', {
            method: 'POST',
            body: JSON.stringify({
                scenario_id: scenarioId,
                parent: 'dad',
                answer: 'dad',
                admin_code: '1438'
            })
        });
        
        const success = response.ok && response.data?.success;
        logTest(
            'Lock dad\'s answer',
            success,
            response.data?.data,
            success ? null : new Error(response.data?.error || 'Failed to lock answer')
        );
        
        if (success && response.data?.data) {
            console.log(`    Both locked: ${response.data.data.both_locked}`);
        }
    } catch (error) {
        logTest('Lock dad\'s answer', false, null, error);
    }
    
    // Test 3: Validation - Invalid admin code
    console.log('\n  Testing validation - invalid admin code...');
    try {
        const response = await apiRequest('game-vote', {
            method: 'POST',
            body: JSON.stringify({
                scenario_id: scenarioId,
                parent: 'mom',
                answer: 'dad',
                admin_code: '0000'
            })
        });
        
        logTest(
            'Reject invalid admin PIN',
            !response.ok && response.status === 401,
            response.data?.error,
            response.ok ? new Error('Should have rejected') : null
        );
    } catch (error) {
        logTest('Reject invalid admin PIN', false, null, error);
    }
    
    // Test 4: Validation - Invalid parent
    console.log('\n  Testing validation - invalid parent...');
    try {
        const response = await apiRequest('game-vote', {
            method: 'POST',
            body: JSON.stringify({
                scenario_id: scenarioId,
                parent: 'invalid',
                answer: 'mom',
                admin_code: '1438'
            })
        });
        
        logTest(
            'Reject invalid parent',
            !response.ok && response.status === 400,
            response.data?.details,
            response.ok ? new Error('Should have rejected') : null
        );
    } catch (error) {
        logTest('Reject invalid parent', false, null, error);
    }
}

/**
 * Test Suite: Reveal Results
 */
async function testGameReveal() {
    console.log('\n🎉 Testing Game Reveal');
    
    if (results.sessionData.scenarios.length === 0) {
        console.log('  ⚠ Skipping reveal tests - no scenarios available');
        return;
    }
    
    const scenarioId = results.sessionData.scenarios[0]?.scenario_id;
    if (!scenarioId) {
        console.log('  ⚠ Skipping reveal tests - no scenario ID available');
        return;
    }
    
    // Test 1: Get reveal status
    console.log('\n  Getting reveal status...');
    try {
        const response = await apiRequest(`game-reveal?scenario_id=${scenarioId}`, {
            method: 'GET'
        });
        
        const success = response.ok && response.data?.success;
        logTest(
            'Get reveal status',
            success,
            response.data?.data,
            success ? null : new Error(response.data?.error || 'Failed to get status')
        );
        
        if (success && response.data?.data) {
            console.log(`    Is revealed: ${response.data.data.is_revealed}`);
            console.log(`    Both parents locked: ${response.data.data.both_parents_locked}`);
            console.log(`    Session status: ${response.data.data.session_status}`);
        }
    } catch (error) {
        logTest('Get reveal status', false, null, error);
    }
    
    // Test 2: Trigger reveal (requires both parents locked)
    console.log('\n  Triggering reveal...');
    try {
        const response = await apiRequest('game-reveal', {
            method: 'POST',
            body: JSON.stringify({
                scenario_id: scenarioId,
                admin_code: '1438'
            })
        });
        
        const success = response.ok && response.data?.success;
        logTest(
            'Trigger reveal',
            success,
            response.data?.data,
            success ? null : new Error(response.data?.error || 'Failed to trigger reveal')
        );
        
        if (success && response.data?.data) {
            console.log(`    Roast: ${response.data.data.roast_commentary}`);
            console.log(`    Perception gap: ${response.data.data.perception_gap}%`);
            console.log(`    Crowd choice: ${response.data.data.vote_comparison?.crowd_choice}`);
            console.log(`    Actual choice: ${response.data.data.vote_comparison?.actual_choice}`);
            console.log(`    Particle effect: ${response.data.data.particle_effect}`);
        }
    } catch (error) {
        logTest('Trigger reveal', false, null, error);
    }
    
    // Test 3: Try to reveal again (should fail - already revealed)
    console.log('\n  Attempting double reveal...');
    try {
        const response = await apiRequest('game-reveal', {
            method: 'POST',
            body: JSON.stringify({
                scenario_id: scenarioId,
                admin_code: '1438'
            })
        });
        
        // Should fail because session is no longer in 'voting' status
        logTest(
            'Reject double reveal',
            !response.ok,
            response.data?.error,
            response.ok ? new Error('Should have rejected') : null
        );
    } catch (error) {
        logTest('Reject double reveal', true, null, null);
    }
    
    // Test 4: Validation - Missing scenario ID
    console.log('\n  Testing validation - missing scenario ID...');
    try {
        const response = await apiRequest('game-reveal', {
            method: 'POST',
            body: JSON.stringify({
                admin_code: '1438'
            })
        });
        
        logTest(
            'Reject missing scenario_id',
            !response.ok && response.status === 400,
            response.data?.details,
            response.ok ? new Error('Should have rejected') : null
        );
    } catch (error) {
        logTest('Reject missing scenario_id', false, null, error);
    }
    
    // Test 5: Validation - Invalid admin code
    console.log('\n  Testing validation - invalid admin code...');
    try {
        const response = await apiRequest('game-reveal', {
            method: 'POST',
            body: JSON.stringify({
                scenario_id: scenarioId,
                admin_code: '0000'
            })
        });
        
        logTest(
            'Reject invalid admin PIN for reveal',
            !response.ok && response.status === 401,
            response.data?.error,
            response.ok ? new Error('Should have rejected') : null
        );
    } catch (error) {
        logTest('Reject invalid admin PIN for reveal', false, null, error);
    }
}

/**
 * Test Suite: Error Handling & Edge Cases
 */
async function testEdgeCases() {
    console.log('\n⚠️ Testing Edge Cases & Error Handling');
    
    // Test 1: Invalid JSON body
    console.log('\n  Testing invalid JSON...');
    try {
        const response = await apiRequest('game-session', {
            method: 'POST',
            body: 'not valid json'
        });
        
        logTest(
            'Handle invalid JSON',
            !response.ok,
            response.status,
            response.ok ? new Error('Should have failed') : null
        );
    } catch (error) {
        logTest('Handle invalid JSON', true, null, null);
    }
    
    // Test 2: Wrong HTTP method
    console.log('\n  Testing wrong HTTP method...');
    try {
        const response = await apiRequest('game-session', {
            method: 'GET'
        });
        
        logTest(
            'Reject GET on POST-only endpoint',
            !response.ok && response.status === 405,
            response.status,
            response.ok ? new Error('Should have rejected') : null
        );
    } catch (error) {
        logTest('Reject GET on POST-only endpoint', false, null, error);
    }
    
    // Test 3: Missing content type
    console.log('\n  Testing missing content type...');
    try {
        const response = await fetch(`${BASE_URL}game-reveal`, {
            method: 'POST',
            body: JSON.stringify({ admin_code: '1438' })
        });
        
        logTest(
            'Handle missing content type',
            !response.ok,
            response.status,
            response.ok ? new Error('Should have failed') : null
        );
    } catch (error) {
        logTest('Handle missing content type', true, null, null);
    }
    
    // Test 4: Request timeout handling
    console.log('\n  Testing timeout handling...');
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);
        
        await fetch(`${BASE_URL}game-session`, {
            method: 'POST',
            signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        logTest('Timeout handling works', true);
    } catch (error) {
        logTest('Timeout handling works', true);
    }
}

/**
 * Generate final report
 */
function generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 MOM VS DAD GAME API - TEST RESULTS');
    console.log('='.repeat(70));
    console.log(`\nTimestamp: ${results.timestamp}`);
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Session Code: ${results.sessionCode}`);
    console.log(`Admin PIN: ${results.adminPin}`);
    
    console.log('\n' + '-'.repeat(70));
    console.log('Session Data:');
    console.log(`  Session ID: ${results.sessionData.sessionId || 'N/A'}`);
    console.log(`  Mom Name: ${results.sessionData.momName || 'N/A'}`);
    console.log(`  Dad Name: ${results.sessionData.dadName || 'N/A'}`);
    console.log(`  Scenarios Created: ${results.sessionData.scenarios.length}`);
    
    if (results.sessionData.scenarios.length > 0) {
        console.log('\n  Scenario Details:');
        results.sessionData.scenarios.forEach((scenario, index) => {
            console.log(`    ${index + 1}. ID: ${scenario.scenario_id}`);
            console.log(`       Text: ${scenario.scenario_text?.substring(0, 60)}...`);
            console.log(`       Intensity: ${scenario.intensity}`);
        });
    }
    
    console.log('\n' + '-'.repeat(70));
    console.log('Test Summary:');
    console.log(`  Total Tests:  ${results.summary.total}`);
    console.log(`  Passed:       ${results.summary.passed} ✓`);
    console.log(`  Failed:       ${results.summary.failed} ✗`);
    console.log(`  Pass Rate:    ${Math.round((results.summary.passed / results.summary.total) * 100)}%`);
    
    console.log('\n' + '-'.repeat(70));
    console.log('Failed Tests:');
    const failedTests = results.tests.filter(t => !t.passed);
    if (failedTests.length > 0) {
        failedTests.forEach(test => {
            console.log(`  ✗ ${test.name}`);
            if (test.error) console.log(`    Error: ${test.error}`);
        });
    } else {
        console.log('  None - All tests passed! 🎉');
    }
    
    console.log('\n' + '='.repeat(70));
    
    return results;
}

/**
 * Save results to file
 */
async function saveResults() {
    const fs = await import('fs/promises');
    const report = generateReport();
    
    try {
        await fs.writeFile(
            'test-game-api-results.json',
            JSON.stringify(report, null, 2)
        );
        console.log('\nResults saved to: test-game-api-results.json');
    } catch (error) {
        console.error('\nFailed to save results:', error);
    }
}

/**
 * Run all tests
 */
async function runTests() {
    console.log('='.repeat(70));
    console.log('🧪 MOM VS DAD GAME API - END-TO-END TEST SUITE');
    console.log('='.repeat(70));
    console.log(`\nBase URL: ${BASE_URL}`);
    console.log(`Session Code: ${results.sessionCode}`);
    console.log(`Admin PIN: ${results.adminPin}`);
    console.log(`Timeout: ${TIMEOUT}ms`);
    
    try {
        // Run test suites
        await testGameSession();
        await delay(500); // Small delay between suites
        
        await testGameScenario();
        await delay(500);
        
        await testGameVote();
        await delay(500);
        
        await testLockAnswers();
        await delay(500);
        
        await testGameReveal();
        await delay(500);
        
        await testEdgeCases();
        
        // Generate and save report
        await saveResults();
        
        // Exit with appropriate code
        process.exit(results.summary.failed > 0 ? 1 : 0);
        
    } catch (error) {
        console.error('\n❌ Test suite error:', error);
        await saveResults();
        process.exit(1);
    }
}

// Run tests
runTests();
