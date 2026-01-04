/**
 * Google Apps Script - Webhook Receiver for Supabase Database Webhook
 * 
 * Setup Instructions:
 * 1. Create a new Google Sheet for the event
 * 2. Extensions > Apps Script
 * 3. Paste this code
 * 4. Save and Deploy > New deployment
 * 5. Select type: Web app
 * 6. Execute as: Me
 * 7. Access: Anyone (anonymous) - required for Supabase webhooks
 * 8. Copy the Web App URL
 * 9. In Supabase Dashboard: Database > Webhooks > New Webhook
 *    - Table: internal.event_archive
 *    - Event: INSERT
 *    - URL: [Your Google Script Web App URL]
 *    - HTTP Method: POST
 *    - Headers: Content-Type: application/json
 */

const SHEET_NAME = 'Archive';
const MAX_ROWS = 50000; // Google Sheets limit

/**
 * Main doPost function - handles Supabase webhook POST requests
 */
function doPost(e) {
  try {
    // Parse the incoming JSON data from Supabase
    const payload = JSON.parse(e.postData.contents);
    
    // Handle different Supabase webhook payload formats
    // Format 1: { "event": { "type": "INSERT", "table": "...", "record": {...} } }
    // Format 2: { "record": {...} } (direct record format)
    let record;
    if (payload.event && payload.event.record) {
      // Supabase Database Webhook with event wrapper
      record = payload.event.record;
    } else if (payload.record) {
      // Direct record format
      record = payload.record;
    } else {
      // Payload is the record itself
      record = payload;
    }
    
    // Get processed data (may be null for raw inserts)
    const processed = record.processed_data || {};
    
    // Extract name from guest_name or processed data
    const guestName = record.guest_name || 
                      processed.guest_name || 
                      processed.guestName || 
                      'Anonymous';
    
    // Extract and format activity data based on type
    const activityData = formatActivityData(record.activity_type, record.raw_data, processed);
    
    // Create row data for the sheet
    const rowData = [
      record.id || '',
      formatDate(record.created_at),
      guestName,
      record.activity_type || '',
      activityData,
      JSON.stringify(processed),
      record.processing_time_ms || 0
    ];
    
    // Append to Google Sheet
    appendRowToSheet(rowData);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Row added successfully' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Log error and return failure
    console.error('Error processing webhook:', error);
    console.error('Payload:', e.postData.contents);
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Format activity data based on activity type for better readability in Google Sheets
 */
function formatActivityData(activityType, rawData, processedData) {
  try {
    // Parse raw_data if it's a string
    let raw;
    if (typeof rawData === 'string') {
      raw = JSON.parse(rawData);
    } else {
      raw = rawData || {};
    }
    
    const proc = processedData || {};
    
    switch (activityType) {
      case 'guestbook':
        return `Guest: ${proc.guest_name || raw.name || 'Anonymous'} | Message: ${proc.message || raw.message || ''} | Relationship: ${proc.relationship || raw.relationship || ''}`;
      
      case 'vote':
        const names = proc.names || raw.names || [];
        const voteCount = proc.vote_count || names.length || 0;
        return `Names: ${names.join(', ')} | Count: ${voteCount}`;
      
      case 'pool':
        return `Guest: ${proc.guest_name || raw.name || 'Anonymous'} | Prediction: ${proc.prediction || raw.prediction || ''} | Due: ${proc.due_date || raw.due_date || ''}`;
      
      case 'quiz':
        const score = proc.score || raw.score || 0;
        const total = proc.total_questions || raw.totalQuestions || raw.total_questions || 0;
        const answers = proc.answers || raw.answers || [];
        return `Score: ${score}/${total} | Answers: [${answers.join(', ')}]`;
      
      case 'advice':
        return `Category: ${proc.category || raw.category || 'General'} | Text: ${proc.advice_text || proc.advice || raw.advice || ''}`;
      
      default:
        // Return formatted JSON for unknown types
        return JSON.stringify(raw);
    }
  } catch (error) {
    return JSON.stringify(rawData || {});
  }
}

/**
 * Append a row to the Google Sheet
 */
function appendRowToSheet(rowData) {
  const sheet = getOrCreateSheet();
  
  // Check if we're approaching the limit
  const lastRow = sheet.getLastRow();
  if (lastRow >= MAX_ROWS) {
    throw new Error('Sheet has reached maximum row limit of ' + MAX_ROWS);
  }
  
  // Append the row (starting from row 2 to preserve headers)
  sheet.appendRow(rowData);
  
  // Log for debugging
  console.log('Added row:', rowData);
}

/**
 * Get existing sheet or create new one with headers
 */
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    // Create new sheet with headers
    sheet = ss.insertSheet(SHEET_NAME);
    
    // Add headers
    const headers = [
      'ID',
      'Timestamp',
      'Guest Name',
      'Activity Type',
      'Activity Data',
      'Processed Data',
      'Processing Time (ms)'
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format headers
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#4CAF50')
      .setFontColor('white');
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, headers.length);
  }
  
  return sheet;
}

/**
 * Format ISO date string to readable format
 */
function formatDate(isoString) {
  if (!isoString) return '';
  
  try {
    const date = new Date(isoString);
    return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  } catch (e) {
    return isoString;
  }
}

/**
 * Test function - call this to test the webhook
 */
function testWebhook() {
  const testPayload = {
    event: {
      type: 'INSERT',
      table: 'internal.event_archive',
      record: {
        id: 999,
        created_at: new Date().toISOString(),
        guest_name: 'Test Guest',
        activity_type: 'guestbook',
        raw_data: { name: 'Test', message: 'Test message', relationship: 'Friend' },
        processed_data: { guest_name: 'Test', message: 'Test message', migrated_at: new Date().toISOString() },
        processing_time_ms: 5
      }
    }
  };
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testPayload)
    }
  };
  
  const response = doPost(mockEvent);
  console.log('Test response:', response.getContent());
  
  // Test all activity types
  const activityTypes = ['guestbook', 'vote', 'pool', 'quiz', 'advice'];
  for (const type of activityTypes) {
    const activityPayload = {
      event: {
        type: 'INSERT',
        table: 'internal.event_archive',
        record: {
          id: Math.floor(Math.random() * 10000),
          created_at: new Date().toISOString(),
          guest_name: 'Test ' + type.charAt(0).toUpperCase() + type.slice(1),
          activity_type: type,
          raw_data: getTestDataForActivity(type),
          processed_data: getTestProcessedDataForActivity(type),
          processing_time_ms: Math.floor(Math.random() * 10)
        }
      }
    };
    
    const activityEvent = {
      postData: {
        contents: JSON.stringify(activityPayload)
      }
    };
    
    const activityResponse = doPost(activityEvent);
    console.log(`${type} test response:`, activityResponse.getContent());
  }
}

/**
 * Get test raw data for activity type
 */
function getTestDataForActivity(activityType) {
  switch (activityType) {
    case 'guestbook':
      return { name: 'Test Guest', message: 'Hello!', relationship: 'friend' };
    case 'vote':
      return { names: ['Alice', 'Bob'], voteCount: 2 };
    case 'pool':
      return { name: 'Test Pool', prediction: '2026-02-15', dueDate: '2026-02-15' };
    case 'quiz':
      return { answers: [1, 2, 3], score: 3, totalQuestions: 3 };
    case 'advice':
      return { advice: 'Test advice', category: 'general' };
    default:
      return {};
  }
}

/**
 * Get test processed data for activity type
 */
function getTestProcessedDataForActivity(activityType) {
  const base = { migrated_at: new Date().toISOString() };
  
  switch (activityType) {
    case 'guestbook':
      return { ...base, guest_name: 'Test Guest', message: 'Hello!', relationship: 'friend' };
    case 'vote':
      return { ...base, names: ['Alice', 'Bob'], vote_count: 2 };
    case 'pool':
      return { ...base, guest_name: 'Test Pool', prediction: '2026-02-15', due_date: '2026-02-15' };
    case 'quiz':
      return { ...base, answers: [1, 2, 3], score: 3, total_questions: 3 };
    case 'advice':
      return { ...base, advice_text: 'Test advice', category: 'general', is_approved: false };
    default:
      return base;
  }
}

/**
 * Manual sync function - fetches data from Supabase API
 * Use this to backfill existing data
 * 
 * Configuration needed:
 * - SUPABASE_URL: Your project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Your service role key
 */
function manualSyncFromSupabase() {
  const config = getSupabaseConfig();
  if (!config.url || !config.key) {
    throw new Error('Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Script Properties.');
  }
  
  // Fetch data from internal archive
  const url = `${config.url}/rest/v1/internal.event_archive?select=*&order=created_at.desc`;
  
  const options = {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${config.key}`,
      'apikey': config.key
    },
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  
  if (response.getResponseCode() !== 200) {
    throw new Error('Failed to fetch data: ' + response.getContentText());
  }
  
  const records = JSON.parse(response.getContentText());
  
  // Process each record
  let synced = 0;
  for (const record of records) {
    try {
      const processed = record.processed_data || {};
      const guestName = record.guest_name || processed.guest_name || 'Anonymous';
      const activityData = formatActivityData(record.activity_type, record.raw_data, processed);
      
      const rowData = [
        record.id,
        formatDate(record.created_at),
        guestName,
        record.activity_type || '',
        activityData,
        JSON.stringify(processed),
        record.processing_time_ms || 0
      ];
      
      appendRowToSheet(rowData);
      synced++;
    } catch (e) {
      console.error('Error syncing record ' + record.id + ':', e);
    }
  }
  
  return { synced, total: records.length };
}

/**
 * Get Supabase configuration from script properties
 */
function getSupabaseConfig() {
  const scriptProperties = PropertiesService.getScriptProperties();
  return {
    url: scriptProperties.getProperty('SUPABASE_URL'),
    key: scriptProperties.getProperty('SUPABASE_SERVICE_ROLE_KEY')
  };
}

/**
 * Set Supabase configuration (run once in console)
 */
function setSupabaseConfig(url, key) {
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty('SUPABASE_URL', url);
  scriptProperties.setProperty('SUPABASE_SERVICE_ROLE_KEY', key);
  return 'Configuration saved';
}

/**
 * Create menu in Google Sheets for easy access
 */
function onOpen() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const menuItems = [
    { name: 'Sync from Supabase', functionName: 'manualSyncFromSupabase' },
    { name: 'Test Webhook', functionName: 'testWebhook' },
    { name: 'Configure Supabase', functionName: 'showConfigDialog' }
  ];
  sheet.addMenu('Supabase Sync', menuItems);
}

/**
 * Show configuration dialog
 */
function showConfigDialog() {
  const html = HtmlService.createHtmlOutputFromFile('config-dialog')
    .setWidth(400)
    .setHeight(300);
  SpreadsheetApp.getUi().showModalDialog(html, 'Supabase Configuration');
}
