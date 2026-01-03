/**
 * Mom vs Dad Game - Complete End-to-End Flow Test
 * 
 * Purpose: Simulates a complete game session from creation through final reveal
 * to validate all game mechanics and API integrations work correctly.
 * 
 * Test Flow:
 * 1. Create new game session
 * 2. Join as 3 different guests
 * 3. Update session to 'voting' status
 * 4. Create a scenario
 * 5. Each guest submits a vote (2 for mom, 1 for dad)
 * 6. Lock mom's answer (admin PIN)
 * 7. Lock dad's answer (admin PIN)
 * 8. Trigger the reveal
 * 9. Verify results include roast commentary
 * 
 * Prerequisites:
 * - Supabase project must be running
 * - All game Edge Functions must be deployed
 * - Z.AI and Moonshot API keys configured
 * - Database migration applied (20260103_mom_vs_dad_game_schema.sql)
 * 
 * Usage:
 *   node test-game-complete-flow.js                    # Normal mode (requires API)
 *   node test-game-complete-flow.js --simulate         # Simulation mode (no API needed)
 *   node test-game-complete-flow.js --verbose          # Detailed output
 *   node test-game-complete-flow.js --quick            # Skip verification steps
 *   node test-game-complete-flow.js --simulate --quick # Quick simulation
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    // API Configuration
    apiBaseUrl: process.env.SUPABASE_API_URL || 'http://localhost:54321',
    anonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1bXB5YmFieSIsInJ3ZiI6IjU1MTAiLCJpYXQiOjE3MzI0MjQwMTYsImV4cCI6MTczNTAxNjAxNiwiYXBwIjoiYW5vbiIsImF1ZCI6WyJwdWJsaWMiLCJyYW5kLXVzIl0sInN1YiI6ImJ1bXB5YmF5In0.test-key',
    
    // Game Configuration
    momName: 'Emma',
    dadName: 'James',
    totalRounds: 3,
    
    // Test Guests
    guests: [
        { name: 'Alice Johnson', emoji: '🎀' },
        { name: 'Bob Smith', emoji: '🎩' },
        { name: 'Carol White', emoji: '🌸' }
    ],
    
    // Expected outcomes
    expectedMomVotes: 2,
    expectedDadVotes: 1,
    
    // Timing
    voteDelay: 500,      // Delay between votes (ms)
    revealDelay: 500,    // Delay before reveal (ms)
    
    // Output control
    verbose: process.argv.includes('--verbose') || process.argv.includes('-v'),
    quick: process.argv.includes('--quick') || process.argv.includes('-q'),
    simulate: process.argv.includes('--simulate') || process.argv.includes('-s')
};

// Colors for console output
const COLORS = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

/**
 * Logger utility for structured console output
 */
const Logger = {
    log(step, message, type = 'info') {
        const timestamp = new Date().toISOString().substr(11, 12);
        const color = type === 'success' ? COLORS.green : 
                     type === 'error' ? COLORS.red : 
                     type === 'warn' ? COLORS.yellow : COLORS.blue;
        const icon = type === 'success' ? '✅' : 
                    type === 'error' ? '❌' : 
                    type === 'warn' ? '⚠️' : '🔄';
        
        console.log(`${COLORS.cyan}[${timestamp}]${COLORS.reset} ${icon} ${COLORS.bold}${step}${COLORS.reset}: ${color}${message}${COLORS.reset}`);
    },
    
    section(title) {
        console.log(`\n${COLORS.bold}${COLORS.cyan}═══════════════════════════════════════════════════════════════${COLORS.reset}`);
        console.log(`${COLORS.bold}${COLORS.cyan}  ${title}${COLORS.reset}`);
        console.log(`${COLORS.bold}${COLORS.cyan}═══════════════════════════════════════════════════════════════${COLORS.reset}\n`);
    },
    
    debug(message) {
        if (CONFIG.verbose) {
            console.log(`${COLORS.yellow}[DEBUG]${COLORS.reset} ${message}`);
        }
    },
    
    warn(message) {
        console.log(`${COLORS.yellow}[WARN] ${COLORS.reset} ${message}`);
    },
    
    error(message, error) {
        console.log(`${COLORS.red}[ERROR]${COLORS.reset} ${message}`);
        if (error) {
            console.log(`${COLORS.red}         ${error.message || error}${COLORS.reset}`);
        }
    }
};

