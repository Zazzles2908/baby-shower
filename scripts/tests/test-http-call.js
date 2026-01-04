#!/usr/bin/env node
/**
 * Direct HTTP call test for all functions
 */

const https = require('https');

const PROJECT_ID = 'bkszmvfsfgvdwzacgmfz';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testFunction(name, data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);

        const options = {
            hostname: `${PROJECT_ID}.supabase.co`,
            path: `/functions/v1/${name}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ANON_KEY}`,
                'apikey': ANON_KEY
            }
        };

        const req = https.request(options, (res) => {
            let body = '';

            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                console.log(`${name}: Status ${res.statusCode}`);
                try {
                    const json = JSON.parse(body);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        console.log(`  ✅ SUCCESS`);
                    } else {
                        console.log(`  ❌ ERROR: ${json.error || json.message}`);
                    }
                } catch (e) {
                    console.log(`  Response: ${body}`);
                }
                resolve();
            });
        });

        req.on('error', (e) => {
            console.log(`${name}: Error - ${e.message}`);
            reject(e);
        });

        req.write(postData);
        req.end();
    });
}

(async () => {
    console.log('🧪 TESTING ALL FUNCTIONS');
    console.log('========================\n');

    await testFunction('guestbook', {
        name: 'Test User',
        relationship: 'Friend',
        message: 'Hello from direct HTTP test!'
    });

    await testFunction('vote', {
        selected_names: ['Test Name']
    });

    await testFunction('pool', {
        name: 'Test User',
        prediction: '2025-02-15',
        dueDate: '2025-02-15',
        weight: 3.5,
        length: 50
    });

    await testFunction('quiz', {
        name: 'Test Quizzer',
        answers: {
            puzzle1: 'answer1',
            puzzle2: 'answer2',
            puzzle3: 'answer3',
            puzzle4: 'answer4',
            puzzle5: 'answer5'
        },
        score: 5,
        totalQuestions: 5
    });

    await testFunction('advice', {
        name: 'Test Advisor',
        advice: 'Test advice message',
        category: 'general'
    });

    console.log('\n🎉 All tests complete!');
})();
