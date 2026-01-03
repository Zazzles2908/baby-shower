
#### Decision 4: Phase 4 (Interactive Games) Scope

**Context:** MiniMax Plan lists Phase 4 as "Interactive Games (TBD)" with no concrete deliverables. Need to decide whether to design now or defer.

**Options:**
1. **Defer Completely:** No design work, focus on first 3 phases
2. **High-Level Planning:** Define goals, user stories, rough scope
3. **Detailed Design Sprint:** Full wireframes, technical spec, API contracts
4. **Build Simple Games Now:** Scope small, implement within current timeline

**Pros and Cons:**

| Option | Pros | Cons |
|--------|------|------|
| **Defer** | Focus on core product, reduce complexity, meet timeline | Risk of architectural decisions limiting games later |
| **High-Level Plan** | Maintains vision, informs architecture, minimal time | Still vague, may not prevent future rework |
| **Design Sprint** | Clear roadmap, proper architecture, team alignment | Significant time investment (1-2 weeks) |
| **Build Now** | Immediate value, learn by doing, ship faster | May build wrong thing, technical debt risk |

**Recommendation:** High-level planning during Phase 3, detailed design sprint after Phase 3

**Rationale:**
- Phases 1-3 (Core app + AI + Security) are higher priority
- Need to validate core product before investing in games
- High-level planning ensures architecture supports future games
- Can reallocate time if core features finish early

**Implementation:**
1. **During Phase 3:**
   - Define game goals (connection, entertainment, legacy)
   - Identify target users (all ages, tech levels)
   - Rough technical requirements (realtime, Z.AI integration)
   - Create `docs/MiniMax_Plan/08_GAMES_OVERVIEW.md`

2. **After Phase 3:**
   - Schedule 1-week design sprint with stakeholders
   - Create wireframes and user flows
   - Define technical architecture and API contracts
   - Estimate effort and timeline
   - Decision: Build now vs. post-launch

**Impact:** Timeline for Phase 4, resource allocation

**Deadline:** Before completion of Phase 3 (to inform architecture)

---

#### Decision 5: Testing Strategy and Coverage Requirements

**Context:** MiniMax Vision introduces new architecture (Vue 3, AI Router, multi-table schema) requiring comprehensive testing approach.

**Options:**
1. **Manual Testing Only:** Focus on speed, accept regression risk
2. **Unit Tests Only:** Test individual functions/components
3. **E2E Tests Only:** Test full user flows
4. **Comprehensive Strategy:** Unit + Integration + E2E
5. **Risk-Based Testing:** Test critical paths heavily, other areas lightly

**Testing Pyramid Target:**

```
              E2E (Playwright)
                  /    |    \
                 /     |     \
         Integration   |    Visual
             /  \      |     Regression
            /    \     |
      Unit    Component
        \       /
         \     /
        Static
```

| Test Type | Coverage Target | Tools | Priority |
|-----------|----------------|-------|----------|
| **Unit** | 80% of business logic | Vitest, Jest | High |
| **Component** | All Vue components | Vue Test Utils | High |
| **Integration** | API contracts, AI Router | MSW (mock service) | Medium |
| **E2E** | Critical user flows | Playwright | High |
| **Visual** | Design system | Percy/Chromatic | Low |
| **Performance** | Lighthouse scores | Lighthouse | Low |

**Pros and Cons:**

| Strategy | Pros | Cons |
|----------|------|------|
| **Manual Only** | Fastest, no tooling overhead | High regression risk, not scalable |
| **Unit Only** | Fast feedback, good coverage | Misses integration issues |
| **E2E Only** | Tests real user experience | Slow, flaky, expensive |
| **Comprehensive** | Highest quality, confident releases | Significant time investment |
| **Risk-Based** | Efficient, focuses on value | Requires risk assessment |

**Recommendation:** Comprehensive strategy with phased implementation

**Prioritization by Phase:**

**Phase 1 (Vue 3 Foundation):**
- Unit tests for all Pinia stores
- Component tests for base components (Button, Card, Input)
- E2E tests for critical flows (submit guestbook, vote)
- Target: 70% coverage minimum