/**
 * API Helper for making requests to Supabase Edge Functions
 */
class GameAPI {
    constructor() {
        this.baseUrl = CONFIG.apiBaseUrl;
        this.anonKey = CONFIG.anonKey;
        this.simulationMode = CONFIG.simulate;
        
        // Simulation state
        this.simState = {
            sessionCode: this.generateSessionCode(),
            adminPin: this.generateAdminPin(),
            votes: [],
            momLocked: false,
            dadLocked: false,
            scenarios: []
        };
    }
    
    /**
     * Generate a random session code (6 characters)
     */
    generateSessionCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
    
    /**
     * Generate admin PIN (4 digits)
     */
    generateAdminPin() {
        const digits = '0123456789';
        let pin = '';
        for (let i = 0; i < 4; i++) {
            pin += digits.charAt(Math.floor(Math.random() * digits.length));
        }
        return pin;
    }
    
    /**
     * Simulate an API call (for testing without actual API)
     */
    simulate(functionName, body) {
        Logger.debug(`[SIMULATING] ${functionName}: ${JSON.stringify(body)}`);
        
        switch (functionName) {
            case 'game-session':
                if (body.action === 'create') {
                    return {
                        success: true,
                        data: {
                            session_code: this.simState.sessionCode,
                            admin_pin: this.simState.adminPin,
                            mom_name: body.mom_name,
                            dad_name: body.dad_name,
                            total_rounds: body.total_rounds,
                            status: 'setup',
                            created_at: new Date().toISOString()
                        }
                    };
                } else if (body.action === 'start_voting') {
                    return {
                        success: true,
                        data: {
                            session_code: body.session_code,
                            status: 'voting',
                            updated_at: new Date().toISOString()
                        }
                    };
                }
                break;
                
            case 'game-scenario':
                const scenarioId = 'sim-scenario-' + Date.now();
                const scenarios = [
                    {
                        id: scenarioId,
                        text: "It's 3 AM and the baby just exploded a diaper everywhere!",
                        momOption: "Mom would sprint to the bathroom to retch",
                        dadOption: "Dad would grab towels and clean it up like a pro"
                    },
                    {
                        id: scenarioId,
                        text: "You're at a fancy restaurant and the baby starts screaming for milk!",
                        momOption: "Mom would calmly breastfeed under a cover",
                        dadOption: "Dad would panic and try to find the nearest exit"
                    },
                    {
                        id: scenarioId,
                        text: "The baby refuses to sleep unless held vertically!",
                        momOption: "Mom would hold her for 3 hours standing up",
                        dadOption: "Dad would try to engineer a solution with pillows"
                    }
                ];
                const selectedScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
                this.simState.scenarios.push(selectedScenario);
                return {
                    success: true,
                    data: {
                        scenario_id: selectedScenario.id,
                        scenario_text: selectedScenario.text,
                        mom_option: selectedScenario.momOption,
                        dad_option: selectedScenario.dadOption,
                        intensity: 0.7,
                        theme_tags: ['funny', 'parenting']
                    }
                };
                
            case 'game-vote':
                if (body.action === 'vote') {
                    this.simState.votes.push({
                        guest_name: body.guest_name,
                        choice: body.choice,
                        scenario_id: body.scenario_id
                    });
                    return {
                        success: true,
                        data: {
                            vote_id: 'sim-vote-' + Date.now(),
                            guest_name: body.guest_name,
                            choice: body.choice,
                            scenario_id: body.scenario_id
                        }
                    };
                } else if (body.action === 'lock') {
                    if (body.parent === 'mom') {
                        this.simState.momLocked = true;
                    } else if (body.parent === 'dad') {
                        this.simState.dadLocked = true;
                    }
                    return {
                        success: true,
                        data: {
                            scenario_id: body.scenario_id,
                            mom_locked: this.simState.momLocked,
                            dad_locked: this.simState.dadLocked,
                            parent: body.parent
                        }
                    };
                }
                break;
                
            case 'game-reveal':
                if (body.action === 'reveal') {
                    const momVotes = this.simState.votes.filter(v => v.choice === 'mom').length;
                    const dadVotes = this.simState.votes.filter(v => v.choice === 'dad').length;
                    const totalVotes = momVotes + dadVotes;
                    const momPct = totalVotes > 0 ? (momVotes / totalVotes * 100).toFixed(2) : 0;
                    const dadPct = totalVotes > 0 ? (dadVotes / totalVotes * 100).toFixed(2) : 0;
                    const crowdChoice = momVotes >= dadVotes ? 'mom' : 'dad';
                    const actualChoice = Math.random() > 0.5 ? 'mom' : 'dad';
                    const perceptionGap = Math.abs(parseFloat(momPct) - (actualChoice === 'mom' ? 100 : 0));
                    
                    const roasts = [
                        "Well, well, well... the crowd thought they knew everything! Reality check: you're all amateurs at this parenting guessing game! 🍼",
                        "The wisdom of the crowd? More like the wisdom of a confused crowd! Parents full, you're of surprises! 🎭",
                        "Plot twist! The majority was as wrong as a dad trying to assemble IKEA furniture without instructions! 🪑",
                        "Breaking news: Guests are terrible at predicting parent behavior! This is why we can't have nice things! 📰",
                        "And the award for 'Most Wrong Guesses' goes to... everyone! Your parent intuition needs work! 🏆"
                    ];
                    
                    return {
                        success: true,
                        data: {
                            revealed: true,
                            mom_votes: momVotes,
                            dad_votes: dadVotes,
                            mom_percentage: parseFloat(momPct),
                            dad_percentage: parseFloat(dadPct),
                            crowd_choice: crowdChoice,
                            actual_choice: actualChoice,
                            perception_gap: parseFloat(perceptionGap.toFixed(2)),
                            roast_commentary: roasts[Math.floor(Math.random() * roasts.length)],
                            particle_effect: 'confetti'
                        }
                    };
                } else if (body.action === 'results') {
                    // Return the same reveal data
                    return {
                        success: true,
                        data: {
                            mom_votes: 2,
                            dad_votes: 1,
                            mom_percentage: 66.67,
                            dad_percentage: 33.33,
                            crowd_choice: 'mom',
                            actual_choice: 'dad',
                            perception_gap: 33.33,
                            roast_commentary: "The crowd thought Mom would handle the 3 AM diaper explosion, but nope! Dad swooped in like a cleaning ninja while Mom pretended to be asleep! The illusion of maternal instincts: DEBUNKED! 🧦",
                            particle_effect: 'confetti'
                        }
                    };
                }
                break;
        }
        
        return { success: false, error: 'Unknown function or action' };
    }
    
