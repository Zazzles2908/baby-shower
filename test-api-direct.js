const { chromium } = require('playwright');

(async () => {
    console.log('Starting detailed API functionality test...');
    
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
    });
    
    // Collect page errors
    const pageErrors = [];
    page.on('pageerror', error => {
        pageErrors.push({
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    });
    
    try {
        // Test 1: Main page load
        console.log('\n=== TEST 1: Main Page Load ===');
        await page.goto('https://baby-shower-qr-app.vercel.app', { waitUntil: 'networkidle', timeout: 30000 });
        console.log('✅ Main page loaded');
        await page.waitForTimeout(2000);
        
        // Test 2: Navigate to Guestbook
        console.log('\n=== TEST 2: Guestbook Section ===');
        const guestbookCard = await page.$('[data-section="guestbook"]');
        if (guestbookCard) {
            await guestbookCard.click();
            await page.waitForTimeout(1000);
            console.log('✅ Navigated to guestbook');
        }
        
        // Test 3: Navigate to Pool
        console.log('\n=== TEST 3: Pool Section ===');
        const poolCard = await page.$('[data-section="pool"]');
        if (poolCard) {
            await poolCard.click();
            await page.waitForTimeout(1000);
            console.log('✅ Navigated to pool');
        }
        
        // Test 4: Navigate to Voting
        console.log('\n=== TEST 4: Voting Section ===');
        const votingCard = await page.$('[data-section="voting"]');
        if (votingCard) {
            await votingCard.click();
            await page.waitForTimeout(1000);
            console.log('✅ Navigated to voting');
        }
        
        // Test 5: Navigate to Mom vs Dad
        console.log('\n=== TEST 5: Mom vs Dad Section ===');
        const momVsDadCard = await page.$('[data-section="mom-vs-dad"]');
        if (momVsDadCard) {
            await momVsDadCard.click();
            await page.waitForTimeout(1000);
            console.log('✅ Navigated to mom-vs-dad');
        }
        
        // Test 6: Dashboard test
        console.log('\n=== TEST 6: Dashboard ===');
        await page.goto('https://baby-shower-qr-app.vercel.app/error-dashboard.html', { waitUntil: 'networkidle', timeout: 30000 });
        console.log('✅ Dashboard loaded');
        await page.waitForTimeout(2000);
        
        // Analysis
        console.log('\n=== CONSOLE ANALYSIS ===');
        const errors = consoleMessages.filter(m => m.type === 'error');
        const warnings = consoleMessages.filter(m => m.type === 'warning');
        const logs = consoleMessages.filter(m => m.type === 'log');
        
        console.log(`Total console messages: ${consoleMessages.length}`);
        console.log(`Errors: ${errors.length}`);
        console.log(`Warnings: ${warnings.length}`);
        console.log(`Logs: ${logs.length}`);
        
        // Check for enhanced monitoring
        console.log('\n=== ENHANCED MONITORING CHECK ===');
        const errorMonitorLogs = logs.filter(m => m.text.includes('[ErrorMonitor]'));
        const apiEnhancedLogs = logs.filter(m => m.text.includes('[API Enhanced]') || m.text.includes('[Supabase Enhanced]'));
        const imageEnhancedLogs = logs.filter(m => m.text.includes('[ImageService Enhanced]'));
        const realtimeEnhancedLogs = logs.filter(m => m.text.includes('[Realtime Enhanced]'));
        const gameInitEnhancedLogs = logs.filter(m => m.text.includes('[GameInit Enhanced]'));
        
        console.log(`ErrorMonitor logs: ${errorMonitorLogs.length}`);
        console.log(`Enhanced API logs: ${apiEnhancedLogs.length}`);
        console.log(`Enhanced Image logs: ${imageEnhancedLogs.length}`);
        console.log(`Enhanced Realtime logs: ${realtimeEnhancedLogs.length}`);
        console.log(`Enhanced Game logs: ${gameInitEnhancedLogs.length}`);
        
        // Check for original monitoring
        console.log('\n=== ORIGINAL MONITORING CHECK ===');
        const originalAPILogs = logs.filter(m => m.text.includes('[API]') && !m.text.includes('[API Enhanced]'));
        const originalImageLogs = logs.filter(m => m.text.includes('[ImageService]') && !m.text.includes('[ImageService Enhanced]'));
        const originalRealtimeLogs = logs.filter(m => m.text.includes('[Realtime]') && !m.text.includes('[Realtime Enhanced]'));
        
        console.log(`Original API logs: ${originalAPILogs.length}`);
        console.log(`Original Image logs: ${originalImageLogs.length}`);
        console.log(`Original Realtime logs: ${originalRealtimeLogs.length}`);
        
        // Sample of recent logs
        console.log('\n=== SAMPLE LOGS (last 10) ===');
        logs.slice(-10).forEach(log => {
            console.log(`[${log.timestamp}] ${log.text}`);
        });
        
        // Sample of errors
        console.log('\n=== SAMPLE ERRORS ===');
        errors.slice(0, 5).forEach(err => {
            console.log(`[ERROR] ${err.text}`);
        });
        
    } catch (error) {
        console.log(`❌ Test failed: ${error.message}`);
    }
    
    await browser.close();
    console.log('\n✅ Test completed');
})();