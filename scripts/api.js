// Baby Shower App - API Communication Layer

/**
 * Submit to both Google Sheets and Supabase (dual-write)
 * @param {string} table - Supabase table name
 * @param {Object} data - Data to send
 * @returns {Promise<Object>} Response
 */
async function submitToBothBackends(table, data) {
    const results = { googleSheets: null, supabase: null, errors: [] };
    
    // Transform data for Google Apps Script (capitalize keys for sheet header)
    const sheetData = transformDataForSheets(table, data);

    // 1. Submit to Google Sheets
    try {
        results.googleSheets = await postToAPI({
            action: table,
            ...sheetData
        });
    } catch (error) {
        results.errors.push({ backend: 'Google Sheets', error: String(error?.message || error || 'Unknown error') });
        console.warn('Google Sheets submission failed:', error);
    }

    // 2. Submit to Supabase (if enabled)
    if (CONFIG.SUPABASE.ENABLED && typeof window.SupabaseClient !== 'undefined') {
        try {
            // Transform data to match Supabase schema
            const supabaseData = transformDataForSupabase(table, data);
            results.supabase = await window.SupabaseClient.submit(table, supabaseData);
        } catch (error) {
            results.errors.push({ backend: 'Supabase', error: String(error?.message || error || 'Unknown error') });
            console.warn('Supabase submission failed:', error);
        }
    }

    // Return success if at least one backend worked
    if (results.googleSheets || results.supabase) {
        // Extract message from Google Sheets response (contains the success message)
        const message = results.googleSheets?.message 
            || results.supabase?.message 
            || 'Thank you for your submission!';
        return { 
            result: 'success', 
            results,
            data: { message },
            milestones: results.googleSheets?.milestones || null
        };
    }

    throw new Error('All backends failed');
}

/**
 * Transform data to match Google Sheets column headers (capitalized keys)
 * @param {string} table - Table name
 * @param {Object} data - Original data with lowercase keys
 * @returns {Object} Transformed data with capitalized keys
 */
function transformDataForSheets(table, data) {
    const mapping = {
        // Guestbook
        guestbook: {
            Name: data.name,
            Relationship: data.relationship,
            Message: data.message,
            PhotoURL: data.photoURL
        },
        // Baby Pool
        baby_pool: {
            Name: data.name,
            DateGuess: data.dateGuess,
            TimeGuess: data.timeGuess,
            WeightGuess: data.weightGuess,
            LengthGuess: data.lengthGuess
        },
        // Quiz
        quiz: {
            Name: data.name,
            Puzzle1: data.puzzle1,
            Puzzle2: data.puzzle2,
            Puzzle3: data.puzzle3,
            Puzzle4: data.puzzle4,
            Puzzle5: data.puzzle5
        },
        // Advice
        advice: {
            Name: data.name,
            AdviceType: data.adviceType,
            Message: data.message
        },
        // Voting
        voting: {
            Name: data.name,
            SelectedNames: data.selectedNames || (data.names ? data.names.join(',') : '')
        }
    };
    
    return mapping[table] || data;
}

/**
 * Transform data to match Supabase simplified schema
 * @param {string} table - Table name (not used, we use single 'submissions' table)
 * @param {Object} data - Original data
 * @returns {Object} Transformed data
 */
function transformDataForSupabase(table, data) {
    const timestamp = new Date().toISOString();
    let activityData = {};

    switch (table) {
        case 'guestbook':
            activityData = {
                relationship: data.relationship,
                message: data.message,
                photo_url: data.photoURL || null
            };
            break;

        case 'baby_pool':
            activityData = {
                birth_date: data.dateGuess,
                birth_time: data.timeGuess,
                weight_kg: parseFloat(data.weightGuess),
                length_cm: parseFloat(data.lengthGuess)
            };
            break;

        case 'quiz':
            activityData = {
                puzzle1: data.puzzle1,
                puzzle2: data.puzzle2,
                puzzle3: data.puzzle3,
                puzzle4: data.puzzle4,
                puzzle5: data.puzzle5
            };
            break;

        case 'advice':
            activityData = {
                advice_type: data.adviceType,
                message: data.message
            };
            break;

        case 'voting':
            activityData = {
                names: data.names || []
            };
            break;

        default:
            activityData = data;
    }

    return {
        name: data.name,
        activity_type: table,
        activity_data: activityData,
        created_at: timestamp
    };
}

/**
 * Generic POST function to Apps Script
 * @param {Object} data - Data to send to the backend
 * @returns {Promise<Object>} Response from the backend
 */
async function postToAPI(data) {
    try {
        const response = await fetch(CONFIG.SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

/**
 * Convert file to base64
 * @param {File} file - File to convert
 * @returns {Promise<string>} Base64 string
 */
function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}

/**
 * Upload photo to Google Drive
 * @param {File} file - Photo file to upload
 * @returns {Promise<Object>} Upload result with URLs
 */
async function uploadPhoto(file) {
    try {
        // Validate file size
        const maxSize = CONFIG.UI.MAX_PHOTO_SIZE_MB * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error(`Photo size must be less than ${CONFIG.UI.MAX_PHOTO_SIZE_MB}MB`);
        }

        // Validate file type
        if (!CONFIG.UI.ALLOWED_PHOTO_TYPES.includes(file.type)) {
            throw new Error('Photo must be JPEG, PNG, or WebP format');
        }

        // Convert to base64
        const base64 = await toBase64(file);

        // Upload to backend
        const result = await postToAPI({
            action: 'upload_photo',
            filename: file.name,
            mimeType: file.type,
            data: base64
        });

        if (result.result !== 'success') {
            throw new Error('Photo upload failed');
        }

        // Return the new structure with driveUrl and googlePhotosLink
        return {
            url: result.data.driveUrl,  // For backward compatibility
            driveUrl: result.data.driveUrl,
            driveId: result.data.driveId,
            name: result.data.name,
            googlePhotosLink: result.data.googlePhotosLink
        };
    } catch (error) {
        console.error('Photo upload error:', error);
        throw error;
    }
}

/**
 * Submit guestbook entry
 * @param {Object} data - Guestbook data
 * @param {File|null} photoFile - Optional photo file
 * @returns {Promise<Object>} Submission result
 */
async function submitGuestbook(data, photoFile = null) {
    try {
        let photoURL = '';

        // Upload photo if provided
        if (photoFile) {
            const uploadResult = await uploadPhoto(photoFile);
            photoURL = uploadResult.url;
        }

        // Submit to both backends
        const result = await submitToBothBackends('guestbook', {
            ...data,
            photoURL: photoURL
        });

        return result;
    } catch (error) {
        console.error('Guestbook submission error:', error);
        throw error;
    }
}

/**
 * Submit baby pool prediction
 * @param {Object} data - Pool prediction data
 * @returns {Promise<Object>} Submission result
 */
async function submitPool(data) {
    try {
        const result = await submitToBothBackends('baby_pool', data);
        return result;
    } catch (error) {
        console.error('Pool submission error:', error);
        throw error;
    }
}

/**
 * Submit quiz answers
 * @param {Object} data - Quiz answers
 * @returns {Promise<Object>} Submission result with score
 */
async function submitQuiz(data) {
    try {
        const result = await submitToBothBackends('quiz', data);
        return result;
    } catch (error) {
        console.error('Quiz submission error:', error);
        throw error;
    }
}

/**
 * Submit advice
 * @param {Object} data - Advice data
 * @returns {Promise<Object>} Submission result
 */
async function submitAdvice(data) {
    try {
        const result = await submitToBothBackends('advice', data);
        return result;
    } catch (error) {
        console.error('Advice submission error:', error);
        throw error;
    }
}

/**
 * Submit name votes
 * @param {Object} data - Voting data
 * @returns {Promise<Object>} Submission result
 */
async function submitVotes(data) {
    try {
        const result = await submitToBothBackends('voting', data);
        return result;
    } catch (error) {
        console.error('Vote submission error:', error);
        throw error;
    }
}

/**
 * Get current statistics
 * @returns {Promise<Object>} Current stats
 */
async function getStats() {
    try {
        const result = await postToAPI({
            action: 'get_stats'
        });

        return result.stats || {};
    } catch (error) {
        console.error('Get stats error:', error);
        throw error;
    }
}

/**
 * Handle API response and check for milestones
 * @param {Object} response - API response
 * @returns {Object} Processed response
 */
function handleResponse(response) {
    // Handle undefined or null response
    if (!response) {
        throw new Error('No response from server');
    }

    // Check for errors
    if (response.result === 'error') {
        throw new Error(response.message || response.error || 'An error occurred');
    }

    // Check for newly unlocked milestones
    if (response.milestones && response.milestones.newlyUnlocked) {
        response.milestones.newlyUnlocked.forEach(milestoneKey => {
            showMilestoneSurprise(milestoneKey);
        });
    }

    return response;
}

/**
 * Show error message to user
 * @param {Error} error - Error object
 */
function showError(error) {
    console.error('Error:', error);
    const message = error?.message || error?.error?.message || String(error) || 'Something went wrong. Please try again.';
    alert(`Error: ${message}`);
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        postToAPI,
        uploadPhoto,
        submitGuestbook,
        submitPool,
        submitQuiz,
        submitAdvice,
        submitVotes,
        getStats,
        handleResponse,
        showError,
        submitToBothBackends,
        transformDataForSupabase
    };
}
