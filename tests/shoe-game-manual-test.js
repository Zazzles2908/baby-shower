/**
 * Baby Shower App - Shoe Game Manual Test Runner
 * Tests game functionality without Playwright
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Expected questions from the game
const EXPECTED_QUESTIONS = [
    "Who worries more?",
    "Who wants more kids?", 
    "Whose parents will feed you more?",
    "Who will be more nervous in labour?",
    "Who keeps track of appointments?",
    "Who is the better baby whisperer?",
    "Who will spoil the baby more?",
    "Who will be stricter with rules?",
    "Who will handle night feeds better?",
    "Who will cry more at baby's first day of school?",
    "Who is more likely to match outfits with baby?",
    "Who will take more photos of baby?",
    "Who will be more protective?",
    "Who will handle tantrums better?",
    "Who will read more bedtime stories?",
    "Who will be the fun parent?",
    "Who will be the disciplinarian?",
    "Who will handle diaper changes better?",
    "Who will plan more elaborate birthday parties?",
    "Who will be more emotional during milestones?"
];

const testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

function log(message) {
    console.log(`[TEST] ${message}`);
}

function logPass(testName) {
    testResults.passed++;
    testResults.tests.push({ name: testName, status: 'PASS' });
    console.log(`✅ PASS: ${testName}`);
}

function logFail(testName, error) {
    testResults.failed++;
    testResults.tests.push({ name: testName, status: 'FAIL', error: error.message || error });
    console.log(`❌ FAIL: ${testName} - ${error}`);
}

async function fetchPage(path) {
    return new Promise((resolve, reject) => {
        http.get(`${BASE_URL}${path}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        }).on('error', reject);
    });
}

async function runTests() {
    console.log('\n' + '='.repeat(60));
    console.log('Baby Shower App - Shoe Game E2E Testing');
    console.log('='.repeat(60) + '\n');

    try {
        // Test 1: Check if index.html loads
        log('Testing index.html loads...');
        try {
            const indexRes = await fetchPage('/index.html');
            if (indexRes.status === 200 && indexRes.data.includes('The Shoe Game')) {
                logPass('index.html loads with Shoe Game');
            } else {
                logFail('index.html loads with Shoe Game', 'Missing Shoe Game content');
            }
        } catch (e) {
            logFail('index.html loads', e);
        }

        // Test 2: Check if shoe game JS loads
        log('Testing shoe game script loads...');
        try {
            const jsRes = await fetchPage('/scripts/who-would-rather.js');
            if (jsRes.status === 200 && jsRes.data.includes('ShoeGame')) {
                logPass('shoe game script loads');
            } else {
                logFail('shoe game script loads', 'Script not found or invalid');
            }
        } catch (e) {
            logFail('shoe game script loads', e);
        }

        // Test 3: Check if shoe game CSS loads
        log('Testing shoe game CSS loads...');
        try {
            const cssRes = await fetchPage('/styles/who-would-rather.css');
            if (cssRes.status === 200 && cssRes.data.includes('shoe-game-question')) {
                logPass('shoe game CSS loads');
            } else {
                logFail('shoe game CSS loads', 'CSS not found or invalid');
            }
        } catch (e) {
            logFail('shoe game CSS loads', e);
        }

        // Test 4: Verify all 20 questions are in the script
        log('Testing all 20 questions are present...');
        try {
            const jsRes = await fetchPage('/scripts/who-would-rather.js');
            let questionsFound = 0;
            for (const q of EXPECTED_QUESTIONS) {
                if (jsRes.data.includes(q)) {
                    questionsFound++;
                }
            }
            if (questionsFound === 20) {
                logPass('all 20 questions present');
            } else {
                logFail('all 20 questions present', `Only ${questionsFound}/20 found`);
            }
        } catch (e) {
            logFail('all 20 questions present', e);
        }

        // Test 5: Check game configuration
        log('Testing game configuration...');
        try {
            const jsRes = await fetchPage('/scripts/who-would-rather.js');
            if (jsRes.data.includes('autoAdvanceDelay: 800') &&
                jsRes.data.includes('parentA') &&
                jsRes.data.includes('parentB')) {
                logPass('game configuration present');
            } else {
                logFail('game configuration present', 'Missing configuration');
            }
        } catch (e) {
            logFail('game configuration present', e);
        }

        // Test 6: Check vote functionality
        log('Testing vote functionality...');
        try {
            const jsRes = await fetchPage('/scripts/who-would-rather.js');
            if (jsRes.data.includes("function vote(choice)") &&
                jsRes.data.includes('state.votes.push(choice)') &&
                jsRes.data.includes("window.ShoeGame")) {
                logPass('vote functionality present');
            } else {
                logFail('vote functionality present', 'Missing vote implementation');
            }
        } catch (e) {
            logFail('vote functionality present', e);
        }

        // Test 7: Check results screen
        log('Testing results screen...');
        try {
            const jsRes = await fetchPage('/scripts/who-would-rather.js');
            if (jsRes.data.includes('function renderResults()') &&
                jsRes.data.includes('winner-banner') &&
                jsRes.data.includes('Game Complete')) {
                logPass('results screen present');
            } else {
                logFail('results screen present', 'Missing results implementation');
            }
        } catch (e) {
            logFail('results screen present', e);
        }

        // Test 8: Check restart functionality
        log('Testing restart functionality...');
        try {
            const jsRes = await fetchPage('/scripts/who-would-rather.js');
            if (jsRes.data.includes('function restart()') &&
                jsRes.data.includes('Play Again')) {
                logPass('restart functionality present');
            } else {
                logFail('restart functionality present', 'Missing restart implementation');
            }
        } catch (e) {
            logFail('restart functionality present', e);
        }

        // Test 9: Check auto-advance logic
        log('Testing auto-advance logic...');
        try {
            const jsRes = await fetchPage('/scripts/who-would-rather.js');
            if (jsRes.data.includes('state.currentQuestion++') &&
                jsRes.data.includes('setTimeout')) {
                logPass('auto-advance logic present');
            } else {
                logFail('auto-advance logic present', 'Missing auto-advance');
            }
        } catch (e) {
            logFail('auto-advance logic present', e);
        }

        // Test 10: Check score calculation
        log('Testing score calculation...');
        try {
            const jsRes = await fetchPage('/scripts/who-would-rather.js');
            if (jsRes.data.includes('state.votes.filter') &&
                jsRes.data.includes('percentA') &&
                jsRes.data.includes('percentB')) {
                logPass('score calculation present');
            } else {
                logFail('score calculation present', 'Missing score calculation');
            }
        } catch (e) {
            logFail('score calculation present', e);
        }

        // Test 11: Check progress bar logic
        log('Testing progress bar...');
        try {
            const jsRes = await fetchPage('/scripts/who-would-rather.js');
            if (jsRes.data.includes('progress-fill') &&
                jsRes.data.includes('progress-bar') &&
                jsRes.data.includes('question-counter')) {
                logPass('progress bar present');
            } else {
                logFail('progress bar present', 'Missing progress bar');
            }
        } catch (e) {
            logFail('progress bar present', e);
        }

        // Test 12: Check mobile responsiveness
        log('Testing mobile responsiveness CSS...');
        try {
            const cssRes = await fetchPage('/styles/who-would-rather.css');
            if (cssRes.data.includes('@media (max-width: 599px)') &&
                cssRes.data.includes('flex-direction: column')) {
                logPass('mobile responsiveness present');
            } else {
                logFail('mobile responsiveness present', 'Missing mobile styles');
            }
        } catch (e) {
            logFail('mobile responsiveness present', e);
        }

        // Test 13: Check animation effects
        log('Testing animation effects...');
        try {
            const cssRes = await fetchPage('/styles/who-would-rather.css');
            if (cssRes.data.includes('@keyframes fadeIn') &&
                cssRes.data.includes('@keyframes votePulse') &&
                cssRes.data.includes('@keyframes rippleEffect')) {
                logPass('animation effects present');
            } else {
                logFail('animation effects present', 'Missing animations');
            }
        } catch (e) {
            logFail('animation effects present', e);
        }

        // Test 14: Check avatar integration
        log('Testing avatar integration...');
        try {
            const jsRes = await fetchPage('/scripts/who-would-rather.js');
            if (jsRes.data.includes('getAvatar') &&
                jsRes.data.includes('shoe-avatar-img') &&
                jsRes.data.includes('DEFAULT_AVATARS')) {
                logPass('avatar integration present');
            } else {
                logFail('avatar integration present', 'Missing avatar support');
            }
        } catch (e) {
            logFail('avatar integration present', e);
        }

        // Test 15: Check API exposure
        log('Testing API exposure...');
        try {
            const jsRes = await fetchPage('/scripts/who-would-rather.js');
            if (jsRes.data.includes('window.ShoeGame = {') &&
                jsRes.data.includes("init: init") &&
                jsRes.data.includes("vote: vote") &&
                jsRes.data.includes("restart: restart")) {
                logPass('API exposure present');
            } else {
                logFail('API exposure present', 'Missing API');
            }
        } catch (e) {
            logFail('API exposure present', e);
        }

    } catch (e) {
        logFail('Test execution', e);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
    console.log('='.repeat(60) + '\n');

    return testResults;
}

runTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
}).catch(e => {
    console.error('Test runner error:', e);
    process.exit(1);
});
