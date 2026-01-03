# 🏠 Baby Shower V2 - Consolidated Build Documentation

**Status:** Design-Aligned Documentation | **Version:** 2.0 | **Date:** January 3, 2026

> **Single Source of Truth** - This document consolidates all design decisions and technical specifications for the Baby Shower V2 project. When implementation conflicts with this documentation, return here for guidance.

---

## 🎯 The Vision: "Digital Living Room"

We are transforming a static digital greeting card into an **interactive space** where guests feel welcomed the way they would in a cozy living room.

**The Transformation:**
- ❌ A webpage you visit → ✅ A place you *inhabit*
- ❌ A form to fill out → ✅ A conversation with hosts  
- ❌ A card to sign → ✅ An experience to remember

**Core Philosophy:** Hospitality over transaction. Every interaction should feel like someone greeting you at the door, not processing your data.

---

## 🏗️ Three Pillars Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    THE APPLICATION                       │
├─────────────────────┬───────────────────────────────────┤
│      THE SOUL       │            THE SYSTEM             │
│   (Frontend)        │         (Backend/Security)        │
│                     │                                    │
│  - Emotional layer  │  - Reliability layer              │
│  - How it feels     │  - How it protects                │
│  - Animations       │  - Data integrity                 │
│  - Character        │  - Privacy walls                  │
│  - "Is this warm?"  │  - "Is this safe?"                │
├─────────────────────┴───────────────────────────────────┤
│                       THE BRAIN                         │
│                    (AI Intelligence)                     │
│              - Routing, personality, responses            │
│              - "Which host should respond?"               │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Design System: Cozy Barnyard Aesthetic

**Philosophy:** Ghibli-meets-Stardew Valley. Warm, hand-crafted, nostalgic.

**Key Characteristics:**
- **Motion:** Everything breathes. Leaves sway. Clouds drift. Buttons bounce.
- **Depth:** Painterly backgrounds with parallax layers. Characters embedded in world.
- **Warmth:** Cream backgrounds, earth tones, rounded corners, soft shadows.
- **Reactivity:** Interface responds to you. Clicks have weight. Success has celebration.

**Technical Implementation:**
- Vue 3 + Vite for reactive components
- `@vueuse/motion` for spring physics animations
- CSS custom properties for theming
- Component-based character system

---

## 👥 Character System with AI Personalities

The interface isn't a form — it's a conversation hosted by characters with distinct AI personalities.

| Character | Personality | AI Provider | Model | When They Appear |
|-----------|-------------|-------------|-------|------------------|
| **Mom** | Warm, welcoming, supportive | MiniMax | `MiniMax-M2.1` | Greetings, helpful info, guidance |
| **Dad** | Sassy, irreverent, fun | Moonshot AI | `kimi-k2` | Humor responses, "dad jokes", tension relief |
| **Thinking** | Curious, processing | Z.AI (Zhipu) | `glm-4.7` | Loading states, game logic, structured analysis |
| **Celebration** | Joyful, rewarding | (Fallback) | Various | Success moments, achievements, milestones |

**Response Contract:** Every AI response includes:
```typescript
{
  text: string,      // The response content
  emotion: string,   // Emotion for frontend animation
  character: string, // Which character to display
  provider: string   // Which AI provider generated this
}
```

---

## 🧠 AI Router Architecture

**Centralized Intelligence:** Single entry point routes requests to appropriate AI providers based on intent and personality needs.

```typescript
// Intent-Based Routing
const AI_ROUTER = {
  'roast': { provider: 'moonshot', model: 'kimi-k2', character: 'Dad' },
  'game_logic': { provider: 'zai', model: 'glm-4.7', character: 'Thinking' },
  'general_chat': { provider: 'minimax', model: 'MiniMax-M2.1', character: 'Mom' },
  'celebration': { provider: 'minimax', model: 'MiniMax-M2.1', character: 'Celebration' }
}
```

**Implementation:** `supabase/functions/ai-router/index.ts`
- Intent classification from user input
- Provider health monitoring with circuit breakers
- Fallback content when providers fail
- Emotion and character metadata injection

---

## 🔒 Security: The Firewall Pattern

**Two-World Architecture:**

| Schema | What Lives Here | Access Pattern |
|--------|----------------|----------------|
| **Public** | Guest submissions, votes, interactions | Insert-only. Anyone can add; no one can read others' data. |
| **Internal** | Curated content, sensitive metadata | Locked. Only backend functions can access. |

