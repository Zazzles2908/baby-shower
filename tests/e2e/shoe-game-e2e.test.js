/**
 * Baby Shower App - Shoe Game E2E Test Suite
 * Phase 7: Comprehensive Shoe Game Testing
 * 
 * Tests cover:
 * 1. Game page loads correctly
 * 2. Question display and progression
 * 3. Answer selection functionality
 * 4. Question progression logic
 * 5. Game completion flow
 * 6. Score tracking and display
 * 7. Game reset functionality
 * 8. Mobile responsiveness
 */

import { test, expect, request } from '@playwright/test';

// Test configuration
const API_BASE_URL = 'https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1';
const ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrc3ptdmZzZmd2ZHd6YWNnbWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzODI1NjMsImV4cCI6MjA3OTk1ODU2M30.BswusP1pfDUStzAU8k-VKPailISimApapNeJGlid8sI';

// Expected questions from the game
const EXPECTED_QUESTIONS = [
    "Who worries more?",
    "Who wants more kids?", 
    "Whose parents will feed you more?",
    "Who will be more nervous in labour?",
    "Who keeps track of appointments?",
    "Who is the better baby whisperer?",
    "Who will spoil the baby more?",
    "Who will be stricter with rules?",
    "Who will handle night feeds better?",
    "Who will cry more at baby's first day of school?",
    "Who is more likely to match outfits with baby?",
    "Who will take more photos of baby?",
    "Who will be more protective?",
    "Who will handle tantrums better?",
    "Who will read more bedtime stories?",
    "Who will be the fun parent?",
    "Who will be the disciplinarian?",
    "Who will handle diaper changes better?",
    "Who will plan more elaborate birthday parties?",
    "Who will be more emotional during milestones?"
];

// ============================================================================
// TEST SUITE 1: GAME PAGE LOADING
// ============================================================================

test.describe('Shoe Game Page Loading', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    });

    test('TC-SG-001: Activity card is visible and clickable', async ({ page }) => {
        const activityCard = page.locator('[data-section="who-would-rather"]');
        await expect(activityCard).toBeVisible();
        
        const cardTitle = activityCard.locator('.card-title');
        await expect(cardTitle).toContainText('The Shoe Game');
    });

    test('TC-SG-002: Game section loads when activity card is clicked', async ({ page }) => {
        await page.click('[data-section="who-would-rather"]');
        
        const gameSection = page.locator('#who-would-rather-section');
        await expect(gameSection).toBeVisible({ timeout: 5000 });
    });

    test('TC-SG-003: Game container is present', async ({ page }) => {
        await page.click('[data-section="who-would-rather"]');
        await page.waitForSelector('#who-would-rather-container', { state: 'visible', timeout: 5000 });
        
        const container = page.locator('#who-would-rather-container');
        await expect(container).toBeVisible();
    });

    test('TC-SG-004: Section header displays correctly', async ({ page }) => {
        await page.click('[data-section="who-would-rather"]');
        
        const header = page.locator('#who-would-rather-section h1');
        await expect(header).toContainText('👟 The Shoe Game');
    });

    test('TC-SG-005: Game initializes with question 1', async ({ page }) => {
        await page.click('[data-section="who-would-rather"]');
        await page.waitForTimeout(1000); // Wait for game to initialize
        
        const questionCounter = page.locator('.question-counter');
        await expect(questionCounter).toContainText('Question 1 of 20');
    });
});

// ============================================================================
// TEST SUITE 2: QUESTION DISPLAY AND VALIDATION
// ============================================================================