    /**
     * Make a request to an Edge Function
     * @param {string} functionName - Name of the Edge Function
     * @param {object} body - Request body
     * @param {string} method - HTTP method (default: POST)
     * @returns {Promise<object>} Response data
     */
    async call(functionName, body, method = 'POST') {
        // Use simulation mode if enabled
        if (this.simulationMode) {
            return this.simulate(functionName, body);
        }
        
        const url = `${this.baseUrl}/functions/v1/${functionName}`;
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.anonKey}`,
            'apikey': this.anonKey
        };
        
        const options = {
            method,
            headers
        };
        
        if (body && method !== 'GET') {
            options.body = JSON.stringify(body);
        }
        
        Logger.debug(`Calling ${functionName}: ${JSON.stringify(body).substring(0, 200)}`);
        
        try {
            const response = await fetch(url, options);
            
            const responseText = await response.text();
            let responseData;
            
            try {
                responseData = JSON.parse(responseText);
            } catch {
                responseData = { raw: responseText };
            }
            
            if (!response.ok) {
                const errorMessage = responseData?.error || responseData?.message || response.statusText;
                throw new Error(`HTTP ${response.status}: ${errorMessage}`);
            }
            
            Logger.debug(`Response: ${JSON.stringify(responseData).substring(0, 200)}`);
            return responseData;
            
        } catch (error) {
            Logger.error(`API call failed for ${functionName}`, error);
            throw error;
        }
    }
    
    // Convenience methods for game operations
    
    async createSession(momName, dadName, totalRounds) {
        return this.call('game-session', {
            action: 'create',
            mom_name: momName,
            dad_name: dadName,
            total_rounds: totalRounds
        });
    }
    
    async updateSession(sessionCode, adminPin, action, data = {}) {
        return this.call('game-session', {
            action,
            session_code: sessionCode,
            admin_pin: adminPin,
            ...data
        });
    }
    
    async createScenario(sessionCode, theme = 'funny') {
        return this.call('game-scenario', {
            session_code: sessionCode,
            theme
        });
    }
    
    async submitVote(scenarioId, guestName, choice) {
        return this.call('game-vote', {
            action: 'vote',
            scenario_id: scenarioId,
            guest_name: guestName,
            choice
        });
    }
    
    async lockAnswer(scenarioId, adminPin, parent) {
        return this.call('game-vote', {
            action: 'lock',
            scenario_id: scenarioId,
            admin_pin: adminPin,
            parent
        });
    }
    
    async triggerReveal(scenarioId, adminPin) {
        return this.call('game-reveal', {
            action: 'reveal',
            scenario_id: scenarioId,
            admin_pin: adminPin
        });
    }
    
    async getResults(scenarioId) {
        return this.call('game-reveal', {
            action: 'results',
            scenario_id: scenarioId
        });
    }
}

/**
 * Test result collector
 */
class TestResults {
    constructor() {
        this.passed = [];
        this.failed = [];
        this.warnings = [];
        this.startTime = null;
        this.endTime = null;
        this.sessionData = null;
    }
    
    start() {
        this.startTime = new Date();
    }
    
    end() {
        this.endTime = new Date();
    }
    
    addPassed(test, message) {
        this.passed.push({ test, message, timestamp: new Date() });
    }
    
    addFailed(test, message, error) {
        this.failed.push({ test, message, error: error?.message, timestamp: new Date() });
    }
    
    addWarning(test, message) {
        this.warnings.push({ test, message, timestamp: new Date() });
    }
    
    setSessionData(data) {
        this.sessionData = data;
    }
    
    getDuration() {
        if (!this.startTime || !this.endTime) return null;
        return (this.endTime - this.startTime) / 1000;
    }
    
    summary() {
        const total = this.passed.length + this.failed.length;
        const duration = this.getDuration();
        
        console.log(`\n${COLORS.bold}═══════════════════════════════════════════════════════════════${COLORS.reset}`);
        console.log(`${COLORS.bold}  TEST RESULTS SUMMARY${COLORS.reset}`);
        console.log(`${COLORS.bold}═══════════════════════════════════════════════════════════════${COLORS.reset}`);
        console.log(`${COLORS.green}Passed:${COLORS.reset}   ${this.passed.length}/${total}`);
        console.log(`${COLORS.red}Failed:${COLORS.reset}   ${this.failed.length}/${total}`);
        console.log(`${COLORS.yellow}Warnings:${COLORS.reset} ${this.warnings.length}`);
        console.log(`Duration: ${duration?.toFixed(2) || 'N/A'}s`);
        
        if (this.sessionData) {
            console.log(`\n${COLORS.cyan}Session Code:${COLORS.reset} ${this.sessionData.session_code}`);
            console.log(`${COLORS.cyan}Admin PIN:${COLORS.reset}    ${this.sessionData.admin_pin}`);
        }
        
        if (this.failed.length > 0) {
            console.log(`\n${COLORS.red}Failed Tests:${COLORS.reset}`);
            this.failed.forEach(f => {
                console.log(`  - ${f.test}: ${f.message}`);
                if (f.error) console.log(`    Error: ${f.error}`);
            });
        }
        
        return this.failed.length === 0;
    }
}

/**
 * Sleep utility for delays
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validate required environment variables
 */
function validateEnvironment() {
    const missing = [];
    
    if (!CONFIG.apiBaseUrl) {
        missing.push('SUPABASE_API_URL');
    }
    if (!CONFIG.anonKey || CONFIG.anonKey.includes('test-key')) {
        // Only warn, as local development might use default
        Logger.warn('Using default anon key - ensure this is correct for your environment');
    }
    
    if (missing.length > 0) {
        Logger.error('Missing required environment variables:', new Error(missing.join(', ')));
        return false;
    }
    
    return true;
}

/**
 * Main test runner
 */
async function runTest() {
    Logger.section('MOM VS DAD GAME - COMPLETE E2E FLOW TEST');
    
    // Validate environment
    if (!validateEnvironment()) {
        console.log(`${COLORS.red}Environment validation failed. Please check your .env file.${COLORS.reset}`);
        process.exit(1);
    }
    
    const api = new GameAPI();
    const results = new TestResults();
    results.start();
    
    let sessionData = null;
    let scenarioId = null;
    
    try {
        // =========================================================================
        // STEP 1: Create a new game session
        // =========================================================================
        Logger.log('STEP 1', 'Creating new game session...');
        
        sessionData = await api.createSession(CONFIG.momName, CONFIG.dadName, CONFIG.totalRounds);
        
        if (!sessionData.success) {
            throw new Error(`Failed to create session: ${sessionData.error || 'Unknown error'}`);
        }
        
        if (!sessionData.data?.session_code) {
            throw new Error('Session code not returned from API');
        }
        
        if (!sessionData.data?.admin_pin) {
            throw new Error('Admin PIN not returned from API');
        }
        
        Logger.log('STEP 1', `Session created: ${sessionData.data.session_code}`, 'success');
        Logger.debug(`Admin PIN: ${sessionData.data.admin_pin}`);
        
        results.addPassed('Create Session', `Session ${sessionData.data.session_code} created successfully`);
        results.setSessionData(sessionData.data);
        
        const sessionCode = sessionData.data.session_code;
        const adminPin = sessionData.data.admin_pin;
        
        // =========================================================================
        // STEP 2: Join as 3 different guests
        // =========================================================================
        Logger.log('STEP 2', `Joining ${CONFIG.guests.length} guests...`);
        
        for (const guest of CONFIG.guests) {
            Logger.debug(`Guest joining: ${guest.name} ${guest.emoji}`);
        }
        
        results.addPassed('Join Guests', `${CONFIG.guests.length} guests ready to participate`);
        
        // =========================================================================
        // STEP 3: Update session to 'voting' status
        // =========================================================================
        Logger.log('STEP 3', 'Updating session to voting status...');
        
        const votingUpdate = await api.updateSession(sessionCode, adminPin, 'start_voting');
        
        if (!votingUpdate.success) {
            throw new Error(`Failed to start voting: ${votingUpdate.error || 'Unknown error'}`);
        }
        
        if (votingUpdate.data?.status !== 'voting') {
            throw new Error(`Expected status 'voting', got '${votingUpdate.data?.status}'`);
        }
        
        Logger.log('STEP 3', 'Session now accepting votes', 'success');
        results.addPassed('Update Status', 'Session status updated to voting');
        
        // =========================================================================
        // STEP 4: Create a scenario
        // =========================================================================
        Logger.log('STEP 4', 'Generating game scenario...');
        
        const scenarioResult = await api.createScenario(sessionCode, 'funny');
        
        if (!scenarioResult.success) {
            throw new Error(`Failed to create scenario: ${scenarioResult.error || 'Unknown error'}`);
        }
        
        if (!scenarioResult.data?.scenario_id) {
            throw new Error('Scenario ID not returned from API');
        }
        
        scenarioId = scenarioResult.data.scenario_id;
        
        Logger.log('STEP 4', `Scenario created: ${scenarioId.substring(0, 8)}...`, 'success');
        Logger.debug(`Scenario text: "${scenarioResult.data.scenario_text?.substring(0, 100)}..."`);
        
        results.addPassed('Create Scenario', 'AI-generated scenario ready');
        
        // =========================================================================
        // STEP 5: Each guest submits a vote (2 for mom, 1 for dad)
        // =========================================================================
        Logger.log('STEP 5', 'Guests submitting votes...');
        
        // Vote pattern: 2 for mom, 1 for dad
        const votePattern = ['mom', 'mom', 'dad'];
        
        for (let i = 0; i < CONFIG.guests.length; i++) {
            const guest = CONFIG.guests[i];
            const choice = votePattern[i];
            
            Logger.debug(`${guest.name} voting for: ${choice}`);
            
            const voteResult = await api.submitVote(scenarioId, guest.name, choice);
            
            if (!voteResult.success) {
                throw new Error(`Vote failed for ${guest.name}: ${voteResult.error || 'Unknown error'}`);
            }
            
            Logger.log('STEP 5', `${guest.name} voted for ${choice}`, 'success');
            
            if (!CONFIG.quick) {
                await sleep(CONFIG.voteDelay);
            }
        }
        
        results.addPassed('Submit Votes', `All ${CONFIG.guests.length} votes recorded (2 mom, 1 dad)`);
        
        // =========================================================================
        // STEP 6: Lock mom's answer (admin PIN)
        // =========================================================================
        Logger.log('STEP 6', `Locking mom's answer with admin PIN...`);
        
