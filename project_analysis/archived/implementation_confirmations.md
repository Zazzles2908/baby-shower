# Implementation Confirmations Required

**Date:** January 9, 2026  
**Document:** Master Implementation Plan v1.0 Review  
**Purpose:** Comprehensive list of questions requiring confirmation before implementation begins

---

## Executive Summary

This document identifies all assumptions, uncertainties, and areas requiring confirmation before proceeding with the Baby Shower Application implementation. The Master Implementation Plan v1.0 contains 18 identified issues across multiple categories, with 3 critical fixes blocking Phase 1 commencement.

**Summary of Confirmation Needs:**

| Category | Critical | Important | Optional | Total |
|----------|----------|-----------|----------|-------|
| Technical Assumptions | 4 | 6 | 3 | 13 |
| Resource Assumptions | 2 | 3 | 1 | 6 |
| Dependency Assumptions | 3 | 4 | 2 | 9 |
| Business Logic | 2 | 5 | 2 | 9 |
| Security Assumptions | 2 | 3 | 1 | 6 |
| Timeline Assumptions | 1 | 4 | 2 | 7 |
| **Total** | **14** | **25** | **11** | **50** |

**Recommendation:** All critical questions (14) must be answered before Phase 1 begins. Important questions (25) should be clarified before Phase 2. Optional questions (11) can be addressed during implementation.

---

## Critical Questions

*Must be answered before Phase 1 begins (Days 1-2)*

---

### T-1: RPC Function Existence Verification

**Question:** Are all RPC functions referenced in the implementation plan actually present in the database migration files?

**Context:** The plan references 5 RPC functions: `get_session_details`, `insert_quiz_result`, `baby_shower.generate_session_code`, `baby_shower.calculate_vote_stats`, and `insert_advice`. The verification script (lines 283-291) assumes these functions can be checked via `information_schema.routines`.

**Why Confirmation Needed:** If these functions are missing, the affected Edge Functions (`game-session/index.ts`, `quiz/index.ts`, `lobby-create/index.ts`, `lobby-status/index.ts`, `advice/index.ts`) will fail at runtime with "function does not exist" errors. This affects core game functionality.

**Potential Answers/Options:**
1. Verify all functions exist in `supabase/migrations/*.sql` files
2. Run the verification SQL query against the database
3. Create missing functions from migration history
4. Use alternative implementation (direct SQL in Edge Functions)

**Impact if Unanswered:** Runtime errors when users attempt game sessions, quiz submissions, or advice submissions. Data loss potential if functions fail mid-operation.

---

### T-2: Lobby-Join Parameter Mapping

**Question:** What is the exact field name convention used for session codes in the frontend `mom-vs-dad-simplified.js` script?

**Context:** The plan states to change `lobby_key` to `session_code` in the interface (lines 154-156), but the frontend script may be using different field names. The LOBBY-A through LOBBY-D sessions have 6-character codes, but the plan doesn't verify the frontend is sending the correct field name.

**Why Confirmation Needed:** Parameter mismatch between frontend and backend will cause session joining to fail. Users will be unable to join Mom vs Dad game sessions.

**Potential Answers/Options:**
1. Check `scripts/mom-vs-dad-simplified.js` for exact parameter names
2. Verify `scripts/config.js` for session code format
3. Capture a live HTTP request to see actual field names sent
4. Standardize on `session_code` throughout codebase

**Impact if Unanswered:** Game unusable - users cannot join sessions. Customer-facing feature failure.

---

### T-3: Vote Function Data Location

**Question:** Is vote submission data currently stored in `public.votes` or `baby_shower.votes`?

**Context:** The plan assumes data needs migration from `public.votes` to `baby_shower.votes` (lines 200-208), but this assumes the data currently exists in the wrong table. No verification has been performed to confirm data location.

**Why Confirmation Needed:** Running the migration script could cause data duplication or loss if data already exists in the correct table. The SQL query pattern `WHERE id NOT IN (SELECT id FROM baby_shower.votes)` may not catch all edge cases.

**Potential Answers/Options:**
1. Query both tables to determine data location
2. Check which table the `vote` Edge Function currently writes to
3. Review recent migration history for table creation
4. Determine if `public.votes` table is used by any other component

**Impact if Unanswered:** Data corruption (duplicate entries), data loss, or unnecessary migration operations. Potential compliance issues if user voting data is in wrong schema.

---

### T-4: Pool Date Constraint Validation

**Question:** What is the exact current state of the `pool_predictions_birth_date_check` constraint?

**Context:** The plan assumes the constraint exists and needs updating (lines 233-245), but no verification confirms the constraint name, current date range, or whether it exists at all.

**Why Confirmation Needed:** The `DROP CONSTRAINT IF EXISTS` command suggests uncertainty. If the constraint has a different name or doesn't exist, the migration may fail or have no effect. Predictions for 2026-2027 dates may be rejected by an unupdated constraint.

