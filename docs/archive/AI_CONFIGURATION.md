# AI Provider Configuration - Character Personality Alignment

**Status:** ✅ VERIFIED | **Version:** 2.1 | **Date:** January 3, 2026

> **Character-Personality-AI Alignment** - This document specifies the exact AI providers and models for each character personality in the Baby Shower application.

---

## 🎯 Character-AI Mapping Overview

| Character | Personality Traits | AI Provider | Model | Purpose | Cost Efficiency |
|-----------|-------------------|-------------|-------|---------|----------------|
| **Mom** | Warm, welcoming, supportive, helpful | MiniMax | `MiniMax-M2.1` | General chat, greetings, guidance | 15x cheaper than Claude |
| **Dad** | Sassy, irreverent, playful, witty | Moonshot AI | `kimi-k2` | Humor, roasts, dad jokes | Competitive pricing |
| **Thinking** | Analytical, precise, structured | Z.AI (Zhipu) | `glm-4.7` | Game logic, scoring, JSON output | Latest model (Dec 2025) |
| **Celebration** | Joyful, enthusiastic, rewarding | Fallback/Mixed | Various | Milestones, achievements, success | Multi-provider backup |

---

## 🔧 Provider Configurations

### 1. MiniMax AI - "Mom" Character

**Provider Details:**
- **Base URL:** `https://api.minimax.chat/v1` (OpenAI-compatible)
- **Authentication:** Bearer token in `Authorization` header
- **Model:** `MiniMax-M2.1` (230B parameters, 10B activated)

**Why MiniMax for Mom:**
- ✅ Optimized for conversational AI
- ✅ Excellent Chinese language support
- ✅ Cost-effective for high-volume chat
- ✅ Warm, balanced response tone
- ⚡ 2x faster than comparable models

**Configuration:**
```typescript
const momConfig = {
  provider: 'minimax',
  model: 'MiniMax-M2.1',
  baseUrl: 'https://api.minimax.chat/v1',
  temperature: 0.7,  // Balanced creativity
  maxTokens: 200,
  systemPrompt: 'You are Mom: warm, welcoming, and supportive. Always family-friendly.'
}
```

### 2. Moonshot AI - "Dad" Character

**Provider Details:**
- **Base URL:** `https://api.moonshot.ai/v1` (Global endpoint)
- **Authentication:** Bearer token in `Authorization` header
- **Model:** `kimi-k2` (256K context window)

**Why Moonshot for Dad:**
- ✅ Excellent at cultural humor and wit
- ✅ Superior at understanding humor across cultures
- ✅ Creative writing capabilities
- ✅ Playful, sassy response style

**Configuration:**
```typescript
const dadConfig = {
  provider: 'moonshot',
  model: 'kimi-k2',
  baseUrl: 'https://api.moonshot.ai/v1',
  temperature: 0.85,  // Higher creativity for humor
  maxTokens: 150,
  systemPrompt: 'You are Dad: playful, slightly sarcastic, but always family-friendly and loving.'
}
```

### 3. Z.AI (Zhipu) - "Thinking" Character

**Provider Details:**
- **Base URL:** `https://api.z.ai/api/paas/v4`
- **Authentication:** Bearer token in `Authorization` header
- **Model:** `glm-4.7` (204K context, released Dec 2025)

**Why Z.AI for Thinking:**
- ✅ Latest flagship model with enhanced reasoning
- ✅ Excellent at structured JSON output
- ✅ Superior multi-step logic execution
- ✅ Precise, analytical response style

**Configuration:**
```typescript
const thinkingConfig = {
  provider: 'zai',
  model: 'glm-4.7',
  baseUrl: 'https://api.z.ai/api/paas/v4',
  temperature: 0.4,  // Lower for precision
  maxTokens: 200,
  systemPrompt: 'You are Thinking: analytical and precise. Always respond in valid JSON format.'
}
```

---

## 🧠 AI Router Implementation

