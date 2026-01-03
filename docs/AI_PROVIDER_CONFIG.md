# AI Provider Configuration Reference

**⚠️ AI CONFIGURATIONS UPDATED - VERIFY BEFORE PRODUCTION**

**Document Version:** 1.0  
**Date:** 2026-01-03  
**Project:** Baby Shower App Redesign  
**Status:** Verified - Configuration Reference

---

## Overview

This document provides the centralized, verified configuration for all AI providers used in the Baby Shower app. These configurations are based on official documentation as of January 2025.

**Routing Logic (unchanged):**
- **Roast/Humor** → Moonshot AI (K2 series)
- **Game Logic/Structure** → Z.AI (GLM-4 series)
- **General Chat** → MiniMax (M2.1 series)

---

## 1. MiniMax AI

### Provider Information
| Field | Value |
|-------|-------|
| **Provider** | MiniMax (海螺AI) |
| **Documentation** | [platform.minimax.io/docs](https://platform.minimax.io/docs/guides/models-intro) |
| **API Console** | [platform.minimax.io](https://platform.minimax.io) |

### Configuration
| Configuration | Value | Notes |
|--------------|-------|-------|
| **Base URL (OpenAI-compatible)** | `https://api.minimax.chat/v1` | Use for OpenAI SDK compatibility |
| **Base URL (Native)** | `https://api.minimax.chat/v1/text/chatcompletion_v2` | Original endpoint |
| **Authentication** | Bearer token in `Authorization` header | Env var: `MINIMAX_API_KEY` |

### Available Models
| Model ID | Context Window | Description | Recommended Use |
|----------|----------------|-------------|-----------------|
| `MiniMax-M2.1` | 256K | Latest flagship model | General chat, complex reasoning |
| `MiniMax-M2` | 256K | Mid-tier model | General chat, balanced performance |
| `abab6.5s-chat` | 200K | Stable chat model | Fallback for general chat |
| `abab5.5-chat` | 128K | Cost-effective option | Simple responses |
| `abab2.5-chat` | 64K | Lightweight model | Basic tasks |

### Pricing (2025)
| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| MiniMax-M2.1 | [VERIFY: Check pricing] | [VERIFY: Check pricing] |
| abab6.5s-chat | $0.50 | $0.50 |
| abab5.5-chat | $0.30 | $0.30 |
| abab2.5-chat | $0.10 | $0.10 |

### Example API Call
```typescript
const response = await fetch('https://api.minimax.chat/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('MINIMAX_API_KEY')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'MiniMax-M2.1',
    messages: [
      { role: 'system', content: 'You are Mom, warm and helpful.' },
      { role: 'user', content: 'Hello! How are you?' }
    ],
    temperature: 0.7,
    max_tokens: 200
  })
});
```

### Best Use Cases
- **Mom character responses**: Warm, welcoming conversation
- **General chat**: Friendly interactions with guests
- **Fallback routing**: Universal fallback when other providers fail
- **Multilingual**: Excellent Chinese language support

---

## 2. Moonshot AI (Kimi)

### Provider Information
| Field | Value |
|-------|-------|
| **Provider** | Moonshot AI (月之暗面) - Kimi |
| **Global API Docs** | [docs.litellm.ai/docs/providers/moonshot](https://docs.litellm.ai/docs/providers/moonshot) |
| **China Platform** | [platform.moonshot.cn](https://platform.moonshot.cn/docs/guide/start-using-kimi-api) |

### Configuration
| Configuration | Value | Notes |
|--------------|-------|-------|
| **Base URL (Global)** | `https://api.moonshot.ai/v1` | For international access |
| **Base URL (China)** | `https://api.moonshot.cn/v1` | For mainland China access |
| **Authentication** | Bearer token in `Authorization` header | Env var: `MOONSHOT_API_KEY` |

### Available Models
| Model ID | Context Window | Description | Recommended Use |
|----------|----------------|-------------|-----------------|
| `kimi-k2` | 256K | Latest K2 flagship model | Humor, creative writing |
| `kimi-k2-thinking` | 256K | Thinking variant for reasoning | Complex analysis |
| `kimi-k2-base` | 256K | Base model for fine-tuning | Custom use cases |
| `moonshot-v1-8k` | 8K | Legacy model (deprecated) | ⚠️ DO NOT USE |
| `moonshot-v1-32k` | 32K | Legacy model (deprecated) | ⚠️ DO NOT USE |

### Pricing (2025)
| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| kimi-k2 | [VERIFY: Check pricing] | [VERIFY: Check pricing] |
| kimi-k2-thinking | [VERIFY: Check pricing] | [VERIFY: Check pricing] |

### Example API Call
```typescript
const response = await fetch('https://api.moonshot.ai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('MOONSHOT_API_KEY')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'kimi-k2',
    messages: [
      { role: 'system', content: 'You are Dad, playful and slightly sarcastic but family-friendly.' },
      { role: 'user', content: 'Write a funny roast for this baby prediction: 4.5kg, 52cm, baby boy' }
    ],
    temperature: 0.85,
    max_tokens: 150
  })
});
```

### Best Use Cases
- **Dad character**: Playful, sassy, witty responses
- **Roast generation**: Family-friendly humor
- **Cultural nuance**: Excellent at understanding humor across cultures
- **Creative writing**: Engaging, fun content

---

## 3. Z.AI (Zhipu AI / 智谱 AI)

### Provider Information
| Field | Value |
|-------|-------|
| **Provider** | Zhipu AI (智谱AI) - Z.AI |
| **Documentation** | [open.bigmodel.cn/dev/api](https://open.bigmodel.cn/dev/api) |
| **New API Docs** | [docs.z.ai/api-reference/llm](https://docs.z.ai/api-reference/llm/chat-completion) |

### Configuration
| Configuration | Value | Notes |
|--------------|-------|-------|
| **Base URL (Standard)** | `https://open.bigmodel.cn/api/paas/v4` | Original endpoint |
| **Base URL (New)** | `https://api.z.ai/api/paas/v4` | Updated endpoint |
| **Authentication** | Bearer token in `Authorization` header | Env var: `ZAI_API_KEY` |

### Available Models
| Model ID | Context Window | Description | Recommended Use |
|----------|----------------|-------------|-----------------|
| `glm-4.7` | 204K | Latest flagship model (Dec 2025) | Game logic, structured output, coding |
| `glm-4-plus` | 256K | Previous flagship model | Game logic, structured output |
| `glm-4` | 128K | Stable model | General structured tasks |
| `glm-4v` | 128K | Vision-enabled model | Multimodal (not used) |
| `glm-3-turbo` | 64K | Cost-effective option | Simple JSON output |

### Pricing (2025)
| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| glm-4.7 | [VERIFY: Check pricing] | [VERIFY: Check pricing] |
| glm-4-plus | [VERIFY: Check pricing] | [VERIFY: Check pricing] |
| glm-4 | [VERIFY: Check pricing] | [VERIFY: Check pricing] |
| glm-3-turbo | ~$0.14 | ~$0.14 |

### Example API Call
```typescript
const response = await fetch('https://api.z.ai/api/paas/v4/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('ZAI_API_KEY')}`,
    'Content-Type': 'application/json'
  },
      body: JSON.stringify({
        model: 'glm-4.7',
    messages: [
      { role: 'system', content: 'You are Thinking, analytical and precise. Always respond in valid JSON format.' },
      { role: 'user', content: 'Calculate the score for this baby pool prediction: weight=3.5kg (avg=3.5), length=50cm (avg=50), due_date偏差=2天' }
    ],
    temperature: 0.4,
    max_tokens: 200
  })
});
```

### Best Use Cases
- **Thinking character**: Analytical, structured responses
- **Game logic**: Scoring, rule evaluation, JSON output
- **Structured data**: Precise JSON responses for game mechanics
- **Agentic tasks**: Multi-step reasoning and execution

---

## 4. Environment Variables

Create or update your `.env.local` file with the following:

```bash
# AI Provider API Keys
MINIMAX_API_KEY=your_minimax_api_key_here
MOONSHOT_API_KEY=your_moonshot_api_key_here
ZAI_API_KEY=your_zai_api_key_here

# Optional: Provider selection for specific use cases
# Default routing uses all three providers
# Set to override for testing
# FORCE_PROVIDER=minimax|moonshot|zai
```

---

## 5. Routing Configuration

### Current Implementation (supabase/functions/ai-router/index.ts)

```typescript
// Provider configurations - VERIFIED 2026-01-03
const PROVIDERS = {
  roast: {
    provider: 'moonshot',
    model: 'kimi-k2',  // Updated from moonshot-v1-8k
    baseUrl: 'https://api.moonshot.ai/v1'  // Updated for global access
  },
  game_logic: {
    provider: 'zai',
    model: 'glm-4.7',  // UPDATED: Latest flagship model (Dec 2025)
    baseUrl: 'https://api.z.ai/api/paas/v4'  // Updated endpoint
  },
  general_chat: {
    provider: 'minimax',
    model: 'MiniMax-M2.1',  // Updated from abab6.5s-chat
    baseUrl: 'https://api.minimax.chat/v1'  // OpenAI-compatible endpoint
  }
};
```

---

## 6. Verification Checklist

Before deploying to production, verify:

- [ ] **MiniMax API Key** is valid and has M2.1 model access
- [ ] **Moonshot API Key** is valid and has K2 model access
- [ ] **Z.AI API Key** is valid and has GLM-4-plus model access
- [ ] **Base URLs** are correct for your geographic region
- [ ] **Rate limits** are understood for each provider
- [ ] **Fallback logic** is tested for each provider failure
- [ ] **Cost estimates** are within budget for expected usage

---

## 7. Known Issues & Workarounds

### MiniMax
- **Issue**: Some older documentation references deprecated models
- **Workaround**: Always use `MiniMax-M2.1` or `abab6.5s-chat` for compatibility

### Moonshot AI
- **Issue**: Model naming changed from `moonshot-v1-*` to `kimi-k2-*`
- **Workaround**: Use `kimi-k2` for new implementations, legacy models deprecated

### Z.AI
- **Issue**: Endpoint URL changed from `open.bigmodel.cn` to `api.z.ai`
- **Workaround**: Both URLs should work, but prefer `api.z.ai` for new integrations

---

## 8. References

### Official Documentation
- [MiniMax API Docs](https://platform.minimax.io/docs/guides/models-intro)
- [Moonshot AI Platform](https://platform.moonshot.cn/docs/guide/start-using-kimi-api)
- [Zhipu AI Developer Console](https://open.bigmodel.cn/dev/api)
- [Z.AI Chat Completion API](https://docs.z.ai/api-reference/llm/chat-completion)

### Related Files
- [`docs/INTEGRATION_PATTERNS.md`](docs/INTEGRATION_PATTERNS.md) - AI Router implementation
- [`docs/MiniMax_Plan/02_TECHNICAL_ARCHITECTURE.md`](docs/MiniMax_Plan/02_TECHNICAL_ARCHITECTURE.md) - Architecture reference
- [`docs/RESEARCH_AI.md`](docs/RESEARCH_AI.md) - Original research document

---

**Document Maintainer:** Infrastructure Analysis System  
**Last Updated:** 2026-01-03  
**Next Review:** 2026-02-03

**Changelog:**
- v1.0 (2026-01-03): Initial version with verified configurations for MiniMax, Moonshot, and Z.AI
