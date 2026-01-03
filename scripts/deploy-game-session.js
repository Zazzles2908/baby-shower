#!/usr/bin/env node

/**
 * Game Session Function Deployment Script
 * Provides both automated and manual deployment options
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_REF = 'bkszmvfsfgvdwzacgmfz';
const FUNCTION_NAME = 'game-session';
const SOURCE_FILE = 'supabase/functions/game-session/index.ts';
const CONFIG_FILE = 'supabase/functions/game-session/config.toml';

async function deployFunction() {
  console.log('🚀 Game Session Function Deployment');
  console.log('='.repeat(50));
  console.log(`📦 Project: ${PROJECT_REF}`);
  console.log(`🔧 Function: ${FUNCTION_NAME}`);
  console.log('');

  // Check if source file exists
  if (!fs.existsSync(SOURCE_FILE)) {
    console.error(`❌ Error: Source file not found: ${SOURCE_FILE}`);
    process.exit(1);
  }

  // Read and prepare source code
  console.log('📄 Reading source file...');
  let sourceCode = fs.readFileSync(SOURCE_FILE, 'utf-8');
  
  // Minify for deployment (remove excessive whitespace)
  sourceCode = sourceCode
    .replace(/\s+/g, ' ')
    .replace(/\{\s+/g, '{')
    .replace(/\s+\}/g, '}')
    .replace(/\[\s+/g, '[')
    .replace(/\s+\]/g, ']');

  console.log('✅ Source code prepared');
  console.log(`📏 Size: ${sourceCode.length} characters`);

  // Try automated deployment first
  console.log('\n🔄 Attempting automated deployment...');
  
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  
  if (accessToken) {
    try {
      const result = await deployWithAPI(accessToken, sourceCode);
      if (result.success) {
        console.log('✅ Automated deployment successful!');
        await verifyDeployment();
        return;
      } else {
        console.log(`⚠️  Automated deployment failed: ${result.error}`);
      }
    } catch (error) {
      console.log(`⚠️  Automated deployment error: ${error.message}`);
    }
  } else {
    console.log('ℹ️  No SUPABASE_ACCESS_TOKEN found in environment');
  }

  // Provide manual deployment options
  console.log('\n📋 Manual Deployment Options:\n');
  
  console.log('Option 1: Using Supabase CLI (Recommended)');
  console.log('-------------------------------------------');
  console.log('1. Authenticate with Supabase:');
  console.log('   supabase login');
  console.log('');
  console.log('2. Link to project:');
  console.log(`   supabase link --project-ref ${PROJECT_REF}`);
  console.log('');
  console.log('3. Deploy function:');
  console.log(`   supabase functions deploy ${FUNCTION_NAME} --project-ref ${PROJECT_REF}`);
  console.log('');

  console.log('Option 2: Manual Dashboard Deployment');
  console.log('---------------------------------------');
  console.log('1. Go to Supabase Dashboard:');
  console.log(`   https://supabase.com/dashboard/project/${PROJECT_REF}/functions`);
  console.log('');
  console.log('2. Find the "game-session" function and click "Edit"');
  console.log('');
  console.log('3. Copy the contents of:');
  console.log(`   ${SOURCE_FILE}`);
  console.log('');
  console.log('4. Paste into the function editor');
  console.log('');
  console.log('5. Save and deploy');
  console.log('');

  console.log('Option 3: Using curl (if you have access token)');
  console.log('----------------------------------------------------');
  console.log(`SUPABASE_ACCESS_TOKEN=your_token node ${__filename}`);
  console.log('');

  // Create a deployment helper file
  console.log('📝 Creating deployment helper...');
  createDeploymentHelper();

  console.log('✅ Deployment preparation complete!');
  console.log('');
  console.log('🎯 Next Steps:');
  console.log('1. Deploy using one of the options above');
  console.log('2. Run: node test-game-session-fixes.js');
  console.log('3. Verify admin_login and session_id are working');
}

async function deployWithAPI(accessToken, sourceCode) {
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/functions`;
  
  const payload = {
    name: FUNCTION_NAME,
    entrypoint_path: 'index.ts',
    source: sourceCode,
    verify_jwt: false,
    import_map_path: ''
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (response.ok) {
      return { success: true, data: result };
    } else {
      return { success: false, error: result.message || result.error };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function verifyDeployment() {
  console.log('\n🔍 Verifying deployment...');
  
  // Test the deployed function
  const testScript = `
    const BASE_URL = 'https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1';
    
    // Test admin_login
    const response = await fetch(\\\`\\\${BASE_URL}/game-session\\\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'admin_login',
        session_code: 'TEST',
        admin_code: '1234'
      })
    });
    
    const data = await response.json();
    console.log('Admin login test:', data.error ? 'FAILED' : 'SUCCESS');
    console.log('Response:', JSON.stringify(data, null, 2));
  `;

  console.log('Run this to verify:');
  console.log(`node -e "${testScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`);
}

function createDeploymentHelper() {
  const helperContent = `# Game Session Deployment Helper
# Run this script to deploy the game-session function

SUPABASE_PROJECT="bkszmvfsfgvdwzacgmfz"
FUNCTION_NAME="game-session"
SOURCE_FILE="supabase/functions/game-session/index.ts"

echo "Deploying ${FUNCTION_NAME} to ${SUPABASE_PROJECT}..."

# Method 1: If you have Supabase CLI with access token
if [ -n "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "Using Supabase API..."
  node -e "
    const fs = require('fs');
    const source = fs.readFileSync('${SOURCE_FILE}', 'utf-8');
    fetch('https://api.supabase.com/v1/projects/${SUPABASE_PROJECT}/functions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.SUPABASE_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: '${FUNCTION_NAME}',
        entrypoint_path: 'index.ts',
        source: source,
        verify_jwt: false
      })
    }).then(r => r.json()).then(console.log).catch(console.error);
  "
elif command -v supabase &> /dev/null; then
  echo "Using Supabase CLI..."
  supabase functions deploy ${FUNCTION_NAME} --project-ref ${SUPABASE_PROJECT}
else
  echo "No deployment method available. Please use manual deployment."
fi
`;

  fs.writeFileSync('deploy-game-helper.sh', helperContent);
  console.log('✅ Created: deploy-game-helper.sh');
}

// Run deployment
deployFunction().catch(console.error);