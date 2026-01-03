# Conflict Analysis: Existing Documentation vs MiniMax Vision

**Document Version:** 1.0  
**Date:** 2026-01-03  
**Project:** Baby Shower App Redesign  
**Status:** Analysis Complete

---

## Executive Summary

This document provides a comprehensive analysis of conflicts between existing documentation and the MiniMax vision defined in [`docs/MiniMax_Plan/00_MASTER_ROADMAP.md`](docs/MiniMax_Plan/00_MASTER_ROADMAP.md). The analysis identifies **17 conflicts** across **6 documents**, with severity ratings ranging from Critical to Low.

| Severity | Count | Action Required |
|----------|-------|-----------------|
| Critical | 3 | Immediate update before Phase 1 |
| High | 5 | Update during Phase 1-2 |
| Medium | 6 | Update during Phase 2-3 |
| Low | 3 | Update during Phase 3-4 or archive |

---

## 1. Frontend Technology Conflict

### 1.1 Document: [`docs/architecture/01-current-system.md`](docs/architecture/01-current-system.md:52)

| Attribute | Current Documentation | MiniMax Vision |
|-----------|----------------------|----------------|
| Frontend | Vanilla HTML/JS/CSS | Vue 3 + Vite |
| Framework | None (static) | Component-based |
| Animation | CSS transitions | `<Transition>` + `@vueuse/motion` |

**Conflict:** The current system architecture document explicitly states "Vanilla HTML/JS/CSS" as the frontend technology, while the MiniMax vision mandates Vue 3 + Vite for the "Soul" layer.

**Severity:** Critical

**Affected Sections:**
- Line 52: "Frontend | Vanilla HTML/JS/CSS | Production"

**Recommended Action:** Update

**Required Changes:**
1. Replace "Vanilla HTML/JS/CSS" with "Vue 3 + Vite"
2. Add new component architecture diagram
3. Include Pinia state management layer
4. Document `@vueuse/motion` integration

---

### 1.2 Document: [`docs/DESIGN_PROPOSALS.md`](docs/DESIGN_PROPOSALS.md:43-98)

| Attribute | Current Documentation | MiniMax Vision |
|-----------|----------------------|----------------|
| CSS Approach | Global CSS variables | Vue SFC with scoped CSS |
| Theming | `:root` variables | CSS-in-JS or CSS Modules |
| Animations | CSS `@keyframes` | Vue `<Transition>` components |

**Conflict:** The design proposals document provides extensive CSS code for a vanilla HTML/CSS/JavaScript architecture. This CSS must be converted to Vue 3 Single File Components (SFC) with scoped styling.

**Severity:** High

**Affected Sections:**
- Lines 43-98: Color palette and typography CSS
- Lines 154-263: Hero section HTML/CSS
- Lines 267-399: Activity grid HTML/CSS
- Lines 405-629: Advice capsule HTML/CSS

**Recommended Action:** Merge

**Required Changes:**
1. Convert global CSS to Vue SFC `<style scoped>` blocks
2. Create Vue components: `HeroSection`, `ActivityCard`, `AdviceCapsule`
3. Move color palette to CSS custom properties in global stylesheet
4. Convert CSS animations to Vue `<Transition>` components

---

## 2. AI Provider Strategy Conflict

### 2.1 Document: [`docs/architecture/01-current-system.md`](docs/architecture/01-current-system.md:32-45)

| Attribute | Current Documentation | MiniMax Vision |
|-----------|----------------------|----------------|
| AI Services | MiniMax API only | Multi-Provider Router |
| Provider List | Single (MiniMax) | MiniMax, Moonshot, Z.AI |
| Personality | Sassy only | Sassy, Helpful, Agentic |

**Conflict:** The current architecture diagram shows only "MiniMax API" under AI Services. The MiniMax vision requires a multi-provider router that can route requests to MiniMax, Moonshot, or Z.AI based on task requirements.

**Severity:** Critical

**Affected Sections:**
- Lines 32-45: AI Services subgraph diagram
- Component Inventory table (line 57): "AI | MiniMax API | Active"

**Recommended Action:** Update

**Required Changes:**
1. Expand AI Services subgraph to show Multi-Provider Router
2. Add provider selection logic documentation
3. Document personality-driven routing rules
4. Include fallback strategy for provider failures

---

### 2.2 Document: [`docs/DESIGN_PROPOSALS.md`](docs/DESIGN_PROPOSALS.md:1034-1062)

| Attribute | Current Documentation | MiniMax Vision |
|-----------|----------------------|----------------|
| API Endpoint | Direct MiniMax API | Router with fallback |
| Model | `abab6.5s-chat` | Provider-specific models |
| Error Handling | Basic try/catch | Circuit breaker + fallback |