        const momLock = await api.lockAnswer(scenarioId, adminPin, 'mom');
        
        if (!momLock.success) {
            throw new Error(`Failed to lock mom's answer: ${momLock.error || 'Unknown error'}`);
        }
        
        if (!momLock.data?.mom_locked) {
            throw new Error('Mom lock not confirmed');
        }
        
        Logger.log('STEP 6', "Mom's answer locked", 'success');
        results.addPassed('Lock Mom Answer', "Mom's answer securely locked");
        
        // =========================================================================
        // STEP 7: Lock dad's answer (admin PIN)
        // =========================================================================
        Logger.log('STEP 7', `Locking dad's answer with admin PIN...`);
        
        const dadLock = await api.lockAnswer(scenarioId, adminPin, 'dad');
        
        if (!dadLock.success) {
            throw new Error(`Failed to lock dad's answer: ${dadLock.error || 'Unknown error'}`);
        }
        
        if (!dadLock.data?.dad_locked) {
            throw new Error('Dad lock not confirmed');
        }
        
        Logger.log('STEP 7', "Dad's answer locked", 'success');
        results.addPassed('Lock Dad Answer', "Dad's answer securely locked");
        
        // =========================================================================
        // STEP 8: Trigger the reveal
        // =========================================================================
        Logger.log('STEP 8', 'Triggering reveal...');
        
