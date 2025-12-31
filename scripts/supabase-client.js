// Baby Shower App - Supabase Client with Realtime

/**
 * Supabase Client Singleton
 * Handles database operations and realtime subscriptions
 */
const SupabaseClient = (function() {
    let client = null;
    let subscription = null;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_DELAY = 3000;

    /**
     * Initialize Supabase client
     * @returns {Object|null} Supabase client or null if disabled
     */
    function initialize() {
        if (!CONFIG.SUPABASE.ENABLED) {
            console.log('Supabase is disabled in configuration');
            return null;
        }

        // Check if Supabase JS library is loaded
        if (typeof supabase === 'undefined') {
            console.warn('Supabase JS library not loaded. Realtime features will be disabled.');
            return null;
        }

        try {
            client = supabase.createClient(
                CONFIG.SUPABASE.URL,
                CONFIG.SUPABASE.ANON_KEY,
                {
                    realtime: {
                        params: {
                            eventsPerSecond: 10
                        }
                    },
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false
                    }
                }
            );

            console.log('Supabase client initialized successfully');
            return client;
        } catch (error) {
            console.error('Failed to initialize Supabase client:', error);
            return null;
        }
    }

    /**
     * Get Supabase client instance
     * @returns {Object|null} Supabase client
     */
    function getClient() {
        return client;
    }

    /**
     * Check if client is initialized
     * @returns {boolean}
     */
    function isInitialized() {
        return client !== null;
    }

    /**
     * Submit data to a table
     * @param {string} table - Table name
     * @param {Object} data - Data to insert
     * @returns {Promise<Object>} Insert result
     */
    async function submit(table, data) {
        if (!client) {
            throw new Error('Supabase client not initialized');
        }

        const { data: result, error } = await client
            .from(table)
            .insert(data)
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return result;
    }

    /**
     * Fetch statistics from Supabase views
     * @returns {Promise<Object>} Stats object
     */
    async function getStats() {
        if (!client) {
            throw new Error('Supabase client not initialized');
        }

        try {
            // Fetch counts from submissions_count view
            const { data: counts, error: countsError } = await client
                .from('submissions_count')
                .select('*')
                .single();

            if (countsError && countsError.code !== 'PGRST116') {
                throw countsError;
            }

            // Fetch vote counts
            const { data: votes, error: votesError } = await client
                .from('vote_counts')
                .select('*');

            if (votesError && votesError.code !== 'PGRST116') {
                throw votesError;
            }

            // Build stats object
            const stats = {
                guestbook_count: counts?.guestbook_count || 0,
                pool_count: counts?.pool_count || 0,
                quiz_count: counts?.quiz_count || 0,
                advice_count: counts?.advice_count || 0,
                votes: {}
            };

            // Add vote counts
            if (votes) {
                votes.forEach(v => {
                    stats.votes[v.name] = v.vote_count;
                });
            }

            return stats;
        } catch (error) {
            console.error('Error fetching stats from Supabase:', error);
            throw error;
        }
    }

    /**
     * Subscribe to realtime updates
     * @param {Function} callback - Callback for INSERT events
     * @returns {Object|null} Subscription object
     */
    function subscribe(callback) {
        if (!client) {
            console.warn('Cannot subscribe - Supabase client not initialized');
            return null;
        }

        if (subscription) {
            console.log('Already subscribed to realtime updates');
            return subscription;
        }

        try {
            subscription = client
                .channel(CONFIG.SUPABASE.CHANNEL, {
                    config: {
                        presence: {
                            key: 'guest-' + Date.now()
                        }
                    }
                })
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'baby_shower',
                        table: 'submissions'
                    },
                    (payload) => {
                        console.log('Realtime INSERT received:', payload);
                        if (callback && typeof callback === 'function') {
                            callback(payload.new);
                        }
                    }
                )
                .on(
                    'presence',
                    { event: 'sync' },
                    () => {
                        const state = subscription.presenceState();
                        console.log('Presence sync:', state);
                    }
                )
                .subscribe((status) => {
                    console.log('Supabase subscription status:', status);
                    
                    if (status === 'SUBSCRIBED') {
                        reconnectAttempts = 0;
                    } else if (status === 'CHANNEL_ERROR') {
                        handleReconnect(callback);
                    }
                });

            console.log('Subscribed to Supabase realtime channel:', CONFIG.SUPABASE.CHANNEL);
            return subscription;
        } catch (error) {
            console.error('Failed to subscribe to Supabase:', error);
            return null;
        }
    }

    /**
     * Handle reconnection with exponential backoff
     * @param {Function} callback - Original callback
     */
    function handleReconnect(callback) {
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.error('Max reconnection attempts reached. Realtime updates disabled.');
            return;
        }

        reconnectAttempts++;
        const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1);

        console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

        setTimeout(() => {
            subscription = null;
            subscribe(callback);
        }, delay);
    }

    /**
     * Unsubscribe from realtime updates
     */
    function unsubscribe() {
        if (subscription) {
            client.removeChannel(subscription);
            subscription = null;
            console.log('Unsubscribed from Supabase realtime');
        }
    }

    /**
     * Track presence (optional for showing active users)
     * @param {Object} userData - User data to track
     */
    async function trackPresence(userData) {
        if (!subscription || !client) {
            return;
        }

        try {
            await subscription.track({
                user_id: userData.name || 'anonymous',
                online_at: new Date().toISOString()
            });
        } catch (error) {
            console.warn('Failed to track presence:', error);
        }
    }

    /**
     * Fetch latest submissions for initial load
     * @param {number} limit - Number of recent submissions to fetch
     * @returns {Promise<Array>} Recent submissions
     */
    async function getRecentSubmissions(limit = 10) {
        if (!client) {
            return [];
        }

        try {
            const { data, error } = await client
                .from('submissions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('Error fetching recent submissions:', error);
            return [];
        }
    }

    // Public API
    return {
        initialize,
        getClient,
        isInitialized,
        submit,
        getStats,
        subscribe,
        unsubscribe,
        trackPresence,
        getRecentSubmissions
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SupabaseClient };
}