**Potential Answers/Options:**
1. Query `pg_constraint` to get exact constraint details
2. Check the most recent migration file for constraint definition
3. Test a 2026 prediction to verify current behavior
4. Determine if constraint was added in a specific migration

**Impact if Unanswered:** Pool predictions for 2026-2027 baby dates will be rejected, causing feature unavailability during the actual baby shower event.

---

### R-1: Supabase CLI Token Configuration

**Question:** Is the `SUPABASE_ACCESS_TOKEN` environment variable configured and valid?

**Context:** The AGENTS.md file (section "Supabase CLI Configuration - Critical for Agents") states that the token must be set manually using `export SUPABASE_ACCESS_TOKEN="$(cat .env.local | grep SUPABASE_ACCESS_TOKEN | cut -d'"' -f2)"`. The plan doesn't verify this has been done.

**Why Confirmation Needed:** Without a valid token, all `supabase` CLI commands will fail with "Unauthorized" errors. This affects database migrations, Edge Function deployments, and secret management.

**Potential Answers/Options:**
1. Run `supabase projects list` to verify token works
2. Check system environment variable: `echo $SUPABASE_ACCESS_TOKEN`
3. Run `supabase-env-setup.bat` or `source supabase-env-setup.sh`
4. Request new token from Supabase dashboard if expired

**Impact if Unanswered:** All Phase 1-4 tasks requiring `supabase` CLI will fail. Implementation completely blocked.

---

### R-2: Agent Tool Access Verification

**Question:** Do all agents have access to the required tools for their assigned tasks?

**Context:** The plan assigns tasks to `debug_expert`, `code_generator`, `ui_builder`, `security_auditor`, and `QA_agent` (lines 607-613). AGENTS.md indicates `ui_builder` does NOT have bash access, but the plan assigns deployment-related tasks to it.

**Why Confirmation Needed:** `ui_builder` (GLM-4.7) has `write` but no `bash` access per AGENTS.md. The plan assigns `ui_builder` to "Frontend enhancement" which may require running build commands, test scripts, or deployment commands.

**Potential Answers/Options:**
1. Assign `ui_builder_fallback` for tasks requiring bash
2. Use `code_generator` for frontend tasks requiring builds
3. Request `ui_builder` get bash access for this project
4. Manually execute build/deploy commands outside agent workflow

**Impact if Unanswered:** Frontend enhancement tasks may not complete fully if bash access is required but unavailable. Deployment delays.

---

### D-1: MiniMax API Key Validity

**Question:** Is the existing `MINIMAX_API_KEY` in Supabase secrets valid and functional?

**Context:** The API key status table (lines 388-392) marks `MINIMAX_API_KEY` as "⚠️ Verify" but doesn't specify what verification has been performed. The plan assumes it exists but may be expired or incorrect.

**Why Confirmation Needed:** Pool and Advice features use MiniMax for AI roasts. An invalid key will cause AI-enhanced features to fail, potentially exposing error messages or failing silently.

**Potential Answers/Options:**
1. Test API key with a simple curl request
2. Check Supabase secrets: `supabase secrets list`
3. Review usage logs if available from MiniMax
4. Generate new key if current key is expired

**Impact if Unanswered:** AI-enhanced pool predictions and advice roasts will fail. Customer experience degradation for these features.

---

### D-2: Z.AI and Kimi API Account Setup

**Question:** Do Z.AI (GLM-4.7) and Kimi (K2) API accounts exist and have billing configured?

**Context:** Both API keys are marked as "❌ Missing" (lines 391-392). The plan assumes these can be configured but doesn't verify account existence, billing status, or access credentials.

**Why Confirmation Needed:** Game scenario generation (Z.AI) and roast commentary (Kimi) require paid API access. If accounts don't exist or are out of credits, these features will fail. Creating accounts may require business verification or payment methods.

**Potential Answers/Options:**
1. Check if accounts exist in Z.AI and Kimi dashboards
2. Verify billing method is on file and has credits
3. Generate new API keys if accounts exist
4. Create new accounts if necessary
5. Determine fallback behavior if accounts cannot be created

**Impact if Unanswered:** Mom vs Dad game will have degraded experience - static questions instead of AI-generated scenarios, no roast commentary. Feature significantly diminished.

---

### D-3: Empty Directory Deletion Safety

**Question:** Is `supabase/functions/setup-demo-sessions/` truly empty and safe to delete?

**Context:** The plan states the directory is "empty" and "created during incomplete refactoring" (lines 130-132), but no verification confirms it contains no files or subdirectories.

**Why Confirmation Needed:** Deleting the wrong directory could remove important code. The directory name suggests it might have contained demo session setup code that could be useful.

**Potential Answers/Options:**
1. List directory contents: `ls -la supabase/functions/setup-demo-sessions/`
2. Check git history for what was in this directory
3. Search for any references to this path in code
4. Verify directory serves no purpose before deletion

