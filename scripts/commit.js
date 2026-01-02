#!/usr/bin/env node
/**
 * Automated Commit Script
 * Generates conventional commit messages based on changed files
 */

const { execSync } = require('child_process');
const path = require('path');

function getGitDiff() {
  try {
    const diff = execSync('git diff --name-only HEAD', { encoding: 'utf-8' });
    return diff.trim().split('\n').filter(f => f.length > 0);
  } catch {
    return [];
  }
}

function getStagedFiles() {
  try {
    const diff = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
    return diff.trim().split('\n').filter(f => f.length > 0);
  } catch {
    return [];
  }
}

function determineCommitType(files) {
  const typeIndicators = {
    feat: ['scripts/', 'index.html'],
    fix: ['scripts/', 'styles/', 'index.html'],
    docs: ['README.md', 'DEPLOYMENT.md', 'docs/'],
    test: ['tests/'],
    refactor: ['scripts/', 'styles/', 'backend/'],
    chore: ['package.json', '.gitignore', '.vercelignore'],
  };

  for (const [type, patterns] of Object.entries(typeIndicators)) {
    if (files.some(f => patterns.some(p => f.startsWith(p)))) {
      return type;
    }
  }
  return 'chore';
}

function generateCommitMessage(files) {
  const type = determineCommitType(files);
  const scope = files[0]?.split('/')[0] || 'app';
  const shortDesc = files.slice(0, 3).map(f => path.basename(f)).join(', ');
  const extra = files.length > 3 ? ` and ${files.length - 3} more` : '';
  
  return `${type}(${scope}): ${shortDesc}${extra}`;
}

function main() {
  const stagedFiles = getStagedFiles();
  
  if (stagedFiles.length === 0) {
    // Stage all changes first
    console.log('Staging all changes...');
    execSync('git add .', { stdio: 'inherit' });
  }
  
  const files = getStagedFiles();
  if (files.length === 0) {
    console.log('No changes to commit.');
    process.exit(0);
  }
  
  const message = generateCommitMessage(files);
  console.log(`Committing: ${message}`);
  
  try {
    execSync(`git commit -m "${message}"`, { stdio: 'inherit' });
    console.log('✓ Commit successful');
  } catch (error) {
    console.error('✗ Commit failed:', error.message);
    process.exit(1);
  }
}

main();
