/**
 * AI Integration Test for Mom vs Dad Game
 * Tests scenario generation and roast generation
 */

const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://bkszmvfsfgvdwzacgmfz.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

// Demo sessions from the migration
const DEMO_SESSIONS = [
    { code: 'LOBBY-A', admin: '1111', mom: 'Sunny', dad: 'Barnaby' },
    { code: 'LOBBY-B', admin: '2222', mom: 'Rosie', dad: 'Ricky' },
    { code: 'LOBBY-C', admin: '3333', mom: 'Clucky', dad: 'Chuck' },
    { code: 'LOBBY-D', admin: '4444', mom: 'Ducky', dad: 'Donald' }
];

async function callEdgeFunction(functionName, body) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${FUNCTIONS_URL}/${functionName}`);
        
        const options = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', async () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.write(JSON.stringify(body));
        req.end();
    });
}

async function queryDatabase(query) {
    // For testing, we'll try to use the Edge Function approach
    // Since direct SQL access requires different credentials
    console.log('Query needed:', query.substring(0, 100));
    return null;
}

async function testAIIntegration() {
    console.log('='.repeat(60));
    console.log('AI INTEGRATION TEST - Mom vs Dad Game');
    console.log('='.repeat(60));
    console.log();

    const report = {
        timestamp: new Date().toISOString(),
        session_tested: null,
        scenario_test: { success: false, ai_generated: false, examples: [] },
        roast_test: { success: false, ai_generated: false, examples: [] },
        errors: [],
        verdict: 'UNKNOWN'
    };

    // Step 1: Find a demo session
    console.log('STEP 1: Finding demo session...');
    const session = DEMO_SESSIONS[0]; // Start with LOBBY-A
    report.session_tested = session;
    console.log(`Found: ${session.code} - Mom: ${session.mom}, Dad: ${session.dad}, Admin: ${session.admin}`);
    console.log();

    // Step 2: Start the game
    console.log('STEP 2: Starting game session...');
    console.log(`Calling game-start with session_code: ${session.code}, admin_code: ${session.admin}`);
    
    try {
        const startResult = await callEdgeFunction('game-start', {
            session_code: session.code,
            admin_code: session.admin,
            total_rounds: 5,
            intensity: 0.7
        });

        console.log(`Response status: ${startResult.status}`);
        console.log(`Response data:`, JSON.stringify(startResult.data, null, 2));
        console.log();

        if (startResult.status === 200 && startResult.data.success) {
            console.log('✓ Game started successfully!');
            report.scenario_test.success = true;
            
            // Check if scenarios were AI generated
            if (startResult.data.scenarios && startResult.data.scenarios.length > 0) {
                const scenarios = startResult.data.scenarios;
                
                // Check for AI vs fallback indicators
                const firstScenario = scenarios[0];
                
                // Check if scenario contains personalized names (AI generated)
                const isPersonalized = firstScenario.scenario_text.includes(session.mom) || 
                                       firstScenario.scenario_text.includes(session.dad) ||
                                       firstScenario.mom_option.includes(session.mom) ||
                                       firstScenario.dad_option.includes(session.dad);
                
                // Check for generic template language (fallback)
                const genericIndicators = [
                    "It's 3 AM",
                    "diaper explosion",
                    "The baby starts crying",
                    "stepped on a Lego"
                ];
                
                const isGeneric = genericIndicators.some(ind => firstScenario.scenario_text.includes(ind));
                
                report.scenario_test.ai_generated = isPersonalized && !isGeneric;
                
                console.log(`Scenarios generated: ${scenarios.length}`);
                console.log(`AI Generated: ${report.scenario_test.ai_generated}`);
                console.log(`Personalized: ${isPersonalized}`);
                console.log(`Generic (fallback): ${isGeneric}`);
                console.log();
                
                console.log('Scenario examples:');
                scenarios.slice(0, 3).forEach((s, i) => {
                    console.log(`\n[Scenario ${i + 1}]`);
                    console.log(`  Text: ${s.scenario_text.substring(0, 80)}...`);
                    console.log(`  Mom option: ${s.mom_option}`);
                    console.log(`  Dad option: ${s.dad_option}`);
                    report.scenario_test.examples.push({
                        text: s.scenario_text,
                        mom_option: s.mom_option,
                        dad_option: s.dad_option
                    });
                });

                // Step 3: Submit a vote
                console.log('\n' + '='.repeat(60));
                console.log('STEP 3: Submitting a test vote...');
                
                const voteResult = await callEdgeFunction('game-vote', {
                    session_code: session.code,
                    guest_name: 'TestGuest',
                    scenario_id: firstScenario.id,
                    vote_choice: 'mom'
                });

                console.log(`Vote response status: ${voteResult.status}`);
                console.log(`Vote response:`, JSON.stringify(voteResult.data, null, 2));
                console.log();

                if (voteResult.status === 200 && voteResult.data.success) {
                    console.log('✓ Vote submitted successfully!');
                    
                    // Step 4: Test roast generation
                    console.log('\n' + '='.repeat(60));
                    console.log('STEP 4: Testing roast generation (game-reveal)...');
                    
                    const revealResult = await callEdgeFunction('game-reveal', {
                        session_code: session.code,
                        admin_code: session.admin,
                        scenario_id: firstScenario.id
                    });

                    console.log(`Reveal response status: ${revealResult.status}`);
                    console.log(`Reveal response:`, JSON.stringify(revealResult.data, null, 2));
                    console.log();

                    if (revealResult.status === 200 && revealResult.data.success) {
                        console.log('✓ Roast generated successfully!');
                        report.roast_test.success = true;
                        
                        // Check if roast was AI generated
                        const roastText = revealResult.data.roast_commentary || '';
                        const hasMoonshotStyle = roastText.includes('🤡') || 
                                                 roastText.includes('🎯') || 
                                                 roastText.includes('😱') ||
                                                 roastText.length > 50;
                        
                        report.roast_test.ai_generated = hasMoonshotStyle;
                        
                        // Check if there's a roast_provider field indicating AI
                        if (revealResult.data.roast_provider) {
                            report.roast_test.ai_generated = revealResult.data.roast_provider === 'moonshot-kimi-k2';
                        }
                        
                        report.roast_test.examples.push({
                            commentary: roastText,
                            provider: revealResult.data.roast_provider || 'unknown',
                            perception_gap: revealResult.data.perception_gap
                        });
                        
                        console.log(`Roast provider: ${revealResult.data.roast_provider || 'unknown'}`);
                        console.log(`AI Generated: ${report.roast_test.ai_generated}`);
                        console.log(`Roast text: ${roastText}`);
                    } else {
                        report.errors.push(`Roast generation failed: ${JSON.stringify(revealResult.data)}`);
                        console.log('✗ Roast generation failed');
                    }
                } else {
                    report.errors.push(`Vote submission failed: ${JSON.stringify(voteResult.data)}`);
                    console.log('✗ Vote submission failed');
                }
            } else {
                report.errors.push('No scenarios returned from game-start');
                console.log('✗ No scenarios returned');
            }
        } else {
            report.errors.push(`Game start failed: ${JSON.stringify(startResult.data)}`);
            console.log('✗ Game start failed');
        }
    } catch (error) {
        report.errors.push(`API call error: ${error.message}`);
        console.log(`✗ Error: ${error.message}`);
    }

    // Final verdict
    console.log('\n' + '='.repeat(60));
    console.log('FINAL REPORT');
    console.log('='.repeat(60));
    console.log(`Session tested: ${report.session_tested.code}`);
    console.log(`Mom: ${report.session_tested.mom}, Dad: ${report.session_tested.dad}`);
    console.log();
    console.log('Scenario Generation:');
    console.log(`  - Success: ${report.scenario_test.success ? 'YES' : 'NO'}`);
    console.log(`  - AI Generated: ${report.scenario_test.ai_generated ? 'YES' : 'NO (using fallback)'}`);
    console.log(`  - Examples: ${report.scenario_test.examples.length}`);
    console.log();
    console.log('Roast Generation:');
    console.log(`  - Success: ${report.roast_test.success ? 'YES' : 'NO'}`);
    console.log(`  - AI Generated: ${report.roast_test.ai_generated ? 'YES' : 'NO (using fallback)'}`);
    console.log(`  - Examples: ${report.roast_test.examples.length}`);
    console.log();
    console.log('Errors:');
    report.errors.forEach(e => console.log(`  - ${e}`));
    console.log();

    // Determine verdict
    const allWorking = report.scenario_test.success && report.roast_test.success;
    const aiWorking = report.scenario_test.ai_generated && report.roast_test.ai_generated;
    
    if (allWorking && aiWorking) {
        report.verdict = 'PASS - Full AI integration working';
    } else if (allWorking && !aiWorking) {
        report.verdict = 'PARTIAL - Using fallback templates, AI may not be configured';
    } else {
        report.verdict = 'FAIL - Issues detected';
    }

    console.log('VERDICT:', report.verdict);
    console.log();
    
    return report;
}

// Run the test
testAIIntegration()
    .then(report => {
        console.log('Test completed. Report:', JSON.stringify(report, null, 2));
        process.exit(report.verdict.includes('FAIL') ? 1 : 0);
    })
    .catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });
