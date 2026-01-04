/**
 * Targeted QA Test with Snapshots
 */

const { chromium } = require('playwright');

async function runTargetedQA() {
    console.log('🎯 Starting Targeted QA with Snapshots...');
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();
    
    const testResults = {
        timestamp: new Date().toISOString(),
        url: 'https://baby-shower-qr-app.vercel.app',
        results: {}
    };

    // Capture console messages
    page.on('console', msg => {
        console.log(`[Console ${msg.type()}]: ${msg.text()}`);
    });

    try {
        // 1. Main Page Load and Hero Image Test
        console.log('📸 Testing Main Page and Hero Image...');
        await page.goto('https://baby-shower-qr-app.vercel.app', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);
        
        // Take screenshot of main page
        await page.screenshot({ path: 'C:\\Project\\Baby_Shower\\test-results\\main-page.png', fullPage: true });
        
        // Check hero section more broadly
        const heroSection = await page.$('header, .hero, .welcome, .banner, [class*="hero"]');
        const heroImages = heroSection ? await heroSection.$$('img') : [];
        
        testResults.results.heroImage = {
            status: heroImages.length > 0 ? 'PASS' : 'FAIL',
            heroSectionFound: !!heroSection,
            heroImagesFound: heroImages.length,
            screenshot: 'main-page.png'
        };

        // 2. Activity Cards Test
        console.log('🎴 Testing Activity Cards...');
        const allCards = await page.$$('[class*="card"], [class*="activity"]');
        const cardDetails = [];
        
        for (let i = 0; i < Math.min(allCards.length, 10); i++) {
            const card = allCards[i];
            const cardHTML = await card.innerHTML();
            const hasImage = cardHTML.includes('<img');
            const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(cardHTML);
            const text = await card.textContent();
            
            cardDetails.push({
                index: i,
                hasImage,
                hasEmoji,
                textLength: text.length,
                visible: await card.isVisible()
            });
        }
        
        await page.screenshot({ path: 'C:\\Project\\Baby_Shower\\test-results\\activity-cards.png', fullPage: true });
        
        testResults.results.activityCards = {
            status: cardDetails.filter(c => c.hasImage || c.hasEmoji).length >= 7 ? 'PASS' : 'PARTIAL',
            totalCards: allCards.length,
            cardsWithVisuals: cardDetails.filter(c => c.hasImage || c.hasEmoji).length,
            details: cardDetails,
            screenshot: 'activity-cards.png'
        };

        // 3. Who Would Rather Game Test
        console.log('🎮 Testing Who Would Rather Game...');
        const whoWouldRatherSection = await page.$('[class*="who-would-rather"], [class*="whoWouldRather"], #who-would-rather');
        
        if (whoWouldRatherSection) {
            await whoWouldRatherSection.scrollIntoViewIfNeeded();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'C:\\Project\\Baby_Shower\\test-results\\who-would-rather.png' });
            
            const avatars = await whoWouldRatherSection.$$('img');
            const avatarDetails = [];
            for (const avatar of avatars) {
                const src = await avatar.getAttribute('src') || '';
                const alt = await avatar.getAttribute('alt') || '';
                const visible = await avatar.isVisible();
                avatarDetails.push({ src: src.substring(0, 50), alt, visible });
            }
            
            testResults.results.whoWouldRather = {
                status: 'PASS',
                sectionFound: true,
                avatarsFound: avatars.length,
                avatarDetails,
                screenshot: 'who-would-rather.png'
            };
        } else {
            // Try to find it differently
            const gameContent = await page.$('[class*="game"], [class*="game-"]');
            if (gameContent) {
                await gameContent.scrollIntoViewIfNeeded();
                await page.waitForTimeout(500);
                await page.screenshot({ path: 'C:\\Project\\Baby_Shower\\test-results\\game-section.png' });
            }
            
            testResults.results.whoWouldRather = {
                status: 'FAIL',
                sectionFound: false,
                error: 'Who Would Rather section not found with expected selectors',
                suggestions: 'Check if section uses different class/ID naming'
            };
        }

        // 4. Mobile Responsiveness Test
        console.log('📱 Testing Mobile Responsiveness...');
        await context.close();
        
        const mobileContext = await browser.newContext({
            viewport: { width: 375, height: 667 },
            isMobile: true
        });
        const mobilePage = await mobileContext.newPage();
        
        await mobilePage.goto('https://baby-shower-qr-app.vercel.app', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1500);
        
        await mobilePage.screenshot({ path: 'C:\\Project\\Baby_Shower\\test-results\\mobile-view.png', fullPage: true });
        
        const mobileCards = await mobilePage.$$('[class*="card"], [class*="activity"]');
        const cardPositions = [];
        let previousY = -1;
        
        for (const card of mobileCards) {
            const box = await card.boundingBox();
            if (box) {
                cardPositions.push({
                    y: box.y,
                    stacked: previousY > 0 && box.y > previousY,
                    visible: await card.isVisible()
                });
                previousY = box.y;
            }
        }
        
        // Check touch targets
        const touchElements = await mobilePage.$$('button, a, input[type="submit"], [role="button"]');
        const touchTargetSizes = [];
        for (const el of touchElements.slice(0, 10)) {
            const box = await el.boundingBox();
            if (box) {
                touchTargetSizes.push({
                    width: Math.round(box.width),
                    height: Math.round(box.height),
                    isSmall: box.width < 44 || box.height < 44
                });
            }
        }
        
        testResults.results.mobileResponsiveness = {
            status: touchTargetSizes.filter(t => t.isSmall).length === 0 ? 'PASS' : 'PARTIAL',
            viewport: { width: 375, height: 667 },
            cardsStacking: cardPositions.length > 0,
            cardsCount: mobileCards.length,
            touchTargetsChecked: touchElements.length,
            smallTouchTargets: touchTargetSizes.filter(t => t.isSmall).length,
            screenshot: 'mobile-view.png'
        };

        await mobileContext.close();

        // 5. Image Loading Test
        console.log('🖼️ Testing Image Loading...');
        const imageContext = await browser.newContext();
        const imagePage = await imageContext.newPage();
        
        await imagePage.goto('https://baby-shower-qr-app.vercel.app', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);
        
        const allImages = await imagePage.$$('img');
        const imageLoadResults = [];
        
        for (const img of allImages) {
            const src = await img.getAttribute('src') || '';
            const alt = await img.getAttribute('alt') || '';
            const complete = await img.evaluate(el => el.complete);
            const naturalWidth = await img.evaluate(el => el.naturalWidth);
            const naturalHeight = await img.evaluate(el => el.naturalHeight);
            const visible = await img.isVisible();
            
            imageLoadResults.push({
                src: src.substring(0, 60),
                alt,
                loaded: complete && naturalWidth > 0,
                visible,
                dimensions: `${naturalWidth}x${naturalHeight}`
            });
        }
        
        const brokenImages = imageLoadResults.filter(img => !img.loaded && img.visible);
        const loadedImages = imageLoadResults.filter(img => img.loaded);
        
        testResults.results.imageLoading = {
            status: brokenImages.length === 0 ? 'PASS' : 'PARTIAL',
            totalImages: allImages.length,
            loadedImages: loadedImages.length,
            brokenImages: brokenImages.length,
            loadSuccessRate: `${((loadedImages.length / allImages.length) * 100).toFixed(1)}%`,
            sampleImages: imageLoadResults.slice(0, 10)
        };

        await imageContext.close();

        // 6. Console Error Test
        console.log('⚠️ Testing Console Errors...');
        const errorContext = await browser.newContext();
        const errorPage = await errorContext.newPage();
        
        const jsErrors = [];
        const networkErrors = [];
        
        errorPage.on('pageerror', error => {
            jsErrors.push(error.message);
        });
        
        errorPage.on('console', msg => {
            if (msg.type() === 'error') {
                const text = msg.text();
                if (text.includes('Failed to load resource') || text.includes('net::')) {
                    networkErrors.push(text);
                }
            }
        });
        
        await errorPage.goto('https://baby-shower-qr-app.vercel.app', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(3000);
        
        testResults.results.consoleErrors = {
            status: jsErrors.length === 0 ? 'PASS' : 'FAIL',
            jsErrors,
            networkErrors,
            totalJsErrors: jsErrors.length,
            totalNetworkErrors: networkErrors.length,
            errorTypes: [...new Set([...jsErrors.map(e => e.split(':')[0]), ...networkErrors.map(e => e.split(':')[0])])]
        };

        await errorContext.close();

        // 7. Cross-Section Test
        console.log('🔄 Testing Cross-Sections...');
        const sectionContext = await browser.newContext();
        const sectionPage = await sectionContext.newPage();
        
        await sectionPage.goto('https://baby-shower-qr-app.vercel.app', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1000);
        
        // Get page content to understand structure
        const pageContent = await sectionPage.content();
        
        // Look for common section patterns
        const sectionPatterns = [
            { name: 'Guestbook', patterns: ['guestbook', 'Guestbook'] },
            { name: 'Baby Pool', patterns: ['pool', 'Pool', 'baby-pool'] },
            { name: 'Quiz', patterns: ['quiz', 'Quiz'] },
            { name: 'Advice', patterns: ['advice', 'Advice'] },
            { name: 'Voting', patterns: ['voting', 'Voting', 'vote'] },
            { name: 'Mom vs Dad', patterns: ['mom-dad', 'momvsdad', 'MomDad'] },
            { name: 'Who Would Rather', patterns: ['who-would-rather', 'WhoWouldRather'] }
        ];
        
        const sectionResults = [];
        for (const section of sectionPatterns) {
            const found = section.patterns.some(pattern => pageContent.includes(pattern));
            sectionResults.push({
                name: section.name,
                status: found ? 'FOUND' : 'NOT_FOUND',
                patterns: section.patterns
            });
        }
        
        testResults.results.crossSections = {
            status: sectionResults.filter(s => s.status === 'NOT_FOUND').length === 0 ? 'PASS' : 'PARTIAL',
            sections: sectionResults,
            foundCount: sectionResults.filter(s => s.status === 'FOUND').length,
            totalSections: sectionPatterns.length
        };

        await sectionContext.close();

        // 8. Visual Quality Test
        console.log('🎨 Testing Visual Quality...');
        const visualContext = await browser.newContext();
        const visualPage = await visualContext.newPage();
        
        await visualPage.goto('https://baby-shower-qr-app.vercel.app', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1000);
        
        // Check for animation concerns
        const animatedElements = await visualPage.$$('[class*="bounce"], [class*="shake"], [class*="wiggle"], [class*="jiggle"]');
        
        // Check color contrast concerns (basic check)
        const textElements = await visualPage.$$('p, h1, h2, h3, h4, h5, h6, span, li');
        const lightTextOnLight = [];
        
        for (const el of textElements.slice(0, 20)) {
            const bgColor = await el.evaluate(e => {
                const style = window.getComputedStyle(e);
                return style.backgroundColor;
            });
            const color = await el.evaluate(e => {
                const style = window.getComputedStyle(e);
                return style.color;
            });
            
            if (bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                lightTextOnLight.push({ color, bgColor });
            }
        }
        
        testResults.results.visualQuality = {
            status: animatedElements.length === 0 ? 'PASS' : 'CAUTION',
            animationElements: animatedElements.length,
            potentialContrastIssues: lightTextOnLight.length,
            hasBouncingAnimations: animatedElements.length > 0,
            overallAssessment: animatedElements.length === 0 ? 'Good' : 'Review animations for accessibility'
        };

        await visualContext.close();

        console.log('\n✅ QA Testing Complete!');
        return testResults;

    } catch (error) {
        console.error('❌ QA Test Error:', error);
        testResults.error = error.message;
        return testResults;
    } finally {
        await browser.close();
    }
}

// Run the test
runTargetedQA().then(results => {
    console.log('\n📋 Final QA Results:');
    console.log(JSON.stringify(results, null, 2));
    
    // Save results to file
    const fs = require('fs');
    fs.writeFileSync('C:\\Project\\Baby_Shower\\test-results\\qa-results.json', JSON.stringify(results, null, 2));
    console.log('💾 Results saved to test-results/qa-results.json');
}).catch(error => {
    console.error('Fatal Error:', error);
});