**Phase 2 (AI Backend):**
- Integration tests for AI Router
- Unit tests for provider routing logic
- E2E tests for AI-enhanced features (roasts)
- Mock external AI providers (MSW)
- Target: 75% coverage

**Phase 3 (Security):**
- Unit tests for RLS policy helpers
- Integration tests for schema separation
- E2E tests for privacy features
- Target: 80% coverage

**Phase 4 (Games):**
- Unit tests for game logic
- Component tests for game UI
- E2E tests for complete game flows
- Target: 85% coverage

**Implementation:**
1. **Tooling Setup (Phase 0):**
   - Vitest for unit tests (Vue 3 native)
   - Vue Test Utils for component tests
   - Playwright for E2E tests
   - MSW for API mocking
   - GitHub Actions for CI

2. **Test-Driven Development:**
   - Write tests before implementation
   - Red → Green → Refactor cycle
   - 100% of critical paths TDD

3. **Continuous Integration:**
   - PRs require passing tests
   - Coverage threshold enforcement
   - Visual regression on PR
   - Performance budget checks

**Impact:** Timeline (adds 15-20% to estimates), quality assurance

**Deadline:** Tooling setup before Phase 1, tests written during each phase

---

#### Decision 6: Baby Name Privacy - Build-Time vs Runtime Masking

**Context:** "Hidden Name" privacy standard requires baby's name never in codebase. Need to decide when and how to inject real name.

**Options:**
1. **Build-Time Injection:** Replace placeholder during Vercel build
2. **Runtime API Fetch:** Fetch from secure endpoint on load
3. **Edge Function Injection:** Middleware replaces placeholder on request
4. **Environment Variable (client):** VITE_BABY_NAME (visible in code)
5. **Hybrid:** Build-time for public info, runtime for sensitive features

**Security Analysis:**

| Method | Security | Complexity | Performance | SEO Impact |
|--------|----------|------------|-------------|------------|
| **Build-Time** | ✅ High (never in source) | Medium | ✅ Best | ✅ Full content |
| **Runtime API** | ✅ Highest (fully dynamic) | High | ⚠️ Delayed | ⚠️ Empty initially |
| **Edge Function** | ✅ High (injected at edge) | Medium | ✅ Fast (edge) | ✅ Full content |
| **Client Env Var** | ❌ Low (visible in bundle) | Low | ✅ Best | ❌ Exposes name |
| **Hybrid** | ✅ Med-High | High | Medium | Medium |

**Pros and Cons:**

| Option | Pros | Cons |
|--------|------|------|
| **Build-Time** | Secure, simple, SEO-friendly | Requires rebuild to change name |
| **Runtime API** | Most secure, fully dynamic | Complexity, loading states |
| **Edge Function** | Secure, fast, dynamic | Vercel-specific, edge complexity |
| **Client Env Var** | Simplest | Insecure, exposes to client |
| **Hybrid** | Flexible, best of both | Complex implementation |

**Recommendation:** Build-time injection for Phase 1-3, roadmap for runtime API if dynamic needed

**Implementation:**

**Phase 1-3 (Static Name, Launch-Friendly):**

```typescript
// In Vue components
const babyName = import.meta.env.VITE_BABY_NAME || "The Little One";
```

```javascript
// Vercel build command
vercel build --build-env BLOOD_BABY_NAME="Maya"
```

```javascript
// In scripts (at build time)
const babyName = process.env.BLOOD_BABY_NAME || "The Little One";
// Replace all instances in HTML/JS/CSS
```

**Security Measures:**
1. Use `BLOOD_` prefix (internal convention for sensitive vars)
2. Never commit `.env.production` with real name
3. Vercel environment variables (secure, encrypted)
4. Git pre-commit hook to prevent accidental commits
5. Code scan to verify no string literals

**Future Enhancement (Post-Launch):**
- Create `/api/name` secure endpoint
- Fetch on app initialization
- Cache in localStorage
- Invalidate cache when name revealed

**Impact:** Privacy compliance, security audit readiness

**Deadline:** Before first production deployment (Phase 1 end)

