// Baby Shower App - Google Apps Script Backend
// DUAL-WRITE: Google Sheets + Supabase

// ============================================
// CONFIGURATION
// ============================================
// Google Drive folder for photo storage (from .env)
const DRIVE_FOLDER_ID = '1so8AZUXenDuTMjgFxeT78beL8MjMMSYC';

// Google Photos sharing link (from .env) - for guests to view/upload photos
const GOOGLE_PHOTOS_LINK = 'https://photos.app.goo.gl/KWzmnmxvQpxdQmP47';

// ============================================
// SUPABASE CONFIGURATION
// ============================================
const SUPABASE_CONFIG = {
  PROJECT_URL: 'https://bkszmvfsfgvdwzacgmfz.supabase.co',
  ANON_KEY: 'sb_publishable_4_-bf5hda3a5Bb9enUmA0Q_jrKJf1K_'
};

/**
 * TEST FUNCTION - Run this to test Supabase connection
 * Select this function in dropdown and press Run
 */
function testSupabaseConnection() {
  console.log('=== Testing Supabase Connection ===');
  console.log('SUPABASE_CONFIG:', JSON.stringify(SUPABASE_CONFIG));
  
  const testData = {
    name: 'Test Guest',
    activity_type: 'guestbook',
    activity_data: {
      relationship: 'friend',
      message: 'This is a test message from Apps Script',
      photo_url: null
    }
  };
  
  console.log('Sending test data:', JSON.stringify(testData));
  
  const result = submitToSupabase(testData.name, testData.activity_type, testData.activity_data);
  
  console.log('Supabase insert result:', result);
  
  if (result && result.success) {
    console.log('✅ SUCCESS! Data inserted to Supabase');
  } else {
    console.log('❌ FAILED! Check errors above');
  }
  
  return result;
}

/**
 * Insert row into Supabase via RPC function
 * @param {string} tableName - Name of table (unused, kept for compatibility)
 * @param {Object} data - Data to insert
 * @returns {Object} Response from Supabase
 */
function insertToSupabase(tableName, data) {
  if (!SUPABASE_CONFIG.ANON_KEY || SUPABASE_CONFIG.ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
    console.log('Supabase not configured, skipping insert');
    return null;
  }
  
  // Use RPC function to insert into baby_shower schema
  const url = `${SUPABASE_CONFIG.PROJECT_URL}/rest/v1/rpc/insert_submission`;
  const jsonPayload = JSON.stringify({
    p_name: data.name,
    p_activity_type: data.activity_type,
    p_activity_data: data.activity_data
  });
  
  // Debug log
  console.log('Supabase RPC URL:', url);
  console.log('Supabase payload:', jsonPayload);

  const options = {
    'method': 'post',
    'headers': {
      'apikey': SUPABASE_CONFIG.ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_CONFIG.ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    'payload': jsonPayload,
    'muteHttpExceptions': true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    
    if (responseCode !== 200 && responseCode !== 201 && responseCode !== 204) {
      console.error('Supabase insert error:', response.getContentText());
      return null;
    }
    
    return { success: true };
  } catch (e) {
    console.error('Supabase insert exception:', e);
    return null;
  }
}

/**
 * Submit activity data to Supabase submissions table
 * @param {string} name - Guest name
 * @param {string} activityType - Type of activity
 * @param {Object} activityData - Activity-specific data
 * @returns {Object} Result
 */
function submitToSupabase(name, activityType, activityData) {
  // Guard: Check if parameters are provided
  if (name === undefined || activityType === undefined) {
    console.log('submitToSupabase called without required parameters. This function requires: name, activityType, activityData');
    console.log('To test, call doPost() with proper JSON data or use the Vercel frontend.');
    return null;
  }
  
  const data = {
    name: name,
    activity_type: activityType,
    activity_data: activityData
  };
  
  // Debug log
  console.log('Supabase data:', JSON.stringify(data));
  
  return insertToSupabase('submissions', data);
}

/**
 * Get statistics from Supabase via RPC function
 * @returns {Object} Statistics
 */
function getSupabaseStats() {
  if (!SUPABASE_CONFIG.ANON_KEY || SUPABASE_CONFIG.ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
    return null;
  }
  
  try {
    const url = `${SUPABASE_CONFIG.PROJECT_URL}/rest/v1/rpc/get_submissions_count`;
    const response = UrlFetchApp.fetch(url, {
      'method': 'post',
      'headers': {
        'apikey': SUPABASE_CONFIG.ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_CONFIG.ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      'muteHttpExceptions': true
    });

    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      const stats = {};
      data.forEach(row => {
        stats[row.activity_type + 'Count'] = row.total;
      });
      return stats;
    }
  } catch (e) {
    console.error('Error getting Supabase stats:', e);
  }
  
  return null;
}

/**
 * Get vote counts from Supabase via RPC function
 * @returns {Object} Vote counts per name
 */
function getSupabaseVoteCounts() {
  if (!SUPABASE_CONFIG.ANON_KEY || SUPABASE_CONFIG.ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
    return null;
  }
  
  try {
    const url = `${SUPABASE_CONFIG.PROJECT_URL}/rest/v1/rpc/get_vote_counts`;
    const response = UrlFetchApp.fetch(url, {
      'method': 'post',
      'headers': {
        'apikey': SUPABASE_CONFIG.ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_CONFIG.ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      'muteHttpExceptions': true
    });

    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      const voteCounts = {};
      data.forEach(row => {
        voteCounts[row.baby_name] = row.vote_count;
      });
      return voteCounts;
    }
  } catch (e) {
    console.error('Error getting Supabase vote counts:', e);
  }
  
  return null;
}

// ============================================
// DUAL-WRITE HELPERS
// ============================================

/**
 * Write to both Google Sheets and Supabase
 * @param {Function} sheetFn - Function to write to sheets (e.g., appendToSheet)
 * @param {Object} params - Request parameters with name field
 * @param {string} activityType - Activity type for Supabase
 * @param {Object} activityData - Activity data for Supabase
 * @returns {Object} Result
 */
function dualWrite(sheetFn, params, activityType, activityData) {
  // Validate required parameters
  if (!params || typeof params !== 'object') {
    console.error('dualWrite called with invalid params:', params);
    return { error: 'Invalid parameters' };
  }
  
  if (!params.name) {
    console.error('dualWrite called without required name field in params');
    return { error: 'Missing name parameter' };
  }
  
  // Write to Google Sheets
  const sheetResult = sheetFn(params);
  
  // Write to Supabase (fire and forget, don't block on this)
  let supabaseSuccess = false;
  let supabaseError = null;
  try {
    const result = submitToSupabase(params.name, activityType, activityData);
    supabaseSuccess = result && result.success;
    if (!supabaseSuccess) {
      supabaseError = result ? (result.error || 'Unknown error') : 'Unknown error';
    }
  } catch (e) {
    console.error('Supabase write failed:', e);
    supabaseError = e.toString();
    // Continue even if Supabase fails - Google Sheets is primary
  }
  
  return {
    ...sheetResult,
    supabase: supabaseSuccess ? 'success' : 'failed',
    supabaseError: supabaseError
  };
}

/**
 * Main POST handler for all API requests
 * @param {Object} e - Event object with request data
 * @returns {ContentService.TextOutput} JSON response
 */
function doPost(e) {
    try {
        // Validate request has data
        if (!e || !e.postData || !e.postData.contents) {
            throw new Error("Invalid request: No data received");
        }

        // Parse the request body
        const params = JSON.parse(e.postData.contents);
        
        // Validate action parameter exists
        if (!params || !params.action) {
            throw new Error("Invalid request: 'action' parameter is required");
        }
        
        const action = params.action;

        // Initialize response object
        let response = {
          result: "success",
          data: {},
          stats: {},
          milestones: {}
        };

        // Route to appropriate handler
        switch(action) {
          case 'guestbook':
            response.data = handleGuestbook(params);
            break;
          case 'pool':
            response.data = handlePool(params);
            break;
          case 'quiz':
            response.data = handleQuiz(params);
            break;
          case 'advice':
            response.data = handleAdvice(params);
            break;
          case 'vote':
            response.data = handleVote(params);
            break;
          case 'upload_photo':
            response.data = handlePhotoUpload(params);
            break;
          case 'get_stats':
            response.stats = getStats();
            break;
          default:
            throw new Error("Invalid action: " + action);
        }

        // Always get current stats
        response.stats = getStats();

        // Check for new milestones
        response.milestones = checkMilestones(response.stats);

        // Return JSON response
        return ContentService
          .createTextOutput(JSON.stringify(response))
          .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        // Return error response
        return ContentService
          .createTextOutput(JSON.stringify({
            result: "error",
            message: error.toString()
          }))
          .setMimeType(ContentService.MimeType.JSON);
    }
}

/**
 * Append a row to a Google Sheet
 * @param {string} sheetName - Name of the sheet
 * @param {Array} headers - Array of column headers
 * @param {Object} params - Parameters to map to headers
 * @returns {Object} Result with sheet name and row index
 */
function appendToSheet(sheetName, headers, params) {
  const doc = SpreadsheetApp.getActiveSpreadsheet();

  // Get or create sheet
  let sheet = doc.getSheetByName(sheetName);
  if (!sheet) {
    sheet = doc.insertSheet(sheetName);
    sheet.appendRow(headers);
  }

  // Build row data
  const row = headers.map(header => {
    if (header === 'Timestamp') {
      return new Date();
    } else {
      return params[header] || '';
    }
  });

  // Append row
  sheet.appendRow(row);

  return {
    sheet: sheetName,
    rowIndex: sheet.getLastRow()
  };
}

/**
 * Get all data from a sheet
 * @param {string} sheetName - Name of the sheet
 * @returns {Array} Array of row objects
 */
function getSheetData(sheetName) {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = doc.getSheetByName(sheetName);

  if (!sheet) {
    return [];
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return [];
  }

  const headers = data[0];
  const rows = data.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

/**
 * Handle guestbook submission
 * @param {Object} params - Request parameters
 * @returns {Object} Result with message
 */
function handleGuestbook(params) {
  const headers = ['Timestamp', 'Name', 'Relationship', 'Message', 'PhotoURL'];
  const result = appendToSheet('Guestbook', headers, params);

  // Write to Supabase (async, non-blocking)
  let supabaseSuccess = false;
  let supabaseError = null;
  try {
    const activityData = {
      relationship: params.relationship,
      message: params.message,
      photo_url: params.photoURL || null
    };
    const sbResult = submitToSupabase(params.name, 'guestbook', activityData);
    supabaseSuccess = sbResult && sbResult.success;
    if (!supabaseSuccess) {
      supabaseError = sbResult ? (sbResult.error || 'Unknown error') : 'Unknown error';
    }
  } catch (e) {
    console.error('Supabase write failed:', e);
    supabaseError = e.toString();
  }

  return {
    message: "Wish saved successfully!",
    rowIndex: result.rowIndex,
    supabase: supabaseSuccess ? 'success' : 'failed',
    supabaseError: supabaseError
  };
}

/**
 * Handle baby pool submission
 * @param {Object} params - Request parameters
 * @returns {Object} Result with message
 */
function handlePool(params) {
  const headers = ['Timestamp', 'Name', 'DateGuess', 'TimeGuess', 'WeightGuess', 'LengthGuess'];
  const result = appendToSheet('BabyPool', headers, params);

  // Write to Supabase (async, non-blocking)
  let supabaseSuccess = false;
  let supabaseError = null;
  try {
    const activityData = {
      date_guess: params.dateGuess,
      time_guess: params.timeGuess,
      weight_guess: parseFloat(params.weightGuess),
      length_guess: parseInt(params.lengthGuess)
    };
    const sbResult = submitToSupabase(params.name, 'pool', activityData);
    supabaseSuccess = sbResult && sbResult.success;
    if (!supabaseSuccess) {
      supabaseError = sbResult ? (sbResult.error || 'Unknown error') : 'Unknown error';
    }
  } catch (e) {
    console.error('Supabase write failed:', e);
    supabaseError = e.toString();
  }

  return {
    message: "Prediction saved!",
    rowIndex: result.rowIndex,
    supabase: supabaseSuccess ? 'success' : 'failed',
    supabaseError: supabaseError
  };
}

/**
 * Handle quiz submission
 * @param {Object} params - Request parameters
 * @returns {Object} Result with message and score
 */
function handleQuiz(params) {
  // Define correct answers
  const correctAnswers = {
    puzzle1: "Baby Shower",
    puzzle2: "Three Little Pigs",
    puzzle3: "Rock a Bye Baby",
    puzzle4: "Baby Bottle",
    puzzle5: "Diaper Change"
  };

  // Calculate score
  let score = 0;
  for (let i = 1; i <= 5; i++) {
    const puzzleKey = 'puzzle' + i;
    if (params[puzzleKey] && params[puzzleKey].toLowerCase() === correctAnswers[puzzleKey].toLowerCase()) {
      score++;
    }
  }

  // Save to sheet
  const headers = ['Timestamp', 'Name', 'Puzzle1', 'Puzzle2', 'Puzzle3', 'Puzzle4', 'Puzzle5', 'Score'];
  const result = appendToSheet('QuizAnswers', headers, {
    ...params,
    score: score
  });

  // Write to Supabase (async, non-blocking)
  let supabaseSuccess = false;
  let supabaseError = null;
  try {
    const activityData = {
      puzzle1: params.puzzle1,
      puzzle2: params.puzzle2,
      puzzle3: params.puzzle3,
      puzzle4: params.puzzle4,
      puzzle5: params.puzzle5,
      score: score
    };
    const sbResult = submitToSupabase(params.name, 'quiz', activityData);
    supabaseSuccess = sbResult && sbResult.success;
    if (!supabaseSuccess) {
      supabaseError = sbResult ? (sbResult.error || 'Unknown error') : 'Unknown error';
    }
  } catch (e) {
    console.error('Supabase write failed:', e);
    supabaseError = e.toString();
  }

  return {
    message: `You got ${score}/5 correct!`,
    score: score,
    rowIndex: result.rowIndex,
    supabase: supabaseSuccess ? 'success' : 'failed',
    supabaseError: supabaseError
  };
}

/**
 * Handle advice submission
 * @param {Object} params - Request parameters
 * @returns {Object} Result with message
 */
function handleAdvice(params) {
  const headers = ['Timestamp', 'Name', 'AdviceType', 'Message'];
  const result = appendToSheet('Advice', headers, params);

  // Write to Supabase (async, non-blocking)
  let supabaseSuccess = false;
  let supabaseError = null;
  try {
    const activityData = {
      advice_type: params.adviceType,
      message: params.message
    };
    const sbResult = submitToSupabase(params.name, 'advice', activityData);
    supabaseSuccess = sbResult && sbResult.success;
    if (!supabaseSuccess) {
      supabaseError = sbResult ? (sbResult.error || 'Unknown error') : 'Unknown error';
    }
  } catch (e) {
    console.error('Supabase write failed:', e);
    supabaseError = e.toString();
  }

  return {
    message: "Advice saved!",
    rowIndex: result.rowIndex,
    supabase: supabaseSuccess ? 'success' : 'failed',
    supabaseError: supabaseError
  };
}

/**
 * Handle name voting submission
 * @param {Object} params - Request parameters
 * @returns {Object} Result with message
 */
function handleVote(params) {
  const headers = ['Timestamp', 'Name', 'SelectedNames'];
  const result = appendToSheet('NameVotes', headers, params);

  // Parse selected names for Supabase
  const names = params.selectedNames ? params.selectedNames.split(',') : [];
  
  // Write to Supabase (async, non-blocking)
  let supabaseSuccess = false;
  let supabaseError = null;
  try {
    const activityData = {
      names: names
    };
    const sbResult = submitToSupabase(params.name, 'voting', activityData);
    supabaseSuccess = sbResult && sbResult.success;
    if (!supabaseSuccess) {
      supabaseError = sbResult ? (sbResult.error || 'Unknown error') : 'Unknown error';
    }
  } catch (e) {
    console.error('Supabase write failed:', e);
    supabaseError = e.toString();
  }

  return {
    message: "Votes recorded!",
    rowIndex: result.rowIndex,
    supabase: supabaseSuccess ? 'success' : 'failed',
    supabaseError: supabaseError
  };
}

/**
 * Handle photo upload to Google Drive
 * @param {Object} params - Request parameters with base64 data
 * @returns {Object} Result with file URLs
 */
function handlePhotoUpload(params) {
  // Use configured Drive folder ID
  const folderId = DRIVE_FOLDER_ID;
  
  // Validate folder ID
  if (!folderId || folderId === 'YOUR_DRIVE_FOLDER_ID_HERE') {
    throw new Error('Google Drive folder ID not configured. Please update the DRIVE_FOLDER_ID constant.');
  }

  try {
    const folder = DriveApp.getFolderById(folderId);
  } catch (e) {
    console.error('Error accessing Drive folder:', e);
    throw new Error('Could not access Google Drive folder. Please verify the folder ID.');
  }

  // Create blob from base64 data
  const blob = Utilities.newBlob(
    Utilities.base64Decode(params.data),
    params.mimeType,
    params.filename
  );

  // Save file to Drive
  const file = folder.createFile(blob);

  // Set sharing to anyone with link can view
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // Return both Drive URL and Google Photos link for sharing
  return {
    driveUrl: file.getUrl(),
    driveId: file.getId(),
    name: file.getName(),
    googlePhotosLink: GOOGLE_PHOTOS_LINK
  };
}

/**
 * Get current statistics
 * @returns {Object} Statistics object
 */
function getStats() {
  const doc = SpreadsheetApp.getActiveSpreadsheet();

  // Count entries in each sheet
  const guestbookCount = doc.getSheetByName('Guestbook') ?
    doc.getSheetByName('Guestbook').getLastRow() - 1 : 0;

  const poolCount = doc.getSheetByName('BabyPool') ?
    doc.getSheetByName('BabyPool').getLastRow() - 1 : 0;

  const quizData = getSheetData('QuizAnswers');
  const quizTotalCorrect = quizData.reduce((sum, row) => sum + (row.Score || 0), 0);

  const adviceCount = doc.getSheetByName('Advice') ?
    doc.getSheetByName('Advice').getLastRow() - 1 : 0;

  const voteData = getSheetData('NameVotes');
  const totalVotes = voteData.reduce((sum, row) => {
    const names = row.SelectedNames ? row.SelectedNames.split(',') : [];
    return sum + names.length;
  }, 0);

  // Calculate vote counts per name
  const voteCounts = {};
  voteData.forEach(row => {
    const names = row.SelectedNames ? row.SelectedNames.split(',') : [];
    names.forEach(name => {
      voteCounts[name] = (voteCounts[name] || 0) + 1;
    });
  });

  return {
    guestbookCount: guestbookCount,
    poolCount: poolCount,
    quizTotalCorrect: quizTotalCorrect,
    adviceCount: adviceCount,
    totalVotes: totalVotes,
    voteCounts: voteCounts
  };
}

/**
 * Check for new milestones
 * @param {Object} stats - Current statistics
 * @returns {Object} Milestone information
 */
function checkMilestones(stats) {
  // Define milestone thresholds
  const milestones = {
    GUESTBOOK_5: 5,
    GUESTBOOK_10: 10,
    GUESTBOOK_20: 20,
    POOL_10: 10,
    POOL_20: 20,
    QUIZ_25: 25,
    QUIZ_50: 50,
    ADVICE_10: 10,
    ADVICE_20: 20,
    VOTES_50: 50
  };

  // Get previously unlocked milestones
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  let milestoneSheet = doc.getSheetByName('Milestones');
  if (!milestoneSheet) {
    milestoneSheet = doc.insertSheet('Milestones');
    milestoneSheet.appendRow(['Key', 'Value', 'UnlockedAt']);
  }

  const milestoneData = getSheetData('Milestones');
  const unlockedMilestones = milestoneData.map(m => m.Key);

  // Check for new milestones
  const newlyUnlocked = [];

  if (stats.guestbookCount >= milestones.GUESTBOOK_5 &&
      !unlockedMilestones.includes('GUESTBOOK_5')) {
    newlyUnlocked.push('GUESTBOOK_5');
    unlockMilestone('GUESTBOOK_5', stats.guestbookCount);
  }

  if (stats.guestbookCount >= milestones.GUESTBOOK_10 &&
      !unlockedMilestones.includes('GUESTBOOK_10')) {
    newlyUnlocked.push('GUESTBOOK_10');
    unlockMilestone('GUESTBOOK_10', stats.guestbookCount);
  }

  if (stats.guestbookCount >= milestones.GUESTBOOK_20 &&
      !unlockedMilestones.includes('GUESTBOOK_20')) {
    newlyUnlocked.push('GUESTBOOK_20');
    unlockMilestone('GUESTBOOK_20', stats.guestbookCount);
  }

  if (stats.poolCount >= milestones.POOL_10 &&
      !unlockedMilestones.includes('POOL_10')) {
    newlyUnlocked.push('POOL_10');
    unlockMilestone('POOL_10', stats.poolCount);
  }

  if (stats.poolCount >= milestones.POOL_20 &&
      !unlockedMilestones.includes('POOL_20')) {
    newlyUnlocked.push('POOL_20');
    unlockMilestone('POOL_20', stats.poolCount);
  }

  if (stats.quizTotalCorrect >= milestones.QUIZ_25 &&
      !unlockedMilestones.includes('QUIZ_25')) {
    newlyUnlocked.push('QUIZ_25');
    unlockMilestone('QUIZ_25', stats.quizTotalCorrect);
  }

  if (stats.quizTotalCorrect >= milestones.QUIZ_50 &&
      !unlockedMilestones.includes('QUIZ_50')) {
    newlyUnlocked.push('QUIZ_50');
    unlockMilestone('QUIZ_50', stats.quizTotalCorrect);
  }

  if (stats.adviceCount >= milestones.ADVICE_10 &&
      !unlockedMilestones.includes('ADVICE_10')) {
    newlyUnlocked.push('ADVICE_10');
    unlockMilestone('ADVICE_10', stats.adviceCount);
  }

  if (stats.adviceCount >= milestones.ADVICE_20 &&
      !unlockedMilestones.includes('ADVICE_20')) {
    newlyUnlocked.push('ADVICE_20');
    unlockMilestone('ADVICE_20', stats.adviceCount);
  }

  if (stats.totalVotes >= milestones.VOTES_50 &&
      !unlockedMilestones.includes('VOTES_50')) {
    newlyUnlocked.push('VOTES_50');
    unlockMilestone('VOTES_50', stats.totalVotes);
  }

  return {
    newlyUnlocked: newlyUnlocked,
    allUnlocked: unlockedMilestones.concat(newlyUnlocked)
  };
}

/**
 * Unlock a milestone
 * @param {string} key - Milestone key
 * @param {number} value - Current value
 */
function unlockMilestone(key, value) {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = doc.getSheetByName('Milestones');

  sheet.appendRow([key, value, new Date()]);
}

/**
 * Get URL of the deployed web app
 * @returns {string} Web app URL
 */
function getWebAppURL() {
  return ScriptApp.getService().getUrl();
}

/**
 * Setup function to initialize the spreadsheet
 * Run this function once to set up all sheets
 */
function setup() {
  const doc = SpreadsheetApp.getActiveSpreadsheet();

  // Create sheets if they don't exist
  const sheets = ['Guestbook', 'BabyPool', 'QuizAnswers', 'Advice', 'NameVotes', 'Milestones'];

  sheets.forEach(sheetName => {
    let sheet = doc.getSheetByName(sheetName);
    if (!sheet) {
      sheet = doc.insertSheet(sheetName);
    }
  });

  // Add headers to sheets
  const headers = {
    Guestbook: ['Timestamp', 'Name', 'Relationship', 'Message', 'PhotoURL'],
    BabyPool: ['Timestamp', 'Name', 'DateGuess', 'TimeGuess', 'WeightGuess', 'LengthGuess'],
    QuizAnswers: ['Timestamp', 'Name', 'Puzzle1', 'Puzzle2', 'Puzzle3', 'Puzzle4', 'Puzzle5', 'Score'],
    Advice: ['Timestamp', 'Name', 'AdviceType', 'Message'],
    NameVotes: ['Timestamp', 'Name', 'SelectedNames'],
    Milestones: ['Key', 'Value', 'UnlockedAt']
  };

  Object.keys(headers).forEach(sheetName => {
    const sheet = doc.getSheetByName(sheetName);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers[sheetName]);
    }
  });

  return "Setup complete!";
}
