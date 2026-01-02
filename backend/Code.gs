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
    
    // Handle Supabase webhook format (new or old)
    const record = payload.record || payload;
    const processed = record.processed_data || {};
    
    // Extract data for the sheet
    const rowData = [
      record.id || '',
      formatDate(record.created_at),
      record.guest_name || '',
      record.activity_type || '',
      JSON.stringify(record.raw_data || {}),
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
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
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
      'Raw Data',
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
    record: {
      id: 999,
      created_at: new Date().toISOString(),
      guest_name: 'Test Guest',
      activity_type: 'guestbook',
      raw_data: { name: 'Test', message: 'Test message', relationship: 'Friend' },
      processed_data: { guest_name: 'Test', message: 'Test message', migrated_at: new Date().toISOString() },
      processing_time_ms: 5
    }
  };
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testPayload)
    }
  };
  
  const response = doPost(mockEvent);
  console.log('Test response:', response.getContent());
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
      const rowData = [
        record.id,
        formatDate(record.created_at),
        record.guest_name || '',
        record.activity_type || '',
        JSON.stringify(record.raw_data || {}),
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