---

#### Decision 7: Animation Performance - Physics vs CSS Fallback

**Context:** MiniMax Vision specifies spring physics animations via `@vueuse/motion`, but mobile performance may suffer.

**Options:**
1. **Physics-First:** Use `@vueuse/motion` everywhere, degrade on mobile
2. **CSS-First:** Use CSS transitions, enhance with physics on desktop
3. **Hybrid Smart:** Detect capabilities, choose appropriate animation
4. **Reduced Motion Respect:** Honor `prefers-reduced-motion` strictly
5. **Toggle:** User preference for animation level

**Performance Considerations:**

| Animation Type | Desktop | Mobile Low-End | Battery | File Size |
|----------------|---------|----------------|---------|-----------|
| **CSS Transitions** | Good | ✅ Excellent | ✅ Excellent | ✅ Tiny |
| **Spring Physics** | ✅ Excellent | ⚠️ Variable | ⚠️ Higher | Medium |
| **Lottie** | Good | ❌ Poor | ❌ Poor | Large |

**Pros and Cons:**

| Option | Pros | Cons |
|--------|------|------|
| **Physics-First** | True to vision, consistent experience | May exclude low-end devices |
| **CSS-First** | Universal support, best performance | Less "alive" feeling |
| **Hybrid Smart** | Best of both, adaptive | Complex implementation |
| **Reduced Motion** | Accessible, respectful | Less delightful |
| **User Toggle** | User control, inclusive | Adds UI complexity |

**Recommendation:** Hybrid smart with strong reduced motion support

**Implementation Strategy:**

**Default Behavior:**
```typescript
// utils/animation-config.ts
export function getAnimationConfig() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isLowEnd = navigator.hardwareConcurrency < 4;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (prefersReduced) {
    return { type: 'none', duration: 0 };
  }
  
  if (isLowEnd && isMobile) {
    return { type: 'css', duration: 150 };
  }
  
  return { type: 'spring', stiffness: 100, damping: 30 };
}
```

**Vue Component Integration:**
```vue
<template>
  <div 
    v-motion
    :initial="animation.initial"
    :enter="animation.enter"
    :variants="animation.variants"
  >
    Content
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { getAnimationConfig } from '@/utils/animation-config';

const config = getAnimationConfig();
const animation = computed(() => {
  return config.type === 'spring' 
    ? springAnimation
    : cssAnimation;
});
</script>
```

**CSS Fallback:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Granular Control:**
- **Hero/Important:** Always physics (if supported)
- **Micro-interactions:** CSS on mobile, physics on desktop
- **Decorative:** Disable on low-end devices
- **Accessibility:** Strict reduced motion compliance

**Impact:** Performance, accessibility, user experience

**Deadline:** During Phase 1 component development

---

### Decision 8: Code Organization - Monorepo vs Multi-Repo

**Context:** Vue 3 frontend, Supabase Edge Functions, documentation - one repo or multiple?

**Options:**
1. **Monorepo:** Everything in current repo with directories
   ```
   baby-shower-app/
   ├── frontend/          # Vue 3 app
   ├── supabase/          # Edge Functions
   ├── docs/              # Documentation
   └── scripts/           # Utilities
   ```
2. **Multi-Repo:** Separate repo for each concern
   - `baby-shower-frontend` (Vue 3)
   - `baby-shower-backend` (Supabase)
   - `baby-shower-docs` (Documentation)
3. **Hybrid:** Main repo + submodules
4. **Monorepo with Tooling:** Use Nx, Turborepo, or Lerna

**Pros and Cons:**

| Option | Pros | Cons |
|--------|------|------|
| **Monorepo** | ✅ Simple, unified versioning, easy CI/CD | Can get messy, no isolation |
| **Multi-Repo** | Clear separation, team autonomy | Complex coordination, version drift |
| **Hybrid** | Best of both (in theory) | Complex, submodules pain |
| **Tooling** | Optimized builds, caching, best practices | Learning curve, config complexity |

**Recommendation:** Monorepo (current structure) with improved organization

**Implementation:**

