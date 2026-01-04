/**
 * Real API Test for Vote Function
 * This tests the actual API call to identify the exact error
 */

async function testRealVoteAPI() {
    console.log('=== REAL VOTE API TEST ===');
    
    const SUPABASE_URL = 'https://bkszmvfsfgvdwzacgmfz.supabase.co';
    const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrc3ptdmZzZmd2ZHd6YWNnbWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzODI1NjMsImV4cCI6MjA3OTk1ODU2M30.BswusP1pfDUStzAU8k-VKPailISimApapNeJGlid8sI';
    
    const VOTE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/vote`;
    
    console.log('Testing vote function at:', VOTE_FUNCTION_URL);
    
    // Test 1: What the frontend currently sends (WRONG format)
    console.log('\n1. TESTING WRONG FORMAT (what frontend sends):');
    const wrongFormatData = {
        name: 'Test Guest',
        names: ['Olivia', 'Ava']
    };
    
    try {
        const wrongResponse = await fetch(VOTE_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ANON_KEY}`
            },
            body: JSON.stringify(wrongFormatData)
        });
        
        console.log('Status:', wrongResponse.status);
        const wrongResult = await wrongResponse.json();
        console.log('Response:', JSON.stringify(wrongResult, null, 2));
        
        if (!wrongResponse.ok) {
            console.log('❌ WRONG FORMAT FAILED as expected');
            console.log('Error message:', wrongResult.error || wrongResult);
        } else {
            console.log('✅ WRONG FORMAT WORKED - unexpected!');
        }
        
    } catch (error) {
        console.log('❌ Network error:', error.message);
    }
    
    // Test 2: What the Edge Function expects (CORRECT format)
    console.log('\n2. TESTING CORRECT FORMAT (what Edge Function expects):');
    const correctFormatData = {
        selected_names: ['Olivia', 'Ava']
    };
    
    try {
        const correctResponse = await fetch(VOTE_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ANON_KEY}`
            },
            body: JSON.stringify(correctFormatData)
        });
        
        console.log('Status:', correctResponse.status);
        const correctResult = await correctResponse.json();
        console.log('Response:', JSON.stringify(correctResult, null, 2));
        
        if (correctResponse.ok) {
            console.log('✅ CORRECT FORMAT WORKED');
        } else {
            console.log('❌ CORRECT FORMAT FAILED - unexpected!');
        }
        
    } catch (error) {
        console.log('❌ Network error:', error.message);
    }
    
    console.log('\n=== CONCLUSION ===');
    console.log('The frontend is sending {name, names} but Edge Function expects {selected_names}');
    console.log('This causes validation to fail, returning an error response');
    console.log('The error response does not have a .milestone property');
    console.log('When the code tries to access response.milestone.triggered, it may fail');
    
    return {
        wrongFormatTested: true,
        correctFormatTested: true,
        recommendation: 'Update frontend to send selected_names instead of names'
    };
}

// Run the test
testRealVoteAPI().then(result => {
    console.log('\n=== TEST COMPLETE ===', result);
}).catch(error => {
    console.error('Test failed:', error);
});
