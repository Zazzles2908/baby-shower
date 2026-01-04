#!/usr/bin/env node
const jwt = require('jsonwebtoken');
const fs = require('fs');
const http = require('http');

// Read .env.local file
const envContent = fs.readFileSync('/c/Project/Baby_Shower/.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmedLine = line.trim();
  if (trimmedLine && !trimmedLine.startsWith('#')) {
    const eqIndex = trimmedLine.indexOf('=');
    if (eqIndex > 0) {
      const key = trimmedLine.substring(0, eqIndex).trim();
      const value = trimmedLine.substring(eqIndex + 1).trim();
      envVars[key] = value;
    }
  }
});

const supabaseUrl = envVars.SUPABASE_URL;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables');
  console.log('Found variables:', Object.keys(envVars));
  process.exit(1);
}

console.log('✓ SUPABASE_URL found:', supabaseUrl);
console.log('✓ Service Role Key found (length:', serviceRoleKey.length, ')');

// Create JWT payload for service role
const payload = {
  sub: 'service-role',
  role: 'service_role',
  iss: 'supabase',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
};

console.log('\nGenerating JWT...');
const token = jwt.sign(payload, serviceRoleKey, { algorithm: 'HS256' });
console.log('✓ JWT generated successfully');
console.log('JWT (first 50 chars):', token.substring(0, 50) + '...');

// Test the Edge Function with this JWT
console.log('\n=== Testing Edge Function with JWT ===');
const postData = JSON.stringify({ lobby_key: 'LOBBY-A' });

const options = {
  hostname: 'bkszmvfsfgvdwzacgmfz.functions.supabase.co',
  path: '/functions/v1/lobby-status',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Authorization': `Bearer ${token}`
  }
};

console.log('Making request to:', options.hostname + options.path);

const req = http.request(options, (res) => {
  console.log(`✓ Response status: ${res.statusCode}`);
  
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Response body:', body);
    try {
      const parsed = JSON.parse(body);
      if (parsed.success) {
        console.log('✓ Lobby found:', parsed.data?.lobby?.lobby_name);
      } else {
        console.log('✗ Error:', parsed.error);
      }
    } catch (e) {
      console.log('Could not parse response');
    }
  });
});

req.on('error', (e) => {
  console.error('✗ Request error:', e.message);
});

req.write(postData);
req.end();

console.log('Request sent, waiting for response...');
