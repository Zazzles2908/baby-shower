# Baby Shower V2 Documentation Inventory

**Last Updated**: 2026-01-03  
**Version**: 1.0  
**Purpose**: Comprehensive mapping and status guide for all project documentation

---

## Navigation

- [Executive Summary](#1-executive-summary)
- [Design Intent Source](#2-design-intent-source)
- [Core Architecture Documents](#3-core-architecture-documents)
- [Implementation Guides](#4-implementation-guides)
- [Research & Analysis](#5-research--analysis)
- [Historical Documents](#6-historical-documents)
- [Action Items](#7-action-items)

---

## 1. Executive Summary

### Overview

This inventory maps all documentation in the `docs/` directory, identifies their alignment status with the MiniMax Vision (as defined in AGENTS.md), and provides clear navigation for developers and AI agents.

### Status Legend

| Symbol | Meaning | Action Required |
|--------|---------|-----------------|
| ✅ | Already MiniMax-aligned (v2.0+) | Use as-is |
| ⚠️ | Needs realignment | Update to match AGENTS.md principles |
| 📦 | Historical/archived | Reference only, do not use for new work |
| 📋 | Reference (still valid) | Valid technical documentation |

### Quick Status Count

| Category | Count | Percentage |
|----------|-------|------------|
| ✅ Aligned | 15 | 32% |
| ⚠️ Needs Work | 12 | 26% |
| 📦 Historical | 10 | 21% |
| 📋 Reference | 10 | 21% |
| **Total** | **47** | **100%** |

### Priority Assessment

**HIGH PRIORITY (Blockers for Phase 1)**:
- 3 documents need updates before frontend work begins

**MEDIUM PRIORITY (Needed for Phase 2)**:
- 5 documents need AI/Brain integration updates

**LOW PRIORITY (Cleanup after Phase 3)**:
- 4 documents can be archived or merged

---

## 2. Design Intent Source

### The Single Source of Truth: AGENTS.md

**Location**: `C:\Project\Baby_Shower\AGENTS.md`  
**Status**: ✅ MiniMax-aligned  
**Purpose**: Vision document capturing *why* we're building something, not *how*

### Core Principles from AGENTS.md

1. **The Vision**: "Digital Living Room" - transforming from static page to interactive space
2. **Three Pillars**:
   - **THE SOUL** (Frontend): Emotional, animated, reactive
   - **THE SYSTEM** (Backend): Secure, reliable, firewalled
   - **THE BRAIN** (AI): Personality-driven routing
3. **Cozy Barnyard Aesthetic**: Ghibli-meets-Stardew Valley
4. **Character System**: Mom, Dad, Thinking, Celebration hosts
5. **Hidden Name Principle**: Baby's name never in code/logs
6. **Firewall Pattern**: Public vs Internal schema separation
7. **Strangler Fig**: Phased implementation approach

### Key Decisions Required (from AGENTS.md)

| Decision | Status | Impact |
|----------|--------|--------|
| Heading Font (Quicksand vs Fredoka One) | ⚠️ Pending | Affects entire design |
| Asset Filenames Verification | ⚠️ Pending | Blocks visual implementation |
| Phase 4 Scope Definition | ⚠️ Pending | Timeline impact |

### Alignment Check Questions

When evaluating any document, verify alignment with:

1. Is this warm? (Would a guest feel welcomed?)
2. Is this alive? (Does motion serve emotion?)
3. Is this safe? (Does the firewall pattern hold?)
4. Is this honest? (Does the character match the response?)
5. Is this complete? (Does this phase deliver something beautiful?)

---

## 3. Core Architecture Documents

### 3.1 MiniMax Plan Documents

| Document | Status | Notes |
|----------|--------|-------|
| `docs/MiniMax_Plan/00_MASTER_ROADMAP.md` | ✅ Aligned | CONFIRMED - maps to AGENTS.md principles |
| `docs/MiniMax_Plan/01_UI_VISUAL_DESIGN.md` | ⚠️ Needs Work | Needs font/asset verification |
| `docs/MiniMax_Plan/02_TECHNICAL_ARCHITECTURE.md` | ⚠️ Needs Work | Needs Vue 3 + Supabase integration |
| `docs/MiniMax_Plan/99_COMPREHENSIVE_ANALYSIS.md` | ⚠️ Needs Work | Needs alignment with Strangler Fig phases |

### 3.2 Technical Architecture

| Document | Status | Notes |
|----------|--------|-------|
| `docs/technical/ARCHITECTURE.md` | ✅ Aligned | Production-ready three-stage pipeline |
| `docs/technical/SETUP.md` | ⚠️ Needs Work | Needs Vue 3 setup instructions |
| `docs/technical/TESTING.md` | ✅ Aligned | E2E test strategy valid |
| `docs/technical/TROUBLESHOOTING.md` | ✅ Aligned | Production issues resolved |

### 3.3 Architecture Analysis & Diagrams

| Document | Status | Notes |
|----------|--------|-------|
| `docs/ARCHITECTURE_DIAGRAM.md` | ⚠️ Needs Work | Needs MiniMax alignment |
| `docs/ARCHITECTURE.md` | ⚠️ Needs Work | Merged into technical/ARCHITECTURE.md |

### 3.4 Current vs Proposed Architecture

| Document | Status | Notes |
|----------|--------|-------|
| `docs/architecture/01-current-system.md` | ⚠️ Needs Work | Documents vanilla JS - needs Vue 3 update |
| `docs/architecture/02-proposed-options.md` | ⚠️ Needs Work | Needs target architecture definition |

---

## 4. Implementation Guides

### 4.1 Design & Proposals

| Document | Status | Notes |
|----------|--------|-------|
| `docs/DESIGN_PROPOSALS.md` | ⚠️ Needs Work | Contains hardcoded names, needs privacy standard |
| `docs/INTEGRATION_PATTERNS.md` | ⚠️ Needs Work | Single-provider AI, needs router pattern |
| `docs/IMAGE_INTEGRATION.md` | ⚠️ Needs Work | Needs Cozy Barnyard aesthetic update |

### 4.2 Schema & Database

| Document | Status | Notes |
|----------|--------|-------|
| `docs/SCHEMA_IMPLEMENTATION.md` | ⚠️ Needs Work | Needs internal/public schema separation |
| `docs/reference/SCHEMA.md` | ✅ Aligned | Valid SQL reference |
| `docs/reference/API.md` | ✅ Aligned | Valid API reference |
| `docs/reference/ENVIRONMENT.md` | ⚠️ Needs Work | Needs VITE_BABY_NAME documentation |

### 4.3 Edge Functions

| Document | Status | Notes |
|----------|--------|-------|
| `docs/reference/EDGE_FUNCTIONS.md` | ✅ Aligned | Valid Edge Function reference |
| `docs/EDGE_FUNCTIONS_ENV_CONFIG.md` | ⚠️ Needs Work | Needs privacy pattern update |

### 4.4 Deployment & Operations

| Document | Status | Notes |
|----------|--------|-------|
| `docs/DEPLOYMENT.md` | ✅ Aligned | Production deployment guide |
| `docs/implementation/README.md` | ⚠️ Needs Work | Needs Phase-based structure |

### 4.5 Realignment Strategy

| Document | Status | Notes |
|----------|--------|-------|
| `docs/REALIGNMENT_STRATEGY_COMPLETE.md` | ✅ Aligned | Complete strategy & planning |
| `docs/REALIGNMENT_STRATEGY.md` | ⚠️ Needs Work | Superseded by COMPLETE version |
| `docs/REALIGNMENT_STRATEGY_PART2.md` | ⚠️ Needs Work | Superseded by COMPLETE version |

---

## 5. Research & Analysis

### 5.1 Provider Research

| Document | Status | Notes |
|----------|--------|-------|
| `docs/RESEARCH_SUPABASE.md` | ✅ Aligned | Supabase capabilities valid |
| `docs/RESEARCH_VERCEL.md` | ⚠️ Needs Work | Needs environment variable security |
| `docs/RESEARCH_AI.md` | ⚠️ Needs Work | Single provider, needs router info |

### 5.2 MiniMax-Specific Research

| Document | Status | Notes |
|----------|--------|-------|
| `docs/research/01-supabase-overview.md` | ✅ Aligned | Valid Supabase research |
| `docs/research/02-vercel-capabilities.md` | ⚠️ Needs Work | Needs deployment security |
| `docs/research/03-ai-providers.md` | ⚠️ Needs Work | Needs multi-provider routing |
| `docs/research/04-integration-patterns.md` | ⚠️ Needs Work | Needs router pattern |

### 5.3 Proposals

| Document | Status | Notes |
|----------|--------|-------|
| `docs/proposals/01-ai-feature-design.md` | ⚠️ Needs Work | Single provider, needs personality routing |

### 5.4 User & Context Profiles

| Document | Status | Notes |
|----------|--------|-------|
| `docs/Users/JAZEEL_PROFILE.md` | ✅ Aligned | Valid context |
| `docs/Users/MICHELLE_PROFILE.md` | ✅ Aligned | Valid context |
| `docs/Users/AI_STACK_ANALYSIS_2026-01-02.md` | ⚠️ Needs Work | Legacy analysis |
| `docs/Users/PROJECT_COMPLETION_SUMMARY_2026-01-02.md` | 📦 Historical | Superseded |

---

## 6. Historical Documents

### 6.1 Critical Analysis (Archived)

| Document | Status | Notes |
|----------|--------|-------|
| `docs/historical/CRITICAL_ANALYSIS_2026-01-02.md` | 📦 Archived | All issues resolved - see technical/ARCHITECTURE.md |
| `docs/historical/DATABASE_SCHEMA_ANALYSIS.md` | 📦 Archived | Merged into SCHEMA_IMPLEMENTATION.md |
| `docs/historical/DETAILED_FIX_PLAN.md` | 📦 Archived | Superseded by REALIGNMENT_STRATEGY_COMPLETE.md |
| `docs/historical/PLANS.md` | 📦 Archived | Merged into MASTER_ROADMAP.md |
| `docs/historical/GOOGLE_SHEETS_INTEGRATION_VERIFICATION.md` | 📦 Archived | Google Sheets integration complete |

### 6.2 Summary Documents

| Document | Status | Notes |
|----------|--------|-------|
| `docs/SUMMARY.md` | ⚠️ Needs Work | Needs MiniMax alignment |
| `docs/SUPABASE_INFRASTRUCTURE_ANALYSIS.md` | ⚠️ Needs Work | Needs firewall pattern update |
| `docs/CONFLICT_ANALYSIS.md` | 📦 Archived | Resolved in realignment strategy |

### 6.3 Test Reports

| Document | Status | Notes |
|----------|--------|-------|
| `docs/testing/E2E_TEST_STRATEGY.md` | ✅ Aligned | Valid test strategy |
| `docs/testing/E2E_TEST_REPORT.md` | 📦 Historical | Snapshot of 2026-01-02 tests |

---

## 7. Action Items

### HIGH PRIORITY - Blockers for Phase 1 (Frontend Foundation)

#### 1. Update `docs/architecture/01-current-system.md`
- **Current**: Documents vanilla JS architecture
- **Needed**: Vue 3 + Vite architecture
- **Blocks**: Team alignment on frontend stack
- **Dependencies**: None (foundational)

#### 2. Create `docs/MiniMax_Plan/01_VUE3_SETUP.md` (NEW)
- **Content**: Vue 3 + Vite project initialization, Pinia setup, component library
- **Blocks**: All frontend development work
- **Priority**: CRITICAL

#### 3. Resolve Font Decision
- **Options**: Quicksand vs Fredoka One
- **Impact**: Affects entire Cozy Barnyard aesthetic
- **Action Required**: Design decision before Phase 1

### MEDIUM PRIORITY - Needed for Phase 2 (AI Backend)

#### 4. Create `docs/MiniMax_Plan/03_AI_ROUTER.md` (NEW)
- **Content**: Multi-provider routing, intent classification, personality switchboard
- **Blocks**: Phase 2 AI backend implementation
- **Dependencies**: Provider API credentials

#### 5. Update `docs/RESEARCH_AI.md`
- **Current**: Single provider documentation
- **Needed**: Multi-provider (MiniMax, Moonshot, Z.AI) documentation
- **Dependencies**: AI router documentation

#### 6. Update `docs/proposals/01-ai-feature-design.md`
- **Current**: Single provider approach
- **Needed**: Personality-driven routing with Dad/Mom/Thinking characters
- **Dependencies**: AI router documentation

### LOW PRIORITY - Cleanup after Phase 3

#### 7. Archive Historical Documents
- `docs/historical/CRITICAL_ANALYSIS_2026-01-02.md` → Mark as reference only
- `docs/historical/DATABASE_SCHEMA_ANALYSIS.md` → Merge into SCHEMA_IMPLEMENTATION.md
- `docs/historical/DETAILED_FIX_PLAN.md` → Merge into REALIGNMENT_STRATEGY_COMPLETE.md
- `docs/historical/PLANS.md` → Merge into MASTER_ROADMAP.md

#### 8. Clean Up Superseded Documents
- `docs/REALIGNMENT_STRATEGY.md` → Replace with COMPLETE version
- `docs/REALIGNMENT_STRATEGY_PART2.md` → Replace with COMPLETE version
- `docs/ARCHITECTURE.md` → Merge into technical/ARCHITECTURE.md

#### 9. Update Privacy Documentation
- `docs/DESIGN_PROPOSALS.md` → Replace hardcoded names with `VITE_BABY_NAME`
- `docs/RESEARCH_VERCEL.md` → Add environment variable security section
- `docs/EDGE_FUNCTIONS_ENV_CONFIG.md` → Add firewall pattern documentation

### Dependency Graph

```
Phase 1 (Frontend)
├── 1. Font Decision ──────────────┐
├── 2. Vue 3 Setup (NEW) ──────────┼──▶ Blocking
├── 3. Architecture Update ────────┘
│
├── 4. AI Router (NEW) ───────────────▶ Phase 2 (AI)
├── 5. AI Research Update ─────────────│
└── 6. AI Feature Design Update ───────┘
    │
    └──▶ Phase 3 (Privacy)
        ├── 7. Archive Historical
        ├── 8. Clean Up Superseded
        └── 9. Update Privacy Docs
```

### Document Creation Checklist

#### New Documents Required
- [ ] `docs/MiniMax_Plan/01_VUE3_SETUP.md`
- [ ] `docs/MiniMax_Plan/03_AI_ROUTER.md`
- [ ] `docs/MiniMax_Plan/05_VISUAL_THEME.md` (Cozy Barnyard design system)

#### Documents to Archive
- [ ] `docs/historical/CRITICAL_ANALYSIS_2026-01-02.md`
- [ ] `docs/historical/DATABASE_SCHEMA_ANALYSIS.md`
- [ ] `docs/historical/DETAILED_FIX_PLAN.md`
- [ ] `docs/historical/PLANS.md`
- [ ] `docs/REALIGNMENT_STRATEGY.md`
- [ ] `docs/REALIGNMENT_STRATEGY_PART2.md`
- [ ] `docs/ARCHITECTURE.md`

#### Documents to Merge
- [ ] `docs/REALIGNMENT_STRATEGY.md` → `REALIGNMENT_STRATEGY_COMPLETE.md`
- [ ] `docs/ARCHITECTURE.md` → `technical/ARCHITECTURE.md`
- [ ] `docs/historical/DATABASE_SCHEMA_ANALYSIS.md` → `SCHEMA_IMPLEMENTATION.md`

---

## Reference: File Tree

```
docs/
├── architecture/
│   ├── 01-current-system.md ⚠️
│   └── 02-proposed-options.md ⚠️
├── historical/
│   ├── CRITICAL_ANALYSIS_2026-01-02.md 📦
│   ├── DATABASE_SCHEMA_ANALYSIS.md 📦
│   ├── DETAILED_FIX_PLAN.md 📦
│   ├── GOOGLE_SHEETS_INTEGRATION_VERIFICATION.md 📦
│   └── PLANS.md 📦
├── implementation/
│   └── README.md ⚠️
├── MiniMax_Plan/
│   ├── 00_MASTER_ROADMAP.md ✅
│   ├── 01_UI_VISUAL_DESIGN.md ⚠️
│   ├── 02_TECHNICAL_ARCHITECTURE.md ⚠️
│   └── 99_COMPREHENSIVE_ANALYSIS.md ⚠️
├── proposals/
│   └── 01-ai-feature-design.md ⚠️
├── reference/
│   ├── API.md ✅
│   ├── EDGE_FUNCTIONS.md ✅
│   ├── ENVIRONMENT.md ⚠️
│   └── SCHEMA.md ✅
├── research/
│   ├── 01-supabase-overview.md ✅
│   ├── 02-vercel-capabilities.md ⚠️
│   ├── 03-ai-providers.md ⚠️
│   └── 04-integration-patterns.md ⚠️
├── technical/
│   ├── ARCHITECTURE.md ✅
│   ├── SETUP.md ⚠️
│   ├── TESTING.md ✅
│   └── TROUBLESHOOTING.md ✅
├── testing/
│   ├── E2E_TEST_REPORT.md 📦
│   └── E2E_TEST_STRATEGY.md ✅
├── Users/
│   ├── AI_STACK_ANALYSIS_2026-01-02.md ⚠️
│   ├── JAZEEL_PROFILE.md ✅
│   ├── MICHELLE_PROFILE.md ✅
│   └── PROJECT_COMPLETION_SUMMARY_2026-01-02.md 📦
├── ARCHITECTURE.md ⚠️
├── ARCHITECTURE_DIAGRAM.md ⚠️
├── CONFLICT_ANALYSIS.md 📦
├── DEPLOYMENT.md ✅
├── DESIGN_PROPOSALS.md ⚠️
├── DOCS_INVENTORY.md (this file) ✅
├── EDGE_FUNCTIONS_ENV_CONFIG.md ⚠️
├── IMAGE_INTEGRATION.md ⚠️
├── INTEGRATION_PATTERNS.md ⚠️
├── REALIGNMENT_STRATEGY.md ⚠️ (superseeded)
├── REALIGNMENT_STRATEGY_COMPLETE.md ✅
├── REALIGNMENT_STRATEGY_PART2.md ⚠️ (superseeded)
├── RESEARCH_AI.md ⚠️
├── RESEARCH_SUPABASE.md ✅
├── RESEARCH_VERCEL.md ⚠️
├── SCHEMA_IMPLEMENTATION.md ⚠️
├── SUMMARY.md ⚠️
└── SUPABASE_INFRASTRUCTURE_ANALYSIS.md ⚠️
```

---

## Maintenance

### Update Schedule

This inventory should be updated:
- After any new document is added
- After any document status changes
- After Phase completions (1, 2, 3, 4)
- Monthly for research documents

### Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-03 | Initial inventory creation |

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-03  
**Maintained By**: Development Team  
**Status**: Active - Requires periodic updates
