/**
 * Baby Shower App - Error Monitor
 * Comprehensive error logging and monitoring system
 * 
 * Features:
 * - Global error handler (window.onerror)
 * - Promise rejection handler (unhandledrejection)
 * - Fetch error interceptor
 * - Image error handler
 * - Performance observer for metrics
 * - Local storage for offline logs
 * - Log export capability
 * - Dashboard integration
 * 
 * @version 2.0.0
 * @author Baby Shower 2026 Team
 */

(function(global) {
    'use strict';

    console.log('[ErrorMonitor] loading...');

    // Configuration
    const CONFIG = {
        maxLogs: 1000,
        logRetentionHours: 168, // 7 days
        performanceSampleRate: 0.1, // 10% sample
        enableConsole: true,
        enableLocalStorage: true,
        enablePerformance: true,
        enableNetworkMonitoring: true,
        enableImageErrorTracking: true,
        errorCategories: {
            javascript: 'JavaScript Error',
            api_error: 'API Error',
            fetch_error: 'Fetch Error',
            image_error: 'Image Error',
            promise_rejection: 'Promise Rejection',
            supabase_error: 'Supabase Error',
            realtime_error: 'Realtime Error',
            game_error: 'Game Error',
            validation_error: 'Validation Error',
            performance_error: 'Performance Issue',
            network_error: 'Network Error'
        },
        severityLevels: {
            critical: 1,
            error: 2,
            warning: 3,
            info: 4,
            debug: 5
        }
    };

    // State
    let errorLogs = [];
    let performanceLogs = [];
    let networkLogs = [];
    let imageErrorLogs = [];
    let errorCount = 0;
    let warningCount = 0;
    let criticalCount = 0;
    let isInitialized = false;

    // Session tracking
    let sessionId = generateSessionId();
    let sessionStartTime = Date.now();

    /**
     * Generate unique session ID
     */
    function generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get current timestamp in ISO format
     */
    function getTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Get caller information from stack trace
     */
    function getCallerInfo() {
        try {
            const stack = new Error().stack;
            if (!stack) return { function: 'unknown', file: 'unknown', line: 'unknown' };

            const lines = stack.split('\n');
            // Skip first line (Error) and second line (getCallerInfo)
            const relevantLines = lines.slice(2, 5);
            
            for (const line of relevantLines) {
                // Match patterns like "at functionName (file:line:col)" or "at file:line:col"
                const match = line.match(/at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)/);
                if (match) {
                    const functionName = match[1] || 'anonymous';
                    const file = match[2].split('/').pop(); // Get just filename
                    const lineNum = match[3];
                    
                    // Skip internal error monitor functions
                    if (!functionName.includes('ErrorMonitor') && 
                        !functionName.includes('getCallerInfo')) {
                        return {
                            function: functionName,
                            file: file,
                            line: lineNum
                        };
                    }
                }
            }
        } catch (e) {
            // Ignore errors in caller info extraction
        }
        return { function: 'unknown', file: 'unknown', line: 'unknown' };
    }

    /**
     * Categorize error based on message and context
     */
    function categorizeError(error, context = {}) {
        const message = (error.message || error.toString() || '').toLowerCase();
        const category = context.category || 'javascript';

        // Check for specific error patterns
        if (message.includes('supabase')) {
            return 'supabase_error';
        }
        if (message.includes('fetch') || message.includes('network') || message.includes('Failed to fetch')) {
            return 'fetch_error';
        }
        if (message.includes('timeout') || message.includes('timed out')) {
            return 'network_error';
        }
        if (message.includes('realtime') || message.includes('websocket') || message.includes('subscription')) {
            return 'realtime_error';
        }
        if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
            return 'validation_error';
        }
        if (message.includes('game') || message.includes('mom-vs-dad') || message.includes('momvsdad')) {
            return 'game_error';
        }
        if (context.imageFailed) {
            return 'image_error';
        }

        return category;
    }

    /**
     * Determine severity level
     */
    function determineSeverity(error, category) {
        const message = (error.message || '').toLowerCase();
        
        // Critical errors
        if (category === 'supabase_error' || 
            message.includes('cannot read') ||
            message.includes('undefined is not') ||
            message.includes('null is not')) {
            return 'critical';
        }
        
        // API and network errors
        if (category === 'api_error' || category === 'fetch_error' || category === 'network_error') {
            return 'error';
        }
        
        // Performance issues
        if (category === 'performance_error') {
            return 'warning';
        }
        
        return 'error';
    }

    /**
     * Log error with full context
     */
    function logError(error, context = {}) {
        if (!CONFIG.enableConsole) return;

        const category = categorizeError(error, context);
        const severity = determineSeverity(error, category);
        const callerInfo = getCallerInfo();

        const logEntry = {
            id: generateLogId(),
            timestamp: getTimestamp(),
            sessionId: sessionId,
            type: 'error',
            category: category,
            severity: severity,
            message: error.message || error.toString(),
            stack: error.stack || null,
            caller: callerInfo,
            context: {
                url: window.location.href,
                userAgent: navigator.userAgent,
                viewport: `${window.innerWidth}x${window.innerHeight}`,
                ...context
            },
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // Add to logs
        errorLogs.unshift(logEntry);
        
        // Trim logs
        if (errorLogs.length > CONFIG.maxLogs) {
            errorLogs = errorLogs.slice(0, CONFIG.maxLogs);
        }

        // Update counters
        if (severity === 'critical') {
            criticalCount++;
        }
        errorCount++;

        // Save to localStorage
        if (CONFIG.enableLocalStorage) {
            saveLogsToStorage();
        }

        // Console output based on severity
        switch (severity) {
            case 'critical':
                console.error('[ErrorMonitor CRITICAL]', logEntry.message, logEntry);
                break;
            case 'error':
                console.error('[ErrorMonitor ERROR]', logEntry.message, logEntry);
                break;
            case 'warning':
                console.warn('[ErrorMonitor WARNING]', logEntry.message, logEntry);
                break;
            default:
                console.log('[ErrorMonitor INFO]', logEntry.message, logEntry);
        }

        return logEntry;
    }

    /**
     * Log warning
     */
    function logWarning(message, context = {}) {
        if (!CONFIG.enableConsole) return;

        const callerInfo = getCallerInfo();
        
        const logEntry = {
            id: generateLogId(),
            timestamp: getTimestamp(),
            sessionId: sessionId,
            type: 'warning',
            category: context.category || 'javascript',
            severity: 'warning',
            message: message,
            stack: null,
            caller: callerInfo,
            context: {
                url: window.location.href,
                userAgent: navigator.userAgent,
                viewport: `${window.innerWidth}x${window.innerHeight}`,
                ...context
            }
        };

        warningCount++;
        return logEntry;
    }

    /**
     * Log info message
     */
    function logInfo(message, context = {}) {
        if (!CONFIG.enableConsole || CONFIG.severityLevels.info > 4) return;

        const logEntry = {
            id: generateLogId(),
            timestamp: getTimestamp(),
            sessionId: sessionId,
            type: 'info',
            category: context.category || 'javascript',
            severity: 'info',
            message: message,
            context: {
                url: window.location.href,
                ...context
            }
        };

        return logEntry;
    }

    /**
     * Generate unique log ID
     */
    function generateLogId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    /**
     * Setup global error handlers
     */
    function setupGlobalErrorHandlers() {
        // Global error handler
        window.onerror = function(message, source, lineno, colno, error) {
            const context = {
                source: source,
                line: lineno,
                column: colno
            };
            logError(error || new Error(message), context);
            
            // Don't prevent default - let other handlers work
            return false;
        };

        // Handle unhandled promise rejections
        window.onunhandledrejection = function(event) {
            const error = event.reason;
            const context = {
                type: 'unhandledrejection',
                promise: event.promise ? event.promise.toString() : 'unknown'
            };
            
            if (error instanceof Error) {
                logError(error, context);
            } else {
                logError(new Error(String(error)), context);
            }
            
            event.preventDefault();
        };

        console.log('[ErrorMonitor] Global error handlers set up');
    }

    /**
     * Setup fetch interceptor for network monitoring
     */
    function setupFetchInterceptor() {
        if (!CONFIG.enableNetworkMonitoring) return;

        const originalFetch = window.fetch;
        
        window.fetch = function(...args) {
            const url = typeof args[0] === 'string' ? args[0] : args[0].url;
            const startTime = performance.now();
            const method = args[1]?.method || 'GET';

            // Sample monitoring (10% of requests)
            if (Math.random() > CONFIG.performanceSampleRate) {
                return originalFetch.apply(this, args);
            }

            return originalFetch.apply(this, args)
                .then(response => {
                    const duration = performance.now() - startTime;
                    const logEntry = {
                        id: generateLogId(),
                        timestamp: getTimestamp(),
                        sessionId: sessionId,
                        type: 'network',
                        url: url,
                        method: method,
                        status: response.status,
                        duration: Math.round(duration),
                        success: response.ok
                    };

                    // Log slow requests
                    if (duration > 5000) {
                        logEntry.severity = 'warning';
                        logEntry.performanceIssue = true;
                        logWarning(`Slow request: ${method} ${url} took ${Math.round(duration)}ms`, {
                            category: 'performance_error',
                            duration: duration,
                            url: url
                        });
                    }

                    networkLogs.unshift(logEntry);
                    trimLogs(networkLogs, 500);
                    saveLogsToStorage();

                    return response;
                })
                .catch(error => {
                    const duration = performance.now() - startTime;
                    const logEntry = {
                        id: generateLogId(),
                        timestamp: getTimestamp(),
                        sessionId: sessionId,
                        type: 'network',
                        url: url,
                        method: method,
                        duration: Math.round(duration),
                        error: error.message,
                        success: false
                    };

                    networkLogs.unshift(logEntry);
                    trimLogs(networkLogs, 500);
                    saveLogsToStorage();

                    logError(error, {
                        category: 'fetch_error',
                        url: url,
                        method: method,
                        duration: duration
                    });

                    throw error;
                });
        };

        console.log('[ErrorMonitor] Fetch interceptor set up');
    }

    /**
     * Setup image error handler
     */
    function setupImageErrorHandler() {
        if (!CONFIG.enableImageErrorTracking) return;

        document.addEventListener('error', function(event) {
            const target = event.target;
            
            // Only handle image errors
            if (target.tagName === 'IMG') {
                const imageEntry = {
                    id: generateLogId(),
                    timestamp: getTimestamp(),
                    sessionId: sessionId,
                    type: 'image_error',
                    src: target.src,
                    alt: target.alt || 'No alt text',
                    naturalWidth: target.naturalWidth,
                    naturalHeight: target.naturalHeight,
                    errorCount: getImageErrorCount(target.src) + 1
                };

                imageErrorLogs.unshift(imageEntry);
                trimLogs(imageErrorLogs, 100);
                saveLogsToStorage();

                logError(new Error(`Image failed to load: ${target.src}`), {
                    category: 'image_error',
                    imageFailed: true,
                    alt: target.alt,
                    src: target.src
                });
            }
        }, true); // Use capture phase to catch all image errors

        console.log('[ErrorMonitor] Image error handler set up');
    }

    /**
     * Get error count for specific image
     */
    function getImageErrorCount(src) {
        return imageErrorLogs.filter(log => log.src === src).length;
    }

    /**
     * Setup performance monitoring
     */
    function setupPerformanceMonitoring() {
        if (!CONFIG.enablePerformance || !window.PerformanceObserver) {
            console.warn('[ErrorMonitor] PerformanceObserver not supported');
            return;
        }

        // Observe long tasks
        try {
            const longTaskObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 100) { // Long task threshold
                        const perfEntry = {
                            id: generateLogId(),
                            timestamp: getTimestamp(),
                            sessionId: sessionId,
                            type: 'performance',
                            category: 'longtask',
                            duration: entry.duration,
                            startTime: entry.startTime,
                            entryType: entry.entryType
                        };

                        performanceLogs.unshift(perfEntry);
                        trimLogs(performanceLogs, 200);
                        saveLogsToStorage();

                        if (entry.duration > 1000) {
                            logWarning(`Long task detected: ${Math.round(entry.duration)}ms`, {
                                category: 'performance_error',
                                duration: entry.duration
                            });
                        }
                    }
                }
            });

            longTaskObserver.observe({ entryTypes: ['longtask'] });
        } catch (e) {
            // Long tasks not supported in all browsers
        }

        // Observe paint times (LCP, FCP)
        const paintObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                const perfEntry = {
                    id: generateLogId(),
                    timestamp: getTimestamp(),
                    sessionId: sessionId,
                    type: 'performance',
                    category: 'paint',
                    name: entry.name,
                    startTime: Math.round(entry.startTime),
                    duration: entry.duration || 0
                };

                performanceLogs.unshift(perfEntry);
                trimLogs(performanceLogs, 200);
                saveLogsToStorage();

                // Warn about slow paint times
                if (entry.name === 'largest-contentful-paint' && entry.startTime > 2500) {
                    logWarning(`Slow LCP: ${Math.round(entry.startTime)}ms`, {
                        category: 'performance_error',
                        lcp: entry.startTime
                    });
                }
            }
        });

        paintObserver.observe({ entryTypes: ['paint'] });

        // Observe memory usage if available
        if (performance.memory) {
            setInterval(() => {
                const memory = performance.memory;
                const perfEntry = {
                    id: generateLogId(),
                    timestamp: getTimestamp(),
                    sessionId: sessionId,
                    type: 'performance',
                    category: 'memory',
                    usedJSHeapSize: memory.usedJSHeapSize,
                    totalJSHeapSize: memory.totalJSHeapSize,
                    jsHeapSizeLimit: memory.jsHeapSizeLimit,
                    memoryUsagePercent: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
                };

                performanceLogs.unshift(perfEntry);
                trimLogs(performanceLogs, 200);
                saveLogsToStorage();

                // Warn about high memory usage
                if (perfEntry.memoryUsagePercent > 80) {
                    logWarning(`High memory usage: ${perfEntry.memoryUsagePercent}%`, {
                        category: 'performance_error',
                        memoryUsage: perfEntry.memoryUsagePercent
                    });
                }
            }, 30000); // Check every 30 seconds
        }

        console.log('[ErrorMonitor] Performance monitoring set up');
    }

    /**
     * Trim logs array to max size
     */
    function trimLogs(logs, maxSize) {
        if (logs.length > maxSize) {
            return logs.slice(0, maxSize);
        }
        return logs;
    }

    /**
     * Load logs from localStorage
     */
    function loadLogsFromStorage() {
        if (!CONFIG.enableLocalStorage) return;

        try {
            const storedLogs = localStorage.getItem('babyShowerErrorLogs');
            if (storedLogs) {
                const parsed = JSON.parse(storedLogs);
                errorLogs = parsed.errors || [];
                performanceLogs = parsed.performance || [];
                networkLogs = parsed.network || [];
                imageErrorLogs = parsed.imageErrors || [];
                errorCount = parsed.errorCount || 0;
                warningCount = parsed.warningCount || 0;
                criticalCount = parsed.criticalCount || 0;
                console.log('[ErrorMonitor] Loaded logs from storage');
            }
        } catch (e) {
            console.warn('[ErrorMonitor] Failed to load logs from storage:', e.message);
        }
    }

    /**
     * Save logs to localStorage
     */
    function saveLogsToStorage() {
        if (!CONFIG.enableLocalStorage) return;

        try {
            const storageData = {
                errors: errorLogs.slice(0, CONFIG.maxLogs),
                performance: performanceLogs.slice(0, 200),
                network: networkLogs.slice(0, 500),
                imageErrors: imageErrorLogs.slice(0, 100),
                errorCount: errorCount,
                warningCount: warningCount,
                criticalCount: criticalCount,
                lastUpdated: getTimestamp()
            };

            localStorage.setItem('babyShowerErrorLogs', JSON.stringify(storageData));
        } catch (e) {
            console.warn('[ErrorMonitor] Failed to save logs to storage:', e.message);
        }
    }

    /**
     * Cleanup old logs
     */
    function cleanupOldLogs() {
        const cutoffTime = Date.now() - (CONFIG.logRetentionHours * 60 * 60 * 1000);
        
        // Filter error logs
        errorLogs = errorLogs.filter(log => new Date(log.timestamp).getTime() > cutoffTime);
        
        // Filter performance logs
        performanceLogs = performanceLogs.filter(log => new Date(log.timestamp).getTime() > cutoffTime);
        
        // Filter network logs
        networkLogs = networkLogs.filter(log => new Date(log.timestamp).getTime() > cutoffTime);
        
        // Filter image error logs
        imageErrorLogs = imageErrorLogs.filter(log => new Date(log.timestamp).getTime() > cutoffTime);

        saveLogsToStorage();
        console.log('[ErrorMonitor] Old logs cleaned up');
    }

    /**
     * Get all logs
     */
    function getLogs(options = {}) {
        const { type = 'all', limit = 100, category = null, severity = null } = options;

        let logs = [];
        switch (type) {
            case 'errors':
                logs = [...errorLogs];
                break;
            case 'performance':
                logs = [...performanceLogs];
                break;
            case 'network':
                logs = [...networkLogs];
                break;
            case 'image':
                logs = [...imageErrorLogs];
                break;
            default:
                logs = [...errorLogs, ...performanceLogs, ...networkLogs];
        }

        // Apply filters
        if (category) {
            logs = logs.filter(log => log.category === category);
        }
        if (severity) {
            logs = logs.filter(log => log.severity === severity);
        }

        return logs.slice(0, limit);
    }

    /**
     * Get performance metrics
     */
    function getPerformance(options = {}) {
        const { limit = 50 } = options;
        return performanceLogs.slice(0, limit);
    }

    /**
     * Get dashboard data
     */
    function getDashboard() {
        const sessionDuration = Date.now() - sessionStartTime;
        
        // Calculate error rates
        const recentErrors = errorLogs.filter(log => {
            const logTime = new Date(log.timestamp).getTime();
            return logTime > Date.now() - 3600000; // Last hour
        }).length;

        const recentWarnings = warningCount > 0 ? Math.floor(warningCount / (sessionDuration / 3600000)) : 0;

        return {
            sessionId: sessionId,
            sessionDuration: Math.round(sessionDuration / 1000), // seconds
            timestamp: getTimestamp(),
            counts: {
                errors: errorCount,
                warnings: warningCount,
                critical: criticalCount,
                performance: performanceLogs.length,
                network: networkLogs.length,
                imageErrors: imageErrorLogs.length
            },
            recentActivity: {
                lastHour: {
                    errors: recentErrors,
                    warnings: recentWarnings
                }
            },
            recentErrors: errorLogs.slice(0, 10),
            performanceMetrics: getPerformanceSummary(),
            networkMetrics: getNetworkSummary(),
            systemInfo: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                online: navigator.onLine,
                viewport: `${window.innerWidth}x${window.innerHeight}`,
                memory: window.performance?.memory ? {
                    used: Math.round(window.performance.memory.usedJSHeapSize / 1048576) + 'MB',
                    total: Math.round(window.performance.memory.totalJSHeapSize / 1048576) + 'MB'
                } : 'Not available'
            }
        };
    }

    /**
     * Get performance summary
     */
    function getPerformanceSummary() {
        if (performanceLogs.length === 0) {
            return { count: 0, avgDuration: 0, issues: 0 };
        }

        const longTasks = performanceLogs.filter(log => log.category === 'longtask' && log.duration > 1000);
        
        return {
            count: performanceLogs.length,
            longTasks: longTasks.length,
            avgDuration: performanceLogs.length > 0 
                ? Math.round(performanceLogs.reduce((sum, log) => sum + (log.duration || 0), 0) / performanceLogs.length)
                : 0,
            issues: longTasks.length
        };
    }

    /**
     * Get network summary
     */
    function getNetworkSummary() {
        if (networkLogs.length === 0) {
            return { count: 0, successRate: 0, avgDuration: 0 };
        }

        const successful = networkLogs.filter(log => log.success);
        const failed = networkLogs.filter(log => !log.success);
        const avgDuration = networkLogs.length > 0
            ? Math.round(networkLogs.reduce((sum, log) => sum + (log.duration || 0), 0) / networkLogs.length)
            : 0;

        return {
            count: networkLogs.length,
            successful: successful.length,
            failed: failed.length,
            successRate: networkLogs.length > 0 
                ? Math.round((successful.length / networkLogs.length) * 100)
                : 100,
            avgDuration: avgDuration,
            slowRequests: networkLogs.filter(log => log.duration > 5000).length
        };
    }

    /**
     * Get summary statistics
     */
    function getStats() {
        return {
            totalErrors: errorCount,
            totalWarnings: warningCount,
            totalCritical: criticalCount,
            sessionDuration: Math.round((Date.now() - sessionStartTime) / 1000),
            logsByCategory: getLogsByCategory(),
            logsBySeverity: getLogsBySeverity()
        };
    }

    /**
     * Get logs grouped by category
     */
    function getLogsByCategory() {
        const categories = {};
        errorLogs.forEach(log => {
            categories[log.category] = (categories[log.category] || 0) + 1;
        });
        return categories;
    }

    /**
     * Get logs grouped by severity
     */
    function getLogsBySeverity() {
        const severities = {};
        errorLogs.forEach(log => {
            severities[log.severity] = (severities[log.severity] || 0) + 1;
        });
        return severities;
    }

    /**
     * Clear all logs
     */
    function clearLogs(options = {}) {
        const { errors = true, performance = false, network = false, image = false } = options;

        if (errors) {
            errorLogs = [];
            errorCount = 0;
            warningCount = 0;
            criticalCount = 0;
        }
        if (performance) performanceLogs = [];
        if (network) networkLogs = [];
        if (image) imageErrorLogs = [];

        saveLogsToStorage();
        console.log('[ErrorMonitor] Logs cleared');
    }

    /**
     * Export logs to JSON
     */
    function exportLogs(options = {}) {
        const { format = 'json', includeStats = true, limit = 1000 } = options;

        const exportData = {
            exportTimestamp: getTimestamp(),
            sessionId: sessionId,
            appUrl: window.location.href,
            userAgent: navigator.userAgent
        };

        if (includeStats) {
            exportData.stats = getStats();
        }

        // Include requested logs
        exportData.errors = getLogs({ type: 'errors', limit });
        exportData.performance = getLogs({ type: 'performance', limit });
        exportData.network = getLogs({ type: 'network', limit });
        exportData.imageErrors = getLogs({ type: 'image', limit });

        if (format === 'json') {
            return JSON.stringify(exportData, null, 2);
        } else if (format === 'csv') {
            return convertToCSV(exportData.errors);
        }

        return exportData;
    }

    /**
     * Convert logs to CSV format
     */
    function convertToCSV(logs) {
        if (logs.length === 0) return '';

        const headers = ['timestamp', 'category', 'severity', 'message', 'url', 'caller'];
        const rows = logs.map(log => [
            log.timestamp,
            log.category,
            log.severity,
            `"${(log.message || '').replace(/"/g, '""')}"`,
            log.url || '',
            log.caller ? `${log.caller.function}@${log.caller.file}:${log.caller.line}` : ''
        ]);

        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    /**
     * Log custom event/data with full context
     */
    function logCustom(type, message, context = {}) {
        if (!CONFIG.enableConsole) return;

        const logEntry = {
            id: generateLogId(),
            timestamp: getTimestamp(),
            sessionId: sessionId,
            type: type,
            category: context.category || 'custom',
            severity: context.severity || 'info',
            message: message,
            stack: null,
            caller: getCallerInfo(),
            context: {
                url: window.location.href,
                userAgent: navigator.userAgent,
                viewport: `${window.innerWidth}x${window.innerHeight}`,
                ...context
            }
        };

        // Add to logs
        if (type === 'error' || type === 'warning') {
            errorLogs.unshift(logEntry);
            if (logEntry.severity === 'critical') {
                criticalCount++;
            }
            if (type === 'warning') {
                warningCount++;
            } else {
                errorCount++;
            }
        } else {
            // For non-error types, just log to console
            console.log(`[ErrorMonitor ${type}]`, message, logEntry);
        }

        // Save to localStorage
        if (CONFIG.enableLocalStorage) {
            saveLogsToStorage();
        }

        return logEntry;
    }

    /**
     * Track custom performance metric
     */
    function trackPerformance(name, value, metadata = {}) {
        const perfEntry = {
            id: generateLogId(),
            timestamp: getTimestamp(),
            sessionId: sessionId,
            type: 'performance',
            category: 'custom',
            name: name,
            value: value,
            metadata: metadata
        };

        performanceLogs.unshift(perfEntry);
        trimLogs(performanceLogs, 200);
        saveLogsToStorage();

        return perfEntry;
    }

    /**
     * Initialize error monitor
     */
    function init() {
        if (isInitialized) {
            console.warn('[ErrorMonitor] Already initialized');
            return;
        }

        console.log('[ErrorMonitor] Initializing...');

        // Load existing logs from localStorage
        loadLogsFromStorage();

        // Set up global error handlers
        setupGlobalErrorHandlers();
        setupFetchInterceptor();
        setupImageErrorHandler();

        // Set up performance monitoring
        if (CONFIG.enablePerformance) {
            setupPerformanceMonitoring();
        }

        // Set up periodic cleanup (every hour)
        setInterval(cleanupOldLogs, 60 * 60 * 1000);

        isInitialized = true;
        console.log('[ErrorMonitor] Initialized successfully');
        console.log('[ErrorMonitor] Session ID:', sessionId);
    }

    // Create public API
    const ErrorMonitor = {
        init: init,
        log: logError,
        warn: logWarning,
        info: logInfo,
        logCustom: logCustom,
        getLogs: getLogs,
        getPerformance: getPerformance,
        getDashboard: getDashboard,
        clearLogs: clearLogs,
        exportLogs: exportLogs,
        trackPerformance: trackPerformance,
        getStats: getStats,
        getSessionId: () => sessionId,
        resetSession: () => {
            sessionId = generateSessionId();
            sessionStartTime = Date.now();
            console.log('[ErrorMonitor] Session reset:', sessionId);
        }
    };

    // Attach to global scope
    global.ErrorMonitor = ErrorMonitor;

    // Auto-initialize when DOM is ready
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    } else {
        init();
    }

    console.log('[ErrorMonitor] Error monitoring system ready');

})(typeof window !== 'undefined' ? window : global);
