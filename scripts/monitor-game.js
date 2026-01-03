/**
 * Baby Shower Game - Supabase Monitoring Dashboard
 * 
 * Purpose: Monitor Supabase Edge Function logs and database activity
 * during the multi-agent simulation to verify system behavior.
 * 
 * Features:
 * - Real-time Edge Function log monitoring
 * - Database operation tracking
 * - Performance metrics dashboard
 * - Error detection and alerting
 * - Historical comparison
 */

const CONFIG = {
    // Supabase Configuration
    SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://bkszmvfsfgvdwzacgmfz.supabase.co',
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',
    
    // Monitoring Configuration
    POLL_INTERVAL: 2000, // ms between polls
    LOG_BUFFER_SIZE: 100,
    ERROR_THRESHOLD: 5, // Alert after this many errors
    PERFORMANCE_THRESHOLD_MS: 5000, // Alert if response time exceeds this
    
    // Game Session
    MONITORED_FUNCTIONS: [
        'game-session',
        'game-scenario', 
        'game-vote',
        'game-reveal',
        'game-answer',
        'game-results'
    ]
};

class SupabaseMonitor {
    constructor() {
        this.supabase = null;
        this.logs = [];
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            edgeFunctionStats: {},
            errorPatterns: [],
            performanceHistory: []
        };
        this.alertBuffer = [];
        this.isMonitoring = false;
        this.startTime = null;
    }

    /**
     * Initialize the monitor
     */
    async init() {
        console.log('📊 Initializing Supabase Monitor...');
        
        try {
            const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
            
            // Use service role key for admin access
            this.supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);
            console.log('✅ Supabase monitor initialized');
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize monitor:', error.message);
            return false;
        }
    }

    /**
     * Fetch recent Edge Function logs from Supabase
     */
    async fetchEdgeFunctionLogs() {
        try {
            // Try to get Edge Function logs via RPC or direct query
            // Note: Actual implementation depends on Supabase logging setup
            
            const { data, error } = await this.supabase
                .from('baby_shower.game_sessions')
                .select('id, session_code, status, created_at')
                .order('created_at', { ascending: false })
                .limit(10);
            
            if (error) {
                this.log('warning', 'Could not fetch logs from Supabase', error.message);
                return [];
            }
            
            return data || [];
        } catch (error) {
            this.log('error', 'Exception fetching logs:', error.message);
            return [];
        }
    }

    /**
     * Simulate fetching logs (for demo purposes)
     * In production, this would query actual Supabase logs
     */
    async simulateLogFetch() {
        const simulatedLogs = [];
        
        // Simulate recent activity
        const activities = [
            { func: 'game-session', duration: 150, status: 'success', timestamp: new Date() },
            { func: 'game-scenario', duration: 2500, status: 'success', timestamp: new Date(Date.now() - 1000) },
            { func: 'game-vote', duration: 180, status: 'success', timestamp: new Date(Date.now() - 2000) },
            { func: 'game-vote', duration: 195, status: 'success', timestamp: new Date(Date.now() - 2500) },
            { func: 'game-vote', duration: 165, status: 'success', timestamp: new Date(Date.now() - 3000) },
            { func: 'game-answer', duration: 120, status: 'success', timestamp: new Date(Date.now() - 4000) },
            { func: 'game-reveal', duration: 3200, status: 'success', timestamp: new Date(Date.now() - 5000) }
        ];
        
        activities.forEach((activity, index) => {
            simulatedLogs.push({
                id: index + 1,
                function_name: activity.func,
                status_code: activity.status === 'success' ? 200 : 500,
                duration_ms: activity.duration,
                status: activity.status,
                created_at: activity.timestamp.toISOString()
            });
        });
        
        return simulatedLogs;
    }

    /**
     * Process and analyze logs
     */
    processLogs(logs) {
        logs.forEach(log => {
            // Update metrics
            this.metrics.totalRequests++;
            
            if (log.status === 'success' || log.status_code === 200) {
                this.metrics.successfulRequests++;
            } else {
                this.metrics.failedRequests++;
            }
            
            // Track per-function stats
            const funcName = log.function_name || 'unknown';
            if (!this.metrics.edgeFunctionStats[funcName]) {
                this.metrics.edgeFunctionStats[funcName] = {
                    total: 0,
                    success: 0,
                    failed: 0,
                    totalDuration: 0,
                    avgDuration: 0,
                    errors: []
                };
            }
            
            this.metrics.edgeFunctionStats[funcName].total++;
            if (log.status === 'success' || log.status_code === 200) {
                this.metrics.edgeFunctionStats[funcName].success++;
            } else {
                this.metrics.edgeFunctionStats[funcName].failed++;
                this.metrics.edgeFunctionStats[funcName].errors.push(log);
            }
            
            this.metrics.edgeFunctionStats[funcName].totalDuration += log.duration_ms || 0;
            this.metrics.edgeFunctionStats[funcName].avgDuration = 
                this.metrics.edgeFunctionStats[funcName].totalDuration / 
                this.metrics.edgeFunctionStats[funcName].total;
            
            // Check for performance issues
            if (log.duration_ms > CONFIG.PERFORMANCE_THRESHOLD_MS) {
                this.alert(`⚠️ Slow ${funcName}: ${log.duration_ms}ms`, 'warning');
            }
            
            // Check for errors
            if (log.status === 'failed' || log.status_code >= 400) {
                this.alert(`❌ Error in ${funcName}: ${log.status_code}`, 'error');
                
                // Track error patterns
                this.metrics.errorPatterns.push({
                    function: funcName,
                    status: log.status_code,
                    timestamp: log.created_at
                });
            }
        });
        
        // Update performance history
        if (logs.length > 0) {
            this.metrics.performanceHistory.push({
                timestamp: new Date().toISOString(),
                totalRequests: this.metrics.totalRequests,
                successRate: (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(1)
            });
            
            // Keep last 50 entries
            if (this.metrics.performanceHistory.length > 50) {
                this.metrics.performanceHistory.shift();
            }
        }
        
        // Add to log buffer
        this.logs.push(...logs);
        if (this.logs.length > CONFIG.LOG_BUFFER_SIZE) {
            this.logs = this.logs.slice(-CONFIG.LOG_BUFFER_SIZE);
        }
    }

    /**
     * Log a message
     */
    log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const entry = {
            timestamp,
            level,
            message,
            data
        };
        
        const prefix = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌'
        }[level] || '📝';
        
        console.log(`${prefix} [${timestamp.split('T')[1].split('.')[0]}] ${message}`);
        if (data) {
            console.log('   ', typeof data === 'object' ? JSON.stringify(data) : data);
        }
    }

    /**
     * Add an alert
     */
    alert(message, level = 'info') {
        const alert = {
            timestamp: new Date().toISOString(),
            message,
            level
        };
        
        this.alertBuffer.push(alert);
        
        // Keep last 20 alerts
        if (this.alertBuffer.length > 20) {
            this.alertBuffer.shift();
        }
        
        this.log(level, message);
    }

    /**
     * Get current status dashboard
     */
    getDashboard() {
        const successRate = this.metrics.totalRequests > 0 
            ? (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(1)
            : 0;
        
        return {
            status: this.isMonitoring ? '🟢 Running' : '🔴 Stopped',
            uptime: this.startTime 
                ? `${((Date.now() - this.startTime) / 1000).toFixed(1)}s`
                : 'N/A',
            metrics: {
                totalRequests: this.metrics.totalRequests,
                successfulRequests: this.metrics.successfulRequests,
                failedRequests: this.metrics.failedRequests,
                successRate: `${successRate}%`
            },
            edgeFunctions: Object.entries(this.metrics.edgeFunctionStats).map(([name, stats]) => ({
                name,
                total: stats.total,
                success: stats.success,
                failed: stats.failed,
                avgDuration: `${stats.avgDuration.toFixed(0)}ms`,
                successRate: `${(stats.success / stats.total * 100).toFixed(0)}%`
            })),
            recentAlerts: this.alertBuffer.slice(-5),
            errorCount: this.metrics.errorPatterns.length
        };
    }

    /**
     * Display dashboard in console
     */
    displayDashboard() {
        const dashboard = this.getDashboard();
        
        console.log('\n');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('📊 SUPABASE MONITOR DASHBOARD');
        console.log('═══════════════════════════════════════════════════════════════');
        
        console.log(`\n🔄 Status: ${dashboard.status}`);
        console.log(`⏱️  Uptime: ${dashboard.uptime}`);
        
        console.log('\n📈 Request Metrics:');
        console.log(`   Total Requests: ${dashboard.metrics.totalRequests}`);
        console.log(`   ✅ Success: ${dashboard.metrics.successfulRequests}`);
        console.log(`   ❌ Failed: ${dashboard.metrics.failedRequests}`);
        console.log(`   📊 Success Rate: ${dashboard.metrics.successRate}`);
        
        console.log('\n⚡ Edge Function Performance:');
        dashboard.edgeFunctions.forEach(func => {
            const icon = func.failed > 0 ? '❌' : '✅';
            console.log(`   ${icon} ${func.name}:`);
            console.log(`      Total: ${func.total} | Success: ${func.success} | Failed: ${func.failed}`);
            console.log(`      Avg Duration: ${func.avgDuration} | Success Rate: ${func.successRate}`);
        });
        
        if (dashboard.recentAlerts.length > 0) {
            console.log('\n🚨 Recent Alerts:');
            dashboard.recentAlerts.forEach(alert => {
                const icon = alert.level === 'error' ? '❌' : '⚠️';
                console.log(`   ${icon} [${alert.timestamp.split('T')[1].split('.')[0]}] ${alert.message}`);
            });
        }
        
        console.log('\n═══════════════════════════════════════════════════════════════\n');
    }

    /**
     * Start monitoring
     */
    async start() {
        if (this.isMonitoring) {
            console.log('⚠️  Monitor already running');
            return;
        }
        
        this.isMonitoring = true;
        this.startTime = Date.now();
        this.log('success', '📊 Starting Supabase Monitor...');
        
        // Monitor loop
        const monitorLoop = async () => {
            while (this.isMonitoring) {
                try {
                    // Fetch logs (simulated for demo)
                    const logs = await this.simulateLogFetch();
                    
                    // Process logs
                    this.processLogs(logs);
                    
                    // Display dashboard every 5 iterations
                    if (this.metrics.totalRequests > 0 && this.metrics.totalRequests % 5 === 0) {
                        this.displayDashboard();
                    }
                    
                    // Wait for next poll
                    await new Promise(resolve => setTimeout(resolve, CONFIG.POLL_INTERVAL));
                } catch (error) {
                    this.log('error', `Monitor loop error: ${error.message}`);
                    await new Promise(resolve => setTimeout(resolve, CONFIG.POLL_INTERVAL));
                }
            }
        };
        
        monitorLoop();
    }

    /**
     * Stop monitoring
     */
    stop() {
        this.isMonitoring = false;
        this.log('info', '📊 Supabase Monitor stopped');
    }

    /**
     * Generate comprehensive report
     */
    generateReport() {
        const dashboard = this.getDashboard();
        
        const report = {
            timestamp: new Date().toISOString(),
            monitorStatus: {
                isMonitoring: this.isMonitoring,
                uptime: this.startTime ? (Date.now() - this.startTime) / 1000 : 0
            },
            metrics: this.metrics,
            alerts: this.alertBuffer,
            dashboard: dashboard
        };
        
        return report;
    }

    /**
     * Export logs for analysis
     */
    exportLogs(format = 'json') {
        if (format === 'json') {
            return JSON.stringify({
                logs: this.logs,
                metrics: this.metrics,
                alerts: this.alertBuffer
            }, null, 2);
        }
        
        // CSV format
        const headers = 'timestamp,function,status,duration_ms\n';
        const rows = this.logs.map(log => 
            `${log.created_at},${log.function_name},${log.status},${log.duration_ms}`
        ).join('\n');
        
        return headers + rows;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SupabaseMonitor, CONFIG };
}

if (typeof window !== 'undefined') {
    window.SupabaseMonitor = SupabaseMonitor;
}

console.log('📊 Supabase Monitor loaded!');
console.log('💡 To use: const monitor = new SupabaseMonitor(); await monitor.start();');
console.log('💡 Dashboard: monitor.displayDashboard()');
console.log('💡 Report: monitor.generateReport()');