/**
 * Baby Shower Mom vs Dad Game - Complete Simulation Suite
 * 
 * This script orchestrates the multi-agent simulation with real-time monitoring
 * to demonstrate how the game system operates under load.
 * 
 * Usage:
 *   node scripts/run-simulation.js
 *   
 * Or in browser:
 *   <script src="scripts/run-simulation.js"></script>
 */

const CONFIG = {
    // Supabase Configuration (update these)
    SUPABASE_URL: 'https://bkszmvfsfgvdwzacgmfz.supabase.co',
    SUPABASE_ANON_KEY: 'your-anon-key-here',
    SUPABASE_SERVICE_KEY: 'your-service-key-here',
    
    // Simulation Configuration
    ENABLE_MONITORING: true,
    MONITOR_DURATION: 30000, // 30 seconds of monitoring
    DELAY_BETWEEN_ACTIONS: 500,
    
    // Output Configuration
    GENERATE_REPORT: true,
    EXPORT_LOGS: true
};

class SimulationSuite {
    constructor() {
        this.simulation = null;
        this.monitor = null;
        this.report = null;
    }

    /**
     * Initialize all components
     */
    async init() {
        console.log('🚀 Initializing Simulation Suite...\n');
        
        // Initialize simulation
        try {
            const { GameSimulation } = await import('./simulate-game.js');
            this.simulation = new GameSimulation();
            await this.simulation.init();
            console.log('✅ Simulation initialized');
        } catch (error) {
            console.error('❌ Failed to initialize simulation:', error.message);
            return false;
        }
        
        // Initialize monitoring
        if (CONFIG.ENABLE_MONITORING) {
            try {
                const { SupabaseMonitor } = await import('./monitor-game.js');
                this.monitor = new SupabaseMonitor();
                await this.monitor.init();
                console.log('✅ Monitor initialized');
            } catch (error) {
                console.warn('⚠️  Monitor initialization failed (continuing without monitoring):', error.message);
                this.monitor = null;
            }
        }
        
        return true;
    }

    /**
     * Run the complete suite
     */
    async run() {
        console.log('\n' + '='.repeat(70));
        console.log('🎮 MOM VS DAD GAME - MULTI-AGENT SIMULATION SUITE');
        console.log('='.repeat(70) + '\n');
        
        // Start monitoring (if enabled)
        if (this.monitor) {
            console.log('📊 Starting real-time monitoring...');
            this.monitor.start();
            
            // Run monitor for specified duration
            setTimeout(() => {
                if (this.monitor) {
                    this.monitor.displayDashboard();
                }
            }, CONFIG.MONITOR_DURATION);
        }
        
        // Run simulation
        console.log('🎮 Starting game simulation...\n');
        const startTime = Date.now();
        
        try {
            const report = await this.simulation.run();
            this.report = report;
            
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`\n⏱️  Simulation completed in ${duration}s\n`);
            
        } catch (error) {
            console.error('❌ Simulation failed:', error.message);
            this.report = { error: error.message };
        }
        
        // Stop monitoring
        if (this.monitor) {
            this.monitor.stop();
        }
        
        // Generate final report
        await this.generateFinalReport();
        
        return this.report;
    }

    /**
     * Generate comprehensive final report
     */
    async generateFinalReport() {
        console.log('\n' + '='.repeat(70));
        console.log('📋 FINAL SIMULATION REPORT');
        console.log('='.repeat(70) + '\n');
        
        // Simulation report
        if (this.simulation) {
            const simReport = this.simulation.generateReport();
            
            console.log('🎮 Simulation Results:');
            console.log(`   Session: ${simReport.sessionCode}`);
            console.log(`   Agents: ${simReport.configuration.totalAgents}`);
            console.log(`   Rounds: ${simReport.scenarioSummary.length}`);
            
            console.log('\n🤖 Agent Activity:');
            simReport.agentSummary.forEach(agent => {
                console.log(`   ${agent.name}: ${agent.totalVotes} votes [${agent.status}]`);
            });
            
            console.log('\n🗳️ Voting Statistics:');
            console.log(`   Total Votes: ${simReport.votingStats.totalVotes}`);
            console.log(`   Mom Votes: ${simReport.votingStats.momVotes}`);
            console.log(`   Dad Votes: ${simReport.votingStats.dadVotes}`);
            
            console.log('\n⚡ Performance:');
            console.log(`   Total Requests: ${simReport.performanceMetrics.totalRequests}`);
            console.log(`   Successful: ${simReport.performanceMetrics.successfulRequests}`);
            console.log(`   Failed: ${simReport.performanceMetrics.failedRequests}`);
            
            const successRate = simReport.performanceMetrics.totalRequests > 0
                ? ((simReport.performanceMetrics.successfulRequests / simReport.performanceMetrics.totalRequests) * 100).toFixed(1)
                : 0;
            console.log(`   Success Rate: ${successRate}%`);
        }
        
        // Monitor report
        if (this.monitor) {
            const monitorReport = this.monitor.generateReport();
            
            console.log('\n📊 Monitoring Summary:');
            console.log(`   Uptime: ${monitorReport.dashboard.uptime}`);
            console.log(`   Total Requests: ${monitorReport.dashboard.metrics.totalRequests}`);
            console.log(`   Success Rate: ${monitorReport.dashboard.metrics.successRate}`);
            
            if (monitorReport.dashboard.recentAlerts.length > 0) {
                console.log('\n🚨 Alerts:');
                monitorReport.dashboard.recentAlerts.forEach(alert => {
                    console.log(`   ${alert.level === 'error' ? '❌' : '⚠️'} ${alert.message}`);
                });
            }
        }
        
        // Export logs
        if (CONFIG.EXPORT_LOGS && this.monitor) {
            const logs = this.monitor.exportLogs('json');
            const fs = await import('fs');
            const filename = `simulation-logs-${Date.now()}.json`;
            fs.writeFileSync(filename, logs);
            console.log(`\n💾 Logs exported to: ${filename}`);
        }
        
        console.log('\n' + '='.repeat(70) + '\n');
    }

    /**
     * Run quick test (1 agent, 1 round)
     */
    async quickTest() {
        console.log('🧪 Running Quick Test...\n');
        
        // Temporarily override config
        const originalConfig = { ...CONFIG };
        CONFIG.TOTAL_AGENTS = 1;
        CONFIG.TOTAL_ROUNDS = 1;
        CONFIG.ENABLE_MONITORING = false;
        
        try {
            await this.run();
        } finally {
            // Restore config
            Object.assign(CONFIG, originalConfig);
        }
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SimulationSuite, CONFIG };
}

if (typeof window !== 'undefined') {
    window.SimulationSuite = SimulationSuite;
    window.CONFIG = CONFIG;
}

// Auto-run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
    (async () => {
        const suite = new SimulationSuite();
        
        // Check for command line arguments
        const args = process.argv.slice(2);
        
        if (args.includes('--quick') || args.includes('-q')) {
            await suite.quickTest();
        } else {
            await suite.run();
        }
        
        process.exit(0);
    })();
}

console.log('🎮 Simulation Suite loaded!');
console.log('💡 Usage: node scripts/run-simulation.js');
console.log('💡 Quick test: node scripts/run-simulation.js --quick');
console.log('💡 In browser: SimulationSuite.run()');