**Impact if Unanswered:** Potential loss of demo session setup code that might be needed. Low risk but worth verifying.

---

### B-1: Guestbook Display Requirement Confirmation

**Question:** Is the guestbook entry display feature actually required by users, or is it optional enhancement?

**Context:** The plan labels Guestbook Entry Display as "Missing Components" with "1 Critical" severity (line 36), but doesn't cite user feedback or requirements documentation confirming this is a critical need.

**Why Confirmation Required:** 6 hours of implementation time (line 629) is allocated to this feature. If users don't need or want this feature, resources could be better allocated to fixing known issues.

**Potential Answers/Options:**
1. Review user feedback for guestbook display requests
2. Check if similar features exist in competitor products
3. Determine if entry display is implied by guestbook submission
4. Proceed as critical if feature is core to guestbook purpose

**Impact if Unanswered:** Potential waste of 6 hours on low-value feature. Alternatively, critical user expectation goes unmet.

---

### B-2: Quiz Puzzle Configuration Final Answer

**Question:** What are the correct quiz puzzle answers and emojis?

**Context:** The plan shows one configuration (lines 524-530) but notes "Configuration mismatch between defined puzzles and UI usage" (line 521). The correct answers may be different from what the plan proposes.

**Why Confirmation Needed:** Wrong answers in the configuration will cause incorrect quiz scoring. Users will fail puzzles they should pass, leading to frustration and support requests.

**Potential Answers/Options:**
1. Check `scripts/quiz.js` for current emoji sequences
2. Verify against any documented answer key
3. Test current implementation to see what answers work
4. Consult original design documentation

**Impact if Unanswered:** Quiz scoring will be incorrect. Users may receive wrong milestone messages or have incorrect completion status.

---

### S-1: Service Role Key Exposure

**Question:** Is `SUPABASE_SERVICE_ROLE_KEY` properly protected in the `guestbook-entries` Edge Function?

**Context:** The proposed Edge Function (lines 460-462) uses `SUPABASE_SERVICE_ROLE_KEY` to fetch guestbook entries. This key should never be exposed client-side, but the function endpoint is called from frontend JavaScript.

**Why Confirmation Needed:** Service role key has full database access. If exposed through a public endpoint, attackers could read, modify, or delete all data. This is a critical security vulnerability.

**Potential Answers/Options:**
1. Use `SUPABASE_ANON_KEY` instead with RLS policies
2. Implement proper RLS on guestbook table
3. Create a service role with limited permissions
4. Verify endpoint is not accessible without authentication

**Impact if Unanswered:** Critical security vulnerability - full database compromise possible. Data breach, compliance violations, reputational damage.

---

### S-2: AI API Key Storage Security

**Question:** Are AI API keys stored in Supabase secrets or in environment files that might be committed?

**Context:** The plan mentions setting secrets via `supabase secrets set` but doesn't verify current key locations. Previous security issues in the project (per AGENTS.md) involved hardcoded credentials.

**Why Confirmation Needed:** Exposed AI API keys could lead to unauthorized usage, billing fraud, or account compromise. AI providers may have usage limits or cost associated with key exposure.

**Potential Answers/Options:**
1. Check `.env.local` for any API keys
2. Verify `.gitignore` excludes all API keys
3. Review Supabase secrets: `supabase secrets list`
4. Search codebase for hardcoded key patterns

**Impact if Unanswered:** API key exposure risk. Potential financial loss from unauthorized usage. Security audit failure.

---

### TM-1: Phase 1 Timeline Realism

**Question:** Can Phase 1 (Critical Fixes) actually be completed in 2 days given the verification and coordination required?

**Context:** Phase 1 includes 5 tasks totaling 7.5 hours estimated time (lines 128, 147, 185, 228, 270). However, verification steps (RPC verification, data migration testing) may uncover additional issues.

**Why Confirmation Needed:** If Phase 1 overruns, the entire project timeline slides. Dependencies between phases mean delays compound.

**Potential Answers/Options:**
1. Add 1-2 day buffer to Phase 1
2. Identify which tasks can run in parallel
3. Pre-gather all required information before starting
4. Have clear Phase 1 exit criteria

**Impact if Unanswered:** Project timeline slip. Stakeholder expectations mismatch. Resource allocation problems.

---

## Important Questions

*Should be clarified before Phase 2 begins (Days 3-4)*

---

### T-5: Advice Character Limit Alignment

**Question:** What is the correct character limit for advice messages - 500, 1000, or unlimited?

**Context:** The plan shows conflicting limits: line 411 says 1000 chars, line 417 says 1000 chars, but previous documentation may have specified 500. The MiniMax API itself may have limits.

**Why Confirmation Needed:** Inconsistent limits between frontend and backend could cause validation bypass or legitimate messages being rejected. User confusion if limits change.