```
baby-shower/                  # Root
├── apps/
│   ├── frontend/            # Vue 3 app (new)
│   └── legacy/              # Vanilla JS (temp)
├── supabase/
│   ├── functions/
│   │   ├── ai-router/
│   │   ├── guestbook/
│   │   ├── vote/
│   │   └── ...
│   └── migrations/
├── packages/                # Shared if needed
│   ├── types/
│   └── ui-components/      # Future
├── docs/
│   ├── MiniMax_Plan/
│   ├── architecture/
│   └── ...
└── scripts/                 # Build, deploy, utilities
```

**Organization Rules:**
1. **Frontend:** All Vue 3 code in `apps/frontend/src/`
2. **Backend:** Edge Functions in `supabase/functions/`
3. **Documentation:** `docs/` with clear categorization
4. **Shared:** Extract common utilities to `packages/`
5. **Legacy:** Keep in root temporarily, migrate progressively

**Benefits:**
- Single commit for cross-cutting changes
- One PR for feature + docs + tests
- Simpler CI/CD pipeline
- Easier onboarding (one clone)
- Vercel/Supabase integration simpler

**Scripts to Add:**
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:supabase\"",
    "dev:frontend": "cd apps/frontend && npm run dev",
    "dev:supabase": "supabase functions serve",
    "build": "npm run build:frontend && npm run build:docs",
    "deploy": "npm run deploy:frontend && npm run deploy:supabase",
    "test": "npm run test:frontend && npm run test:backend"
  }
}
```

**Impact:** Development workflow, CI/CD, team onboarding

**Deadline:** Before Phase 1 (structure affects all work)

---

### Decision 9: Analytics and Monitoring Strategy

**Context:** Need visibility into app usage, AI performance, errors, and user behavior.

**Options:**
1. **Minimal:** Console.log + basic error tracking
2. **Basic:** Google Analytics + Sentry
3. **Comprehensive:** GA4 + Sentry + Custom metrics + Uptime monitoring
4. **Privacy-First:** Plausible/Cloudflare + Minimal error tracking

**Required Metrics:**

| Category | Metrics | Why |
|----------|---------|-----|
| **Usage** | Page views, activity submissions, unique users | Understand adoption |
| **AI Performance** | Response time, error rate, fallback %, cost | Optimize providers |
| **Errors** | JS errors, API failures, rate limits | Proactive fixes |
| **Performance** | Page load, TTI, animation FPS | User experience |
| **User Behavior** | Feature usage, drop-off points | Product decisions |

**Pros and Cons:**

| Option | Pros | Cons |
|--------|------|------|
| **Minimal** | Zero cost, simple | Blind to issues, no insights |
| **Basic** | Industry standard, easy setup | Privacy concerns, limited |
| **Comprehensive** | Full visibility, alerting | Cost, privacy implications |
| **Privacy-First** | Ethical, lightweight | Less detail, limited features |

**Recommendation:** Privacy-first comprehensive approach

**Implementation:**

**Privacy-First Analytics:**
```typescript
// No cookies, no personal data, GDPR-compliant
import Plausible from 'plausible-tracker';

const plausible = Plausible({
  domain: 'baby-shower-app.vercel.app',
  trackLocalhost: true,
  apiHost: 'https://plausible.io'
});

plausible.enableAutoPageviews();
plausible.enableAutoOutboundTracking();
```

**Error Tracking (Sentry):**
```typescript
import * as Sentry from '@sentry/vue';

Sentry.init({
  app,
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_ENV,
  
  // Privacy config
  sendDefaultPii: false,  // No personal info
  beforeSend(event) {
    // Strip sensitive data
    delete event.request?.cookies;
    return event;
  },
  
  // Sample rate
  tracesSampleRate: 0.1,  // 10% of transactions
  replaysSessionSampleRate: 0.0,  // No session replay
  replaysOnErrorSampleRate: 0.1,
});
```

**Custom AI Metrics:**
```typescript
// Track AI performance
function trackAIMetrics(provider: string, duration: number, success: boolean, cached: boolean, fallback: boolean) {
  // Send to custom endpoint (Supabase table)
  await supabase.from('internal.ai_metrics').insert({
    provider,
    duration_ms: duration,
    success,
    cached,
    fallback,
    timestamp: new Date()
  });
  
  // Also log to console for debugging
  console.log(`AI: ${provider} ${duration}ms ${cached ? 'cached' : ''} ${fallback ? 'fallback' : ''}`);
}
```

**Dashboard Setup:**
```sql
-- internal.analytics_dashboard view
CREATE VIEW internal.analytics_summary AS
SELECT 
  date_trunc('hour', created_at) as hour,
  activity_type,
  count(*) as submissions,
  count(DISTINCT submitted_by) as unique_users
