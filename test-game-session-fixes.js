/**
 * Game Session Fix Verification Script
 * Tests both the source code fixes and deployed function behavior
 */

const BASE_URL = 'https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1';

async function testGameSessionFixes() {
  console.log('🧪 Testing Game Session Fixes...\n');

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Create Session (should include session_id)
  console.log('Test 1: Create Session with session_id');
  try {
    const createResponse = await fetch(`${BASE_URL}/game-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        mom_name: 'TestMom',
        dad_name: 'TestDad',
        total_rounds: 3
      })
    });

    const createData = await createResponse.json();

    if (createResponse.ok && createData.success) {
      console.log('✅ Create Session: PASSED');
      console.log('  - session_code:', createData.data?.session_code);
      console.log('  - session_id:', createData.data?.session_id);
      console.log('  - admin_code:', createData.data?.admin_code);

      if (createData.data?.session_id) {
        testsPassed++;
        console.log('  ✅ session_id IS present in create response');
      } else {
        testsFailed++;
        console.log('  ❌ session_id MISSING in create response');
      }

      // Test 2: Get Session (should include session_id)
      console.log('\nTest 2: Get Session with session_id');
      const getResponse = await fetch(`${BASE_URL}/game-session?code=${createData.data?.session_code}`);
      const getData = await getResponse.json();

      if (getResponse.ok && getData.success) {
        console.log('✅ Get Session: PASSED');
        console.log('  - session_code:', getData.data?.session_code);
        console.log('  - session_id:', getData.data?.session_id);

        if (getData.data?.session_id) {
          testsPassed++;
          console.log('  ✅ session_id IS present in GET response');
        } else {
          testsFailed++;
          console.log('  ❌ session_id MISSING in GET response (FIX NEEDED)');
        }
      } else {
        testsFailed++;
        console.log('❌ Get Session: FAILED', getData.error);
      }

      // Test 3: Admin Login (should work)
      console.log('\nTest 3: Admin Login functionality');
      const loginResponse = await fetch(`${BASE_URL}/game-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin_login',
          session_code: createData.data?.session_code,
          admin_code: createData.data?.admin_code
        })
      });

      const loginData = await loginResponse.json();

      if (loginResponse.ok && loginData.success) {
        console.log('✅ Admin Login: PASSED');
        console.log('  - session_id:', loginData.data?.session_id);

        if (loginData.data?.session_id) {
          testsPassed++;
          console.log('  ✅ admin_login IS working and returns session_id');
        } else {
          testsFailed++;
          console.log('  ❌ admin_login missing session_id');
        }
      } else {
        testsFailed++;
        console.log('❌ Admin Login: FAILED', loginData.error);
        console.log('  💡 This indicates the deployed function is missing admin_login case');
      }

      // Cleanup: Test session created (we could delete it, but leaving for debugging)

    } else {
      testsFailed++;
      console.log('❌ Create Session: FAILED', createData.error);
    }

  } catch (error) {
    testsFailed++;
    console.log('❌ Test Error:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Test Results: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('='.repeat(50));

  if (testsFailed === 0) {
    console.log('🎉 All tests passed! The fixes are working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Deployment or code fixes needed.');
  }

  return { passed: testsPassed, failed: testsFailed };
}

// Run the tests
testGameSessionFixes().then(results => {
  console.log('\nFinal Results:', results);
  process.exit(results.failed > 0 ? 1 : 0);
});