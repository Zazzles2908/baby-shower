const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Read .env.local file manually
const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.SUPABASE_URL;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

console.log('SUPABASE_URL:', supabaseUrl);
console.log('Service Role Key (first 20 chars):', serviceRoleKey.substring(0, 20) + '...');

// Create JWT payload for service role
const payload = {
  sub: 'service-role',
  role: 'service_role',
  iss: 'supabase',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
};

// Generate JWT using HS256 algorithm
const token = jwt.sign(payload, serviceRoleKey, { algorithm: 'HS256' });
console.log('\nGenerated JWT:', token);

// Test the Edge Function with this JWT
console.log('\n=== Testing Edge Function with JWT ===');
const { execSync } = require('child_process');
const http = require('http');

const testEdgeFunction = () => {
  const data = JSON.stringify({
    lobby_key: 'LOBBY-A'
  });

  const options = {
    hostname: 'bkszmvfsfgvdwzacgmfz.functions.supabase.co',
    path: '/functions/v1/lobby-status',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      console.log('Response:', body);
    });
  });

  req.on('error', (e) => console.error('Error:', e.message));
  req.write(data);
  req.end();
};

testEdgeFunction();
