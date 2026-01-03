// Direct test script
const https = require('https');

const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrc3ptdmZzZmd2ZHd6YWNnbWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzODI1NjMsImV4cCI6MjA3OTk1ODU2M30.BswusP1pfDUStzAU8k-VKPailISimApapNeJGlid8sI';

console.log('=== Testing Direct REST API ===\n');

// Test 1: REST API
console.log('Test 1: Fetching lobby via REST API...');
const req1 = https.request({
    hostname: 'bkszmvfsfgvdwzacgmfz.supabase.co',
    path: '/rest/v1/mom_dad_lobbies?lobby_key=eq.LOBBY-A',
    method: 'GET',
    headers: {
        'apikey': anonKey,
        'Accept-Profile': 'baby_shower'
    }
}, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        console.log('Status: ' + res.statusCode);
        console.log('Response: ' + body.substring(0, 300));
        if (res.statusCode === 200) {
            console.log('REST API working!\n');
        } else {
            console.log('REST API failed\n');
        }
        
        // Test 2: Edge Function
        console.log('Test 2: Testing Edge Function...');
        const postData = JSON.stringify({ lobby_key: 'LOBBY-A' });
        const req2 = https.request({
            hostname: 'bkszmvfsfgvdwzacgmfz.functions.supabase.co',
            path: '/functions/v1/lobby-status',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'apikey': anonKey
            }
        }, (res2) => {
            let body2 = '';
            res2.on('data', chunk => body2 += chunk);
            res2.on('end', () => {
                console.log('Status: ' + res2.statusCode);
                console.log('Response: ' + body2.substring(0, 300));
                if (res2.statusCode === 200) {
                    console.log('Edge Function working!');
                } else {
                    console.log('Edge Function failed');
                }
            });
        });
        req2.on('error', (e) => console.error('Error:', e.message));
        req2.write(postData);
        req2.end();
    });
});

req1.on('error', (e) => console.error('Error:', e.message));
req1.end();
