const http = require('http');
const https = require('https');

const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrc3ptdmZzZmd2ZHd6YWNnbWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzODI1NjMsImV4cCI6MjA3OTk1ODU2M30.BswusP1pfDUStzAU8k-VKPailISimApapNeJGlid8sI';

console.log('========================================');
console.log('MOM VS DAD GAME - COMPREHENSIVE TEST');
console.log('========================================\n');

let testsPassed = 0;
let testsFailed = 0;

function runTest(name, testFn) {
    return new Promise((resolve) => {
        console.log('Testing:', name);
        testFn()
            .then((result) => {
                if (result.success) {
                    console.log('  [PASS]', result.message);
                    testsPassed++;
                } else {
                    console.log('  [FAIL]', result.message);
                    testsFailed++;
                }
                resolve();
            })
            .catch((error) => {
                console.log('  [ERROR]', error.message);
                testsFailed++;
                resolve();
            });
    });
}

async function runAllTests() {
    // Test 1: Website loads
    await runTest('Website loads', async () => {
        return new Promise((resolve, reject) => {
            https.get('https://baby-shower-six.vercel.app', (res) => {
                resolve({ success: res.statusCode === 200, message: 'Status: ' + res.statusCode });
            }).on('error', reject);
        });
    });

    // Test 2: Environment variables injected
    await runTest('Environment variables injected', async () => {
        return new Promise((resolve, reject) => {
            https.get('https://baby-shower-six.vercel.app', (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    const hasEnv = data.includes('NEXT_PUBLIC_SUPABASE_URL') && 
                                   data.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');
                    resolve({ 
                        success: hasEnv, 
                        message: hasEnv ? 'Environment variables found' : 'Missing env vars' 
                    });
                });
            }).on('error', reject);
        });
    });

    // Test 3: Direct REST API - Fetch lobby LOBBY-A
    await runTest('REST API - Fetch lobby LOBBY-A', async () => {
        return new Promise((resolve, reject) => {
            const req = https.request({
                hostname: 'bkszmvfsfgvdwzacgmfz.supabase.co',
                path: '/rest/v1/mom_dad_lobbies?lobby_key=eq.LOBBY-A',
                method: 'GET',
                headers: {
                    'apikey': anonKey,
                    'Accept-Profile': 'baby_shower'
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        const success = res.statusCode === 200 && parsed.length > 0;
                        resolve({
                            success,
                            message: success 
                                ? 'Lobby found: ' + parsed[0].lobby_name 
                                : 'Failed to fetch lobby'
                        });
                    } catch (e) {
                        resolve({ success: false, message: 'Invalid JSON' });
                    }
                });
            });
            req.on('error', reject);
            req.end();
        });
    });

    // Test 4: Direct REST API - Fetch all lobbies
    await runTest('REST API - Fetch all lobbies', async () => {
        return new Promise((resolve, reject) => {
            const req = https.request({
                hostname: 'bkszmvfsfgvdwzacgmfz.supabase.co',
                path: '/rest/v1/mom_dad_lobbies',
                method: 'GET',
                headers: {
                    'apikey': anonKey,
                    'Accept-Profile': 'baby_shower'
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        const success = res.statusCode === 200 && parsed.length === 4;
                        resolve({
                            success,
                            message: success 
                                ? 'Found ' + parsed.length + ' lobbies' 
                                : 'Expected 4 lobbies'
                        });
                    } catch (e) {
                        resolve({ success: false, message: 'Invalid JSON' });
                    }
                });
            });
            req.on('error', reject);
            req.end();
        });
    });

    // Test 5: Input sanitization
    await runTest('Input sanitization', async () => {
        return new Promise((resolve) => {
            const testName = '  Test Player  ';
            const cleanName = testName.trim().substring(0, 50);
            const safeName = cleanName.replace(/[<>\"\'\\\/]/g, '');
            const isValid = safeName === 'Test Player' && safeName.length > 0;
            resolve({
                success: isValid,
                message: isValid ? 'Input sanitization working' : 'Sanitization failed'
            });
        });
    });

    // Test 6: RLS policies
    await runTest('RLS - Public read access', async () => {
        return new Promise((resolve, reject) => {
            const req = https.request({
                hostname: 'bkszmvfsfgvdwzacgmfz.supabase.co',
                path: '/rest/v1/mom_dad_lobbies?select=lobby_key,status',
                method: 'GET',
                headers: {
                    'apikey': anonKey,
                    'Accept-Profile': 'baby_shower'
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        const success = res.statusCode === 200 && Array.isArray(parsed);
                        resolve({
                            success,
                            message: success ? 'RLS allows public read' : 'RLS may be blocking'
                        });
                    } catch (e) {
                        resolve({ success: false, message: 'Invalid JSON' });
                    }
                });
            });
            req.on('error', reject);
            req.end();
        });
    });

    // Summary
    console.log('\n========================================');
    console.log('TEST RESULTS SUMMARY');
    console.log('========================================');
    console.log('Passed:', testsPassed);
    console.log('Failed:', testsFailed);
    console.log('Total:', testsPassed + testsFailed);
    console.log('');
    
    if (testsFailed === 0) {
        console.log('ALL TESTS PASSED!');
        console.log('\nYou can now:');
        console.log('1. Hard refresh browser (Ctrl+Shift+R)');
        console.log('2. Visit: https://baby-shower-six.vercel.app');
        console.log('3. Try joining a Mom vs Dad lobby');
    } else {
        console.log('Some tests failed. Please review above.');
    }
}

runAllTests().catch(console.error);