**Conflict:** The AI content generation code in DESIGN_PROPOSALS.md (lines 1034-1062) makes direct API calls to MiniMax without provider routing or fallback logic.

**Severity:** High

**Affected Sections:**
- Lines 1034-1062: `generateAIContent()` function

**Recommended Action:** Update

**Required Changes:**
1. Replace direct API call with router function
2. Add provider health check logic
3. Implement fallback to secondary providers
4. Add circuit breaker pattern for resilience

---

## 3. Implementation Phase Conflict

### 3.1 Document: [`docs/DESIGN_PROPOSALS.md`](docs/DESIGN_PROPOSALS.md:1588-1634)

| Attribute | Current Documentation | MiniMax Vision |
|-----------|----------------------|----------------|
| Phase 1 | Database schema update | Vue 3 initialization + visual design |
| Phase 2 | Design system | AI Backend deployment |
| Phase 3 | Realtime features | Privacy & Security |
| Phase 4 | AI enhancements | Interactive Games (TBD) |
| Phase 5 | Legacy features | Not planned |

**Conflict:** The implementation roadmap in DESIGN_PROPOSALS.md uses a 5-phase approach spanning 5 weeks. The MiniMax vision uses a 4-phase "Strangler Fig" pattern with different priorities.

**Severity:** Medium

**Affected Sections:**
- Lines 1588-1634: Implementation Roadmap sections 5.1-5.5

**Recommended Action:** Update

**Required Changes:**
1. Align phases with MiniMax roadmap:
   - Phase 1: Vue 3 Foundation + Visual Design
   - Phase 2: AI Backend + Personality Switchboard
   - Phase 3: Privacy + Security
   - Phase 4: Interactive Games (deferred)
2. Remove Phase 5 (Legacy Features) - merge into appropriate phases
3. Update task durations and dependencies

---

## 4. Component Architecture Conflict

### 4.1 Document: [`docs/DESIGN_PROPOSALS.md`](docs/DESIGN_PROPOSALS.md:763-926)

| Attribute | Current Documentation | MiniMax Vision |
|-----------|----------------------|----------------|
| Handler Pattern | Unified function with switch | Activity-specific handlers |
| Code Organization | Single file per activity | Deno module imports |
| Validation | Inline validation schema | Zod or similar library |

**Conflict:** The unified handler approach in DESIGN_PROPOSALS.md creates a single large handler file. The MiniMax vision favors modular, composable Edge Functions with clear separation of concerns.

**Severity:** Medium

**Affected Sections:**
- Lines 763-926: Unified function handler design

**Recommended Action:** Merge

**Required Changes:**
1. Refactor unified handler into modular imports
2. Create `activity-registry.ts` for activity configurations
3. Extract validation to separate schema files
4. Add shared utilities module

---

### 4.2 Document: [`docs/SCHEMA_IMPLEMENTATION.md`](docs/SCHEMA_IMPLEMENTATION.md:1-33)

| Attribute | Current Documentation | MiniMax Vision |
|-----------|----------------------|----------------|
| Schema Organization | Single `baby_shower` schema | `internal` vs `public` separation |
| Table Naming | snake_case only | Consistent with RLS policies |
| Trigger Pattern | Database triggers | Application-level processing |

**Conflict:** The schema implementation document doesn't address the MiniMax requirement for `internal` vs `public` schema separation for security and the "Hidden Name" privacy standard.

**Severity:** High

**Affected Sections:**
- Lines 1-33: Architecture overview and data flow
- Migration strategy (lines 224-246)

**Recommended Action:** Update

**Required Changes:**
1. Add `internal` schema for sensitive data
2. Move baby name to internal schema
3. Document RLS policies for schema separation
4. Update migration strategy to include schema split

---

## 5. State Management Conflict

### 5.1 Document: [`docs/architecture/01-current-system.md`](docs/architecture/01-current-system.md:50-57)

| Attribute | Current Documentation | MiniMax Vision |
|-----------|----------------------|----------------|
| State Management | LocalStorage only | Pinia + LocalStorage persistence |
| Realtime Sync | Polling-based | WebSocket subscriptions |
| Data Fetching | Fetch API | TanStack Query or similar |

**Conflict:** The current system architecture doesn't mention state management beyond localStorage. The MiniMax vision requires Pinia for centralized state with Supabase Realtime integration.

**Severity:** Medium

**Affected Sections:**
- Component Inventory table (lines 50-57)

**Recommended Action:** Update

**Required Changes:**
1. Add "State Management: Pinia" to component inventory
2. Document LocalStorage persistence strategy
3. Add realtime subscription management via Pinia
4. Include optimistic update patterns

---

## 6. Privacy & Security Conflict

### 6.1 Document: [`docs/DESIGN_PROPOSALS.md`](docs/DESIGN_PROPOSALS.md:148-149)

