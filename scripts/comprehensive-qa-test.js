const { chromium } = require('playwright');

(async () => {
    console.log('Starting comprehensive QA test...');
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Collect console messages
    const consoleMessages = [];
    page.on('console', msg => {
        const log = {
            type: msg.type(),
            text: msg.text(),
            timestamp: new Date().toISOString()
        };
        consoleMessages.push(log);
        console.log(`[${log.type.toUpperCase()}] ${log.text}`);
    });
    
    // Collect page errors
    const pageErrors = [];
    page.on('pageerror', error => {
        const errorLog = {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        };
        pageErrors.push(errorLog);
        console.log(`[PAGE ERROR] ${error.message}`);
    });
    
    // Navigate to the site
    console.log('\n=== TESTING: Navigation ===');
    try {
        await page.goto('https://baby-shower-qr-app.vercel.app', { waitUntil: 'networkidle', timeout: 30000 });
        console.log('✅ Page loaded successfully');
    } catch (error) {
        console.log(`❌ Page load failed: ${error.message}`);
    }
    
    // Wait a bit for all scripts to initialize
    await page.waitForTimeout(3000);
    
    // Test Error Monitor
    console.log('\n=== TESTING: Error Monitor ===');
    const errorMonitorLogs = consoleMessages.filter(m => m.text.includes('[ErrorMonitor]'));
    console.log(`Found ${errorMonitorLogs.length} ErrorMonitor log messages`);
    errorMonitorLogs.forEach(log => console.log(`  - ${log.text}`));
    
    // Test Enhanced API
    console.log('\n=== TESTING: Enhanced API ===');
    const apiLogs = consoleMessages.filter(m => m.text.includes('[API') || m.text.includes('[Supabase]'));
    console.log(`Found ${apiLogs.length} API log messages`);
    apiLogs.forEach(log => console.log(`  - ${log.text}`));
    
    // Test Image Service
    console.log('\n=== TESTING: Image Service ===');
    const imageLogs = consoleMessages.filter(m => m.text.includes('[ImageService]'));
    console.log(`Found ${imageLogs.length} ImageService log messages`);
    imageLogs.forEach(log => console.log(`  - ${log.text}`));
    
    // Test Realtime
    console.log('\n=== TESTING: Realtime ===');
    const realtimeLogs = consoleMessages.filter(m => m.text.includes('[Realtime]'));
    console.log(`Found ${realtimeLogs.length} Realtime log messages`);
    realtimeLogs.forEach(log => console.log(`  - ${log.text}`));
    
    // Test Game Init
    console.log('\n=== TESTING: Game Init ===');
    const gameLogs = consoleMessages.filter(m => m.text.includes('[GameInit]'));
    console.log(`Found ${gameLogs.length} GameInit log messages`);
    gameLogs.forEach(log => console.log(`  - ${log.text}`));
    
    // Count errors
    const errors = consoleMessages.filter(m => m.type === 'error');
    const warnings = consoleMessages.filter(m => m.type === 'warning');
    console.log('\n=== CONSOLE ANALYSIS ===');
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);
    console.log(`Page errors: ${pageErrors.length}`);
    
    if (errors.length > 0) {
        console.log('\nError details:');
        errors.forEach((err, i) => console.log(`  ${i+1}. ${err.text}`));
    }
    
    // Test dashboard
    console.log('\n=== TESTING: Dashboard ===');
    try {
        await page.goto('https://baby-shower-qr-app.vercel.app/error-dashboard.html', { waitUntil: 'networkidle', timeout: 30000 });
        console.log('✅ Dashboard loaded');
    } catch (error) {
        console.log(`❌ Dashboard load failed: ${error.message}`);
    }
    
    // Wait a bit more
    await page.waitForTimeout(2000);
    
    // Summary
    console.log('\n=== TEST SUMMARY ===');
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Total errors: ${errors.length}`);
    console.log(`Total warnings: ${warnings.length}`);
    console.log(`Page errors: ${pageErrors.length}`);
    console.log(`ErrorMonitor logs: ${errorMonitorLogs.length}`);
    console.log(`API logs: ${apiLogs.length}`);
    console.log(`ImageService logs: ${imageLogs.length}`);
    console.log(`Realtime logs: ${realtimeLogs.length}`);
    console.log(`GameInit logs: ${gameLogs.length}`);
    
    await browser.close();
    console.log('\n✅ QA Test completed');
})();