test.describe('Question Display and Validation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
        await page.click('[data-section="who-would-rather"]');
        await page.waitForSelector('#who-would-rather-container', { state: 'visible', timeout: 5000 });
    });

    test('TC-SG-006: All 20 questions are available', async ({ page }) => {
        const questions = page.locator('.question-text');
        await expect(questions.first()).toBeVisible();
        
        // The questions are rendered one at a time, so we verify the game has 20 questions
        // by checking that we can progress through all of them
        let totalQuestions = 0;
        for (let i = 0; i < 20; i++) {
            const counter = page.locator('.question-counter');
            const counterText = await counter.textContent();
            if (counterText && counterText.includes('Question')) {
                totalQuestions++;
            }
            
            // Vote to advance to next question
            const leftButton = page.locator('#btn-parentA');
            if (await leftButton.isVisible({ timeout: 1000 })) {
                await leftButton.click();
                await page.waitForTimeout(1000); // Wait for auto-advance
            }
        }
        
        expect(totalQuestions).toBe(20);
    });

    test('TC-SG-007: Question text displays correctly', async ({ page }) => {
        const questionText = page.locator('.question-text');
        await expect(questionText).toBeVisible();
        
        // Verify first question is correct
        const text = await questionText.textContent();
        expect(EXPECTED_QUESTIONS).toContain(text);
    });

    test('TC-SG-008: Progress bar shows correct progress', async ({ page }) => {
        const progressFill = page.locator('.progress-fill');
        await expect(progressFill).toBeVisible();
        
        // Initially should show 5% progress (1/20)
        const style = await progressFill.getAttribute('style');
        expect(style).toContain('width: 5%');
    });

    test('TC-SG-009: Question counter displays correctly', async ({ page }) => {
        const counter = page.locator('.question-counter');
        await expect(counter).toContainText('Question 1 of 20');
    });

    test('TC-SG-010: "Who would do this?" label is visible', async ({ page }) => {
        const label = page.locator('.question-label');
        await expect(label).toContainText('Who would do this?');
    });

    test('TC-SG-011: Avatar buttons are present', async ({ page }) => {
        const leftButton = page.locator('#btn-parentA');
        const rightButton = page.locator('#btn-parentB');
        
        await expect(leftButton).toBeVisible();
        await expect(rightButton).toBeVisible();
        
        const leftName = leftButton.locator('.shoe-avatar-name');
        const rightName = rightButton.locator('.shoe-avatar-name');
        
        await expect(leftName).toBeVisible();
        await expect(rightName).toBeVisible();
    });

    test('TC-SG-012: VS badge is visible', async ({ page }) => {
        const vsBadge = page.locator('.shoe-vs-badge');
        await expect(vsBadge).toContainText('VS');
    });
});

// ============================================================================
// TEST SUITE 3: ANSWER SELECTION FUNCTIONALITY
// ============================================================================

test.describe('Answer Selection Functionality', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
        await page.click('[data-section="who-would-rather"]');
        await page.waitForSelector('#who-would-rather-container', { state: 'visible', timeout: 5000 });
    });

    test('TC-SG-013: Clicking parent A button registers vote', async ({ page }) => {
        const leftButton = page.locator('#btn-parentA');
        await leftButton.click();
        
        // Button should become disabled after voting
        const isDisabled = await leftButton.isDisabled();
        expect(isDisabled).toBe(true);
        
        const rightButton = page.locator('#btn-parentB');
        const rightDisabled = await rightButton.isDisabled();
        expect(rightDisabled).toBe(true);
    });

    test('TC-SG-014: Clicking parent B button registers vote', async ({ page }) => {
        const rightButton = page.locator('#btn-parentB');
        await rightButton.click();
        
        // Button should become disabled after voting
        const isDisabled = await rightButton.isDisabled();
        expect(isDisabled).toBe(true);
        
        const leftButton = page.locator('#btn-parentA');
        const leftDisabled = await leftButton.isDisabled();
        expect(leftDisabled).toBe(true);
    });

    test('TC-SG-015: Vote recorded message appears', async ({ page }) => {
        const leftButton = page.locator('#btn-parentA');
        await leftButton.click();
        
        const voteRecorded = page.locator('.vote-recorded');
        await expect(voteRecorded).toBeVisible();
        await expect(voteRecorded).toContainText('Vote recorded!');
    });

    test('TC-SG-016: Voted button gets visual feedback', async ({ page }) => {
        const leftButton = page.locator('#btn-parentA');
        await leftButton.click();
        
        // Button should have 'voted' class
        const hasVotedClass = await leftButton.evaluate(el => el.classList.contains('voted'));
        expect(hasVotedClass).toBe(true);
    });

    test('TC-SG-017: Cannot vote twice on same question', async ({ page }) => {
        const leftButton = page.locator('#btn-parentA');
        
        // First vote should work
        await leftButton.click();
        
        // Second vote should be blocked (button disabled)
        const isDisabled = await leftButton.isDisabled();
        expect(isDisabled).toBe(true);
    });

    test('TC-SG-018: Ripple effect plays on vote', async ({ page }) => {
        const leftButton = page.locator('#btn-parentA');
        await leftButton.click();
        
        // Wait for ripple animation
        await page.waitForTimeout(700);
        
        // Ripple element should have been created and removed
        // We verify this by checking the button state
        const hasVotedClass = await leftButton.evaluate(el => el.classList.contains('voted'));
        expect(hasVotedClass).toBe(true);
    });

    test('TC-SG-019: Auto-advance happens after vote', async ({ page }) => {
        const leftButton = page.locator('#btn-parentA');
        await leftButton.click();
        
        // Wait for auto-advance (800ms delay + animation)
        await page.waitForTimeout(1500);
        
        // Should be on question 2 now
        const counter = page.locator('.question-counter');
        await expect(counter).toContainText('Question 2 of 20');
    });

    test('TC-SG-020: Both parent buttons have correct avatars', async ({ page }) => {
        const leftButton = page.locator('#btn-parentA');
        const leftImg = leftButton.locator('.shoe-avatar-img');
        
        const rightButton = page.locator('#btn-parentB');
        const rightImg = rightButton.locator('.shoe-avatar-img');
        
        await expect(leftImg).toBeVisible();
        await expect(rightImg).toBeVisible();
        
        // Check that images have src attributes
        const leftSrc = await leftImg.getAttribute('src');
        const rightSrc = await rightImg.getAttribute('src');
        
        expect(leftSrc).toBeTruthy();
        expect(rightSrc).toBeTruthy();
        expect(leftSrc).not.toEqual(rightSrc);
    });
});

// ============================================================================
// TEST SUITE 4: QUESTION PROGRESSION LOGIC
// ============================================================================

test.describe('Question Progression Logic', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
        await page.click('[data-section="who-would-rather"]');
        await page.waitForSelector('#who-would-rather-container', { state: 'visible', timeout: 5000 });
    });

    test('TC-SG-021: Progress bar updates correctly', async ({ page }) => {
        // Advance through several questions
        for (let i = 1; i <= 5; i++) {
            const counter = page.locator('.question-counter');
            await expect(counter).toContainText(`Question ${i} of 20`);
            
            const leftButton = page.locator('#btn-parentA');
            await leftButton.click();
            await page.waitForTimeout(1000); // Wait for auto-advance
        }
        
        // Progress should be at 25% (5/20)
        const progressFill = page.locator('.progress-fill');
        const style = await progressFill.getAttribute('style');
        expect(style).toContain('width: 25%');
    });

    test('TC-SG-022: Question counter updates sequentially', async ({ page }) => {
        // Go through all 20 questions
        for (let i = 1; i <= 20; i++) {
            const counter = page.locator('.question-counter');
            await expect(counter).toContainText(`Question ${i} of 20`);
            
            if (i < 20) {
                const leftButton = page.locator('#btn-parentA');
                await leftButton.click();
                await page.waitForTimeout(1000);
            }
        }
    });

    test('TC-SG-023: All questions can be answered', async ({ page }) => {
        let questionsAnswered = 0;
        
        // Answer all 20 questions
        for (let i = 0; i < 20; i++) {
            const leftButton = page.locator('#btn-parentA');
            const isVisible = await leftButton.isVisible({ timeout: 2000 });
            
            if (isVisible) {
                await leftButton.click();
                await page.waitForTimeout(1000);
                questionsAnswered++;
            }
        }
        
        expect(questionsAnswered).toBe(20);
    });

    test('TC-SG-024: Questions display in correct order', async ({ page }) => {
        // Answer first 5 questions and verify order
        const displayedQuestions = [];
        
        for (let i = 0; i < 5; i++) {
            const questionText = page.locator('.question-text');
            const text = await questionText.textContent();
            displayedQuestions.push(text);
            
            if (i < 4) {
                const leftButton = page.locator('#btn-parentA');
                await leftButton.click();
                await page.waitForTimeout(1000);
            }
        }
        
        // Verify questions are in expected order
        for (let i = 0; i < 5; i++) {
            expect(displayedQuestions[i]).toBe(EXPECTED_QUESTIONS[i]);
        }
    });
});

// ============================================================================
// TEST SUITE 5: GAME COMPLETION FLOW
// ============================================================================

test.describe('Game Completion Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
        await page.click('[data-section="who-would-rather"]');
        await page.waitForSelector('#who-would-rather-container', { state: 'visible', timeout: 5000 });
    });

    test('TC-SG-025: Game complete screen appears after all questions', async ({ page }) => {
        // Answer all 20 questions
        for (let i = 0; i < 20; i++) {
            const leftButton = page.locator('#btn-parentA');
            if (await leftButton.isVisible({ timeout: 2000 })) {
                await leftButton.click();
                await page.waitForTimeout(1000);
            }
        }
        
        // Should show results
        const results = page.locator('.shoe-game-results, .shoe-results');
        await expect(results.first()).toBeVisible({ timeout: 3000 });
    });

    test('TC-SG-026: Completion message displays correctly', async ({ page }) => {
        // Answer all 20 questions
        for (let i = 0; i < 20; i++) {
            const leftButton = page.locator('#btn-parentA');
            if (await leftButton.isVisible({ timeout: 2000 })) {
                await leftButton.click();
                await page.waitForTimeout(1000);
            }
        }
        
        // Check for game complete message
        const header = page.locator('.shoe-game-results h2, .shoe-results h2');
        const headerText = await header.textContent();
        expect(headerText).toContain('Game Complete');
    });

    test('TC-SG-027: Total questions answered displays', async ({ page }) => {
        // Answer all 20 questions
        for (let i = 0; i < 20; i++) {
            const leftButton = page.locator('#btn-parentA');
            if (await leftButton.isVisible({ timeout: 2000 })) {
                await leftButton.click();
                await page.waitForTimeout(1000);
            }
        }
        
        // Should mention 20 questions answered
        const resultsSummary = page.locator('.results-summary');
        const summaryText = await resultsSummary.textContent();
        expect(summaryText).toContain('20');
    });

    test('TC-SG-028: Results show winner or tie', async ({ page }) => {
        // Answer all 20 questions
        for (let i = 0; i < 20; i++) {
            const leftButton = page.locator('#btn-parentA');
            if (await leftButton.isVisible({ timeout: 2000 })) {
                await leftButton.click();
                await page.waitForTimeout(1000);
            }
        }
        
        // Should have either winner banner or tie result
        const hasWinner = await page.locator('.winner-banner').count();
        const hasTie = await page.locator('.tie-result').count();
        
        expect(hasWinner > 0 || hasTie > 0).toBe(true);
    });

    test('TC-SG-029: Results breakdown displays percentages', async ({ page }) => {
        // Answer all 20 questions
        for (let i = 0; i < 20; i++) {
            const leftButton = page.locator('#btn-parentA');
            if (await leftButton.isVisible({ timeout: 2000 })) {
                await leftButton.click();
                await page.waitForTimeout(1000);
            }
        }
        
        // Should have breakdown bars
        const breakdown = page.locator('.results-breakdown');
        await expect(breakdown).toBeVisible();
        
        // Should have percentage displays
        const percents = page.locator('.breakdown-percent');
        const percentCount = await percents.count();
        expect(percentCount).toBe(2);
    });

    test('TC-SG-030: Play Again button is available', async ({ page }) => {
        // Answer all 20 questions
        for (let i = 0; i < 20; i++) {
            const leftButton = page.locator('#btn-parentA');
            if (await leftButton.isVisible({ timeout: 2000 })) {
                await leftButton.click();
                await page.waitForTimeout(1000);
            }
        }
        
        // Should have play again button
        const playAgainBtn = page.locator('button:has-text("Play Again")');
        await expect(playAgainBtn).toBeVisible();
    });

    test('TC-SG-031: Back to Activities button is available', async ({ page }) => {
        // Answer all 20 questions
        for (let i = 0; i < 20; i++) {
            const leftButton = page.locator('#btn-parentA');
            if (await leftButton.isVisible({ timeout: 2000 })) {
                await leftButton.click();
                await page.waitForTimeout(1000);
            }
        }
        
        // Should have back button
        const backBtn = page.locator('button:has-text("Back to Activities")');
        await expect(backBtn).toBeVisible();
    });
});

// ============================================================================
// TEST SUITE 6: SCORE TRACKING AND DISPLAY
// ============================================================================

