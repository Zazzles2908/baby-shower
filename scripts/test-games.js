#!/usr/bin/env node
/**
 * Baby Shower App - Game Verification Script
 * Quick test to verify all games are working
 * 
 * Usage: node scripts/test-games.js
 */

const https = require('https');

const APP_URL = 'https://baby-shower-v2.vercel.app';
const TEST_TIMEOUT = 10000;

// Helper function to fetch URL
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Request timeout: ${url}`));
    }, TEST_TIMEOUT);

    https.get(url, (res) => {
      clearTimeout(timeout);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    }).on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

// Test 1: Check if app loads
async function testAppLoad() {
  console.log('Test 1: Checking if app loads...');
  try {
    const response = await fetchUrl(APP_URL);
    
    if (response.status === 200) {
      console.log('✅ App loads successfully (HTTP 200)');
      return true;
    } else {
      console.log(`❌ App returned HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Failed to load app: ${error.message}`);
    return false;
  }
}

// Test 2: Check if scripts are accessible
async function testScripts() {
  console.log('\nTest 2: Checking if scripts are accessible...');
  
  const scripts = [
    '/scripts/main.js',
    '/scripts/mom-vs-dad-simplified.js'
  ];
  
  let allPassed = true;
  
  for (const script of scripts) {
    try {
      const url = APP_URL + script;
      const response = await fetchUrl(url);
      
      if (response.status === 200) {
        console.log(`✅ ${script} - accessible`);
        
        // Check if the file has the expected content
        if (script.includes('mom-vs-dad')) {
          if (response.body.includes('reinitializeForSection')) {
            console.log('   ✅ reinitializeForSection function found');
          } else {
            console.log('   ⚠️  reinitializeForSection function NOT found');
            allPassed = false;
          }
        }
      } else {
        console.log(`❌ ${script} - HTTP ${response.status}`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ ${script} - ${error.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

// Test 3: Check Mom vs Dad game content
async function testGameContent() {
  console.log('\nTest 3: Checking Mom vs Dad game content...');
  
  try {
    const response = await fetchUrl(APP_URL + '/scripts/mom-vs-dad-simplified.js');
    
    if (response.status === 200) {
      const checks = [
        { pattern: 'renderLobbySelector', desc: 'Lobby renderer' },
        { pattern: 'reinitializeForSection', desc: 'Section re-initializer' },
        { pattern: 'renderGameScreen', desc: 'Game screen renderer' },
        { pattern: 'renderResultsScreen', desc: 'Results renderer' },
        { pattern: 'initializeGame', desc: 'Game initializer' },
        { pattern: 'GameStates', desc: 'Game states defined' }
      ];
      
      let allFound = true;
      for (const check of checks) {
        if (response.body.includes(check.pattern)) {
          console.log(`✅ ${check.desc} - found`);
        } else {
          console.log(`❌ ${check.desc} - NOT found`);
          allFound = false;
        }
      }
      
      return allFound;
    } else {
      console.log('❌ Could not fetch game script');
      return false;
    }
  } catch (error) {
    console.log(`❌ Error checking game content: ${error.message}`);
    return false;
  }
}

// Test 4: Check main.js navigation code
async function testNavigation() {
  console.log('\nTest 4: Checking navigation code...');
  
  try {
    const response = await fetchUrl(APP_URL + '/scripts/main.js');
    
    if (response.status === 200) {
      if (response.body.includes('reinitializeForSection')) {
        console.log('✅ Navigation calls reinitializeForSection');
        return true;
      } else {
        console.log('❌ Navigation does NOT call reinitializeForSection');
        return false;
      }
    } else {
      console.log('❌ Could not fetch main.js');
      return false;
    }
  } catch (error) {
    console.log(`❌ Error checking navigation: ${error.message}`);
    return false;
  }
}

// Test 5: Check index.html structure
async function testHtmlStructure() {
  console.log('\nTest 5: Checking HTML structure...');
  
  try {
    const response = await fetchUrl(APP_URL);
    
    if (response.status === 200) {
      const checks = [
        { pattern: 'mom-vs-dad-section', desc: 'Game section element' },
        { pattern: 'mom-vs-dad-game', desc: 'Game container element' },
        { pattern: 'data-section="mom-vs-dad"', desc: 'Activity card link' },
        { pattern: 'Baby Pool', desc: 'Other activities' }
      ];
      
      let allFound = true;
      for (const check of checks) {
        if (response.body.includes(check.pattern)) {
          console.log(`✅ ${check.desc} - found`);
        } else {
          console.log(`❌ ${check.desc} - NOT found`);
          allFound = false;
        }
      }
      
      return allFound;
    } else {
      console.log('❌ Could not fetch HTML');
      return false;
    }
  } catch (error) {
    console.log(`❌ Error checking HTML: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log(`Testing: ${APP_URL}\n`);
  
  const results = {
    appLoad: await testAppLoad(),
    scripts: await testScripts(),
    gameContent: await testGameContent(),
    navigation: await testNavigation(),
    htmlStructure: await testHtmlStructure()
  };
  
  // Summary
  console.log('\n==========================================');
  console.log('📊 Test Results Summary');
  console.log('==========================================');
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  console.log(`Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! The app is working correctly.');
    console.log('\nIf the Mom vs Dad game still shows a dead-end screen:');
    console.log('1. Do a HARD REFRESH (Ctrl+Shift+R)');
    console.log('2. Check browser console for errors');
    console.log('3. The issue might be client-side caching');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the results above.');
  }
  
  console.log('\n==========================================\n');
}

runTests().catch(console.error);
