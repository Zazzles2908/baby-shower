/**
 * Baby Shower App - Global Setup
 * Prepares test environment before running tests
 */

import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export default async function globalSetup() {
  // Create directories for test artifacts
  const dirs = [
    'test-results',
    'test-results/html-report',
    'test-results/screenshots',
    'tests/e2e/.auth'
  ];
  
  dirs.forEach(dir => {
    const fullPath = path.resolve(dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
  
  // Create default auth state directory if it doesn't exist
  const authDir = path.resolve('tests/e2e/.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  
  // Initialize auth state file
  const authState = {
    cookies: [],
    origins: []
  };
  
  fs.writeFileSync(
    path.resolve(authDir, 'state.json'),
    JSON.stringify(authState, null, 2)
  );
  
  console.log('✅ Global setup complete');
  console.log('📁 Test directories created');
  console.log('🔧 Auth state initialized');
}
