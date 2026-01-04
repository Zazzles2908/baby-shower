#!/usr/bin/env node
/**
 * Supabase Edge Function Deployment Script
 * Deploys all core functions with proper configuration
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PROJECT_ID = 'bkszmvfsfgvdwzacgmfz';
const FUNCTIONS_DIR = 'supabase/functions';

const CORE_FUNCTIONS = ['guestbook', 'vote', 'pool', 'quiz', 'advice'];

console.log('🚀 Deploying Supabase Edge Functions');
console.log('====================================\n');

// Create a simple inline deployment for each function
async function deployFunction(functionName) {
    console.log(`📦 Deploying ${functionName}...`);
    
    try {
        // Use supabase MCP to deploy
        const result = await deployViaMCP(functionName);
        console.log(`   ✅ ${functionName} deployed successfully`);
        return true;
    } catch (error) {
        console.log(`   ❌ ${functionName} failed: ${error.message}`);
        return false;
    }
}

async function deployViaMCP(functionName) {
    // Import the MCP tool
    // This would use supabase_deploy_edge_function
    return new Promise((resolve, reject) => {
        // For now, just log
        console.log(`   📡 Preparing deployment for ${functionName}...`);
        
        // Check if we can run supabase CLI
        const proc = spawn('npx', ['supabase', 'functions', 'deploy', functionName, '--project-ref', PROJECT_ID], {
            cwd: 'supabase',
            stdio: 'pipe'
        });
        
        let stdout = '';
        let stderr = '';
        
        proc.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        proc.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        proc.on('close', (code) => {
            if (code === 0) {
                resolve(stdout);
            } else {
                reject(new Error(stderr || stdout));
            }
        });
        
        proc.on('error', (error) => {
            reject(error);
        });
        
        // Timeout after 60 seconds
        setTimeout(() => {
            proc.kill();
            reject(new Error('Deployment timed out'));
        }, 60000);
    });
}

async function main() {
    console.log(`Project: ${PROJECT_ID}`);
    console.log(`Functions to deploy: ${CORE_FUNCTIONS.join(', ')}\n`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const func of CORE_FUNCTIONS) {
        const success = await deployFunction(func);
        if (success) {
            successCount++;
        } else {
            failCount++;
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`Deployment Results:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    
    if (failCount > 0) {
        console.log('\n⚠️  Some functions failed to deploy.');
        console.log('Please deploy manually via Supabase Dashboard:');
        console.log('   1. Go to: https://supabase.com/dashboard/project/bkszmvfsfgvdwzacgmfz');
        console.log('   2. Click Edge Functions');
        console.log('   3. Click each function and click Deploy');
    } else {
        console.log('\n🎉 All functions deployed successfully!');
        console.log('\n🧪 Test with:');
        console.log(`   curl -X POST "https://${PROJECT_ID}.functions.supabase.co/vote" \\`);
        console.log(`     -H "Content-Type: application/json" \\`);
        console.log(`     -d '{"selected_names": ["Test"]}'`);
    }
}

main().catch(console.error);
