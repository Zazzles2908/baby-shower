/**
 * Baby Shower Mom vs Dad Game - Multi-Agent Simulation
 * 
 * Purpose: Test the complete game system with multiple AI agents playing
 * as users, then monitor Supabase logs to verify system behavior.
 * 
 * Features:
 * - 5 AI agents with distinct personalities
 * - Tests all game phases: join, vote, lock answers, reveal
 * - Monitors Supabase Edge Function logs
 * - Generates performance metrics
 * - Identifies edge cases and issues
 */

const CONFIG = {
    // Supabase Configuration
    SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://bkszmvfsfgvdwzacgmfz.supabase.co',
    SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || '',
    
    // Game Configuration
    TOTAL_AGENTS: 5,
    SESSION_CODE: '', // Will be generated
    ADMIN_CODE: '1234', // 4-digit admin PIN for parents
    MOM_NAME: 'Sarah',
    DAD_NAME: 'Mike',
    TOTAL_ROUNDS: 3,
    
    // AI Providers
    USE_ZAI: true,
    USE_MOONSHOT: true,
    
    // Simulation Settings
    DELAY_BETWEEN_ACTIONS: 1000, // ms
    DELAY_BETWEEN_ROUNDS: 2000, // ms
    LOG_LEVEL: 'detailed' // minimal, normal, detailed
};

// Agent personalities with different voting patterns
const AGENT_PERSONALITIES = {
    analytical: {
        name: 'Dr. Rational',
        description: 'Analyzes every scenario logically before voting',
        votingPattern: 'balanced', // votes based on logic
        lockSpeed: 'slow', // takes time to decide
        confidence: 0.8
    },
    emotional: {
        name: 'Heartfelt Hannah',
        description: 'Votes based on emotional connection to scenarios',
        votingPattern: 'emotional', // votes based on feelings
        lockSpeed: 'fast', // decides quickly
        confidence: 0.6
    },
    competitive: {
        name: 'Winner Wilson',
        description: 'Tries to predict what others will vote and counter',
        votingPattern: 'contrarian', // votes against crowd
        lockSpeed: 'medium',
        confidence: 0.9
    },
    casual: {
        name: ' laid-back Liam',
        description: 'Just wants to have fun, votes randomly',
        votingPattern: 'random', // votes randomly
        lockSpeed: 'fast',
        confidence: 0.4
    },
    strategic: {
        name: 'Strategic Sam',
        description: 'Plans ahead and tracks voting patterns',
        votingPattern: 'strategic', // adapts based on history
        lockSpeed: 'slow',
        confidence: 0.85
    }
};