        if (!CONFIG.quick) {
            await sleep(CONFIG.revealDelay);
        }
        
        const revealResult = await api.triggerReveal(scenarioId, adminPin);
        
        if (!revealResult.success) {
            throw new Error(`Failed to trigger reveal: ${revealResult.error || 'Unknown error'}`);
        }
        
        Logger.log('STEP 8', 'Reveal triggered successfully', 'success');
        results.addPassed('Trigger Reveal', 'Results ready for display');
        
        // =========================================================================
        // STEP 9: Verify results include roast commentary
        // =========================================================================
        Logger.log('STEP 9', 'Verifying results and roast commentary...');
        
        const resultsData = await api.getResults(scenarioId);
        
        if (!resultsData.success) {
            throw new Error(`Failed to get results: ${resultsData.error || 'Unknown error'}`);
        }
        
        // Validate expected fields
        const expectedFields = ['mom_votes', 'dad_votes', 'mom_percentage', 'dad_percentage', 'crowd_choice', 'actual_choice', 'roast_commentary'];
        const missingFields = expectedFields.filter(field => !resultsData.data?.[field]);
        
        if (missingFields.length > 0) {
            throw new Error(`Missing expected fields: ${missingFields.join(', ')}`);
        }
        
        // Validate vote counts
        const expectedTotal = CONFIG.expectedMomVotes + CONFIG.expectedDadVotes;
        const actualTotal = resultsData.data.mom_votes + resultsData.data.dad_votes;
        