**Potential Answers/Options:**
1. Check current `scripts/advice.js` for limit
2. Check current `advice/index.ts` for limit
3. Check MiniMax API maximum input length
4. Determine reasonable user experience limit

**Impact if Unanswered:** Users may compose long messages only to have them rejected. Or frontend accepts messages backend rejects.

---

### T-6: Advice MiniMax Model Name

**Question:** Is `abab6.5s-chat` the correct MiniMax model name for the advice function?

**Context:** The plan proposes changing from `MiniMax-M2.1` to `abab6.5s-chat` (lines 400-405), but model names may have changed with API version updates.

**Why Confirmation Needed:** Wrong model name will cause API call failure. AI-generated advice will not work.

**Potential Answers/Options:**
1. Check MiniMax API documentation for current model names
2. Test current model name to verify it works
3. Check recent successful API calls for model name
4. Contact MiniMax support if uncertain

**Impact if Unanswered:** Advice AI feature fails. Users receive error messages instead of witty advice.

---

### T-7: Shoe Game Missing Questions Content

**Question:** What are the 5 missing questions for the Shoe Game?

**Context:** The plan states 5 questions are missing (line 366) but doesn't specify what they are. The game should have 24 questions total.

**Why Confirmation Needed:** Incomplete question set means users may see repeats or the game may end prematurely. Affects user experience.

**Potential Answers/Options:**
1. Review original design document for full question list
2. Check if questions should be AI-generated
3. Find reference implementation with full 24 questions
4. Create new questions following existing patterns

**Impact if Unanswered:** Game has fewer questions than designed. User experience inconsistency.

---

### T-8: Database Table Schema Verification

**Question:** Do all database tables have proper primary keys, indexes, and RLS policies?

**Context:** The plan adds constraints to `baby_shower.advice` (lines 423-428) but doesn't verify other tables have similar structure. The `advice` table lacks a primary key per the plan.

**Why Confirmation Needed:** Tables without primary keys may have duplicate data issues. Missing indexes cause performance problems. Missing RLS policies are security vulnerabilities.

**Potential Answers/Options:**
1. Audit all `baby_shower.*` tables for structure
2. Check which tables have RLS enabled
3. Verify foreign key relationships are correct
4. Document required schema changes

**Impact if Unanswered:** Data integrity issues, performance problems, security vulnerabilities in database layer.

---

### T-9: Edge Function CORS Configuration

**Question:** Are all Edge Functions properly configured for CORS from the frontend origin?

**Context:** The plan uses `CORS_HEADERS` from `../_shared/security.ts` but doesn't verify all functions include proper origin restrictions.

**Why Confirmation Needed:** Missing CORS headers cause API calls to fail in browsers. Incorrect CORS allows unauthorized access from other domains.

**Potential Answers/Options:**
1. Test each Edge Function with curl to check headers
2. Review `CORS_HEADERS` configuration
3. Verify origin whitelist matches frontend URL
4. Test from actual browser environment

**Impact if Unanswered:** API calls fail in production. Users cannot use features. Console errors in browser.

---

### T-10: Realtime Subscription Channels

**Question:** Are all required Supabase realtime channels properly configured and not conflicting?

**Context:** The plan adds a `guestbook-changes` channel (lines 504-513) but doesn't verify other channels exist or conflict. Multiple features using realtime could have channel name collisions.

**Why Confirmation Needed:** Channel name collisions cause message routing issues. Events may go to wrong handlers or be lost entirely.

**Potential Answers/Options:**
1. List all existing Supabase channels
2. Document channel naming convention
3. Verify no duplicate channel names
4. Test realtime events propagate correctly

**Impact if Unanswered:** Real-time updates fail. Guestbook entries don't appear live. Game votes don't update live.

---

### T-11: Photo Upload Storage Bucket Configuration

**Question:** What are the exact configuration requirements for the photo upload feature?

**Context:** The plan references "Photo Upload Implementation" depending on "Storage bucket configuration" (lines 89-91) but provides no details on bucket name, size limits, or file type restrictions.

**Why Confirmation Needed:** Without configuration details, implementation cannot proceed. Storage buckets need proper security policies, file size limits, and allowed types.

**Potential Answers/Options:**
1. Check existing storage bucket configuration
2. Determine if photos are for guestbook or separate feature
3. Set file size limits (likely 5MB as per AGENTS.md)
4. Configure allowed file types (JPEG, PNG, GIF)

**Impact if Unanswered:** Photo upload feature cannot be implemented. Dependency for guestbook display blocked.

---

### R-3: Team Role Availability

**Question:** Are the 4 team roles (Backend Developer, Frontend Developer, DevOps Engineer, QA Engineer) available concurrently, or is work sequential?

**Context:** The plan assumes parallel work (40%, 35%, 15%, 10% allocation) but doesn't confirm team availability. AGENTS.md shows agent-based task distribution.

