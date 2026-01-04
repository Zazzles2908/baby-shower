#!/usr/bin/env node
/**
 * Test Supabase Edge Functions using Supabase JS Client
 */

const { createClient } = require('@supabase/supabase-js');

const PROJECT_ID = 'bkszmvfsfgvdwzacgmfz';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🧪 TESTING WITH SUPABASE JS CLIENT');
console.log('==================================\n');

if (!ANON_KEY) {
    console.log('❌ ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY not found');
    console.log('Run: bash -c \'source .env.local && export NEXT_PUBLIC_SUPABASE_ANON_KEY && node test-supabase-js.js\'');
    process.exit(1);
}

console.log('✅ Creating Supabase client...');

const supabase = createClient(
    `https://${PROJECT_ID}.supabase.co`,
    ANON_KEY
);

async function testEdgeFunction(name, body) {
    console.log(`\nTesting ${name}...`);
    
    const { data, error } = await supabase.functions.invoke(name, {
        body: body
    });
    
    if (error) {
        console.log(`❌ ${name}: ERROR - ${error.message}`);
        console.log('   Full error:', JSON.stringify(error, null, 2));
    } else {
        console.log(`✅ ${name}: SUCCESS`);
    }
}

(async () => {
    await testEdgeFunction('guestbook', { 
        name: 'Test User', 
        relationship: 'Friend', 
        message: 'Testing with JS client!' 
    });
    
    await testEdgeFunction('vote', { 
        selected_names: ['Test Name'] 
    });
    
    await testEdgeFunction('pool', {
        name: 'Test User',
        prediction: '2025-02-15',
        dueDate: '2025-02-15',
        weight: 3.5,
        length: 50
    });
    
    await testEdgeFunction('quiz', {
        name: 'Test Quizzer',
        answers: {
            puzzle1: 'test1',
            puzzle2: 'test2',
            puzzle3: 'test3',
            puzzle4: 'test4',
            puzzle5: 'test5'
        },
        score: 5,
        totalQuestions: 5
    });
    
    await testEdgeFunction('advice', {
        name: 'Test Advisor',
        advice: 'Test advice message',
        category: 'general'
    });
    
    console.log('\n🎉 Tests complete!');
})();
