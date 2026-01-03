# AGENTS.md - Baby Shower V2 Development Guide

**Purpose:** Single source of truth for design vision AND development practices. This document captures *why* we're building something AND *how* to build it correctly.

**Created:** 2026-01-03  
**Status:** Living Document (Design Intent + Technical Guidelines)

---

## 🎯 Design Vision (Read First)

**Core Philosophy:** Transform static digital greeting cards into an **interactive "digital living room"** where guests feel welcomed through character-based hospitality, not form-based transactions.

**Key Principles:**
- **Warmth over efficiency** - Every interaction should feel like a host greeting you
- **Character over components** - Users talk to hosts, not fill forms  
- **Motion serves emotion** - Animations must enhance feeling, not just decorate
- **Safety through architecture** - Data protection built into design, not just policies

**The Three Pillars:**
- **Soul (Frontend)** - Emotional layer: "Does this feel alive?"
- **System (Backend)** - Reliability layer: "Is this secure?"  
- **Brain (AI)** - Intelligence layer: "What's the right response?"

---

## 🛠️ Development Commands

### Development Server
```bash
npm run dev              # Start local server at http://localhost:3000
```

### Testing Commands
```bash
# Run all tests
npm test

# Run specific test categories  
npm run test:frontend    # Frontend functionality tests
npm run test:api        # API integration tests
npm run test:db         # Database verification tests
npm run test:errors     # Error handling tests
npm run test:flow       # Data flow tests

# Run single test file
npx playwright test --config=tests/playwright.config.js tests/e2e/baby-shower.test.js

# Run tests with specific grep pattern
npx playwright test --config=tests/playwright.config.js --grep="guestbook"

# Browser-specific testing
npm run test:chromium   # Chrome only
npm run test:firefox    # Firefox only  
npm run test:webkit     # Safari only
npm run test:mobile     # Mobile browsers

# Debug and UI modes
npm run test:debug      # Run in debug mode
npm run test:ui         # Open Playwright UI
npm run test:headed     # Show browser during tests
```

### Deployment
```bash
npm run commit          # Custom commit script with validation
npm run push            # Push to main branch
npm run deploy          # Commit + push sequence
```

---

## 📋 Code Style Guidelines

### JavaScript Conventions
- **Frontend**: Vanilla ES6+ JavaScript, no frameworks
- **Backend**: TypeScript for Edge Functions (Deno runtime)
- **Module Pattern**: IIFE (Immediately Invoked Function Expression) for frontend scripts
- **Global Namespace**: Attach functions to `window` object (e.g., `window.API`, `window.CONFIG`)

### Naming Conventions
```javascript
// Variables: camelCase
const guestName = 'Test User';
let submissionCount = 0;

// Constants: UPPER_SNAKE_CASE  
const API_TIMEOUT = 30000;
const MAX_VOTES_PER_GUEST = 3;

// Functions: camelCase, descriptive
function validateGuestbookEntry(data) { }
async function fetchGuestbookEntries() { }

// CSS Classes: kebab-case
.guestbook-form { }
.character-mom { }

// File Names: kebab-case
scripts/guestbook.js
styles/animations.css
```

### Error Handling Pattern
```javascript
// Always use try-catch with specific error messages
try {
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }
  return await response.json();
} catch (error) {
  console.error('API Error:', error.message);
  throw new Error(`Failed to fetch data: ${error.message}`);
}
```

### API Response Format
```javascript
// Success response
{
  success: true,
  data: { /* payload */ },
  message: 'Optional success message'
}

// Error response  
{
  success: false,
  error: 'Human-readable error message',
  details: { /* optional technical details */ }
}
```

### Frontend Script Structure
```javascript
/**
 * Baby Shower App - [Feature Name]
 * Brief description of what this script does
 */

(function() {
    'use strict';
    
    console.log('[Feature] loading...');
    
    // Private variables
    let privateVar = 'value';
    
    // Public API
    window.FEATURE = {
        init: initializeFeature,
        publicMethod: publicFunction
    };
    
    function initializeFeature() {
        // Initialization logic
    }
    
    function publicFunction() {
        // Public method implementation
    }
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeFeature);
    } else {
        initializeFeature();
    }
})();
```

### TypeScript Edge Functions
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RequestData {
  // Define your request structure
}

interface ErrorResponse {
  error: string
  details?: unknown
}

serve(async (req: Request) => {
  // CORS headers always first
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  })

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  try {
    // Implementation here
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message } as ErrorResponse),
      { status: 500, headers }
    )
  }
})
```

---

## 🔧 Technical Standards

### Environment Variables
- Never commit sensitive data
- Use `window.ENV` for frontend environment variables
- Use `Deno.env.get()` for backend environment variables
- Always provide fallback values for development

### Security Requirements
- ** baby's name NEVER in code/commits** - Use environment variables only
- **RLS Policies** - All database tables must have Row Level Security enabled
- **Input Validation** - Validate all user inputs on both client and server
- **CORS Configuration** - Properly configured for cross-origin requests

### Performance Guidelines
- **API Timeout**: 30 seconds maximum
- **File Upload**: 5MB maximum, JPEG/PNG/GIF only
- **Mobile First**: All features must work on mobile devices
- **Progressive Enhancement**: Core functionality works without JavaScript

### Testing Standards
- **E2E Tests Required** for all new features
- **Test Data Generation** - Use existing data generators in `tests/e2e/data-generator.js`
- **Cross-Browser** - Test on Chromium, Firefox, WebKit
- **Mobile Testing** - Test on mobile Chrome and Safari
- **Error Scenarios** - Test network failures and invalid inputs

---

## 🚨 Common Pitfalls to Avoid

1. **Don't use ES6 modules in frontend scripts** - Use IIFE pattern instead
2. **Don't forget CORS headers** in Edge Functions - Always include them
3. **Don't hardcode the baby's name** - Use environment variables
4. **Don't skip error handling** - Every async operation needs try-catch
5. **Don't forget mobile testing** - Mobile-first is required
6. **Don't commit sensitive data** - Use .env.local and never commit it

---

## 📚 Reference Documentation

- **Design Vision**: See original AGENTS.md for detailed character system and design philosophy
- **API Documentation**: `docs/reference/API.md`
- **Database Schema**: `docs/reference/SCHEMA.md`  
- **Testing Guide**: `docs/technical/TESTING.md`
- **Deployment Guide**: `docs/technical/DEPLOYMENT.md`

---

**Document Version: 2.0**  
**Purpose: Development Guidelines for AI Agents and Developers**  
**Read this before implementing any features**