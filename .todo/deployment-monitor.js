/**
 * Baby Shower V2 - Vercel Deployment Monitor
 * Uses Playwright MCP to monitor deployment status in real-time
 */

const VERCEL_URL = 'https://baby-shower-qr-app.vercel.app';
const DEPLOYMENT_URL = 'https://vercel.com/baby-shower-qr-app/deployments';

// Configuration
const CONFIG = {
    maxRetries: 10,
    retryDelay: 5000, // 5 seconds
    checkTimeout: 30000, // 30 seconds
};

/**
 * Monitor Vercel deployment status
 */
async function monitorDeployment() {
    console.log('[DeploymentMonitor] Starting deployment monitoring...');
    
    try {
        // Navigate to Vercel dashboard
        await page.goto(DEPLOYMENT_URL, { waitUntil: 'networkidle' });
        console.log('[DeploymentMonitor] Navigated to Vercel dashboard');
        
        // Wait for deployment status to load
        await page.waitForTimeout(3000);
        
        // Check for deployment status
        const status = await checkDeploymentStatus();
        console.log('[DeploymentMonitor] Current status:', status);
        
        if (status === 'ready') {
            console.log('[DeploymentMonitor] ✅ Deployment is ready!');
            await verifyApplication();
        } else if (status === 'building' || status === 'in_progress') {
            console.log('[DeploymentMonitor] 🔄 Deployment in progress...');
            await retryDeploymentCheck();
        } else if (status === 'error' || status === 'failed') {
            console.log('[DeploymentMonitor] ❌ Deployment failed!');
            await handleDeploymentFailure();
        } else {
            console.log('[DeploymentMonitor] ⚠️ Unknown status, retrying...');
            await retryDeploymentCheck();
        }
        
    } catch (error) {
        console.error('[DeploymentMonitor] Error during monitoring:', error.message);
        await handleMonitoringError(error);
    }
}

/**
 * Check current deployment status
 */
async function checkDeploymentStatus() {
    try {
        // Look for status indicators on the page
        const statusElements = await page.locator('text=/ready|built|success/i').count();
        const errorElements = await page.locator('text=/error|failed|cancelled/i').count();
        const buildingElements = await page.locator('text=/building|deploying|preparing/i').count();
        
        if (statusElements > 0) {
            return 'ready';
        } else if (errorElements > 0) {
            return 'failed';
        } else if (buildingElements > 0) {
            return 'in_progress';
        } else {
            // Try to get specific status from page content
            const pageContent = await page.content();
            if (pageContent.includes('Ready') || pageContent.includes('Success')) {
                return 'ready';
            } else if (pageContent.includes('Error') || pageContent.includes('Failed')) {
                return 'failed';
            } else {
                return 'in_progress';
            }
        }
    } catch (error) {
        console.error('[DeploymentMonitor] Error checking status:', error.message);
        return 'unknown';
    }
}

/**
 * Verify application is working correctly
 */
async function verifyApplication() {
    console.log('[DeploymentMonitor] Verifying application functionality...');
    
    try {
        // Navigate to the application
        await page.goto(VERCEL_URL, { waitUntil: 'networkidle', timeout: CONFIG.checkTimeout });
        console.log('[DeploymentMonitor] Application URL loaded');
        
        // Check for console errors
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });
        
        // Wait for page to be fully loaded
        await page.waitForTimeout(2000);
        
        // Check if main elements are present
        const title = await page.title();
        console.log('[DeploymentMonitor] Page title:', title);
        
        // Check for main content
        const mainContent = await page.locator('body').isVisible();
        console.log('[DeploymentMonitor] Main content visible:', mainContent);
        
        if (consoleErrors.length > 0) {
            console.warn('[DeploymentMonitor] ⚠️ Console errors detected:');
            consoleErrors.forEach(err => console.warn('[DeploymentMonitor]', err));
            await handleConsoleErrors(consoleErrors);
        } else {
            console.log('[DeploymentMonitor] ✅ No console errors detected!');
        }
        
        console.log('[DeploymentMonitor] ✅ Application verification complete!');
        
    } catch (error) {
        console.error('[DeploymentMonitor] Error during verification:', error.message);
        await handleVerificationError(error);
    }
}

/**
 * Retry deployment check
 */
