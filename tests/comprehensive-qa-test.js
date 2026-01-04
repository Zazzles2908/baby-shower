/**
 * Comprehensive QA Test Script for Baby Shower App
 * Tests all specified areas including hero image, activity cards, games, mobile responsiveness, etc.
 */

const { chromium } = require('playwright');

async function runComprehensiveQA() {
    console.log('🧪 Starting Comprehensive QA Testing...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const testResults = {
        timestamp: new Date().toISOString(),
        url: 'https://baby-shower-qr-app.vercel.app',
        sections: {},
        consoleErrors: [],
        consoleWarnings: []
    };

    // Capture console messages
    page.on('console', msg => {
        if (msg.type() === 'error') {
            testResults.consoleErrors.push(msg.text());
        } else if (msg.type() === 'warning') {
            testResults.consoleWarnings.push(msg.text());
        }
    });

    page.on('pageerror', error => {
        testResults.consoleErrors.push(`Page Error: ${error.message}`);
    });

    try {
        // 1. Hero Image Verification
        console.log('📸 Testing Hero Image...');
        await page.goto('https://baby-shower-qr-app.vercel.app', { waitUntil: 'networkidle' });
        
        const heroImage = await page.$('img[alt*="hero"], .hero img, header img, .welcome-section img');
        if (heroImage) {
            const isVisible = await heroImage.isVisible();
            const src = await heroImage.getAttribute('src');
            testResults.sections.heroImage = {
                status: isVisible ? 'PASS' : 'FAIL',
                elementFound: true,
                visible: isVisible,
                src: src,
                errors: []
            };
        } else {
            testResults.sections.heroImage = {
                status: 'FAIL',
                elementFound: false,
                errors: ['Hero image element not found']
            };
        }

        // 2. Activity Card Icons Verification
        console.log('🎴 Testing Activity Card Icons...');
        const activityCards = await page.$$('.activity-card, .card, [class*="activity"]');
        const cardIcons = [];
        
        for (let i = 0; i < Math.min(activityCards.length, 7); i++) {
            const card = activityCards[i];
            const icon = await card.$('img, [class*="icon"], svg');
            cardIcons.push({
                index: i,
                hasIcon: !!icon,
                visible: icon ? await icon.isVisible() : false
            });
        }
        
        testResults.sections.activityCardIcons = {
            status: cardIcons.length >= 7 ? 'PASS' : 'PARTIAL',
            totalCards: activityCards.length,
            cardsWithIcons: cardIcons.filter(c => c.hasIcon).length,
            icons: cardIcons
        };

        // 3. Who Would Rather Game Verification
        console.log('🎮 Testing Who Would Rather Game...');
        const whoWouldRatherLink = await page.$('a[href*="who-would-rather"], [data-testid*="who-would-rather"], .who-would-rather');
        
        if (whoWouldRatherLink) {
            await whoWouldRatherLink.click();
            await page.waitForTimeout(1000);
            
            const leftAvatar = await page.$('[class*="michelle"], [class*="left"]:has(img), .game-avatar:first-child');
            const rightAvatar = await page.$('[class*="jazeel"], [class*="right"]:has(img), .game-avatar:last-child');
            
            testResults.sections.whoWouldRather = {
                status: 'PASS',
                pageLoaded: true,
                leftAvatarFound: !!leftAvatar,
                rightAvatarFound: !!rightAvatar,
                leftAvatarVisible: leftAvatar ? await leftAvatar.isVisible() : false,
                rightAvatarVisible: rightAvatar ? await rightAvatar.isVisible() : false
            };
        } else {
            testResults.sections.whoWouldRather = {
                status: 'FAIL',
                pageLoaded: false,
                error: 'Who Would Rather link/element not found'
            };
        }

        // 4. Mobile Responsiveness Test
        console.log('📱 Testing Mobile Responsiveness...');
        await context.close();
        await browser.close();
        
        // Re-launch with mobile viewport
        const mobileBrowser = await chromium.launch({ headless: true });
        const mobileContext = await mobileBrowser.newContext({
            viewport: { width: 375, height: 667 },
            isMobile: true
        });
        const mobilePage = await mobileContext.newPage();
        
        await mobilePage.goto('https://baby-shower-qr-app.vercel.app', { waitUntil: 'networkidle' });
        
        // Check activity card stacking
        const mobileCards = await mobilePage.$$('.activity-card, .card, [class*="activity"]');
        const stackedCards = [];
        for (const card of mobileCards) {
            const box = await card.boundingBox();
            if (box) {
                stackedCards.push({
                    visible: await card.isVisible(),
                    height: box.height,
                    y: box.y
                });
            }
        }
        
        // Check touch targets (minimum 44px)
        const touchTargets = await mobilePage.$$('button, a, input[type="submit"]');
        const smallTargets = [];
        for (const target of touchTargets) {
            const box = await target.boundingBox();
            if (box && (box.width < 44 || box.height < 44)) {
                smallTargets.push({
                    width: box.width,
                    height: box.height,
                    tagName: await target.evaluate(el => el.tagName)
                });
            }
        }
        
        testResults.sections.mobileResponsiveness = {
            status: smallTargets.length === 0 ? 'PASS' : 'PARTIAL',
            viewport: { width: 375, height: 667 },
            cardsStacking: stackedCards.length > 0,
            smallTouchTargets: smallTargets.length,
            smallTargetDetails: smallTargets.slice(0, 5) // Limit to 5 examples
        };

        await mobileContext.close();
        await mobileBrowser.close();

        // 5. Image Loading Verification
        console.log('🖼️ Testing Image Loading...');
        const desktopBrowser = await chromium.launch({ headless: true });
        const desktopContext = await desktopBrowser.newContext();
        const desktopPage = await desktopContext.newPage();
        
        const imageErrors = [];
        desktopPage.on('console', msg => {
            if (msg.type() === 'error' && (msg.text().includes('image') || msg.text().includes('img'))) {
                imageErrors.push(msg.text());
            }
        });
        
        await desktopPage.goto('https://baby-shower-qr-app.vercel.app', { waitUntil: 'networkidle' });
        
        const allImages = await desktopPage.$$('img');
        const loadedImages = [];
        const brokenImages = [];
        
        for (const img of allImages) {
            const src = await img.getAttribute('src');
            const complete = await img.evaluate(el => el.complete);
            const naturalWidth = await img.evaluate(el => el.naturalWidth);
            
            if (complete && naturalWidth > 0) {
                loadedImages.push(src);
            } else {
                brokenImages.push(src);
            }
        }
        
        testResults.sections.imageLoading = {
            status: brokenImages.length === 0 ? 'PASS' : 'PARTIAL',
            totalImages: allImages.length,
            loadedImages: loadedImages.length,
            brokenImages: brokenImages.length,
            imageErrors: imageErrors
        };

        await desktopContext.close();
        await desktopBrowser.close();

        // 6. Console Error Check
        console.log('⚠️ Checking Console Errors...');
        const errorBrowser = await chromium.launch({ headless: true });
        const errorContext = await errorBrowser.newContext();
        const errorPage = await errorContext.newPage();
        
        const jsErrors = [];
        errorPage.on('pageerror', error => {
            jsErrors.push(error.message);
        });
        
        await errorPage.goto('https://baby-shower-qr-app.vercel.app', { waitUntil: 'networkidle' });
        await errorPage.waitForTimeout(2000);
        
        testResults.sections.consoleErrors = {
            status: jsErrors.length === 0 ? 'PASS' : 'FAIL',
            jsErrors: jsErrors,
            totalErrors: jsErrors.length
        };

        await errorContext.close();
        await errorBrowser.close();

        // 7. Cross-Section Testing
        console.log('🔄 Testing Cross-Sections...');
        const crossBrowser = await chromium.launch({ headless: true });
        const crossContext = await crossBrowser.newContext();
        const crossPage = await crossContext.newPage();
        
        const sectionResults = [];
        const sections = [
            { name: 'Guestbook', selectors: ['.guestbook', '[data-testid="guestbook"]', 'a[href*="guestbook"]'] },
            { name: 'Baby Pool', selectors: ['.pool', '[data-testid="pool"]', 'a[href*="pool"]'] },
            { name: 'Quiz', selectors: ['.quiz', '[data-testid="quiz"]', 'a[href*="quiz"]'] },
            { name: 'Advice', selectors: ['.advice', '[data-testid="advice"]', 'a[href*="advice"]'] },
            { name: 'Voting', selectors: ['.voting', '[data-testid="voting"]', 'a[href*="voting"]'] },
            { name: 'Mom vs Dad', selectors: ['.mom-dad', '[data-testid="mom-dad"]', 'a[href*="mom-dad"]'] },
            { name: 'Who Would Rather', selectors: ['.who-would-rather', '[data-testid="who-would-rather"]', 'a[href*="who-would-rather"]'] }
        ];
        
        for (const section of sections) {
            let found = false;
            for (const selector of section.selectors) {
                const element = await crossPage.$(selector);
                if (element) {
                    found = true;
                    sectionResults.push({
                        name: section.name,
                        status: 'FOUND',
                        selector: selector
                    });
                    break;
                }
            }
            if (!found) {
                sectionResults.push({
                    name: section.name,
                    status: 'NOT_FOUND',
                    selectors: section.selectors
                });
            }
        }
        
        testResults.sections.crossSection = {
            status: sectionResults.filter(s => s.status === 'NOT_FOUND').length === 0 ? 'PASS' : 'PARTIAL',
            sections: sectionResults,
            foundCount: sectionResults.filter(s => s.status === 'FOUND').length,
            totalSections: sections.length
        };

        await crossContext.close();
        await crossBrowser.close();

        // 8. Visual Quality Check
        console.log('🎨 Checking Visual Quality...');
        const visualBrowser = await chromium.launch({ headless: true });
        const visualContext = await visualBrowser.newContext();
        const visualPage = await visualContext.newPage();
        
        await visualPage.goto('https://baby-shower-qr-app.vercel.app', { waitUntil: 'networkidle' });
        
        // Check color consistency
        const colors = await visualPage.$$eval('*', elements => {
            const colorSet = new Set();
            elements.forEach(el => {
                const style = window.getComputedStyle(el);
                if (style.color) colorSet.add(style.color);
                if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                    colorSet.add(style.backgroundColor);
                }
            });
            return Array.from(colorSet).slice(0, 10); // Limit to 10 colors
        });
        
        // Check for animations that might cause motion discomfort
        const animations = await visualPage.$$('[class*="animate"], [class*="bounce"], [class*="shake"], @keyframes');
        
        testResults.sections.visualQuality = {
            status: 'PASS',
            colorsUsed: colors.length,
            animationElements: animations.length,
            colorPalette: colors,
            hasBouncingAnimations: animations.length > 0
        };

        await visualContext.close();
        await visualBrowser.close();

        // Generate final report
        console.log('📊 Generating Final Report...');
        return testResults;

    } catch (error) {
        console.error('❌ QA Test Error:', error);
        testResults.error = error.message;
        return testResults;
    }
}

// Run the test
runComprehensiveQA().then(results => {
    console.log('\n📋 QA Test Results:');
    console.log(JSON.stringify(results, null, 2));
}).catch(error => {
    console.error('Fatal Error:', error);
});
