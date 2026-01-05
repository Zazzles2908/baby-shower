#!/usr/bin/env node
/**
 * Environment Variable Injection Script
 * Injects Supabase credentials into index.html for static deployment
 * Supports both local development (.env.local) and Vercel deployment (env vars)
 * 
 * SECURITY: Only injects public (anon) key to client-side
 * Service role key is NEVER exposed to client - used only in Edge Functions
 */

const fs = require('fs');
const path = require('path');

// Read index.html
const indexPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Check if already injected (prevent duplicate blocks)
if (html.includes('[ENV] Supabase URL configured:')) {
    console.log('⚠️  Environment variables already injected, skipping...');
    process.exit(0);
}

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
                let value = trimmedLine.substring(eqIndex + 1).trim();
                // Remove wrapping quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || 
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
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

// CRITICAL: Service role key is NEVER injected to client-side!
// It's only used server-side in Edge Functions via Deno.env.get()
const supabaseServiceKey = ''; // Don't expose to client!

// Validate that we have the required values
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('ERROR: Missing required environment variables!');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.error('Please set these in Vercel project settings or .env.local');
    process.exit(1);
}

// Inject environment variables before config.js
const envScript = `
    <script>
        // Environment variables injected at build time by Vercel
        // Only public (anon) key is exposed to client - service role stays server-side!
        window.ENV = window.ENV || {};
        window.ENV.NEXT_PUBLIC_SUPABASE_URL = ${supabaseUrl ? `'${supabaseUrl.replace(/'/g, "\\'")}'` : 'null'};
        window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY = ${supabaseAnonKey ? `'${supabaseAnonKey.replace(/'/g, "\\'")}'` : 'null'};
        
        // CRITICAL: Service role key is NEVER exposed to client-side!
        // Only accessed server-side in Edge Functions via Deno.env.get()
        
        console.log('[ENV] Supabase URL configured:', window.ENV.NEXT_PUBLIC_SUPABASE_URL ? '***configured***' : 'missing');
        console.log('[ENV] Supabase Anon Key configured:', window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '***configured***' : 'missing');
        console.log('[ENV] Security: Service role key NOT exposed to client (as it should be)');
    </script>
`;

html = html.replace('<script src="scripts/config.js"></script>', `${envScript}<script src="scripts/config.js"></script>`);

// Write the modified HTML
fs.writeFileSync(indexPath, html);
console.log('✅ Environment variables injected into index.html');
console.log('   URL:', supabaseUrl ? '***configured***' : 'not set');
console.log('   Anon Key:', supabaseAnonKey ? '***configured***' : 'not set');
console.log('   Security: Service role key NOT exposed to client (correct!)');