| Attribute | Current Documentation | MiniMax Vision |
|-----------|----------------------|----------------|
| Baby Name Handling | Hardcoded in HTML | Environment variable only |
| Build-time Injection | Not mentioned | Secure env vars at build time |
| Development Mode | "The Little One" placeholder | Same placeholder with masking |

**Conflict:** The DESIGN_PROPOSALS.md HTML code (lines 168-185) hardcodes "Jazeel & Michelle's" and "Baby Maya's Shower" directly in the HTML. The MiniMax "Hidden Name" privacy standard requires these to be environment variables only.

**Severity:** Critical

**Affected Sections:**
- Lines 168-185: Hero section HTML with hardcoded names
- Lines 423-425: Advice capsule form intro text

**Recommended Action:** Update

**Required Changes:**
1. Replace hardcoded names with `VITE_BABY_NAME` variable
2. Replace "Jazeel & Michelle" with `VITE_COUPLE_NAMES`
3. Add build-time environment variable injection documentation
4. Create `.env.example` with placeholder values

---

### 6.2 Document: [`docs/RESEARCH_VERCEL.md`](docs/RESEARCH_VERCEL.md:278-289)

| Attribute | Current Documentation | MiniMax Vision |
|-----------|----------------------|----------------|
| Env Vars | Basic Supabase keys | Masked baby name variable |
| Security | Standard headers | Internal/public schema separation |

**Conflict:** The Vercel environment variables documentation doesn't include the special baby name masking requirement from the MiniMax vision.

**Severity:** Low

**Affected Sections:**
- Lines 278-289: Environment Variables table

**Recommended Action:** Update

**Required Changes:**
1. Add `VITE_BABY_NAME` to environment variables table
2. Document build-time injection only (not client-side)
3. Add security considerations for name masking

---

## 7. Activity Feed & Realtime Conflict

### 7.1 Document: [`docs/SCHEMA_IMPLEMENTATION.md`](docs/SCHEMA_IMPLEMENTATION.md:328-357)

| Attribute | Current Documentation | MiniMax Vision |
|-----------|----------------------|----------------|
| Subscription Pattern | Table-specific channels | Unified activity feed |
| Data Format | Raw table data | Normalized activity items |
| Milestone Trigger | Not documented | Event-driven celebrations |

**Conflict:** The realtime subscription code in SCHEMA_IMPLEMENTATION.md shows individual table subscriptions, but doesn't address the MiniMax requirement for a unified activity feed with milestone celebrations.

**Severity:** Medium

**Affected Sections:**
- Lines 328-357: Realtime subscriptions section

**Recommended Action:** Update

**Required Changes:**
1. Add activity feed normalization layer
2. Document milestone event dispatch
3. Add celebration trigger integration
4. Include activity type mapping

---

## 8. Visual Design System Conflict

### 8.1 Document: [`docs/DESIGN_PROPOSALS.md`](docs/DESIGN_PROPOSALS.md:37-148)

| Attribute | Current Documentation | MiniMax Vision |
|-----------|----------------------|----------------|
| Design Theme | "Yin-Yin" (soft, nature) | "Cozy Barnyard" (Ghibli-meets-Stardew) |
| Color Palette | Sage green + soft gold | Needs animal/nature theme |
| Animation Library | CSS only | `@vueuse/motion` + transitions |

**Conflict:** The design proposals establish a "Yin-Yin" theme with sage green and soft gold colors. The MiniMax vision specifies a "Cozy Barnyard" aesthetic inspired by Studio Ghibli and Stardew Valley.

**Severity:** Low

**Affected Sections:**
- Lines 37-148: Visual Design System section

**Recommended Action:** Merge

**Required Changes:**
1. Add barnyard/animal theme elements to color palette
2. Extend typography with handwritten/script fonts
3. Add animation system documentation
4. Include animal iconography guidelines

---

## 9. Testing Strategy Gap

### 9.1 Document: [`docs/DESIGN_PROPOSALS.md`](docs/DESIGN_PROPOSALS.md:1588-1634)

| Attribute | Current Documentation | MiniMax Vision |
|-----------|----------------------|----------------|
| Testing | Not addressed | E2E tests required |
| Test Coverage | No requirements | 80% minimum coverage |
| CI/CD | Not documented | Vercel Preview Deployments |

**Conflict:** The implementation roadmap doesn't include testing requirements or CI/CD pipeline setup, which are essential for the Vue 3 + Vite migration.

**Severity:** Medium

**Affected Sections:**
- Lines 1588-1634: Implementation Roadmap

**Recommended Action:** Update

**Required Changes:**
1. Add testing phase to each implementation phase
2. Document E2E test requirements (Playwright)
3. Add unit test requirements (Vitest)
4. Include Vercel preview deployment strategy

