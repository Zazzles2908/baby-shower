// Test script to capture the actual error from the vote function
const https = require('https');

const VOTE_FUNCTION_URL = 'https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/vote';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrc3ptdmZzZmd2ZHd6YWNnbWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzODI1NjMsImV4cCI6MjA3OTk1ODU2M30.BswusP1pfDUStzAU8k-VKPailISimApapNeJGlid8sI';

console.log('🧪 Testing vote function to capture actual error...\n');

const postData = JSON.stringify({
  selected_names: ['Emma', 'Olivia']
});

const options = {
  hostname: 'bkszmvfsfgvdwzacgmfz.supabase.co',
  path: '/functions/v1/vote',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ANON_KEY}`,
    'apikey': ANON_KEY,
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('📡 Sending request to:', VOTE_FUNCTION_URL);
console.log('📦 Request body:', postData);
console.log('🔑 Headers:', JSON.stringify(options.headers, null, 2));
console.log('\n⏳ Waiting for response...\n');

const req = https.request(options, (res) => {
  console.log('📊 Response status:', res.statusCode);
  console.log('📋 Response headers:', JSON.stringify(res.headers, null, 2));
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📝 Response body:', data);
    console.log('\n✅ Test complete');
    
    try {
      const parsed = JSON.parse(data);
      if (parsed.error) {
        console.log('\n🚨 ERROR FOUND:', parsed.error);
        console.log('📌 Error details:', parsed.details || 'No details');
        console.log('💡 Error hint:', parsed.hint || 'No hint');
      }
    } catch (e) {
      console.log('\n⚠️ Could not parse response as JSON');
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ Request failed:', error.message);
});

req.write(postData);
req.end();
