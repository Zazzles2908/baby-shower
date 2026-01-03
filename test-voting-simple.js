#!/usr/bin/env node

/**
 * Simple test to isolate voting issue
 */

const BASE_URL = 'https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/';
const SCENARIO_ID = 'd803f7ef-6711-4010-a712-5de5fa80aa8f';

async function testVoting() {
  console.log('🧪 Testing game-vote function directly...\n');

  // Test 1: Get vote counts (should work)
  console.log('1. Testing GET vote counts...');
  try {
    const response = await fetch(`${BASE_URL}game-vote?scenario_id=${SCENARIO_ID}`);
    const data = await response.json();
    console.log('Response:', response.status, data);
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Test 2: Submit a vote (this is failing)
  console.log('\n2. Testing POST vote submission...');
  try {
    const response = await fetch(`${BASE_URL}game-vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario_id: SCENARIO_ID,
        guest_name: 'Test Guest',
        vote_choice: 'mom'
      })
    });
    const data = await response.json();
    console.log('Response:', response.status, data);
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Test 3: Lock answer (this is also failing)
  console.log('\n3. Testing POST lock answer...');
  try {
    const response = await fetch(`${BASE_URL}game-vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario_id: SCENARIO_ID,
        parent: 'mom',
        answer: 'mom',
        admin_code: '1637'
      })
    });
    const data = await response.json();
    console.log('Response:', response.status, data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testVoting().catch(console.error);