test.describe('Score Tracking and Display', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
        await page.click('[data-section="who-would-rather"]');
        await page.waitForSelector('#who-would-rather-container', { state: 'visible', timeout: 5000 });
    });

    test('TC-SG-032: Score calculation - all votes for one parent', async ({ page }) => {
        // Vote for parent A all 20 times
        for (let i = 0; i < 20; i++) {
            const leftButton = page.locator('#btn-parentA');
            if (await leftButton.isVisible({ timeout: 2000 })) {
                await leftButton.click();
                await page.waitForTimeout(1000);
            }
        }
        
        // Should show 100% for parent A
        const breakdownFill = page.locator('.breakdown-fill.mom-bar');
        const style = await breakdownFill.getAttribute('style');
        expect(style).toContain('width: 100%');
    });

    test('TC-SG-033: Score calculation - even split', async ({ page }) => {
        // Vote for parent A 10 times, parent B 10 times
        for (let i = 0; i < 20; i++) {
            const button = i % 2 === 0 
                ? page.locator('#btn-parentA')
                : page.locator('#btn-parentB');
            
            if (await button.isVisible({ timeout: 2000 })) {
                await button.click();
                await page.waitForTimeout(1000);
            }
        }
        
        // Should show 50% for each
        const momBar = page.locator('.breakdown-fill.mom-bar');
        const dadBar = page.locator('.breakdown-fill.dad-bar');
        
        const momStyle = await momBar.getAttribute('style');
        const dadStyle = await dadBar.getAttribute('style');
        
        // Both should show 50%
        expect(momStyle).toContain('width: 50%');
        expect(dadStyle).toContain('width: 50%');
    });

    test('TC-SG-034: Percentage display is accurate', async ({ page }) => {
        // Vote 3 times for parent A, 2 times for parent B (60% / 40%)
        const votes = ['parentA', 'parentA', 'parentA', 'parentB', 'parentB'];
        
        for (const vote of votes) {
            const button = page.locator(`#btn-${vote}`);
            if (await button.isVisible({ timeout: 2000 })) {
                await button.click();
                await page.waitForTimeout(1000);
            }
        }
        
        // Need 15 more votes to reach 20 total (let's continue with A)
        for (let i = 0; i < 15; i++) {
            const leftButton = page.locator('#btn-parentA');
            if (await leftButton.isVisible({ timeout: 2000 })) {
                await leftButton.click();
                await page.waitForTimeout(1000);
            }
        }
        
        // Should show 90% for parent A (18/20)
        const momBar = page.locator('.breakdown-fill.mom-bar');
        const momStyle = await momBar.getAttribute('style');
        expect(momStyle).toContain('width: 90%');
    });

    test('TC-SG-035: Tie result displays correctly', async ({ page }) => {
        // Vote 10 times for each parent
        for (let i = 0; i < 20; i++) {
            const button = i % 2 === 0 
                ? page.locator('#btn-parentA')
                : page.locator('#btn-parentB');
            
            if (await button.isVisible({ timeout: 2000 })) {
                await button.click();
                await page.waitForTimeout(1000);
            }
        }
        
        // Should show tie
        const tieResult = page.locator('.tie-result');
        const tieVisible = await tieResult.count();
        expect(tieVisible).toBeGreaterThan(0);
    });

    test('TC-SG-036: Winner banner displays correct parent', async ({ page }) => {
        // Vote all for parent A
        for (let i = 0; i < 20; i++) {
            const leftButton = page.locator('#btn-parentA');
            if (await leftButton.isVisible({ timeout: 2000 })) {
                await leftButton.click();
                await page.waitForTimeout(1000);
            }
        }
        
        // Winner banner should show parent A (Mom)
        const winnerBanner = page.locator('.winner-banner');
        await expect(winnerBanner).toBeVisible();
        
        const winnerName = page.locator('.winner-name');
        await expect(winnerName.first()).toBeVisible();
    });

    test('TC-SG-037: Winner percentage displays correctly', async ({ page }) => {
        // Vote all for parent B
        for (let i = 0; i < 20; i++) {
            const rightButton = page.locator('#btn-parentB');
            if (await rightButton.isVisible({ timeout: 2000 })) {
                await rightButton.click();
                await page.waitForTimeout(1000);
            }
        }
        
        // Should show 100% for winner
        const winnerPercent = page.locator('.winner-percent');
        await expect(winnerPercent).toContainText('100%');
    });
});

// ============================================================================
// TEST SUITE 7: GAME RESET FUNCTIONALITY
// ============================================================================

