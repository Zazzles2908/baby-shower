#!/usr/bin/env node
/**
 * Environment Variable Injection Script
 * Injects Supabase credentials into index.html for static deployment
 */

const fs = require('fs');
const path = require('path');

// Read index.html
const indexPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Parse .env.local manually
const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
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

// Support both NEXT_PUBLIC and standard naming
const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL ||
                    envVars.SUPABASE_URL || '';
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                        envVars.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY || '';

// Inject environment variables before the closing </body> tag
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