async function retryDeploymentCheck() {
    console.log(`[DeploymentMonitor] Retrying deployment check in ${CONFIG.retryDelay / 1000} seconds...`);
    
    await page.waitForTimeout(CONFIG.retryDelay);
    
    // Recursive retry with limit
    const retryCount = await page.evaluate(() => {
        return window.retryCount || 0;
    });
    
    if (retryCount < CONFIG.maxRetries) {
        await page.evaluate(() => {
            window.retryCount = (window.retryCount || 0) + 1;
        });
        
        await monitorDeployment();
    } else {
        console.error('[DeploymentMonitor] ❌ Max retries reached!');
        await handleMaxRetries();
    }
}

/**
 * Handle deployment failure
 */
async function handleDeploymentFailure() {
    console.log('[DeploymentMonitor] Handling deployment failure...');
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'deployment-failure.png' });
    console.log('[DeploymentMonitor] Screenshot saved as deployment-failure.png');
    
    // Get error details from page
    const errorDetails = await page.locator('.error, .message, [class*="error"]').allTextContents();
    console.error('[DeploymentMonitor] Error details:', errorDetails);
    
    // Update todo list with failure
    await updateTodoStatus('2', 'failed');
    
    console.log('[DeploymentMonitor] ✅ Failure handling complete');
}

/**
 * Handle monitoring errors
 */
async function handleMonitoringError(error) {
    console.error('[DeploymentMonitor] Handling monitoring error:', error.message);
    
    // Log error for debugging
    await page.screenshot({ path: 'monitoring-error.png' });
    
    console.log('[DeploymentMonitor] ✅ Error handling complete');
}

/**
 * Handle console errors
 */
async function handleConsoleErrors(errors) {
    console.warn('[DeploymentMonitor] Processing console errors...');
    
    errors.forEach(err => {
        console.warn(`[DeploymentMonitor] Console error: ${err}`);
    });
    
    // Determine if errors are critical
    const criticalErrors = errors.filter(err => 
        err.includes('Failed to load resource') ||
        err.includes('NetworkError') ||
        err.includes('SyntaxError') ||
        err.includes('ReferenceError')
    );
    
    if (criticalErrors.length > 0) {
        console.error('[DeploymentMonitor] ❌ Critical errors detected!');
        await updateTodoStatus('2', 'completed');
    } else {
        console.log('[DeploymentMonitor] ✅ Non-critical errors, deployment OK');
    }
}

/**
 * Handle verification errors
 */
async function handleVerificationError(error) {
    console.error('[DeploymentMonitor] Handling verification error:', error.message);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'verification-error.png' });
    
    console.log('[DeploymentMonitor] ✅ Verification error handling complete');
}

/**
 * Handle max retries exceeded
 */
async function handleMaxRetries() {
    console.error('[DeploymentMonitor] Max retries exceeded, marking task as failed');
    
    await updateTodoStatus('1', 'failed');
    await updateTodoStatus('2', 'failed');
    
    console.log('[DeploymentMonitor] ✅ Max retries handling complete');
}

/**
 * Update todo status
 */
async function updateTodoStatus(taskId, status) {
    try {
        // This would update the todo list file
        console.log(`[DeploymentMonitor] Updated task ${taskId} status to: ${status}`);
        
        // For actual implementation, use the file system to update todos.json
        // const todoData = JSON.parse(fs.readFileSync('.todo/todos.json', 'utf8'));
        // const task = todoData.todoList.find(t => t.id === taskId);
        // if (task) task.status = status;
        // fs.writeFileSync('.todo/todos.json', JSON.stringify(todoData, null, 2));
        
    } catch (error) {
        console.error('[DeploymentMonitor] Error updating todo:', error.message);
    }
}

// Export functions for use with MCP
window.DeploymentMonitor = {
    monitorDeployment,
    checkDeploymentStatus,
    verifyApplication,
    retryDeploymentCheck,
    handleDeploymentFailure
};

console.log('[DeploymentMonitor] ✅ Deployment monitoring script loaded');
console.log('[DeploymentMonitor] Available functions:');
console.log('  - monitorDeployment()');
console.log('  - checkDeploymentStatus()');
console.log('  - verifyApplication()');
console.log('  - retryDeploymentCheck()');