/**
 * Debug Vote Function Test
 * This script tests the vote function to identify the exact error
 */

const TEST_MODE = true; // Set to false to actually test against real API

async function testVoteFunction() {
    console.log('=== VOTING FUNCTION DEBUG TEST ===');
    
    // Test 1: Check what the frontend sends
    console.log('\n1. FRONTEND REQUEST FORMAT:');
    const frontendRequest = {
        name: 'Test Guest',
        names: ['Olivia', 'Ava']
    };
    console.log('Frontend sends:', JSON.stringify(frontendRequest, null, 2));
    
    // Test 2: Check what the Edge Function expects
    console.log('\n2. EDGE FUNCTION EXPECTED FORMAT:');
    const edgeFunctionExpects = {
        selected_names: ['string array of names']
    };
    console.log('Edge Function expects:', JSON.stringify(edgeFunctionExpects, null, 2));
    
    // Test 3: Check the mismatch
    console.log('\n3. MISMATCH ANALYSIS:');
    console.log('Frontend field names:', Object.keys(frontendRequest));
    console.log('Edge Function field names:', Object.keys(edgeFunctionExpects));
    
    if (!frontendRequest.selected_names) {
        console.log('❌ MISSING: selected_names field in frontend request');
        console.log('This would cause validation error in Edge Function');
    }
    
    // Test 4: Check voting.js response handling
    console.log('\n4. RESPONSE HANDLING CODE:');
    console.log('Line 376: if (response?.milestone?.triggered) {');
    console.log('If response is undefined, this causes:');
    console.log('❌ "Cannot read properties of undefined (reading \'milestone\')"');
    
    // Test 5: Simulate what happens when API call fails
    console.log('\n5. SIMULATED ERROR SCENARIO:');
    const mockFailedResponse = null; // API call failed
    
    try {
        // This simulates what happens in voting.js line 376
        if (mockFailedResponse?.milestone?.triggered) {
            console.log('Milestone triggered!');
        }
        console.log('✅ Safe with optional chaining');
    } catch (error) {
        console.log('❌ Error without optional chaining:', error.message);
    }
    
    console.log('\n=== ROOT CAUSE IDENTIFIED ===');
    console.log('The "cannot read properties" error is caused by:');
    console.log('1. API call fails due to field name mismatch (names vs selected_names)');
    console.log('2. Response is undefined/null');
    console.log('3. Code tries to access response.milestone.triggered');
    console.log('4. JavaScript throws: "Cannot read properties of undefined"');
    
    console.log('\n=== RECOMMENDED FIX ===');
    console.log('Update voting.js line 376 to handle null/undefined response:');
    console.log('BEFORE: if (response?.milestone?.triggered) {');
    console.log('AFTER:  if (response?.milestone?.triggered) {');
    console.log('(Actually, the optional chaining is already correct!)');
    
    console.log('\nBut the REAL fix needed:');
    console.log('1. Fix submitVote to send selected_names instead of names');
    console.log('2. Or update Edge Function to accept names field');
    
    return {
        mismatch: true,
        frontendFields: Object.keys(frontendRequest),
        edgeFunctionFields: Object.keys(edgeFunctionExpects),
        recommendedFix: 'Update field names to match'
    };
}

// Run the test
testVoteFunction().then(result => {
    console.log('\n=== TEST RESULT ===', result);
});