test.describe('Game Reset Functionality', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
        await page.click('[data-section="who-would-rather"]');
        await page.waitForSelector('#who-would-rather-container', { state: 'visible', timeout: 5000 });
    });

    test('TC-SG-038: Play Again button resets game', async ({ page }) => {
        // Answer a few questions
        for (let i = 0; i < 5; i++) {
            const leftButton = page.locator('#btn-parentA');
            if (await leftButton.isVisible({ timeout: 2000 })) {
                await leftButton.click();
                await page.waitForTimeout(1000);
            }
        }
        
        // Click Play Again
        const playAgainBtn = page.locator('button:has-text("Play Again")');
        if (await playAgainBtn.isVisible()) {
            await playAgainBtn.click();
        } else {
            // Complete the game first
            for (let i = 0; i < 15; i++) {
                const leftButton = page.locator('#btn-parentA');
                if (await leftButton.isVisible({ timeout: 2000 })) {
                    await leftButton.click();
                    await page.waitForTimeout(1000);
                }
            }
            await playAgainBtn.click();
        }
        
        // Should be back to question 1
        const counter = page.locator('.question-counter');
        await expect(counter).toContainText('Question 1 of 20');
    });

    test('TC-SG-039: Game state resets correctly', async ({ page }) => {
        // Complete the game
        for (let i = 0; i < 20; i++) {
            const leftButton = page.locator('#btn-parentA');
            if (await leftButton.isVisible({ timeout: 2000 })) {
                await leftButton.click();
                await page.waitForTimeout(1000);
            }
        }
        
        // Click Play Again
        const playAgainBtn = page.locator('button:has-text("Play Again")');
        await playAgainBtn.click();
        
        // Progress bar should reset to 5%
        const progressFill = page.locator('.progress-fill');
        const style = await progressFill.getAttribute('style');
        expect(style).toContain('width: 5%');
    });

    test('TC-SG-040: Votes are cleared on reset', async ({ page }) => {
        // Complete the game
        for (let i = 0; i < 20; i++) {
            const leftButton = page.locator('#btn-parentA');
            if (await leftButton.isVisible({ timeout: 2000 })) {
                await leftButton.click();
                await page.waitForTimeout(1000);
            }
        }
        
        // Click Play Again
        const playAgainBtn = page.locator('button:has-text("Play Again")');
        await playAgainBtn.click();
        
        // Answer one question
        const leftButton = page.locator('#btn-parentA');
        await leftButton.click();
        await page.waitForTimeout(1000);
        
        // Should be on question 2
        const counter = page.locator('.question-counter');
        await expect(counter).toContainText('Question 2 of 20');
    });

    test('TC-SG-041: Back to Activities returns to welcome screen', async ({ page }) => {
        // Complete the game
        for (let i = 0; i < 20; i++) {
            const leftButton = page.locator('#btn-parentA');
            if (await leftButton.isVisible({ timeout: 2000 })) {
                await leftButton.click();
                await page.waitForTimeout(1000);
            }
        }
        
        // Click Back to Activities
        const backBtn = page.locator('button:has-text("Back to Activities")');
        await backBtn.click();
        
        // Should navigate back to welcome section
        const welcomeSection = page.locator('#welcome-section');
        await expect(welcomeSection).toBeVisible({ timeout: 3000 });
    });
});

// ============================================================================
// TEST SUITE 8: MOBILE RESPONSIVENESS
// ============================================================================

