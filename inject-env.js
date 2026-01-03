#!/usr/bin/env node
/**
 * Environment Variable Injection Script
 * Injects Supabase credentials into index.html for static deployment
 * Supports both local development (.env.local) and Vercel deployment (env vars)
 */

const fs = require('fs');
const path = require('path');

// Read index.html
const indexPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Helper function to get env var from any source
function getEnvVar(key) {
    // First check process.env (Vercel environment variables)
    if (process.env[key]) {
        return process.env[key];
    }
    return '';
}

// Parse .env.local manually (for local development)
let envVars = {};
try {
    const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
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
} catch (e) {
    console.log('No .env.local file found, using environment variables only');
}

// Support both NEXT_PUBLIC and standard naming, with priority:
// 1. process.env (Vercel)
// 2. .env.local file
const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || 
                    getEnvVar('SUPABASE_URL') || 
                    envVars.NEXT_PUBLIC_SUPABASE_URL || 
                    envVars.SUPABASE_URL || '';
const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') || 
                        getEnvVar('SUPABASE_ANON_KEY') || 
                        envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                        envVars.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY') || 
                           envVars.SUPABASE_SERVICE_ROLE_KEY || '';

// Validate that we have the required values
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('ERROR: Missing required environment variables!');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.error('Please set these in Vercel project settings or .env.local');
    process.exit(1);
}

// Inject environment variables before the closing </head> tag
const envScript = `
    <script>
        // Environment variables injected at build time
        window.ENV = window.ENV || {};
        window.ENV.NEXT_PUBLIC_SUPABASE_URL = '${supabaseUrl}';
        window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY = '${supabaseAnonKey}';
        window.ENV.SUPABASE_SERVICE_ROLE_KEY = '${supabaseServiceKey}';
        
        console.log('[ENV] Supabase URL configured:', window.ENV.NEXT_PUBLIC_SUPABASE_URL ? '***configured***' : 'missing');
        console.log('[ENV] Supabase Anon Key configured:', window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '***configured***' : 'missing');
    </script>
`;

html = html.replace('</head>', `${envScript}</head>`);

// Write the modified HTML
fs.writeFileSync(indexPath, html);
console.log('✅ Environment variables injected into index.html');
console.log('   URL:', supabaseUrl ? '***configured***' : 'not set');
console.log('   Anon Key:', supabaseAnonKey ? '***configured***' : 'not set');
