/**
 * Supabase Client for Baby Shower App
 * Project: bkszmvfsfgvdwzacgmfz
 * 
 * This script handles all Supabase interactions including:
 * - Data insertion
 * - Real-time subscriptions
 * - Row count queries
 * 
 * Uses baby_shower schema with single submissions table
 */

// Wait for Supabase JS to load
document.addEventListener('DOMContentLoaded', () => {
    initializeSupabase();
});

let supabaseClient = null;

async function initializeSupabase() {
    if (!CONFIG.SUPABASE.ENABLED) {
        console.log('Supabase is disabled in configuration');
        return null;
    }

    if (typeof supabase === 'undefined') {
        console.warn('Supabase JS not loaded. Add the script tag to index.html');
        return null;
    }

    try {
        supabaseClient = supabase.createClient(
            CONFIG.SUPABASE.URL,
            CONFIG.SUPABASE.ANON_KEY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                },
                realtime: {
                    params: {
                        eventsPerSecond: 10
                    }
                }
            }
        );

        console.log('Supabase client initialized:', CONFIG.SUPABASE.URL);
        return supabaseClient;
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        return null;
    }
}

/**
 * Submit data to Supabase (baby_shower schema)
 * @param {string} activityType - Activity type (guestbook, pool, quiz, advice, voting)
 * @param {object} data - Data to insert
 * @returns {Promise<object>} - Result from Supabase
 */
async function submitToSupabase(activityType, data) {
    if (!supabaseClient) {
        await initializeSupabase();
    }

    if (!supabaseClient) {
        return { error: { message: 'Supabase client not initialized' } };
    }

    try {
        // Transform data using the shared function
        const transformedData = transformDataForSupabase(activityType, data);

        const { data: result, error } = await supabaseClient
            .from('baby_shower.submissions')
            .insert([transformedData])
            .select()
            .single();

        if (error) {
            console.error(`Supabase insert error (${activityType}):`, error);
            return { error: { message: error.message || String(error) } };
        }

        console.log(`Supabase insert success (${activityType}):`, result);
        return { data: result };
    } catch (err) {
        console.error(`Supabase exception (${activityType}):`, err);
        return { error: { message: err.message || String(err) } };
    }
}

/**
 * Get count of records by activity type
 * @param {string} activityType - Activity type
 * @returns {Promise<number>} - Count of records
 */
async function getSupabaseCount(activityType) {
    if (!supabaseClient) {
        await initializeSupabase();
    }

    if (!supabaseClient) {
        return 0;
    }

    const { count, error } = await supabaseClient
        .from('baby_shower.submissions')
        .select('*', { count: 'exact', head: true })
        .eq('activity_type', activityType);

    if (error) {
        console.error(`Supabase count error (${activityType}):`, error);
        return 0;
    }

    return count || 0;
}

/**
 * Get all entries by activity type
 * @param {string} activityType - Activity type
 * @param {number} limit - Max number of records
 * @returns {Promise<array>} - Array of entries
 */
async function getEntriesFromSupabase(activityType, limit = 100) {
    if (!supabaseClient) {
        await initializeSupabase();
    }

    if (!supabaseClient) {
        return [];
    }

    const { data, error } = await supabaseClient
        .from('baby_shower.submissions')
        .select('*')
        .eq('activity_type', activityType)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error(`Supabase select error (${activityType}):`, error);
        return [];
    }

    return data || [];
}

/**
 * Subscribe to real-time changes for an activity type
 * @param {string} activityType - Activity type
 * @param {function} callback - Function to call on new insert
 * @returns {object} - Subscription object
 */
function subscribeToTable(activityType, callback) {
    if (!supabaseClient) {
        initializeSupabase();
        return null;
    }

    const channel = supabaseClient
        .channel(`${activityType}_realtime_${Date.now()}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'baby_shower',
                table: 'submissions',
                filter: `activity_type=eq.${activityType}`
            },
            (payload) => {
                console.log(`Real-time insert on ${activityType}:`, payload.new);
                callback(payload.new);
            }
        )
        .subscribe((status) => {
            console.log(`Supabase subscription status (${activityType}):`, status);
        });

    return channel;
}

/**
 * Unsubscribe from a real-time channel
 * @param {object} channel - Channel object from subscribeToTable
 */
function unsubscribeFromTable(channel) {
    if (channel && supabaseClient) {
        supabaseClient.removeChannel(channel);
    }
}

// Export for use in other modules
window.SupabaseClient = {
    submit: submitToSupabase,
    count: getSupabaseCount,
    subscribe: subscribeToTable,
    unsubscribe: unsubscribeFromTable,
    getEntries: getEntriesFromSupabase,
    initialize: initializeSupabase
};
