/**
 * Test script for Baby Pool and Advice validation fixes
 * Run this to verify the validation errors are now resolved
 */

// Test data for Baby Pool
const testPoolData = {
    name: "Test User",
    prediction: "Date: 2026-02-15, Time: 08:30, Weight: 3.5kg, Length: 52cm",
    dueDate: "2026-02-15",
    weight: 3.5,
    length: 52
};

// Test data for Advice  
const testAdviceData = {
    name: "Test Advisor",
    category: "general",
    advice: "Trust your instincts! Every baby is different."
};

// Expected responses
const expectedPoolResponse = {
    success: true,
    error: null
};

const expectedAdviceResponse = {
    success: true,
    error: null
};

async function testPoolEndpoint() {
    console.log('🧪 Testing Baby Pool endpoint...');
    
    try {
        const response = await fetch('/functions/v1/pool', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testPoolData)
        });
        
        const result = await response.json();
        
        if (response.status === 400) {
            console.log('❌ Pool validation failed:', result);
            if (result.details && Array.isArray(result.details)) {
                console.log('   Specific errors:');
                result.details.forEach((error, i) => {
                    console.log(`   ${i + 1}. ${error}`);
                });
            }
            return false;
        } else if (response.status === 201) {
            console.log('✅ Pool submission successful!');
            console.log('   Response:', result);
            return true;
        } else {
            console.log('⚠️  Unexpected response:', response.status, result);
            return false;
        }
    } catch (error) {
        console.log('❌ Pool test error:', error.message);
        return false;
    }
}

async function testAdviceEndpoint() {
    console.log('🧪 Testing Advice endpoint...');
    
    try {
        const response = await fetch('/functions/v1/advice', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testAdviceData)
        });
        
        const result = await response.json();
        
        if (response.status === 400) {
            console.log('❌ Advice validation failed:', result);
            if (result.details && Array.isArray(result.details)) {
                console.log('   Specific errors:');
                result.details.forEach((error, i) => {
                    console.log(`   ${i + 1}. ${error}`);
                });
            }
            return false;
        } else if (response.status === 201) {
            console.log('✅ Advice submission successful!');
            console.log('   Response:', result);
            return true;
        } else {
            console.log('⚠️  Unexpected response:', response.status, result);
            return false;
        }
    } catch (error) {
        console.log('❌ Advice test error:', error.message);
        return false;
    }
}

async function testInvalidPoolData() {
    console.log('🧪 Testing Baby Pool with invalid data (should show specific errors)...');
    
    // Test with invalid weight (too high)
    const invalidData = { ...testPoolData, weight: 15 };
    
    try {
        const response = await fetch('/functions/v1/pool', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(invalidData)
        });
        
        const result = await response.json();
        
        if (response.status === 400 && result.details) {
            console.log('✅ Validation caught invalid weight:');
            result.details.forEach((error, i) => {
                console.log(`   ${i + 1}. ${error}`);
            });
            return true;
        } else {
            console.log('❌ Expected 400 with specific error, got:', response.status, result);
            return false;
        }
    } catch (error) {
        console.log('❌ Test error:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('='.repeat(50));
    console.log('🎯 VALIDATION FIX TEST SUITE');
    console.log('='.repeat(50));
    
    const results = {
        pool: await testPoolEndpoint(),
        advice: await testAdviceEndpoint(),
        invalidPool: await testInvalidPoolData()
    };
    
    console.log('='.repeat(50));
    console.log('📊 TEST RESULTS:');
    console.log('   Baby Pool:    ', results.pool ? '✅ PASS' : '❌ FAIL');
    console.log('   Advice:       ', results.advice ? '✅ PASS' : '❌ FAIL');
    console.log('   Invalid Data: ', results.invalidPool ? '✅ PASS' : '❌ FAIL');
    
    const allPassed = Object.values(results).every(r => r === true);
    console.log('='.repeat(50));
    console.log(allPassed ? '🎉 All tests passed!' : '⚠️  Some tests failed');
    
    return allPassed;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testPoolEndpoint,
        testAdviceEndpoint,
        testInvalidPoolData,
        runTests
    };
}

// Auto-run if executed directly
if (typeof window !== 'undefined') {
    window.ValidationTests = {
        run: runTests,
        testPool: testPoolEndpoint,
        testAdvice: testAdviceEndpoint
    };
}