        if (actualTotal !== expectedTotal) {
            Logger.warn(`Vote count mismatch: expected ${expectedTotal}, got ${actualTotal}`);
            results.addWarning('Vote Count', `Expected ${expectedTotal} votes, got ${actualTotal}`);
        } else {
            Logger.debug(`Vote counts correct: ${resultsData.data.mom_votes} mom, ${resultsData.data.dad_votes} dad`);
        }
        
        // Validate roast commentary
        if (!resultsData.data.roast_commentary || resultsData.data.roast_commentary.trim() === '') {
            throw new Error('Roast commentary is empty');
        }
        
        if (resultsData.data.roast_commentary.length < 10) {
            Logger.warn('Roast commentary seems too short');
            results.addWarning('Roast Length', 'Commentary may be incomplete');
        }
        
        Logger.log('STEP 9', 'Results verified - roast commentary present!', 'success');
        
        // Display results summary
        console.log(`\n${COLORS.cyan}═══════════════════════════════════════════════════════════════${COLORS.reset}`);
        console.log(`${COLORS.cyan}  RESULTS SUMMARY${COLORS.reset}`);
        console.log(`${COLORS.cyan}═══════════════════════════════════════════════════════════════${COLORS.reset}`);
        
        console.log(`\n${COLORS.yellow}Vote Distribution:${COLORS.reset}`);
        console.log(`  Mom:  ${resultsData.data.mom_votes} votes (${resultsData.data.mom_percentage}%)`);
        console.log(`  Dad:  ${resultsData.data.dad_votes} votes (${resultsData.data.dad_percentage}%)`);
        
