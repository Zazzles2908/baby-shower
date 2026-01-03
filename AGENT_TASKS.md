# Agent Task Delegation - Baby Shower 2026 Project

**Created:** 2026-01-03  
**Purpose:** Comprehensive task list for specialized agent delegation  
**Status:** Living Document - Updated as project evolves

---

## 🎯 Executive Summary

The Baby Shower 2026 project is a production-ready web application with 5 core activities (Guestbook, Baby Pool, Quiz, Advice, Voting) and a 6th game feature (Mom vs Dad) in development. The system uses Supabase Edge Functions, vanilla JavaScript frontend, and comprehensive Playwright testing.

**Current Status:**
- ✅ 5 core activities production-ready
- 🔄 Mom vs Dad game partially implemented
- ✅ Database schema normalized and secured
- ✅ E2E testing framework established
- ⚠️ Some Edge Functions need schema cache fixes

---

## 🚨 HIGH PRIORITY TASKS (Critical Path)

### 1. Complete Mom vs Dad Game Implementation
**Priority:** HIGH  
**Agent:** code_generator  
**Dependencies:** None  
**Description:** Finish the 6th activity game with AI integration

#### Subtasks:
- [ ] **1a. Fix Edge Functions Schema Cache Issues**
  - Apply RPC-based fixes to `pool`, `quiz`, `advice` Edge Functions
  - Follow pattern used in `vote` and `guestbook` functions
  - Test all GET operations

- [ ] **1b. Complete Game Edge Functions**
  - `game-scenario`: Z.AI integration for scenario generation
  - `game-reveal`: Moonshot AI integration for roast commentary
  - Add proper error handling and CORS headers

- [ ] **1c. Frontend Game Logic**
  - Complete `scripts/mom-vs-dad.js` implementation
  - Add chibi avatar animations
  - Implement tug-of-war visual feedback
  - Add admin panel with 4-digit PIN authentication

### 2. Security & Performance Audit
**Priority:** HIGH  
**Agent:** security_auditor  
**Dependencies:** None  
**Description:** Comprehensive security review before event day

#### Subtasks:
- [ ] **2a. RLS Policy Verification**
  - Verify all `baby_shower` tables have proper RLS policies
  - Check for any exposed sensitive data
  - Validate authentication requirements

- [ ] **2b. Input Validation Review**
  - Audit all user inputs across Edge Functions
  - Check for SQL injection vulnerabilities
  - Validate file upload restrictions (5MB limit, file types)

- [ ] **2c. Environment Variable Security**
  - Ensure baby's name is never hardcoded
  - Verify API keys are properly secured
  - Check for any exposed credentials

---

## ⚡ MEDIUM PRIORITY TASKS (Important Enhancements)

### 3. Testing & Quality Assurance
**Priority:** MEDIUM  
**Agent:** debug_expert  
**Dependencies:** Task 1 completion  
**Description:** Expand test coverage and fix edge cases

#### Subtasks:
- [ ] **3a. Mom vs Dad Game Testing**
  - Create comprehensive E2E tests for game flow
  - Test AI scenario generation quality
  - Test roast commentary appropriateness
  - Cross-browser compatibility testing

- [ ] **3b. Mobile Responsiveness Testing**
  - Test all activities on mobile devices
  - Verify touch interactions work properly
  - Check responsive layout breakpoints

- [ ] **3c. Error Handling Testing**
  - Test network failure scenarios
  - Test invalid input handling
  - Test concurrent user scenarios

### 4. Code Refactoring & Optimization
**Priority:** MEDIUM  
**Agent:** code_generator  
**Dependencies:** None  
**Description:** Improve code quality and performance

#### Subtasks:
- [ ] **4a. JavaScript Module Consolidation**
  - Merge duplicate API clients (`api.js` vs `api-supabase.js`)
  - Standardize error handling patterns
  - Extract common utilities to shared modules

- [ ] **4b. Performance Optimization**
  - Implement lazy loading for images
  - Optimize CSS bundle size
  - Add resource caching strategies

- [ ] **4c. Code Documentation**
  - Add JSDoc comments to all functions
  - Document API response formats
  - Create inline code examples

---

## 📝 LOW PRIORITY TASKS (Nice to Have)

### 5. UI/UX Enhancements
**Priority:** LOW  
**Agent:** ui_builder  
**Dependencies:** Task 1 completion  
**Description:** Polish visual design and interactions

#### Subtasks:
- [ ] **5a. Animation Improvements**
  - Add smooth transitions between sections
  - Implement particle effects for game reveals
  - Add micro-interactions for better feedback

- [ ] **5b. Accessibility Enhancements**
  - Add ARIA labels to all interactive elements
  - Improve keyboard navigation
  - Add screen reader support

- [ ] **5c. Visual Polish**
  - Optimize color contrast ratios
  - Add loading states for async operations
  - Improve mobile touch targets

### 6. Documentation & Guides
**Priority:** LOW  
**Agent:** researcher  
**Dependencies:** Task 1 completion  
**Description:** Update documentation for maintainers

#### Subtasks:
- [ ] **6a. API Documentation Updates**
  - Document new game endpoints
  - Update response format examples
  - Add error code reference

- [ ] **6b. Deployment Guides**
  - Create step-by-step deployment checklist
  - Document environment variable setup
  - Add troubleshooting guides

- [ ] **6c. Event Day Playbook**
  - Create operator guide for event day
  - Document monitoring procedures
  - Add emergency contact procedures