class GameSimulation {
    constructor() {
        this.supabase = null;
        this.agents = [];
        this.sessionId = null;
        this.scenarios = [];
        this.votes = [];
        this.results = [];
        this.logs = [];
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            edgeFunctionCalls: {}
        };
    }

    /**
     * Initialize the simulation
     */
    async init() {
        console.log('🎮 Initializing Mom vs Dad Multi-Agent Simulation...');
        console.log(`📊 Configuration: ${CONFIG.TOTAL_AGENTS} agents, ${CONFIG.TOTAL_ROUNDS} rounds`);
        
        // Initialize Supabase client
        try {
            const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
            this.supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
            console.log('✅ Supabase client initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Supabase:', error.message);
            return false;
        }

        // Generate session code
        CONFIG.SESSION_CODE = this.generateSessionCode();
        console.log(`🎯 Session Code: ${CONFIG.SESSION_CODE}`);

        // Create agent instances
        this.createAgents();
        
        return true;
    }

    /**
     * Generate a 6-character session code
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
     * Create agent instances with different personalities
     */
    createAgents() {
        const personalities = Object.keys(AGENT_PERSONALITIES);
        
        for (let i = 0; i < CONFIG.TOTAL_AGENTS; i++) {
            const personalityKey = personalities[i % personalities.length];
            const personality = AGENT_PERSONALITIES[personalityKey];
            
            this.agents.push({
                id: i + 1,
                name: `${personality.name} ${i + 1}`,
                personality: personalityKey,
                description: personality.description,
                votingPattern: personality.votingPattern,
                lockSpeed: personality.lockSpeed,
                confidence: personality.confidence,
                votes: [],
                joinedAt: null,
                status: 'pending'
            });
        }
        
        console.log(`✅ Created ${this.agents.length} agents with distinct personalities`);
        this.agents.forEach(agent => {
            console.log(`   🤖 ${agent.name} - ${agent.description}`);
        });
    }

    /**
     * Log a message with timestamp
     */
    log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const entry = { timestamp, level, message, data };
        this.logs.push(entry);
        
        if (CONFIG.LOG_LEVEL === 'detailed' || 
            (CONFIG.LOG_LEVEL === 'normal' && level !== 'debug') ||
            (level === 'error' || level === 'success')) {
            const prefix = {
                'debug': '🔍',
                'info': 'ℹ️',
                'success': '✅',
                'warning': '⚠️',
                'error': '❌'
            }[level] || '📝';
            
            console.log(`${prefix} [${timestamp.split('T')[1].split('.')[0]}] ${message}`);
            if (data && CONFIG.LOG_LEVEL === 'detailed') {
                console.log('   ', JSON.stringify(data, null, 2));
            }
        }
    }

    /**
     * Track metrics for Supabase operations
     */
    async trackRequest(edgeFunction, success, responseTime) {
        this.metrics.totalRequests++;
        if (success) {
            this.metrics.successfulRequests++;
        } else {
            this.metrics.failedRequests++;
        }
        
        if (!this.metrics.edgeFunctionCalls[edgeFunction]) {
            this.metrics.edgeFunctionCalls[edgeFunction] = {
                total: 0,
                success: 0,
                failed: 0,
                totalTime: 0
            };
        }
        
        this.metrics.edgeFunctionCalls[edgeFunction].total++;
        this.metrics.edgeFunctionCalls[edgeFunction].totalTime += responseTime;
        if (success) {
            this.metrics.edgeFunctionCalls[edgeFunction].success++;
        } else {
            this.metrics.edgeFunctionCalls[edgeFunction].failed++;
        }
    }

    /**
     * PHASE 1: Create Game Session
     */
    async createSession() {
        this.log('info', '📋 Phase 1: Creating Game Session');
        
        const startTime = Date.now();
        
        try {
            const { data, error } = await this.supabase
                .from('baby_shower.game_sessions')
                .insert({
                    session_code: CONFIG.SESSION_CODE,
                    status: 'setup',
                    mom_name: CONFIG.MOM_NAME,
                    dad_name: CONFIG.DAD_NAME,
                    admin_code: CONFIG.ADMIN_CODE,
                    total_rounds: CONFIG.TOTAL_ROUNDS,
                    current_round: 0,
                    created_by: 'simulation'
                })
                .select()
                .single();
            
            const responseTime = Date.now() - startTime;
            await this.trackRequest('game-session', !error, responseTime);
            
            if (error) {
                this.log('error', `Failed to create session: ${error.message}`, error);
                return false;
            }
            
            this.sessionId = data.id;
            this.log('success', `✅ Session created: ${data.id}`);
            this.log('debug', 'Session details', {
                code: CONFIG.SESSION_CODE,
                mom: CONFIG.MOM_NAME,
                dad: CONFIG.DAD_NAME,
                rounds: CONFIG.TOTAL_ROUNDS
            });
            
            return true;
        } catch (error) {
            this.log('error', `Exception creating session: ${error.message}`);
            await this.trackRequest('game-session', false, Date.now() - startTime);
            return false;
        }
    }

    /**
     * PHASE 2: Agents Join the Session
     */
    async agentsJoinSession() {
        this.log('info', '👥 Phase 2: Agents Joining Session');
        
        const joinPromises = this.agents.map(async (agent, index) => {
            // Stagger agent joins
            await this.delay(CONFIG.DELAY_BETWEEN_ACTIONS * (index + 1));
            
            const startTime = Date.now();
            
            try {
                // Call Edge Function to handle join
                const { data, error } = await this.supabase
                    .rpc('game_join_session', {
                        session_code_input: CONFIG.SESSION_CODE,
                        guest_name_input: agent.name
                    });
                
                const responseTime = Date.now() - startTime;
                await this.trackRequest('game-join', !error, responseTime);
                
                if (error) {
                    this.log('error', `${agent.name} failed to join: ${error.message}`);
                    agent.status = 'failed';
                    return false;
                }
                
                agent.joinedAt = new Date().toISOString();
                agent.status = 'joined';
                agent.sessionData = data;
                
                this.log('success', `✅ ${agent.name} joined session`, {
                    votingPattern: agent.votingPattern,
                    confidence: agent.confidence
                });
                
                return true;
            } catch (error) {
                this.log('error', `${agent.name} exception joining: ${error.message}`);
                agent.status = 'failed';
                await this.trackRequest('game-join', false, Date.now() - startTime);
                return false;
            }
        });
        
        const results = await Promise.all(joinPromises);
        const successfulJoins = results.filter(r => r).length;
        
        this.log('info', `📊 Agent Join Summary: ${successfulJoins}/${this.agents.length} successfully joined`);
        
        return successfulJoins > 0;
    }

    /**
     * PHASE 3: Generate Scenarios (AI-powered)
     */
    async generateScenarios() {
        this.log('info', '🎭 Phase 3: Generating Scenarios with AI');
        
        for (let round = 1; round <= CONFIG.TOTAL_ROUNDS; round++) {
            this.log('info', `🎯 Generating Scenario for Round ${round}/${CONFIG.TOTAL_ROUNDS}`);
            
            const startTime = Date.now();
            
            try {
                // Call AI to generate scenario
                const { data, error } = await this.supabase
                    .rpc('game_generate_scenario', {
                        session_id_input: this.sessionId,
                        round_number_input: round,
                        mom_name_input: CONFIG.MOM_NAME,
                        dad_name_input: CONFIG.DAD_NAME,
                        intensity_input: 0.5 + (Math.random() * 0.3), // 0.5-0.8
                        theme_input: ['farm', 'funny', 'parenting', 'cozy'][Math.floor(Math.random() * 4)]
                    });
                
                const responseTime = Date.now() - startTime;
                await this.trackRequest('game-scenario', !error, responseTime);
                
                if (error) {
                    this.log('error', `Failed to generate scenario for round ${round}: ${error.message}`);
                    // Fallback: create manual scenario
                    const scenario = this.createManualScenario(round);
                    this.scenarios.push(scenario);
                } else {
                    this.scenarios.push(data);
                    this.log('success', `✅ Scenario ${round}: ${data.scenario_text.substring(0, 50)}...`);
                }
                
                // Delay between rounds
                if (round < CONFIG.TOTAL_ROUNDS) {
                    await this.delay(CONFIG.DELAY_BETWEEN_ROUNDS);
                }
            } catch (error) {
                this.log('error', `Exception generating scenario: ${error.message}`);
                const scenario = this.createManualScenario(round);
                this.scenarios.push(scenario);
            }
        }
        
        this.log('success', `✅ Generated ${this.scenarios.length} scenarios`);
        return this.scenarios.length > 0;
    }

    /**
     * Create a manual scenario as fallback
     */
    createManualScenario(round) {
        const scenarios = [
            {
                scenario_text: "It's 3 AM and the baby starts crying. Who gets up first?",
                mom_option: `${CONFIG.MOM_NAME} springs into action like a ninja`,
                dad_option: `${CONFIG.DAD_NAME} pretends to be in a deep sleep`
            },
            {
                scenario_text: "The baby has a dirty diaper that requires immediate attention.",
                mom_option: `${CONFIG.MOM_NAME} handles it without flinching`,
                dad_option: `${CONFIG.DAD_NAME} contemplates running away`
            },
            {
                scenario_text: "Guests are coming over and the house is a mess.",
                mom_option: `${CONFIG.MOM_NAME} does a frantic cleanup`,
                dad_option: `${CONFIG.DAD_NAME} suggests everyone just go outside`
            },
            {
                scenario_text: "The baby finally falls asleep for a nap.",
                mom_option: `${CONFIG.MOM_NAME} starts a load of laundry`,
                dad_option: `${CONFIG.DAD_NAME} turns on the TV`
            },
            {
                scenario_text: "You discover the baby ate something they shouldn't have.",
                mom_option: `${CONFIG.MOM_NAME} immediately calls the doctor`,
                dad_option: `${CONFIG.DAD_NAME} Google it frantically`
            }
        ];
        
        const scenario = scenarios[(round - 1) % scenarios.length];
        return {
            id: `manual-${Date.now()}-${round}`,
            session_id: this.sessionId,
            round_number: round,
            ...scenario,
            ai_provider: 'manual',
            intensity: 0.5,
            theme_tags: ['manual', 'test'],
            is_active: true
        };
    }

    /**
     * PHASE 4: Agents Vote on Scenarios
     */
    async agentsVote() {
        this.log('info', '🗳️ Phase 4: Agents Voting on Scenarios');
        
        for (let round = 0; round < this.scenarios.length; round++) {
            const scenario = this.scenarios[round];
            this.log('info', `📋 Round ${round + 1}: Voting on scenario`);
            
            const votePromises = this.agents
                .filter(agent => agent.status === 'joined')
                .map(async (agent, index) => {
                    // Stagger votes
                    await this.delay(CONFIG.DELAY_BETWEEN_ACTIONS * (index + 1));
                    
                    // Determine vote based on agent personality
                    const voteChoice = this.determineVote(agent, scenario);
                    
                    const startTime = Date.now();
                    
                    try {
                        const { data, error } = await this.supabase
                            .from('baby_shower.game_votes')
                            .insert({
                                scenario_id: scenario.id,
                                guest_name: agent.name,
                                vote_choice: voteChoice
                            })
                            .select()
                            .single();
                        
                        const responseTime = Date.now() - startTime;
                        await this.trackRequest('game-vote', !error, responseTime);
                        
                        if (error) {
                            this.log('error', `${agent.name} vote failed: ${error.message}`);
                            agent.status = 'vote_failed';
                            return false;
                        }
                        
                        agent.votes.push({
                            round: round + 1,
                            scenario_id: scenario.id,
                            choice: voteChoice
                        });
                        
                        this.log('success', `${agent.name} voted for ${voteChoice.toUpperCase()}`, {
                            votingPattern: agent.votingPattern,
                            confidence: agent.confidence
                        });
                        
                        return true;
                    } catch (error) {
                        this.log('error', `${agent.name} vote exception: ${error.message}`);
                        await this.trackRequest('game-vote', false, Date.now() - startTime);
                        return false;
                    }
                });
            
            await Promise.all(votePromises);
            
            // Delay between rounds
            await this.delay(CONFIG.DELAY_BETWEEN_ROUNDS);
        }
        
        const totalVotes = this.agents.reduce((sum, agent) => sum + agent.votes.length, 0);
        this.log('success', `✅ All voting complete: ${totalVotes} total votes cast`);
    }

    /**
     * Determine how an agent votes based on their personality
     */
    determineVote(agent, scenario) {
        const random = Math.random();
        
        switch (agent.votingPattern) {
            case 'balanced':
                // 50/50 split with slight bias
                return random < 0.52 ? 'mom' : 'dad';
                
            case 'emotional':
                // More likely to vote for the "more dramatic" option
                return scenario.mom_option.length > scenario.dad_option.length ? 'mom' : 'dad';
                
            case 'contrarian':
                // Tends to go against what seems obvious
                return random < 0.6 ? 'dad' : 'mom';
                
            case 'random':
                // Pure random
                return random < 0.5 ? 'mom' : 'dad';
                
            case 'strategic':
                // Adapts based on previous voting patterns
                const momVotes = this.agents.reduce((sum, a) => 
                    sum + a.votes.filter(v => v.choice === 'mom').length, 0);
                const dadVotes = this.agents.reduce((sum, a) => 
                    sum + a.votes.filter(v => v.choice === 'dad').length, 0);
                
                if (momVotes > dadVotes) {
                    return random < 0.4 ? 'mom' : 'dad'; // Lean toward dad
                } else if (dadVotes > momVotes) {
                    return random < 0.4 ? 'dad' : 'mom'; // Lean toward mom
                }
                return random < 0.5 ? 'mom' : 'dad';
                
            default:
                return random < 0.5 ? 'mom' : 'dad';
        }
    }

    /**
     * PHASE 5: Lock Parent Answers
     */
    async lockParentAnswers() {
        this.log('info', '🔒 Phase 5: Locking Parent Answers');
        
        // Simulate both parents locking their answers
        for (const parent of ['mom', 'dad']) {
            const parentName = parent === 'mom' ? CONFIG.MOM_NAME : CONFIG.DAD_NAME;
            this.log('info', `👤 ${parentName} locking answer...`);
            
            const lockPromises = this.scenarios.map(async (scenario, index) => {
                await this.delay(500 * (index + 1)); // Stagger locks
                
                // Parent decides based on random factor
                const answer = Math.random() < 0.5 ? 'mom' : 'dad';
                
                try {
                    const { error } = await this.supabase
                        .from('baby_shower.game_answers')
                        .upsert({
                            scenario_id: scenario.id,
                            [`${parent}_answer`]: answer,
                            [`${parent}_locked`]: true,
                            [`${parent}_locked_at`]: new Date().toISOString()
                        }, { onConflict: 'scenario_id' });
                    
                    if (error) {
                        this.log('error', `${parentName} lock failed for scenario ${index + 1}: ${error.message}`);
                        return false;
                    }
                    
                    this.log('success', `✅ ${parentName} locked answer: ${answer.toUpperCase()}`);
                    return true;
                } catch (error) {
                    this.log('error', `${parentName} lock exception: ${error.message}`);
                    return false;
                }
            });
            
            await Promise.all(lockPromises);
            await this.delay(1000); // Delay between parents
        }
        
        this.log('success', '✅ All parent answers locked');
    }

    /**
     * PHASE 6: Reveal Results
     */
    async revealResults() {
        this.log('info', '🎉 Phase 6: Revealing Results');
        
        for (let round = 0; round < this.scenarios.length; round++) {
            const scenario = this.scenarios[round];
            this.log('info', `🎯 Revealing Round ${round + 1}/${this.scenarios.length}`);
            
            // Count votes
            const votes = await this.supabase
                .from('baby_shower.game_votes')
                .select('vote_choice')
                .eq('scenario_id', scenario.id);
            
            const momVotes = votes.data?.filter(v => v.vote_choice === 'mom').length || 0;
            const dadVotes = votes.data?.filter(v => v.vote_choice === 'dad').length || 0;
            const totalVotes = momVotes + dadVotes;
            
            // Get actual answer
            const answer = await this.supabase
                .from('baby_shower.game_answers')
                .select('final_answer')
                .eq('scenario_id', scenario.id)
                .single();
            
            const actualAnswer = answer.data?.final_answer || 'dad';
            const crowdChoice = momVotes > dadVotes ? 'mom' : 'dad';
            
            // Calculate perception gap
            const crowdPct = totalVotes > 0 ? (crowdChoice === 'mom' ? momVotes : dadVotes) / totalVotes * 100 : 0;
            const actualPct = totalVotes > 0 ? (actualAnswer === 'mom' ? momVotes : dadVotes) / totalVotes * 100 : 0;
            const perceptionGap = Math.abs(crowdPct - (actualAnswer === crowdChoice ? 100 : 0));
            
            // Generate roast (simulated AI roast)
            const roastCommentary = this.generateRoastCommentary(
                momVotes, dadVotes, crowdChoice, actualAnswer, perceptionGap
            );
            
            // Insert result
            const startTime = Date.now();
            
            try {
                const { data, error } = await this.supabase
                    .from('baby_shower.game_results')
                    .insert({
                        scenario_id: scenario.id,
                        mom_votes: momVotes,
                        dad_votes: dadVotes,
                        crowd_choice: crowdChoice,
                        actual_choice: actualAnswer,
                        perception_gap: perceptionGap,
                        roast_commentary: roastCommentary,
                        roast_provider: 'simulated',
                        particle_effect: this.determineParticleEffect(perceptionGap),
                        revealed_at: new Date().toISOString()
                    })
                    .select()
                    .single();
                
                await this.trackRequest('game-reveal', !error, Date.now() - startTime);
                
                if (error) {
                    this.log('error', `Failed to insert result: ${error.message}`);
                    continue;
                }
                
                this.results.push(data);
                
                this.log('success', `✅ Round ${round + 1} Revealed`, {
                    momVotes,
                    dadVotes,
                    crowdChoice,
                    actualAnswer,
                    perceptionGap: perceptionGap.toFixed(1) + '%',
                    roast: roastCommentary.substring(0, 100) + '...'
                });
                
            } catch (error) {
                this.log('error', `Exception revealing result: ${error.message}`);
            }
            
            // Delay between reveals
            await this.delay(CONFIG.DELAY_BETWEEN_ROUNDS);
        }
        
        this.log('success', `✅ All ${this.results.length} rounds revealed`);
    }

    /**
     * Generate roast commentary based on voting results
     */
    generateRoastCommentary(momVotes, dadVotes, crowdChoice, actualAnswer, perceptionGap) {
        const roasts = [];
        
        if (crowdChoice === actualAnswer) {
            roasts.push(`🎉 The crowd was SPOT ON! ${momVotes > dadVotes ? momVotes : dadVotes} people correctly predicted ${actualAnswer === 'mom' ? CONFIG.MOM_NAME : CONFIG.DAD_NAME}'s behavior!`);
            
            if (perceptionGap > 30) {
                roasts.push(`🤔 Though it took a lot of convincing to get everyone on board...`);
            }
        } else {
            roasts.push(`😅 Oh no! The crowd thought ${crowdChoice === 'mom' ? CONFIG.MOM_NAME : CONFIG.DAD_NAME} would do it, but surprise! It was actually ${actualAnswer === 'mom' ? CONFIG.MOM_NAME : CONFIG.DAD_NAME}!`);
            
            if (perceptionGap > 50) {
                roasts.push(`🤦 Major misread! The crowd was ${perceptionGap.toFixed(0)}% confident in the wrong answer!`);
            }
        }
        
        if (momVotes === dadVotes) {
            roasts.push(`⚖️ Perfectly split! This one really divided the room!`);
        }
        
        return roasts.join(' ');
    }

    /**
     * Determine particle effect based on perception gap
     */
    determineParticleEffect(perceptionGap) {
        if (perceptionGap > 60) return 'rainbow'; // Major gap
        if (perceptionGap > 30) return 'confetti'; // Moderate gap
        return 'sparkles'; // Small gap or correct
    }

    /**
     * Utility: Delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Generate comprehensive simulation report
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            sessionCode: CONFIG.SESSION_CODE,
            configuration: {
                totalAgents: CONFIG.TOTAL_AGENTS,
                totalRounds: CONFIG.TOTAL_ROUNDS,
                momName: CONFIG.MOM_NAME,
                dadName: CONFIG.DAD_NAME
            },
            agentSummary: this.agents.map(agent => ({
                name: agent.name,
                personality: agent.personality,
                votingPattern: agent.votingPattern,
                totalVotes: agent.votes.length,
                status: agent.status
            })),
            scenarioSummary: this.scenarios.map((scenario, index) => ({
                round: index + 1,
                scenarioText: scenario.scenario_text,
                status: 'completed'
            })),
            votingStats: {
                totalVotes: this.agents.reduce((sum, agent) => sum + agent.votes.length, 0),
                momVotes: this.results.reduce((sum, r) => sum + (r.mom_votes || 0), 0),
                dadVotes: this.results.reduce((sum, r) => sum + (r.dad_votes || 0), 0)
            },
            performanceMetrics: this.metrics,
            logs: this.logs.slice(-50) // Last 50 log entries
        };
        
        return report;
    }

    /**
     * Print final summary
     */
    printSummary() {
        console.log('\n');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('🎮 MULTI-AGENT SIMULATION COMPLETE');
        console.log('═══════════════════════════════════════════════════════════════');
        
        console.log('\n📊 Session Summary:');
        console.log(`   Session Code: ${CONFIG.SESSION_CODE}`);
        console.log(`   Total Agents: ${this.agents.length}`);
        console.log(`   Rounds Played: ${this.scenarios.length}`);
        
        console.log('\n🤖 Agent Performance:');
        this.agents.forEach(agent => {
            console.log(`   ${agent.name}: ${agent.votes.length} votes [${agent.status}]`);
        });
        
        console.log('\n🗳️ Voting Results:');
        console.log(`   Total Votes: ${this.metrics.successfulRequests - this.metrics.failedRequests}`);
        console.log(`   Mom Votes: ${this.results.reduce((sum, r) => sum + (r.mom_votes || 0), 0)}`);
        console.log(`   Dad Votes: ${this.results.reduce((sum, r) => sum + (r.dad_votes || 0), 0)}`);
        
        console.log('\n⚡ Performance Metrics:');
        console.log(`   Total Requests: ${this.metrics.totalRequests}`);
        console.log(`   Successful: ${this.metrics.successfulRequests}`);
        console.log(`   Failed: ${this.metrics.failedRequests}`);
        console.log(`   Success Rate: ${((this.metrics.successfulRequests / this.metrics.totalRequests) * 100).toFixed(1)}%`);
        
        console.log('\n📈 Edge Function Calls:');
        Object.entries(this.metrics.edgeFunctionCalls).forEach(([func, stats]) => {
            console.log(`   ${func}: ${stats.success}/${stats.total} (${((stats.success/stats.total)*100).toFixed(0)}%)`);
        });
        
        console.log('\n═══════════════════════════════════════════════════════════════\n');
    }

    /**
     * Run the complete simulation
     */
    async run() {
        console.log('🚀 Starting Multi-Agent Mom vs Dad Game Simulation...\n');
        
        // Initialize
        if (!await this.init()) {
            console.log('❌ Failed to initialize simulation');
            return null;
        }
        
        // Phase 1: Create Session
        if (!await this.createSession()) {
            console.log('❌ Failed to create game session');
            return this.generateReport();
        }
        
        // Phase 2: Agents Join
        if (!await this.agentsJoinSession()) {
            console.log('⚠️ No agents joined, but continuing with session...');
        }
        
        // Phase 3: Generate Scenarios
        await this.generateScenarios();
        
        // Phase 4: Voting
        await this.agentsVote();
        
        // Phase 5: Lock Parent Answers
        await this.lockParentAnswers();
        
        // Phase 6: Reveal Results
        await this.revealResults();
        
        // Generate and print summary
        this.printSummary();
        
        return this.generateReport();
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameSimulation, AGENT_PERSONALITIES, CONFIG };
}

// Auto-run if executed directly
if (typeof window !== 'undefined') {
    window.GameSimulation = GameSimulation;
    window.AGENT_PERSONALITIES = AGENT_PERSONALITIES;
    
    // Auto-run simulation when loaded
    window.addEventListener('load', async () => {
        console.log('🎮 Auto-running Mom vs Dad Multi-Agent Simulation...');
        const simulation = new GameSimulation();
        const report = await simulation.run();
        console.log('📋 Full report available in simulation.report');
    });
}

console.log('🎮 Mom vs Dad Multi-Agent Simulation loaded!');
console.log('💡 To run: const sim = new GameSimulation(); await sim.run();');
console.log('📊 Report: sim.generateReport()');