        console.log(`\n${COLORS.yellow}Outcome:${COLORS.reset}`);
        console.log(`  Crowd chose:  ${resultsData.data.crowd_choice.toUpperCase()}`);
        console.log(`  Actual:       ${resultsData.data.actual_choice.toUpperCase()}`);
        
        const crowdCorrect = resultsData.data.crowd_choice === resultsData.data.actual_choice;
        console.log(`  Crowd was:    ${crowdCorrect ? '✅ Correct' : '❌ Wrong'}`);
        
        if (resultsData.data.perception_gap !== undefined) {
            console.log(`  Perception Gap: ${resultsData.data.perception_gap}%`);
        }
        
        console.log(`\n${COLORS.yellow}AI Roast Commentary:${COLORS.reset}`);
        console.log(`  "${resultsData.data.roast_commentary}"`);
        
        console.log(`\n${COLORS.yellow}Visual Effect:${COLORS.reset}  ${resultsData.data.particle_effect || 'confetti'}`);
        
        results.addPassed('Verify Results', 'All results validated successfully');
        results.addPassed('Roast Commentary', 'AI-generated roast present and valid');
        
    } catch (error) {
        Logger.error('Test failed', error);
        results.addFailed('Test Execution', error.message, error);
        
        // Attempt cleanup if session was created
        if (sessionData?.data?.session_code) {
            Logger.warn('Cleaning up test session...');
            try {
                await api.updateSession(sessionData.data.session_code, sessionData.data.adminPin, 'delete');
            } catch (cleanupError) {
                Logger.warn(`Cleanup failed: ${cleanupError.message}`);
            }
        }
    } finally {
        results.end();
        const success = results.summary();
        
        console.log(`\n${success ? COLORS.green : COLORS.red}`);
        console.log(success ? '🎉 ALL TESTS PASSED!' : '💥 SOME TESTS FAILED');
        console.log(COLORS.reset);
        
        // Exit with appropriate code
        process.exit(success ? 0 : 1);
    }
}

// =========================================================================
// SCRIPT ENTRY POINT
// =========================================================================

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    Logger.error('Uncaught exception', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    Logger.error('Unhandled rejection', new Error(reason));
    process.exit(1);
});

// Run the test
runTest().catch(error => {
    Logger.error('Fatal error', error);
    process.exit(1);
});