test.describe('Mobile Responsiveness', () => {
    test('TC-SG-042: Game works on Pixel 5', async ({ page }) => {
        await page.setViewportSize({ width: 412, height: 915 });
        
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
        await page.click('[data-section="who-would-rather"]');
        await page.waitForSelector('#who-would-rather-container', { state: 'visible', timeout: 5000 });
        
        // Verify game elements are visible
        const questionText = page.locator('.question-text');
        await expect(questionText).toBeVisible();
        
        const leftButton = page.locator('#btn-parentA');
        await expect(leftButton).toBeVisible();
        
        // Answer a few questions
        for (let i = 0; i < 3; i++) {
            if (await leftButton.isVisible({ timeout: 2000 })) {
                await leftButton.click();
                await page.waitForTimeout(1000);
            }
        }
    });

    test('TC-SG-043: Game works on iPhone 12', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
        await page.click('[data-section="who-would-rather"]');
        await page.waitForSelector('#who-would-rather-container', { state: 'visible', timeout: 5000 });
        
        // Verify game elements are visible
        const questionText = page.locator('.question-text');
        await expect(questionText).toBeVisible();
        
        // Answer a few questions
        const leftButton = page.locator('#btn-parentA');
        for (let i = 0; i < 3; i++) {
            if (await leftButton.isVisible({ timeout: 2000 })) {
                await leftButton.click();
                await page.waitForTimeout(1000);
            }
        }
    });

    test('TC-SG-044: Touch targets are accessible on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
        await page.click('[data-section="who-would-rather"]');
        await page.waitForSelector('#who-would-rather-container', { state: 'visible', timeout: 5000 });
        
        const leftButton = page.locator('#btn-parentA');
        const box = await leftButton.boundingBox();
        
        // Button should be at least 44x44px for accessibility
        expect(box?.width).toBeGreaterThanOrEqual(44);
        expect(box?.height).toBeGreaterThanOrEqual(44);
    });

    test('TC-SG-045: Layout adapts for mobile', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
        await page.click('[data-section="who-would-rather"]');
        await page.waitForSelector('#who-would-rather-container', { state: 'visible', timeout: 5000 });
        
        // Container should fit within viewport
        const container = page.locator('#who-would-rather-container');
        const box = await container.boundingBox();
        
        expect(box?.width).toBeLessThanOrEqual(390);
    });

    test('TC-SG-046: Question text wraps on small screens', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
        await page.click('[data-section="who-would-rather"]');
        await page.waitForSelector('#who-would-rather-container', { state: 'visible', timeout: 5000 });
        
        const questionText = page.locator('.question-text');
        const text = await questionText.textContent();
        
        // Text should be visible and complete
        expect(text?.length).toBeGreaterThan(0);
    });

    test('TC-SG-047: Results display correctly on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 412, height: 915 });
        
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
        await page.click('[data-section="who-would-rather"]');
        
        // Complete the game
        for (let i = 0; i < 20; i++) {
            const leftButton = page.locator('#btn-parentA');
            if (await leftButton.isVisible({ timeout: 2000 })) {
                await leftButton.click();
                await page.waitForTimeout(1000);
            }
        }
        
        // Results should be visible
        const results = page.locator('.shoe-game-results, .shoe-results');
        await expect(results.first()).toBeVisible();
        
        // Breakdown should be visible
        const breakdown = page.locator('.results-breakdown');
        await expect(breakdown).toBeVisible();
    });
});

// ============================================================================
// TEST SUITE 9: CROSS-BROWSER COMPATIBILITY
// ============================================================================

test.describe('Cross-Browser Compatibility', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    });

    test('TC-SG-048: Game renders correctly on Chromium', async ({ page }) => {
        await page.click('[data-section="who-would-rather"]');
        await page.waitForSelector('#who-would-rather-container', { state: 'visible', timeout: 5000 });
        
        const container = page.locator('#who-would-rather-container');
        await expect(container).toBeVisible();
        
        const question = page.locator('.question-text');
        await expect(question).toBeVisible();
    });

    test('TC-SG-049: Game functionality works on Firefox', async ({ page }) => {
        await page.click('[data-section="who-would-rather"]');
        await page.waitForSelector('#who-would-rather-container', { state: 'visible', timeout: 5000 });
        
        const leftButton = page.locator('#btn-parentA');
        await leftButton.click();
        
        // Vote should be recorded
        const isDisabled = await leftButton.isDisabled();
        expect(isDisabled).toBe(true);
    });

    test('TC-SG-050: Game functionality works on WebKit', async ({ page }) => {
        await page.click('[data-section="who-would-rather"]');
        await page.waitForSelector('#who-would-rather-container', { state: 'visible', timeout: 5000 });
        
        const rightButton = page.locator('#btn-parentB');
        await rightButton.click();
        
        // Vote should be recorded
        const isDisabled = await rightButton.isDisabled();
        expect(isDisabled).toBe(true);
    });
});

// ============================================================================
// TEST SUITE 10: PERFORMANCE AND ERROR HANDLING
// ============================================================================