**Why Confirmation Needed:** If resources are limited, tasks must be sequenced. Dependencies between tasks may require specific order.

**Potential Answers/Options:**
1. Confirm actual team members available
2. Identify which tasks are agent-only vs human-required
3. Sequence work to match resource availability
4. Add buffer time for resource constraints

**Impact if Unanswered:** Work stalls if resources unavailable. Timeline extends beyond estimate.

---

### R-4: Test Framework Configuration

**Question:** Are all npm test commands (`npm run test:frontend`, `npm run test:api`, etc.) actually defined in package.json?

**Context:** The plan references specific test commands (lines 541-560) but doesn't verify these scripts exist in `package.json`.

**Why Confirmation Needed:** Running undefined npm scripts causes errors. Test execution fails. Quality assurance cannot be performed.

**Potential Answers/Options:**
1. Check `package.json` for script definitions
2. Identify available test commands
3. Create missing test commands
4. Document expected test behavior

**Impact if Unanswered:** Test commands fail. Cannot validate fixes. Quality assurance blocked.

---

### R-5: Supabase Project ID Consistency

**Question:** Is the Supabase project ID `bkszmvfsfgvdwzacgmfz` consistent across all references?

**Context:** The plan references this project ID in testing examples (lines 175, 217, 754-757) but doesn't verify it's the correct current project ID.

**Why Confirmation Needed:** Wrong project ID means commands target wrong database. Development changes could affect wrong environment.

**Potential Answers/Options:**
1. Verify project ID in Supabase dashboard
2. Check `supabase link` status
3. Compare against environment variables
4. Test with a simple query to confirm connection

**Impact if Unanswered:** Changes applied to wrong environment. Data corruption between dev/prod.

---

### D-4: AI Feature Fallback Behavior

**Question:** What should happen when AI APIs fail or are unavailable?

**Context:** The plan mentions "graceful fallback to templates" (line 394) but doesn't specify what templates exist or what fallback behavior is expected.

**Why Confirmation Needed:** Users need clear experience when AI fails. Without defined fallback, errors may show to users or features may fail silently.

**Potential Answers/Options:**
1. Create template responses for each AI feature
2. Implement retry logic with backoff
3. Show user-friendly error messages
4. Log failures for monitoring

**Impact if Unanswered:** Poor user experience when AI fails. Support requests for broken features.

---

### D-5: Shoe Game Session Persistence

**Question:** Should the Shoe Game store session state or be purely ephemeral?

**Context:** The plan notes "Votes tracked in local state (session only)" (AGENTS.md) but doesn't confirm if this is intentional or if persistence was removed due to issues.

**Why Confirmation Needed:** Ephemeral state means no history, no analytics, and no way to recover if user leaves. Persistent state requires database and Edge Functions.

**Potential Answers/Options:**
1. Confirm ephemeral state is intentional
2. If persistence needed, add database table and API
3. Document design decision
4. Communicate limitations to users

**Impact if Unanswered:** User expectations mismatch. Feature may seem broken if they expect persistence.

---

### D-6: Deprecated Table Dependencies

**Question:** Are there any code dependencies on the deprecated `who_would_rather_*` or `public.submissions_DEPRECATED` tables?

**Context:** The plan removes these tables but doesn't verify no code references them.

**Why Confirmation Needed:** Code referencing deleted tables will fail with errors. Runtime crashes when users access related features.

**Potential Answers/Options:**
1. Search codebase for table names
2. Check Edge Functions for table references
3. Verify frontend scripts don't reference tables
4. Update any references before deletion

**Impact if Unanswered:** Runtime errors. Feature crashes. Potential data access exceptions.

---

### B-3: Guestbook Entry Display Order

**Question:** What is the desired sort order for guestbook entries - newest first, oldest first, or alphabetical?

**Context:** The plan shows `order('created_at', { ascending: false })` (line 467) which shows newest first, but doesn't confirm this is the desired behavior.

**Why Confirmation Needed:** Different sort orders give different user experiences. Users may have preferences based on how they want to read entries.

**Potential Answers/Options:**
1. Check for user feedback on entry order preference
2. Review similar guestbook applications
3. Offer user toggle for sort order
4. Default to newest first (most recent activity)

**Impact if Unanswered:** May not match user expectations. Extra work to change later.

---

### B-4: Advice Delivery Options

**Question:** What are the exact advice delivery options and their behavior?

**Context:** The plan mentions "advice submission with delivery options" (line 566) but doesn't specify what options exist or how they work.

**Why Confirmation Needed:** Users need clear options. Implementation requires defined behaviors for each option.

**Potential Answers/Options:**
1. Check existing advice feature for options
2. Review design documents for intended options
3. Define options: email, print, display, etc.
4. Implement each option's specific behavior

**Impact if Unanswered:** Feature cannot be implemented correctly. User confusion about options.

---

### B-5: Quiz Scoring Logic

**Question:** What are the exact quiz scoring rules and milestone thresholds?