FROM public.submissions
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY hour, activity_type;
```

**Monitoring Alerts:**
```yaml
# Example alerting rules
alerts:
  - name: "AI Error Rate"
    condition: "error_rate > 5%"
    duration: "5m"
    action: "notify-slack"
    
  - name: "Submission Spike"
    condition: "submissions > 100/hour"
    duration: "10m"
    action: "notify-celebration"
    
  - name: "Site Down"
    condition: "uptime < 99%"
    duration: "1m"
    action: "page-oncall"
```

**Privacy Safeguards:**
1. No IP addresses stored
2. No user agent strings in analytics
3. Aggregate data only (no individual tracking)
4. Opt-in only for error reporting
5. Data retention: 30 days max
6. No third-party trackers (Facebook, Google ads, etc.)

**Cost Estimate:**
- Plausible: $9/month (10k pageviews)
- Sentry: Free tier (sufficient for launch)
- Custom metrics: Included in Supabase
- **Total: $9/month**

**Impact:** Privacy compliance, debugging, product decisions

**Deadline:** Before production launch (Phase 1)

---

### Decision 10: Launch Readiness - What Defines "Done"

**Context:** Multiple phases, but need clear definition of when app is production-ready vs. ongoing improvements.

**Options:**
1. **Phase 1 Launch:** Basic Vue 3 app, functional but minimal features
2. **Phase 3 Launch:** Full MiniMax vision (Core + AI + Security), no games
3. **All Phases Complete:** Everything including games
4. **MVP + Iterations:** Ship Phase 2, add games as enhancements

**Launch Criteria Definition:**

**Phase 1 "Foundation Ready":**
- ✅ Vue 3 app deployed
- ✅ All existing features functional
- ✅ New visual design implemented
- ❌ No AI enhancements
- ❌ Old database schema
- **Status:** Internal alpha only

**Phase 2 "Experience Ready":**
- ✅ All Phase 1 criteria
- ✅ AI Router functional
- ✅ Multi-provider working
- ✅ Personality-driven responses
- ❌ Schema separation
- ❌ Full privacy controls
- **Status:** Beta launch (friends & family)

**Phase 3 "Production Ready":**
- ✅ All Phase 2 criteria
- ✅ Multi-table schema migration
- ✅ Firewall security pattern
- ✅ Hidden Name privacy standard
- ✅ Comprehensive testing
- ❌ Interactive games
- **Status:** **OFFICIAL LAUNCH** 🚀

**Phase 4 "Enhancement Ready":**
- ✅ All Phase 3 criteria
- ✅ Interactive games deployed
- ✅ Advanced analytics
- ✅ Performance optimized
- **Status:** Post-launch updates

**Pros and Cons:**

| Launch Point | Pros | Cons |
|--------------|------|------|
| **Phase 1** | Fastest, gets feedback early | Barely better than legacy, not special |
| **Phase 3** | Full MiniMax vision, polished | Takes longer, delayed value |
| **All Phases** | Complete product | Longest delay, risk of over-engineering |
| **Iterative** | Balance speed and quality | Needs careful scope management |

**Recommendation:** Phase 3 is official launch, but...

**Strategy: "Soft Launch to Hard Launch"**

**Phase 2 Beta (Internal):**
- Deploy to production URL
- Password protect or limited invite
- Test with real users (event coordinators)
- Gather feedback on AI personality
- Validate new design system

**Phase 3 Official Launch:**
- Remove beta restrictions
- Announce to full guest list
- Monitor metrics and performance
- Social sharing ready

**Phase 4 Surprise Updates:**
- Launch games as "surprise features"
- Keeps app fresh post-event
- Continued engagement
- Easier to promote incremental updates

**Launch Checklist (Phase 3):**

**Technical:**
- [ ] All tests passing (80% coverage)
- [ ] Performance audit passed (Lighthouse > 90)
- [ ] Security audit completed
- [ ] Error tracking configured
- [ ] Analytics verified
- [ ] Deployed to production URL
- [ ] Environment variables configured correctly

**Content:**
- [ ] Baby name correctly injected (not placeholder)
- [ ] Assets optimized and loading
- [ ] Copy reviewed and approved
- [ ] Legal/privacy considerations addressed

**Operational:**
- [ ] Monitoring dashboards accessible
- [ ] On-call rotation established
- [ ] Rollback procedure tested
- [ ] Support documentation written
- [ ] Team knows how to respond to issues

**Marketing:**
- [ ] Landing page compelling
- [ ] Share functionality working
- [ ] QR codes generated and tested
- [ ] Email templates ready

**Impact:** Project scope, timeline, stakeholder expectations

**Deadline:** Align with baby shower date (or event if applicable)

---

## G. Action Items Summary

### Before Implementation Begins (This Week)

**Critical Documentation:**
- [ ] **Create `docs/MiniMax_Plan/01_VUE3_SETUP.md`**
- [ ] **Create `docs/MiniMax_Plan/03_AI_ROUTER.md`**
- [ ] **Create `docs/MiniMax_Plan/06_MIGRATION_STRATEGY.md`**
- [ ] **Update `docs/architecture/01-current-system.md` (lines 52, component table)**
- [ ] **Update `docs/DESIGN_PROPOSALS.md` (hardcoded names lines 168-185)**

**Decisions Needed (Before Phase 1):**
- [ ] **Choose typography:** Quicksand + Fredoka One hybrid
- [ ] **Audit assets:** Verify at least 50% of critical assets exist
- [ ] **Rename event:** `new_roast` → `dad_interaction`
- [ ] **Schedule Phase 4 discussion:** Plan design sprint after Phase 3
- [ ] **Confirm testing strategy:** Comprehensive tests, phased implementation
- [ ] **Finalize privacy approach:** Build-time injection, confirm process
- [ ] **Architecture decision:** Monorepo structure confirmed
- [ ] **Analytics setup:** Choose Plausible + Sentry, configure privacy

**Setup and Tooling:**
- [ ] Initialize Vue 3 project structure
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Configure testing framework (Vitest + Playwright)
- [ ] Set up Supabase migrations for new schema
- [ ] Create feature branch `feature/minimax-realignment`

### Phase 1: Foundation (Weeks 1-2)

**Core Documentation:**
- [ ] Create `docs/MiniMax_Plan/02_PINIA_STATE.md`
- [ ] Create `docs/MiniMax_Plan/04_PRIVACY_STANDARD.md`
- [ ] Create `docs/MiniMax_Plan/05_VISUAL_THEME.md`
- [ ] Create `docs/architecture/02_TARGET_ARCHITECTURE.md`
- [ ] Merge `docs/DESIGN_PROPOSALS.md` CSS to Vue SFC format

**Technical Implementation:**
- [ ] Set up Vue 3 + Vite project
- [ ] Configure Tailwind with barnyard theme
- [ ] Create Pinia stores (user, activities, ui)
- [ ] Build component library (Button, Card, Input, etc.)
- [ ] Migrate landing page to Vue 3
- [ ] Implement hero section with parallax
- [ ] Create activity card components
- [ ] Initial test suite (unit + component tests)

**Decisions During Phase 1:**
- [ ] Finalize animation strategy (detect capabilities)
- [ ] Confirm asset manifest and fallback plan
- [ ] Complete asset audit, plan creation for missing assets

### Phase 2: Intelligent Backend (Weeks 3-4)

**Documentation:**
- [ ] Update `docs/DESIGN_PROPOSALS.md` AI sections (router pattern)
- [ ] Create AI router API documentation
- [ ] Document personality-driven response generation

**Technical Implementation:**
- [ ] Create `ai-router` Edge Function
- [ ] Implement intent classification system
- [ ] Integrate Moonshot AI (roast/humor)
- [ ] Integrate Z.AI (game logic/structured output)
- [ ] Integrate MiniMax (general chat)
- [ ] Build personality switchboard
- [ ] Implement circuit breaker pattern
- [ ] Create health monitoring system
- [ ] Add caching layer
- [ ] Develop fallback content system
- [ ] Migrate AI-enhanced features (pool roasts)
- [ ] E2E tests for AI interactions

**Integration:**
- [ ] Connect frontend to AI router
- [ ] Display emotion/avatar states
- [ ] Test multi-provider failover

### Phase 3: Privacy & Security (Weeks 5-6)

**Documentation:**
- [ ] Update `docs/SCHEMA_IMPLEMENTATION.md` (schema separation)
- [ ] Update `docs/RESEARCH_VERCEL.md` (environment variables)
- [ ] Create security audit checklist

**Technical Implementation:**
- [ ] Run schema migration (multi-table)
- [ ] Implement dual-write strategy
- [ ] Create `internal` schema for sensitive data
- [ ] Set up Row Level Security (RLS) policies
- [ ] Configure environment variable injection
- [ ] Update frontend to use new schema
- [ ] Test security boundaries
- [ ] Implement "Hidden Name" standard
- [ ] Security audit (internal or external)
- [ ] Performance optimization
- [ ] Comprehensive E2E test suite

**Operational:**
- [ ] Backup and monitoring verified
- [ ] Rollback procedure tested
- [ ] Team trained on new architecture

### Phase 4: Interactive Games (Weeks 7-8)

**Documentation:**
- [ ] Design sprint documentation
- [ ] Game technical specification
- [ ] API contracts for game logic

**Technical Implementation:**
- [ ] Design and spec games
- [ ] Implement Z.AI integration for agentic games
- [ ] Build game UI components
- [ ] Add realtime game events
- [ ] Create game state management
- [ ] Beta test with small group
- [ ] Games-specific analytics
- [ ] Performance testing with games

**Launch:**
- [ ] Deploy games as surprise feature
- [ ] Monitor engagement metrics
- [ ] Gather user feedback
- [ ] Iterate based on usage

---

## Summary

The realignment strategy provides a comprehensive roadmap to transform the Baby Shower application from its current vanilla JavaScript architecture to the MiniMax Vision—a "Digital Living Room" with Vue 3 frontend, multi-provider AI routing, enhanced privacy controls, and a warm, engaging design aesthetic.

**Key Success Factors:**

1. **Clear Prioritization:** Critical documents identified (Vue 3 setup, AI Router, Migration Strategy) that block implementation
2. **Pragmatic Approach:** Phased migration with dual-write strategy, allowing rollback and validation at each step
3. **Risk Mitigation:** Comprehensive risk assessment with early warning systems and rollback strategies
4. **Decision Clarity:** Ten critical decisions documented with clear recommendations and trade-offs
5. **Quality Focus:** Comprehensive testing strategy, privacy-first, performance-conscious
6. **Team Enablement:** Clear documentation requirements, monorepo structure, tooling setup

**Most Critical Next Steps:**

1. **Create foundational documentation** (Vue 3 setup, AI Router, Migration Strategy)
2. **Complete asset audit** - verify critical visual assets exist or plan creation
3. **Finalize six critical decisions** (typography, event naming, scope, testing, privacy, code organization)
4. **Initialize Vue 3 project** and set up development environment
5. **Implement testing framework** before writing production code

**Time-Sensitive Actions:**
- Asset audit (blocks Phase 1 visual work)
- Decision on Phase 4 scope (affects architecture decisions)
- Testing framework setup (should be in place before feature development)
- Analytics infrastructure (needed for beta testing insights)

The strategy balances ambition with pragmatism, ensuring the MiniMax Vision is achieved while maintaining the stability and reliability required for a successful event application.
