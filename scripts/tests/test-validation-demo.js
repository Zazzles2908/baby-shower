const { chromium } = require('playwright');

(async () => {
    console.log('Starting validation test...');
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const consoleMessages = [];
    page.on('console', msg => {
        consoleMessages.push({
            type: msg.type(),
            text: msg.text(),
            timestamp: new Date().toISOString()
        });
    });
    
    const pageErrors = [];
    page.on('pageerror', error => {
        pageErrors.push({
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    });
    
    try {
        // Load main page
        console.log('\n=== LOADING MAIN PAGE ===');
        await page.goto('https://baby-shower-qr-app.vercel.app', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(3000);
        
        // Check what scripts are loaded
        console.log('\n=== CHECKING LOADED SCRIPTS ===');
        const scriptsInfo = await page.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script[src]'));
            return scripts.map(s => s.src);
        });
        console.log('Scripts loaded:', scriptsInfo);
        
        // Check if enhanced scripts are present
        console.log('\n=== CHECKING FOR ENHANCED SCRIPTS ===');
        const hasErrorMonitor = await page.evaluate(() => typeof window.ErrorMonitor !== 'undefined');
        const hasAPIEnhanced = await page.evaluate(() => typeof window.APIEnhanced !== 'undefined');
        const hasImageServiceEnhanced = await page.evaluate(() => typeof window.ImageServiceEnhanced !== 'undefined');
        const hasRealtimeEnhanced = await page.evaluate(() => typeof window.RealtimeEnhanced !== 'undefined');
        const hasGameInitEnhanced = await page.evaluate(() => typeof window.GameInitEnhanced !== 'undefined');
        
        console.log('ErrorMonitor loaded:', hasErrorMonitor);
        console.log('API Enhanced loaded:', hasAPIEnhanced);
        console.log('ImageService Enhanced loaded:', hasImageServiceEnhanced);
        console.log('Realtime Enhanced loaded:', hasRealtimeEnhanced);
        console.log('GameInit Enhanced loaded:', hasGameInitEnhanced);
        
        // Check original scripts
        console.log('\n=== CHECKING ORIGINAL SCRIPTS ===');
        const hasAPI = await page.evaluate(() => typeof window.API !== 'undefined');
        const hasGallery = await page.evaluate(() => typeof window.Gallery !== 'undefined');
        const hasVoting = await page.evaluate(() => typeof window.Voting !== 'undefined');
        const hasMomVsDad = await page.evaluate(() => typeof window.MomVsDad !== 'undefined');
        
        console.log('API loaded:', hasAPI);
        console.log('Gallery loaded:', hasGallery);
        console.log('Voting loaded:', hasVoting);
        console.log('MomVsDad loaded:', hasMomVsDad);
        
        // Check console for specific patterns
        console.log('\n=== CONSOLE PATTERN ANALYSIS ===');
        const logs = consoleMessages.filter(m => m.type === 'log');
        const errors = consoleMessages.filter(m => m.type === 'error');
        
        // Look for enhanced monitoring patterns
        const enhancedPatterns = [
            '[ErrorMonitor]',
            '[API Enhanced]',
            '[ImageService Enhanced]',
            '[Realtime Enhanced]',
            '[GameInit Enhanced]',
            '[Supabase Enhanced]'
        ];
        
        console.log('Enhanced monitoring patterns found:');
        enhancedPatterns.forEach(pattern => {
            const count = logs.filter(m => m.text.includes(pattern)).length;
            console.log(`  ${pattern}: ${count} occurrences`);
        });
        
        // Look for original monitoring patterns
        const originalPatterns = [
            '[API]',
            '[ImageService]',
            '[Supabase]',
            '[Realtime]',
            '[Gallery]'
        ];
        
        console.log('\nOriginal monitoring patterns found:');
        originalPatterns.forEach(pattern => {
            const count = logs.filter(m => m.text.includes(pattern)).length;
            console.log(`  ${pattern}: ${count} occurrences`);
        });
        
        // Show sample logs
        console.log('\n=== SAMPLE LOGS ===');
        logs.slice(0, 20).forEach(log => {
            console.log(`[${log.timestamp}] ${log.text}`);
        });
        
        // Show errors
        console.log('\n=== ERRORS ===');
        errors.forEach(err => {
            console.log(`[ERROR] ${err.text}`);
        });
        
        // Dashboard test
        console.log('\n=== DASHBOARD TEST ===');
        await page.goto('https://baby-shower-qr-app.vercel.app/error-dashboard.html', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);
        
        // Check dashboard content
        const dashboardContent = await page.evaluate(() => {
            const body = document.body.innerText;
            return {
                hasStats: body.includes('Statistics') || body.includes('stats'),
                hasErrors: body.includes('Error') || body.includes('error'),
                hasMonitoring: body.includes('Monitor') || body.includes('monitor'),
                hasCharts: body.includes('Chart') || body.includes('chart')
            };
        });
        
        console.log('Dashboard content:', dashboardContent);
        
        // Final summary
        console.log('\n=== FINAL SUMMARY ===');
        console.log(`Total console messages: ${consoleMessages.length}`);
        console.log(`Total errors: ${errors.length}`);
        console.log(`Total page errors: ${pageErrors.length}`);
        console.log(`Enhanced scripts loaded: ${hasErrorMonitor || hasAPIEnhanced || hasImageServiceEnhanced || hasRealtimeEnhanced || hasGameInitEnhanced}`);
        console.log(`Original scripts loaded: ${hasAPI || hasGallery || hasVoting || hasMomVsDad}`);
        
    } catch (error) {
        console.log(`❌ Test failed: ${error.message}`);
    }
    
    await browser.close();
    console.log('\n✅ Test completed');
})();