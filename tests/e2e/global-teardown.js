/**
 * Baby Shower App - Global Teardown
 * Cleans up test environment after all tests complete
 */

import fs from 'fs';
import path from 'path';

export default async function globalTeardown() {
  // Clean up test artifacts
  const cleanupDirs = [
    'test-results',
    'tests/e2e/.auth'
  ];
  
  // Keep last run info for debugging
  const lastRunFile = 'test-results/.last-run.json';
  const lastRunInfo = {
    timestamp: new Date().toISOString(),
    status: 'completed'
  };
  
  // Write last run info
  fs.writeFileSync(
    path.resolve(lastRunFile),
    JSON.stringify(lastRunInfo, null, 2)
  );
  
  // Clean up old screenshots (keep only last 10)
  const screenshotsDir = path.resolve('test-results/screenshots');
  if (fs.existsSync(screenshotsDir)) {
    const files = fs.readdirSync(screenshotsDir)
      .map(file => ({
        name: file,
        path: path.join(screenshotsDir, file),
        stats: fs.statSync(path.join(screenshotsDir, file))
      }))
      .sort((a, b) => b.stats.mtime - a.stats.mtime);
    
    // Keep only the 10 most recent
    files.slice(10).forEach(file => {
      fs.unlinkSync(file.path);
    });
  }
  
  console.log('✅ Global teardown complete');
  console.log('📊 Last run info saved');
  console.log('🧹 Old screenshots cleaned up');
}