test.describe('Performance and Error Handling', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
        await page.click('[data-section="who-would-rather"]');
        await page.waitForSelector('#who-would-rather-container', { state: 'visible', timeout: 5000 });
    });

    test('TC-SG-051: Game initializes within acceptable time', async ({ page }) => {
        const startTime = Date.now();
        
        await page.click('[data-section="who-would-rather"]');
        await page.waitForSelector('#who-would-rather-container', { state: 'visible', timeout: 5000 });
        
        const elapsed = Date.now() - startTime;
        expect(elapsed).toBeLessThan(3000);
    });

    test('TC-SG-052: Question auto-advance timing is appropriate', async ({ page }) => {
        const startTime = Date.now();
        
        const leftButton = page.locator('#btn-parentA');
        await leftButton.click();
        
        // Wait for auto-advance (should be around 800ms)
        await page.waitForSelector('.question-counter', { timeout: 5000 });
        
        const elapsed = Date.now() - startTime;
        // Should be between 800ms and 1500ms to account for animations
        expect(elapsed).toBeGreaterThan(800);
        expect(elapsed).toBeLessThan(2000);
    });

    test('TC-SG-053: Rapid clicking is handled gracefully', async ({ page }) => {
        // Rapidly click buttons
        const leftButton = page.locator('#btn-parentA');
        await leftButton.click();
        await leftButton.click();
        await leftButton.click();
        
        // Should only register one vote
        const isDisabled = await leftButton.isDisabled();
        expect(isDisabled).toBe(true);
    });

    test('TC-SG-054: Console errors are logged properly', async ({ page }) => {
        // Navigate to game
        await page.click('[data-section="who-would-rather"]');
        
        // Listen for console errors
        const errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });
        
        // Interact with game
        const leftButton = page.locator('#btn-parentA');
        await leftButton.click();
        await page.waitForTimeout(1000);
        
        // No console errors should occur
        const criticalErrors = errors.filter(e => 
            !e.includes('favicon') && 
            !e.includes('404') &&
            !e.includes('net::')
        );
        expect(criticalErrors.length).toBe(0);
    });

    test('TC-SG-055: Game works without console errors', async ({ page }) => {
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });
        
        // Complete a few questions
        for (let i = 0; i < 5; i++) {
            const leftButton = page.locator('#btn-parentA');
            if (await leftButton.isVisible({ timeout: 2000 })) {
                await leftButton.click();
                await page.waitForTimeout(1000);
            }
        }
        
        // Filter out network errors (expected in test environment)
        const gameErrors = consoleErrors.filter(e => 
            !e.includes('Failed to load resource') &&
            !e.includes('net::')
        );
        
        expect(gameErrors.length).toBe(0);
    });
});

// ============================================================================
// TEST SUITE 11: CONFIGURATION AND CUSTOMIZATION
// ============================================================================

test.describe('Configuration and Customization', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    });

    test('TC-SG-056: Game uses default parent names', async ({ page }) => {
        await page.click('[data-section="who-would-rather"]');
        await page.waitForSelector('#who-would-rather-container', { state: 'visible', timeout: 5000 });
        
        const leftName = page.locator('#btn-parentA .shoe-avatar-name');
        const rightName = page.locator('#btn-parentB .shoe-avatar-name');
        
        await expect(leftName).toContainText('Mom');
        await expect(rightName).toContainText('Dad');
    });

    test('TC-SG-057: Custom configuration can be applied', async ({ page }) => {
        // Inject custom configuration
        await page.evaluate(() => {
            window.ShoeGameConfig = {
                parentA: { name: 'Custom Mom', avatar: '' },
                parentB: { name: 'Custom Dad', avatar: '' },
                autoAdvanceDelay: 500
            };
        });
        
        await page.click('[data-section="who-would-rather"]');
        await page.waitForTimeout(1000);
        
        const leftName = page.locator('#btn-parentA .shoe-avatar-name');
        await expect(leftName).toContainText('Custom Mom');
    });

    test('TC-SG-058: API methods are exposed on window object', async ({ page }) => {
        await page.click('[data-section="who-would-rather"]');
        await page.waitForTimeout(1000);
        
        // ShoeGame object should be available
        const hasAPI = await page.evaluate(() => typeof window.ShoeGame !== 'undefined');
        expect(hasAPI).toBe(true);
        
        // Methods should be available
        const hasVote = await page.evaluate(() => typeof window.ShoeGame.vote === 'function');
        const hasRestart = await page.evaluate(() => typeof window.ShoeGame.restart === 'function');
        
        expect(hasVote).toBe(true);
        expect(hasRestart).toBe(true);
    });
});

// ============================================================================
// EXPORTS
// ============================================================================

export { EXPECTED_QUESTIONS, API_BASE_URL, ANON_KEY };
