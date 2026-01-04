/**
 * Baby Shower App - Enhanced Realtime Subscription Manager
 * Robust subscription management with reconnection and health monitoring
 */

(function() {
    'use strict';
    
    console.log('[RealtimeManager] Loading enhanced realtime manager...');
    
    // Configuration
    const CONFIG = {
        MAX_RECONNECT_ATTEMPTS: 5,
        RECONNECT_DELAY: 2000,
        HEALTH_CHECK_INTERVAL: 30000,
        SUBSCRIPTION_TIMEOUT: 10000,
        HEARTBEAT_INTERVAL: 15000,
        MAX_MISSED_HEARTBEATS: 2
    };
    
    // State
    let subscriptions = new Map();
    let reconnectAttempts = new Map();
    let heartbeatTimers = new Map();
    let missedHeartbeats = new Map();
    let isOnline = true;
    
    // Public API
    window.RealtimeManager = {
        createSubscription: createEnhancedSubscription,
        removeSubscription: removeSubscription,
        getSubscriptionStatus: getSubscriptionStatus,
        reconnectAll: reconnectAllSubscriptions,
        getStats: getSubscriptionStats
    };
    
    /**
     * Create enhanced subscription with reconnection logic
     */
    function createEnhancedSubscription(channelConfig, eventHandlers, options = {}) {
        const {
            maxReconnectAttempts = CONFIG.MAX_RECONNECT_ATTEMPTS,
            reconnectDelay = CONFIG.RECONNECT_DELAY,
            healthCheckInterval = CONFIG.HEALTH_CHECK_INTERVAL,
            subscriptionTimeout = CONFIG.SUBSCRIPTION_TIMEOUT
        } = options;
        
        const subscriptionId = generateSubscriptionId(channelConfig);
        
        console.log(`[RealtimeManager] Creating subscription: ${subscriptionId}`);
        
        const subscription = {
            id: subscriptionId,
            config: channelConfig,
            handlers: eventHandlers,
            options: options,
            status: 'connecting',
            channel: null,
            unsubscribe: null,
            lastHeartbeat: Date.now(),
            reconnectAttempts: 0,
            createdAt: Date.now()
        };
        
        subscriptions.set(subscriptionId, subscription);
        
        // Start connection process
        connectSubscription(subscription);
        
        return {
            id: subscriptionId,
            unsubscribe: () => removeSubscription(subscriptionId),
            getStatus: () => getSubscriptionStatus(subscriptionId)
        };
    }
    
    /**
     * Connect subscription with retry logic
     */
    async function connectSubscription(subscription) {
        const { config, handlers, options } = subscription;
        
        try {
            console.log(`[RealtimeManager] Connecting subscription: ${subscription.id}`);
            subscription.status = 'connecting';
            
            // Get Supabase client
            const supabase = await getSupabaseClient();
            if (!supabase) {
                throw new Error('Supabase client not available');
            }
            
            // Create channel
            const channel = supabase.channel(config.name);
            
            // Set up event handlers
            if (handlers.postgres_changes) {
                channel.on(
                    'postgres_changes',
                    config.event,
                    (payload) => {
                        subscription.lastHeartbeat = Date.now();
                        handlers.postgres_changes(payload);
                    }
                );
            }
            
            if (handlers.broadcast) {
                channel.on(
                    'broadcast',
                    { event: config.event },
                    (payload) => {
                        subscription.lastHeartbeat = Date.now();
                        handlers.broadcast(payload);
                    }
                );
            }
            
            if (handlers.presence) {
                channel.on(
                    'presence',
                    { event: 'sync' },
                    () => {
                        subscription.lastHeartbeat = Date.now();
                        handlers.presence(channel.presenceState());
                    }
                );
            }
            
            // Subscribe with timeout
            const subscribePromise = new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    reject(new Error('Subscription timeout'));
                }, options.subscriptionTimeout || CONFIG.SUBSCRIPTION_TIMEOUT);
                
                channel.subscribe((status) => {
                    clearTimeout(timeoutId);
                    
                    if (status === 'SUBSCRIBED') {
                        console.log(`[RealtimeManager] Subscription successful: ${subscription.id}`);
                        subscription.status = 'connected';
                        subscription.channel = channel;
                        subscription.reconnectAttempts = 0;
                        
                        // Start heartbeat monitoring
                        startHeartbeatMonitoring(subscription);
                        
                        resolve(channel);
                    } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                        reject(new Error(`Subscription failed: ${status}`));
                    } else if (status === 'TIMED_OUT') {
                        reject(new Error('Subscription timed out'));
                    }
                });
            });
            
            await subscribePromise;
            
        } catch (error) {
            console.error(`[RealtimeManager] Subscription connection failed: ${subscription.id}`, error);
            subscription.status = 'error';
            
            // Log to error monitor
            if (window.ErrorMonitor) {
                window.ErrorMonitor.logCustom('subscription_connection_failed', error.message, {
                    subscriptionId: subscription.id,
                    attempt: subscription.reconnectAttempts + 1
                });
            }
            
            // Schedule reconnection
            scheduleReconnection(subscription);
        }
    }
    
    /**
     * Start heartbeat monitoring for subscription
     */
    function startHeartbeatMonitoring(subscription) {
        const timer = setInterval(() => {
            if (subscription.status !== 'connected') {
                clearInterval(timer);
                return;
            }
            
            const now = Date.now();
            const timeSinceLastHeartbeat = now - subscription.lastHeartbeat;
            
            if (timeSinceLastHeartbeat > CONFIG.HEARTBEAT_INTERVAL * 2) {
                const missedCount = missedHeartbeats.get(subscription.id) || 0;
                missedHeartbeats.set(subscription.id, missedCount + 1);
                
                console.warn(`[RealtimeManager] Missed heartbeat for: ${subscription.id} (count: ${missedCount + 1})`);
                
                if (missedCount + 1 >= CONFIG.MAX_MISSED_HEARTBEATS) {
                    console.error(`[RealtimeManager] Too many missed heartbeats, reconnecting: ${subscription.id}`);
                    clearInterval(timer);
                    
                    // Force reconnection
                    subscription.status = 'error';
                    scheduleReconnection(subscription);
                }
            } else {
                // Reset missed heartbeats on successful heartbeat
                missedHeartbeats.delete(subscription.id);
            }
            
            // Send heartbeat ping
            if (subscription.channel) {
                try {
                    subscription.channel.send({
                        type: 'heartbeat',
                        timestamp: now
                    });
                } catch (error) {
                    console.warn(`[RealtimeManager] Heartbeat send failed: ${subscription.id}`, error);
                }
            }
        }, CONFIG.HEARTBEAT_INTERVAL);
        
        heartbeatTimers.set(subscription.id, timer);
    }
    
    /**
     * Schedule reconnection with exponential backoff
     */
    function scheduleReconnection(subscription) {
        const attempts = reconnectAttempts.get(subscription.id) || 0;
        
        if (attempts >= CONFIG.MAX_RECONNECT_ATTEMPTS) {
            console.error(`[RealtimeManager] Max reconnection attempts reached: ${subscription.id}`);
            subscription.status = 'failed';
            
            // Log to error monitor
            if (window.ErrorMonitor) {
                window.ErrorMonitor.logCustom('subscription_max_reconnects_reached', 'Max reconnection attempts reached', {
                    subscriptionId: subscription.id,
                    maxAttempts: CONFIG.MAX_RECONNECT_ATTEMPTS
                });
            }
            return;
        }
        
        const delay = CONFIG.RECONNECT_DELAY * Math.pow(2, attempts);
        console.log(`[RealtimeManager] Scheduling reconnection in ${delay}ms: ${subscription.id}`);
        
        reconnectAttempts.set(subscription.id, attempts + 1);
        
        setTimeout(() => {
            console.log(`[RealtimeManager] Attempting reconnection: ${subscription.id}`);
            connectSubscription(subscription);
        }, delay);
    }
    
    /**
     * Remove subscription and clean up
     */
    function removeSubscription(subscriptionId) {
        console.log(`[RealtimeManager] Removing subscription: ${subscriptionId}`);
        
        const subscription = subscriptions.get(subscriptionId);
        if (!subscription) {
            return;
        }
        
        // Clean up heartbeat
        const heartbeatTimer = heartbeatTimers.get(subscriptionId);
        if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimers.delete(subscriptionId);
        }
        
        // Clean up missed heartbeats
        missedHeartbeats.delete(subscriptionId);
        
        // Clean up reconnect attempts
        reconnectAttempts.delete(subscriptionId);
        
        // Unsubscribe from channel
        if (subscription.channel && subscription.channel.unsubscribe) {
            try {
                subscription.channel.unsubscribe();
            } catch (error) {
                console.warn(`[RealtimeManager] Error unsubscribing: ${subscriptionId}`, error);
            }
        }
        
        // Remove from subscriptions
        subscriptions.delete(subscriptionId);
        
        console.log(`[RealtimeManager] Subscription removed: ${subscriptionId}`);
    }
    
    /**
     * Get subscription status
     */
    function getSubscriptionStatus(subscriptionId) {
        const subscription = subscriptions.get(subscriptionId);
        if (!subscription) {
            return 'not_found';
        }
        
        return {
            status: subscription.status,
            lastHeartbeat: subscription.lastHeartbeat,
            reconnectAttempts: subscription.reconnectAttempts,
            createdAt: subscription.createdAt
        };
    }
    
    /**
     * Reconnect all subscriptions
     */
    async function reconnectAllSubscriptions() {
        console.log('[RealtimeManager] Reconnecting all subscriptions...');
        
        const reconnectionPromises = [];
        
        for (const subscription of subscriptions.values()) {
            if (subscription.status === 'error' || subscription.status === 'failed') {
                reconnectionPromises.push(connectSubscription(subscription));
            }
        }
        
        await Promise.allSettled(reconnectionPromises);
        console.log('[RealtimeManager] All subscriptions reconnection completed');
    }
    
    /**
     * Get subscription statistics
     */
    function getSubscriptionStats() {
        const stats = {
            total: subscriptions.size,
            byStatus: {
                connecting: 0,
                connected: 0,
                error: 0,
                failed: 0
            },
            heartbeatHealth: {},
            reconnectAttempts: {}
        };
        
        for (const [id, subscription] of subscriptions) {
            stats.byStatus[subscription.status]++;
            
            const missedCount = missedHeartbeats.get(id) || 0;
            stats.heartbeatHealth[id] = {
                missedHeartbeats: missedCount,
                lastHeartbeat: subscription.lastHeartbeat,
                healthy: missedCount < CONFIG.MAX_MISSED_HEARTBEATS
            };
            
            stats.reconnectAttempts[id] = subscription.reconnectAttempts;
        }
        
        return stats;
    }
    
    /**
     * Get Supabase client with fallback
     */
    async function getSupabaseClient() {
        if (window.API && window.API.getSupabaseClient) {
            return await window.API.getSupabaseClient();
        }
        
        // Fallback to global supabase
        if (typeof window.supabase !== 'undefined') {
            return window.supabase;
        }
        
        return null;
    }
    
    /**
     * Generate unique subscription ID
     */
    function generateSubscriptionId(config) {
        const parts = [
            config.name,
            config.event?.schema || '',
            config.event?.table || '',
            config.event?.filter || ''
        ];
        
        return parts.join('_').replace(/[^a-zA-Z0-9]/g, '_');
    }
    
    /**
     * Handle online/offline events
     */
    function handleConnectionChange() {
        const wasOnline = isOnline;
        isOnline = navigator.onLine;
        
        if (!wasOnline && isOnline) {
            console.log('[RealtimeManager] Connection restored, reconnecting subscriptions...');
            reconnectAllSubscriptions();
        } else if (wasOnline && !isOnline) {
            console.log('[RealtimeManager] Connection lost, marking subscriptions as offline...');
            
            for (const subscription of subscriptions.values()) {
                if (subscription.status === 'connected') {
                    subscription.status = 'offline';
                }
            }
        }
    }
    
    /**
     * Initialize realtime manager
     */
    function initializeRealtimeManager() {
        console.log('[RealtimeManager] Initializing...');
        
        // Set up connection change handlers
        window.addEventListener('online', handleConnectionChange);
        window.addEventListener('offline', handleConnectionChange);
        
        // Periodic health check
        setInterval(() => {
            const stats = getSubscriptionStats();
            console.log('[RealtimeManager] Health check:', stats);
            
            // Auto-reconnect failed subscriptions
            if (stats.byStatus.failed > 0 && navigator.onLine) {
                console.log('[RealtimeManager] Auto-reconnecting failed subscriptions...');
                reconnectAllSubscriptions();
            }
        }, CONFIG.HEALTH_CHECK_INTERVAL);
        
        console.log('[RealtimeManager] Initialized successfully');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeRealtimeManager);
    } else {
        initializeRealtimeManager();
    }
    
})();