**Context:** The plan mentions "Quiz scoring and milestones" (line 579) but doesn't specify scoring algorithm or milestone criteria.

**Why Confirmation Needed:** Users need to understand how they're scored. Implementation requires exact logic.

**Potential Answers/Options:**
1. Check existing `scripts/quiz.js` for scoring
2. Review `quiz/index.ts` for score calculation
3. Document all milestones and their criteria
4. Verify scoring matches puzzle difficulty

**Impact if Unanswered:** Users receive incorrect scores. Wrong milestone messages.

---

### B-6: Mom vs Dad Game Flow

**Question:** What is the complete game flow for Mom vs Dad - what screens, states, and transitions exist?

**Context:** The plan references game flow (line 568) but doesn't provide complete state diagram or flow documentation.

**Why Confirmation Needed:** Testing requires knowing expected behavior. Implementation requires understanding all states.

**Potential Answers/Options:**
1. Review design document for game flow
2. Trace through `scripts/mom-vs-dad-simplified.js`
3. Document all game states and transitions
4. Create state diagram

**Impact if Unanswered:** Incomplete testing. Missing edge cases. User confusion during game.

---

### B-7: Vote Tally Display

**Question:** Should vote tallies be visible during voting, only at end, or admin-controlled?

**Context:** The plan mentions "Vote submission and tallying" (line 569) but doesn't specify when users see results.

**Why Confirmation Needed:** Live results vs end-of-game results give different experiences. Affects game strategy and user engagement.

**Potential Answers/Options:**
1. Check existing vote feature behavior
2. Review design for vote display requirements
3. Consider admin controls for reveal timing
4. Implement option for live vs delayed results

**Impact if Unanswered:** May not match user expectations. Extra work to change display timing.

---

### S-3: RLS Policy Verification

**Question:** Are RLS policies properly configured on all tables, especially `baby_shower.guestbook`?

**Context:** The plan doesn't verify RLS policies exist or are correct for the new guestbook entries endpoint.

**Why Confirmation Needed:** RLS protects data from unauthorized access. Missing RLS means anyone can read any entry.

**Potential Answers/Options:**
1. Check each table for RLS status
2. Review RLS policy definitions
3. Test unauthorized access attempts
4. Add policies for tables missing them

**Impact if Unanswered:** Data privacy violations. Unauthorized data access. Compliance issues.

---

### S-4: Input Validation Coverage

**Question:** Are all Edge Functions performing complete input validation per AGENTS.md security standards?

**Context:** The plan adds validation to new functions but doesn't verify existing functions have proper validation.

**Why Confirmation Needed:** Missing input validation allows injection attacks, malformed data, and security vulnerabilities.

**Potential Answers/Options:**
1. Audit each Edge Function for validation
2. Check against `validateInput()` pattern from AGENTS.md
3. Add validation to functions missing it
4. Test with malformed inputs

**Impact if Unanswered:** Security vulnerabilities. Potential injection attacks. Data corruption.

---

### S-5: Error Message Security

**Question:** Do error messages expose sensitive information (table names, query structure, internal paths)?

**Context:** The plan uses `createErrorResponse()` but doesn't verify error messages are sanitized.

**Why Confirmation Needed:** Verbose error messages help attackers understand system architecture. Information disclosure vulnerabilities.

**Potential Answers/Options:**
1. Test each endpoint with invalid input
2. Review error message content
3. Sanitize sensitive information
4. Log detailed errors server-side only

**Impact if Unanswered:** Information disclosure. Security reconnaissance easier for attackers.

---

### TM-2: Phase 2 Timeline Buffer

**Question:** Is the 2-day buffer for Phase 2 (Technical Debt Cleanup) sufficient given potential discoveries in Phase 1?

**Context:** Phase 2 depends on Phase 1 completion but has fixed 2-day allocation regardless of Phase 1 findings.

**Why Confirmation Needed:** Phase 1 may uncover additional issues requiring Phase 2 work. Timeline may need adjustment.

**Potential Answers/Options:**
1. Add 1-day buffer between phases
2. Make Phase 2 tasks optional if Phase 1 overruns
3. Pre-identify Phase 2 tasks that can be deferred
4. Have clear Phase 2 exit criteria

**Impact if Unanswered:** Phase 2 rushed or incomplete. Technical debt remains unaddressed.

---

### TM-3: Phase 3 Effort Estimates

**Question:** Are the 6-hour estimate for guestbook display and 4-hour estimate for advice fixes accurate?

**Context:** These are the largest single tasks in the plan. If estimates are wrong, Phase 3 timeline will slip.

**Why Confirmation Needed:** 6 hours for guestbook display includes Edge Function creation, frontend changes, realtime subscription. 4 hours for advice includes multiple fixes.

**Potential Answers/Options:**
1. Break down tasks into smaller estimates
2. Identify potential complexities not accounted for
3. Add 25% buffer to estimates
4. Start with these tasks to validate estimates

