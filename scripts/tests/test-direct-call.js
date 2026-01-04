#!/usr/bin/env node
/**
 * Direct function test with better error handling
 */

const { createClient } = require('@supabase/supabase-js');

const PROJECT_ID = 'bkszmvfsfgvdwzacgmfz';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testDirectCall() {
    console.log('🧪 DIRECT FUNCTION TEST');
    console.log('========================\n');

    const supabase = createClient(
        `https://${PROJECT_ID}.supabase.co`,
        ANON_KEY
    );

    // Test pool
    console.log('Testing pool...');
    try {
        const { data, error, status } = await supabase.functions.invoke('pool', {
            body: {
                name: 'Test User',
                prediction: '2025-02-15',
                dueDate: '2025-02-15',
                weight: 3.5,
                length: 50
            }
        });

        console.log('Status:', status);
        console.log('Data:', JSON.stringify(data, null, 2));
        console.log('Error:', JSON.stringify(error, null, 2));
    } catch (e) {
        console.log('Exception:', e.message);
    }
}

testDirectCall().catch(console.error);