**Hidden Name Implementation:**
```typescript
// Development: Use placeholder
const babyName = process.env.BABY_NAME || 'The Little One'

// Production: Name never in source
// Build-time injection via environment variables
```

---

## 🏗️ Technical Architecture

### **Frontend Stack (Vue 3)**
```javascript
// Core Dependencies
"vue": "^3.4.0",           // Component framework
"@vueuse/motion": "^2.0.0", // Spring physics animations  
"@vueuse/core": "^10.0.0",  // Composition utilities
"pinia": "^2.1.0",          // State management
"vue-router": "^4.2.0"      // Routing
```

### **Backend Stack (Supabase)**
```javascript
// Core Services
"@supabase/supabase-js": "^2.38.0",  // Database + Auth
"@supabase/realtime-js": "^2.8.0",   // Live updates
"@supabase/functions-js": "^2.0.0"   // Edge functions
```

### **AI Providers**
```javascript
// Multi-provider architecture
"minimax": "MiniMax-M2.1",     // Mom character (warm chat)
"moonshot": "kimi-k2",         // Dad character (humor/roasts)  
"zai": "glm-4.7",              // Thinking character (logic/games)
```

---

## 📋 Implementation Phases

### **Phase 1: Foundation (Warmth)** ✅
- [x] Vue 3 + Vite setup
- [x] Basic component architecture
- [x] Animation system with `@vueuse/motion`
- [x] Pinia state management
- [x] Character component foundation

### **Phase 2: Pulse (Backend)** 🔄
- [x] Supabase integration
- [x] Database schema with firewall pattern
- [x] Edge functions for each activity
- [ ] **TODO**: AI Router implementation
- [ ] **TODO**: Multi-provider AI integration

### **Phase 3: Magic (Intelligence)** 📋
- [ ] AI Router with intent classification
- [ ] Character personality AI responses
- [ ] Circuit breaker pattern for providers
- [ ] Fallback content system
- [ ] Hidden name build-time injection

### **Phase 4: Legacy (Games)** 📋
- [ ] Interactive baby pool scoring
- [ ] Quiz system with AI-generated questions
- [ ] Advice categorization with AI
- [ ] Advanced milestone celebrations

---

## 🔧 Environment Configuration

```bash
# Core Application
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_BABY_NAME=The Little One  # Build-time injection for production

# AI Providers (All Required)
MINIMAX_API_KEY=your_minimax_key      # Mom character
MOONSHOT_API_KEY=your_moonshot_key    # Dad character  
ZAI_API_KEY=your_zai_key              # Thinking character

# Optional Configuration
VITE_FORCE_PROVIDER=minimax|moonshot|zai  # Override for testing
VITE_DEBUG_AI_RESPONSES=true              # Log AI responses
```

---

## 🧪 Testing Strategy

### **Unit Tests**
- Vue components with Vitest
- Pinia store actions
- Utility functions

### **Integration Tests**
- Supabase edge functions
- AI provider responses
- Real-time subscriptions

### **E2E Tests**
- User flows across all activities
- Character personality consistency
- Animation and interaction testing
- Cross-browser compatibility

---

## 📚 Related Documentation

### **Technical References**
- [AI Provider Configuration](./AI_PROVIDER_CONFIG.md) - Detailed API specs
- [Integration Patterns](./docs/INTEGRATION_PATTERNS.md) - Architecture details
- [Edge Functions Guide](./docs/reference/EDGE_FUNCTIONS.md) - Backend implementation

### **Design Resources**
- [AGENTS.md](./AGENTS.md) - Original design vision (unchanged)
- [UI Visual Design](./docs/MiniMax_Plan/01_UI_VISUAL_DESIGN.md) - Component specifications

---

## ⚠️ Known Implementation Gaps

1. **AI Router Missing**: Currently using direct API calls instead of routing
2. **Hidden Name Exposure**: Names hardcoded in examples (needs build-time injection)
3. **Single Provider Usage**: All functions use MiniMax regardless of character
4. **Response Contract**: No emotion/character metadata in AI responses

---

**Document Maintainer:** Project Alignment System  
**Last Updated:** January 3, 2026  
**Next Review:** February 3, 2026

**Changelog:**
- v2.0: Consolidated all documentation into single authoritative source
- v1.1: Updated AI provider configurations with validated models
- v1.0: Initial unified documentation structure