---

## 🐛 BUG FIXES NEEDED

### 7. Critical Bug Fixes
**Priority:** HIGH  
**Agent:** debug_expert  
**Dependencies:** None  

#### Issues Identified:
- [ ] **7a. Schema Cache Issues**
  - `pool`, `quiz`, `advice` Edge Functions failing on GET operations
  - Need RPC-based queries like `vote` and `guestbook` functions

- [ ] **7b. API Client Inconsistencies**
  - `api.js` not loaded but referenced in some places
  - `getVoteCounts()` function missing (already fixed in QA)

- [ ] **7c. Configuration Loading**
  - Race conditions in CONFIG loading
  - Some modules initialize before CONFIG is available

### 8. Minor Bug Fixes
**Priority:** MEDIUM  
**Agent:** debug_expert  
**Dependencies:** None  

#### Issues Identified:
- [ ] **8a. Console Warnings**
  - Clean up deprecated API usage
  - Fix browser compatibility warnings

- [ ] **8b. Form Validation**
  - Add client-side validation to all forms
  - Improve error message display

- [ ] **8c. Realtime Connection Issues**
  - Handle connection drops gracefully
  - Add reconnection logic

---

## 🚀 NEW FEATURE OPPORTUNITIES

### 9. Analytics & Monitoring
**Priority:** LOW  
**Agent:** code_generator  
**Dependencies:** Core completion  
**Description:** Add usage analytics and monitoring

#### Subtasks:
- [ ] **9a. Usage Analytics**
  - Track feature usage statistics
  - Monitor user engagement patterns
  - Create simple dashboard

- [ ] **9b. Performance Monitoring**
  - Add API response time tracking
  - Monitor error rates
  - Set up alerts for issues

### 10. Social Features
**Priority:** LOW  
**Agent:** ui_builder  
**Dependencies:** Core completion  
**Description:** Enhance social interaction aspects

#### Subtasks:
- [ ] **10a. Guest Interaction**
  - Add guest-to-guest messaging
  - Create shared photo gallery
  - Add comment system for entries

---

## 📊 Implementation Timeline

### Week 1 (Critical Path)
- **Days 1-2:** Complete Mom vs Dad game backend (Tasks 1a, 1b)
- **Days 3-4:** Finish game frontend implementation (Task 1c)
- **Days 5-7:** Security audit and critical bug fixes (Tasks 2, 7)

### Week 2 (Enhancements)
- **Days 8-10:** Testing expansion and mobile optimization (Task 3)
- **Days 11-12:** Code refactoring and performance optimization (Task 4)
- **Days 13-14:** UI polish and documentation updates (Tasks 5, 6)

---

## 🤖 Agent Specialization Guide

### Code Generator
**Best For:** Backend logic, Edge Functions, API development, database queries  
**Current Tasks:** 1a, 1b, 4, 9  
**Skills:** TypeScript, Deno, Supabase, SQL, API design

### UI Builder  
**Best For:** Frontend styling, animations, responsive design, visual polish  
**Current Tasks:** 5, 10  
**Skills:** CSS, JavaScript, animations, accessibility, mobile design

### Debug Expert
**Best For:** Bug fixes, testing, error handling, performance issues  
**Current Tasks:** 3, 7, 8  
**Skills:** Playwright, debugging, testing, error analysis

### Security Auditor
**Best For:** Security reviews, compliance checks, vulnerability assessment  
**Current Tasks:** 2  
**Skills:** Security analysis, RLS policies, input validation, compliance

### Researcher
**Best For:** Documentation, analysis, investigation, best practices  
**Current Tasks:** 6  
**Skills:** Technical writing, research, documentation, analysis

---

## 🔄 Task Dependencies Graph

```
1 (Mom vs Dad Game)
├── 1a (Schema Fixes) → 7a (Schema Cache)
├── 1b (Edge Functions)
└── 1c (Frontend) → 5 (UI Polish)

2 (Security Audit) → 3a (Game Testing)

3 (Testing) → 4 (Refactoring)

7 (Bug Fixes) → All other tasks
```

---

## 📋 Success Criteria

### For Each Task Type:

**Code Generator Tasks:**
- All Edge Functions pass integration tests
- No TypeScript compilation errors
- Proper error handling implemented
- CORS headers configured correctly

**UI Builder Tasks:**
- Cross-browser compatibility verified
- Mobile responsiveness tested
- Accessibility standards met
- Visual design consistent with theme

**Debug Expert Tasks:**
- All tests pass in CI pipeline
- No console errors in production
- Performance metrics improved
- Edge cases handled properly

**Security Auditor Tasks:**
- No security vulnerabilities found
- RLS policies properly configured
- Input validation comprehensive
- Environment variables secured

**Researcher Tasks:**
- Documentation complete and accurate
- Best practices followed
- Implementation guides clear
- Troubleshooting resources provided

---

## 📞 Escalation Procedures

### Critical Issues (Blockers):
1. **Security vulnerabilities** → Immediate fix required
2. **Database connection failures** → Contact infrastructure team
3. **Edge Function deployment failures** → Check environment variables
4. **Test suite failures** → Debug and fix before proceeding

### Non-Critical Issues:
1. **Performance optimization** → Can be deferred to post-event
2. **UI polish items** → Priority based on time availability
3. **Documentation updates** → Can be completed after event

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-03  
**Next Review:** 2026-01-10  
**Maintained By:** OpenCode Orchestrator