---

## 10. Documentation Gaps

The following topics require **new documentation** that doesn't exist in current documents:

### 10.1 Required New Documents

| Document | Purpose | Priority |
|----------|---------|----------|
| `docs/MiniMax_Plan/01_VUE3_SETUP.md` | Vue 3 + Vite project initialization | Critical |
| `docs/MiniMax_Plan/02_PINIA_STATE.md` | Pinia store architecture | High |
| `docs/MiniMax_Plan/03_AI_ROUTER.md` | Multi-provider AI router design | Critical |
| `docs/MiniMax_Plan/04_PRIVACY_STANDARD.md` | "Hidden Name" implementation | High |
| `docs/MiniMax_Plan/05_VISUAL_THEME.md` | "Cozy Barnyard" design system | High |
| `docs/MiniMax_Plan/06_MIGRATION_STRATEGY.md` | Vanilla to Vue 3 migration | Critical |
| `docs/architecture/02_TARGET_ARCHITECTURE.md` | Target Vue 3 architecture | High |

### 10.2 Document Archives

The following documents should be **archived** after creating new documentation:

| Document | Reason for Archive |
|----------|-------------------|
| `docs/historical/CRITICAL_ANALYSIS_2026-01-02.md` | Superseded by MiniMax Plan |
| `docs/historical/DATABASE_SCHEMA_ANALYSIS.md` | Superseded by SCHEMA_IMPLEMENTATION.md |
| `docs/historical/DETAILED_FIX_PLAN.md` | Superseded by MiniMax Plan |
| `docs/historical/PLANS.md` | Superseded by MASTER_ROADMAP.md |

---

## 11. Summary Table

| Document | Conflicts | Critical | High | Medium | Low | Action |
|----------|-----------|----------|------|--------|-----|--------|
| `docs/architecture/01-current-system.md` | 3 | 2 | 0 | 0 | 1 | Update |
| `docs/DESIGN_PROPOSALS.md` | 8 | 1 | 3 | 3 | 1 | Merge |
| `docs/RESEARCH_VERCEL.md` | 1 | 0 | 0 | 0 | 1 | Update |
| `docs/SCHEMA_IMPLEMENTATION.md` | 2 | 0 | 1 | 1 | 0 | Update |
| **New Documents Required** | 7 | 3 | 4 | 0 | 0 | Create |
| **Documents to Archive** | 4 | - | - | - | - | Archive |

---

## 12. Action Items

### Phase 0: Pre-Phase 1 (Immediate)

- [ ] Create `docs/MiniMax_Plan/01_VUE3_SETUP.md`
- [ ] Create `docs/MiniMax_Plan/03_AI_ROUTER.md`
- [ ] Create `docs/MiniMax_Plan/06_MIGRATION_STRATEGY.md`
- [ ] Update `docs/architecture/01-current-system.md` - Critical items
- [ ] Update `docs/DESIGN_PROPOSALS.md` - Critical items (hardcoded names)

### Phase 1: Foundation

- [ ] Update `docs/architecture/01-current-system.md` - Remaining items
- [ ] Create `docs/MiniMax_Plan/02_PINIA_STATE.md`
- [ ] Create `docs/MiniMax_Plan/04_PRIVACY_STANDARD.md`
- [ ] Merge `docs/DESIGN_PROPOSALS.md` CSS to Vue SFC format

### Phase 2: Backend

- [ ] Update `docs/SCHEMA_IMPLEMENTATION.md` - Schema separation
- [ ] Update `docs/DESIGN_PROPOSALS.md` - AI router integration
- [ ] Create `docs/MiniMax_Plan/05_VISUAL_THEME.md`
- [ ] Create `docs/architecture/02_TARGET_ARCHITECTURE.md`

### Phase 3-4

- [ ] Update `docs/DESIGN_PROPOSALS.md` - Implementation roadmap
- [ ] Archive historical documents
- [ ] Create comprehensive testing documentation

---

## References

- [`docs/MiniMax_Plan/00_MASTER_ROADMAP.md`](docs/MiniMax_Plan/00_MASTER_ROADMAP.md) - MiniMax Vision
- [`docs/architecture/01-current-system.md`](docs/architecture/01-current-system.md) - Current Architecture
- [`docs/DESIGN_PROPOSALS.md`](docs/DESIGN_PROPOSALS.md) - Design Proposals
- [`docs/RESEARCH_VERCEL.md`](docs/RESEARCH_VERCEL.md) - Vercel Research
- [`docs/SCHEMA_IMPLEMENTATION.md`](docs/SCHEMA_IMPLEMENTATION.md) - Schema Implementation

---

**Document Maintainer:** Infrastructure Analysis System  
**Last Updated:** 2026-01-03  
**Next Review:** 2026-01-10