**Impact if Unanswered:** Phase 3 overruns. Project timeline extends.

---

### TM-4: Testing Duration Validation

**Question:** Is 8 hours for Phase 4 (Testing & Documentation) sufficient for comprehensive validation?

**Context:** Phase 4 includes full test suite run (4 hours), E2E test creation (2 hours), and documentation update (2 hours). This assumes test commands work and tests pass on first run.

**Why Confirmation Needed:** Test failures require investigation and fixes. E2E test creation takes time. Documentation updates may discover additional issues.

**Potential Answers/Options:**
1. Add 4-hour buffer for test failures
2. Prioritize tests to run if time constrained
3. Pre-create E2E test templates
4. Identify documentation that needs updates

**Impact if Unanswered:** Testing incomplete. Bugs reach production. Documentation outdated.

---

## Optional Questions

*Can be addressed during implementation*

---

### T-12: CSS File Consolidation

**Question:** Should the 3 CSS files (`main.css`, `animations.css`, component-specific) be consolidated into fewer files?

**Context:** The plan mentions "3 CSS files" but doesn't evaluate if consolidation would improve maintainability or performance.

**Why Confirmation Needed:** Multiple CSS files cause additional HTTP requests. Consolidation improves performance but may hurt maintainability.

**Potential Answers/Options:**
1. Analyze CSS for duplication
2. Consider CSS modules or scoped styles
3. Evaluate build tool for CSS bundling
4. Defer to post-implementation optimization

**Impact if Unanswered:** Minor performance impact. Maintainable as-is for now.

---

### T-13: JavaScript Module Organization

**Question:** Should the 8 JavaScript modules be organized into a directory structure?

**Context:** All scripts are in `scripts/` root directory. No subdirectories for feature organization.

**Why Confirmation Needed:** As features grow, flat structure becomes hard to navigate. Better organization improves maintainability.

**Potential Answers/Options:**
1. Create feature directories (guestbook/, pool/, quiz/, etc.)
2. Move shared utilities to `scripts/lib/`
3. Keep flat structure for simplicity
4. Defer to future refactoring

**Impact if Unanswered:** Navigation becomes harder as codebase grows. Not critical now.

---

### T-14: Error Logging Standardization

**Question:** Should error logging be standardized across all Edge Functions using a common logger?

**Context:** Each function may have its own error handling pattern. Standardization improves debugging.

**Why Confirmation Needed:** Inconsistent logs make debugging harder. Common patterns help new developers understand code.

**Potential Answers/Options:**
1. Create `scripts/lib/logger.ts` with standard format
2. Update all functions to use common logger
3. Log to both console and monitoring service
4. Defer to post-implementation

**Impact if Unanswered:** Inconsistent debugging experience. Minor impact on operations.

---

### R-6: Local Development Environment

**Question:** Is there a complete local development environment setup documentation?

**Context:** The plan references `npm run dev` but doesn't verify environment setup requirements.

**Why Confirmation Needed:** New developers need clear setup steps. Missing documentation causes onboarding delays.

**Potential Answers/Options:**
1. Create or update README.md with setup steps
2. Document required tools (Node, npm, Supabase CLI)
3. Create setup checklist
4. Defer to documentation phase

**Impact if Unanswered:** New developer onboarding takes longer. Setup trial and error.

---

### D-7: Third-party Service SLAs

**Question:** What are the expected uptime and performance SLAs for Supabase and AI APIs?

**Context:** No SLA requirements documented. Monitoring thresholds defined but no baseline for comparison.

**Why Confirmation Needed:** SLAs inform monitoring thresholds and incident response. Without SLAs, "normal" vs "degraded" is undefined.

**Potential Answers/Options:**
1. Check Supabase pricing tier for SLA
2. Review AI provider documentation for uptime
3. Set internal targets based on pricing
4. Defer to operations planning

**Impact if Unanswered:** Unclear when to declare incidents. Monitoring thresholds arbitrary.

---

### D-8: Feature Flag Framework

**Question:** Should a feature flag framework be implemented for staged rollouts?

**Context:** The plan mentions "Deploy with feature flag" (line 648) but no framework exists.

**Why Confirmation Needed:** Feature flags enable safe deployments, A/B testing, and quick rollbacks. Without framework, flags are ad-hoc.

**Potential Answers/Options:**
1. Implement simple feature flag system
2. Use environment variables for flags
3. Integrate third-party service
4. Defer to future enhancement

**Impact if Unanswered:** Deployment risk higher. No A/B testing capability.

---

### B-8: Analytics Integration

**Question:** Should analytics tracking be implemented for user behavior and feature usage?

**Context:** The plan mentions "Analytics tracking" (lines 733, 798) but doesn't specify what analytics solution to use.

**Why Confirmation Needed:** Analytics inform product decisions. Without tracking, usage patterns are unknown.