**Central Router Logic:**
```typescript
// supabase/functions/ai-router/index.ts
const CHARACTER_ROUTER = {
  'general_chat': momConfig,
  'greeting': momConfig,
  'help': momConfig,
  'roast': dadConfig,
  'joke': dadConfig,
  'humor': dadConfig,
  'game_logic': thinkingConfig,
  'scoring': thinkingConfig,
  'calculation': thinkingConfig,
  'celebration': momConfig, // Celebration uses Mom with higher temperature
  'milestone': momConfig
}

// Intent Classification
function classifyIntent(userInput: string): string {
  const roastPatterns = /roast|joke|funny|sassy|tease|playful/i;
  const logicPatterns = /game|score|calculate|logic|rule|agent/i;
  const celebrationPatterns = /celebrate|milestone|achievement|success/i;
  
  if (roastPatterns.test(userInput)) return 'roast';
  if (logicPatterns.test(userInput)) return 'game_logic';
  if (celebrationPatterns.test(userInput)) return 'celebration';
  return 'general_chat';
}
```

---

## 🔄 Fallback Strategy

**Provider Failure Hierarchy:**
1. **Primary Provider** → Character-specific AI
2. **Secondary Provider** → MiniMax (universal fallback)
3. **Tertiary Fallback** → Pre-generated content library

**Fallback Content Examples:**
```typescript
const FALLBACK_RESPONSES = {
  roast: [
    "Your prediction is... certainly memorable! Either you're right or baby has some surprises ahead. 🍼",
    "Bold prediction! Either you'll be the hero of the day or we'll be reminding you of this moment for years!"
  ],
  game_logic: [
    "Let me calculate that for you!",
    "Here's how that works...",
    "I'm thinking... 🤔"
  ],
  general_chat: [
    "Hi there! 👋 How can I help you today?",
    "Thanks for visiting! Come back soon! 👋"
  ]
}
```

---

## 📊 Cost Analysis & Monitoring

**Token Pricing (2026):**
| Provider | Model | Input (1M tokens) | Output (1M tokens) | Efficiency |
|----------|-------|-------------------|--------------------|------------|
| MiniMax | M2.1 | $0.50 | $0.50 | 15x cheaper than Claude |
| Moonshot | Kimi-K2 | ~$2.00 | ~$2.00 | Competitive for quality |
| Z.AI | GLM-4.7 | ~$1.50 | ~$1.50 | Latest model pricing |

**Monitoring Metrics:**
- Response latency per provider
- Token usage per character type
- Fallback trigger frequency
- Error rates and circuit breaker status

---

## 🛠️ Environment Configuration

```bash
# AI Provider API Keys (All Required)
MINIMAX_API_KEY=your_minimax_api_key_here      # Mom character
MOONSHOT_API_KEY=your_moonshot_api_key_here    # Dad character
ZAI_API_KEY=your_zai_api_key_here              # Thinking character

# Optional Configuration
FORCE_PROVIDER=minimax|moonshot|zai            # Override for testing
DEBUG_AI_RESPONSES=true                        # Log AI responses
CIRCUIT_BREAKER_THRESHOLD=3                    # Failure threshold
CIRCUIT_BREAKER_TIMEOUT=30000                  # 30 seconds
```

---

## 🧪 Testing & Validation

**Provider Health Checks:**
```typescript
// Health check endpoint
async function checkProviderHealth(provider: string): Promise<boolean> {
  try {
    const response = await fetch(`${PROVIDERS[provider].baseUrl}/models`, {
      headers: { 'Authorization': `Bearer ${getApiKey(provider)}` }
    });
    return response.ok;
  } catch {
    return false;
  }
}
```

**Character Response Validation:**
- Text content appropriate for character
- Emotion metadata present
- Response time under 3 seconds
- JSON validity for Thinking character

---

## 🚨 Common Issues & Solutions

### **Provider Timeouts**
- **Issue**: AI provider takes >3 seconds to respond
- **Solution**: Implement 3-second timeout with immediate fallback

### **Character Mismatch**
- **Issue**: Dad character responds with Mom-like warmth
- **Solution**: Verify system prompts and temperature settings

### **Rate Limiting**
- **Issue**: Provider returns 429 errors
- **Solution**: Implement request queuing and circuit breaker pattern

---

## 📚 Related Documentation

- [BUILD_DOCUMENTATION.md](./BUILD_DOCUMENTATION.md) - Overall project architecture
- [AGENTS.md](./AGENTS.md) - Design vision and character personalities
- [Integration Patterns](./docs/INTEGRATION_PATTERNS.md) - Technical implementation details

---

**Document Maintainer:** AI Configuration System  
**Last Updated:** January 3, 2026  
**Next Review:** February 3, 2026

**Changelog:**
- v2.1: Updated GLM-4.7 as latest Z.AI model (Dec 2025)
- v2.0: Consolidated character-personality-AI alignment
- v1.0: Initial provider configuration specifications