**Potential Answers/Options:**
1. Integrate existing analytics solution
2. Implement custom event tracking
3. Use Supabase analytics features
4. Defer to post-launch

**Impact if Unanswered:** No data for product decisions. Cannot measure feature success.

---

### S-6: Security Headers Verification

**Question:** Are SECURITY_HEADERS properly configured and tested on all responses?

**Context:** The plan imports `SECURITY_HEADERS` but doesn't verify all responses include them.

**Why Confirmation Needed:** Security headers protect against common attacks (XSS, clickjacking, etc.). Missing headers create vulnerabilities.

**Potential Answers/Options:**
1. Audit all Edge Function responses
2. Test with security header scanner
3. Add missing headers
4. Document required headers

**Impact if Unanswered:** Minor security gaps. Not critical but should be addressed.

---

### TM-5: Documentation Update Ownership

**Question:** Who is responsible for updating each documentation file mentioned in the plan?

**Context:** The plan lists documents to update (lines 586-590) but doesn't assign ownership.

**Why Confirmation Needed:** Unassigned tasks may not get done. Different docs require different expertise.

**Potential Answers/Options:**
1. Assign specific docs to team members
2. Create documentation checklist with owners
3. Set documentation review process
4. Defer to whoever has time

**Impact if Unanswered:** Documentation inconsistent. Hard for new developers to onboard.

---

### TM-6: Post-Implementation Support

**Question:** Who provides support after implementation? What are support procedures?

**Context:** The plan has monitoring and maintenance sections but no support escalation defined.

**Why Confirmation Needed:** Users will have questions or issues. Without support definition, issues go unresolved.

**Potential Answers/Options:**
1. Define support contacts and hours
2. Create issue escalation procedure
3. Set up error monitoring alerts
4. Defer to operations team

**Impact if Unanswered:** User issues may not get resolved. Poor user experience post-launch.

---

## Risk Assessment Summary

### High-Risk Items (Critical Questions Unanswered)

| Question ID | Risk | Likelihood | Impact | Mitigation |
|-------------|------|------------|--------|------------|
| T-1 | RPC function missing | Medium | Critical | Verify before Phase 1 |
| T-2 | Parameter mismatch | Medium | Critical | Check frontend params |
| R-1 | CLI token missing | High | Critical | Set token before any work |
| D-1 | MiniMax key invalid | Medium | High | Test API key |
| S-1 | Service key exposed | High | Critical | Use anon key with RLS |
| TM-1 | Timeline unrealistic | Medium | High | Add buffer days |

### Medium-Risk Items (Important Questions Unanswered)

| Question ID | Risk | Likelihood | Impact | Mitigation |
|-------------|------|------------|--------|------------|
| T-5 | Character limit mismatch | Medium | Medium | Standardize limit |
| T-7 | Missing questions | Low | Medium | Create full set |
| T-8 | Missing indexes | Medium | Medium | Audit database |
| D-4 | AI fallback undefined | Medium | Medium | Create templates |
| S-3 | RLS policies missing | Medium | Medium | Add RLS to all tables |
| TM-2 | Phase 2 buffer insufficient | Medium | Medium | Add buffer days |

### Low-Risk Items (Optional Questions)

| Question ID | Risk | Likelihood | Impact | Mitigation |
|-------------|------|------------|--------|------------|
| T-12 | CSS organization | Low | Low | Future refactor |
| R-6 | Dev environment docs | Low | Low | Update README |
| B-8 | Analytics missing | Low | Low | Post-launch |
| TM-5 | Documentation owners | Low | Low | Assign during work |

---

## Recommendations

### Immediate Actions (Before Phase 1)

1. **Verify Supabase CLI Token** - Run `supabase projects list` to confirm authentication
2. **Verify RPC Functions** - Run SQL query to check function existence
3. **Check Vote Data Location** - Query both tables to confirm migration need
4. **Check Pool Date Constraint** - Verify current constraint state
5. **Security Review** - Ensure guestbook entries endpoint doesn't expose service key

### Phase 1 Pre-Work

1. Review `scripts/mom-vs-dad-simplified.js` for exact parameter names
2. Test MiniMax API key validity
3. Document Z.AI and Kimi account setup requirements
4. Verify `setup-demo-sessions/` directory contents
5. Review team resource availability

### Phase 2 Pre-Work

1. Audit all database tables for structure, indexes, RLS
2. Verify npm test commands exist in package.json
3. Review all Edge Functions for CORS and security headers
4. Document AI feature fallback behavior
5. Search for code dependencies on deprecated tables

### Documentation to Prepare

1. API key configuration guide
2. Database schema documentation
3. Game flow state diagrams
4. Quiz scoring rules
5. Error message guidelines

---

**Document Version:** 1.0  
**Created:** January 9, 2026  
**Author:** Quality Assurance Specialist  
**Next Review:** After all Critical questions resolved