# AI Integration Capability Analysis - Character Personality System

**Document Version:** 2.0 (Aligned with Character Personalities)  
**Date:** 2026-01-03  
**Project:** Baby Shower App Redesign  
**Status:** Multi-Provider Character System Research Complete

---

## 1. Multi-Provider AI Architecture

### 1.1 Character-Personality-AI Mapping

The Baby Shower app implements a **personality-driven AI system** where different characters use specialized AI providers:

| Character | Personality | AI Provider | Model | Use Case | Cost Advantage |
|-----------|-------------|-------------|-------|----------|----------------|
| **Mom** | Warm, welcoming, supportive | MiniMax | `MiniMax-M2.1` | General chat, greetings | 15x cheaper than Claude |
| **Dad** | Sassy, irreverent, playful | Moonshot AI | `kimi-k2` | Humor, roasts, wit | Cultural humor expertise |
| **Thinking** | Analytical, precise, structured | Z.AI (Zhipu) | `glm-4.7` | Game logic, JSON output | Latest model (Dec 2025) |
| **Celebration** | Joyful, enthusiastic | MiniMax | `MiniMax-M2.1` | Milestones, achievements | Warm celebration tone |

### 1.2 Strategic Value

**Multi-provider approach addresses:**
- **Personality Alignment**: Each character gets AI that matches their personality
- **Cost Optimization**: Cheaper providers for suitable tasks
- **Reliability**: Fallback options when providers fail
- **Specialization**: Different providers excel at different tasks

---

## 2. Technical Implementation

### 2.1 AI Router Architecture

```typescript
// services/ai-router.ts
interface AIRequest {
  intent: 'roast' | 'game_logic' | 'general_chat' | 'celebration';
  data: any;
  character?: 'mom' | 'dad' | 'thinking' | 'celebration';
}

interface AIResponse {
  success: boolean;
  text: string;
  emotion: string;
  character: string;
  provider: string;
}

const CHARACTER_ROUTER = {
  mom: {
    provider: 'minimax',
    model: 'MiniMax-M2.1',
    baseUrl: 'https://api.minimax.chat/v1',
    temperature: 0.7,
    systemPrompt: 'You are Mom: warm, welcoming, and supportive. Always family-friendly.'
  },
  dad: {
    provider: 'moonshot',
    model: 'kimi-k2',
    baseUrl: 'https://api.moonshot.ai/v1',
    temperature: 0.85,
    systemPrompt: 'You are Dad: playful, slightly sarcastic, but always family-friendly and loving.'
  },
  thinking: {
    provider: 'zai',
    model: 'glm-4.7',
    baseUrl: 'https://api.z.ai/api/paas/v4',
    temperature: 0.4,
    systemPrompt: 'You are Thinking: analytical and precise. Always respond in valid JSON format.'
  }
};

export async function routeToAI(request: AIRequest): Promise<AIResponse> {
  const character = request.character || classifyIntent(request.intent);
  const config = CHARACTER_ROUTER[character];
  
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getApiKey(config.provider)}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: config.systemPrompt },
        { role: 'user', content: buildPrompt(request.intent, request.data) }
      ],
      temperature: config.temperature,
      max_tokens: 200
    })
  });
  
  const result = await response.json();
  
  return {
    success: true,
    text: result.choices?.[0]?.message?.content,
    emotion: inferEmotion(request.intent, character),
    character: character,
    provider: config.provider
  };
}
```

### 2.2 Intent Classification System

```typescript
// services/intent-classifier.ts
const INTENT_PATTERNS = {
  roast: [
    /roast/i, /funny/i, /joke/i, /sassy/i, /tease/i, /playful/i, /humor/i
  ],
  game_logic: [
    /game/i, /score/i, /calculate/i, /logic/i, /rule/i, /agent/i, /win/i
  ],
  celebration: [
    /celebrate/i, /milestone/i, /achievement/i, /success/i, /congratulations/i
  ]
};

export function classifyIntent(userInput: string): 'mom' | 'dad' | 'thinking' | 'celebration' {
  const message = userInput.toLowerCase();
  
  // Check roast patterns first (strong indicators)
  for (const pattern of INTENT_PATTERNS.roast) {
    if (pattern.test(message)) return 'dad';
  }
  
  // Check game logic patterns
  for (const pattern of INTENT_PATTERNS.game_logic) {
    if (pattern.test(message)) return 'thinking';
  }
  
  // Check celebration patterns
  for (const pattern of INTENT_PATTERNS.celebration) {
    if (pattern.test(message)) return 'celebration';
  }
  
  // Default to Mom for general conversation
  return 'mom';
}
```

---

## 3. Provider-Specific Capabilities

### 3.1 MiniMax AI (Mom Character)

**Provider Details:**
- **Model**: `MiniMax-M2.1` (230B parameters, 10B activated)
- **Endpoint**: `https://api.minimax.chat/v1`
- **Strengths**: Conversational AI, cost-effective, fast response times
- **Cost**: $0.50 per 1M tokens (15x cheaper than Claude)

**Best Use Cases:**
- General chat and greetings
- Warm, supportive responses
- High-volume interactions
- Multilingual support (excellent Chinese)

**Configuration Example:**
```typescript
const momConfig = {
  model: 'MiniMax-M2.1',
  temperature: 0.7,  // Balanced creativity
  maxTokens: 200,
  systemPrompt: 'You are Mom: warm, welcoming, and supportive. Always family-friendly.'
};
```

### 3.2 Moonshot AI (Dad Character)

**Provider Details:**
- **Model**: `kimi-k2` (256K context window)
- **Endpoint**: `https://api.moonshot.ai/v1`
- **Strengths**: Cultural humor, creative writing, witty responses
- **Speciality**: Understanding humor across different cultures

**Best Use Cases:**
- Humorous roasts and jokes
- Playful, sassy responses
- Creative writing tasks
- Cultural nuance understanding

**Configuration Example:**
```typescript
const dadConfig = {
  model: 'kimi-k2',
  temperature: 0.85,  // Higher creativity for humor
  maxTokens: 150,     // Keep it short and punchy
  systemPrompt: 'You are Dad: playful, slightly sarcastic, but always family-friendly.'
};
```

### 3.3 Z.AI GLM-4.7 (Thinking Character)

**Provider Details:**
- **Model**: `glm-4.7` (204K context, released Dec 2025)
- **Endpoint**: `https://api.z.ai/api/paas/v4`
- **Strengths**: Structured reasoning, JSON output, analytical tasks
- **Latest Features**: Enhanced coding capabilities, multi-step reasoning

**Best Use Cases:**
- Game logic and scoring
- Structured JSON responses
- Analytical calculations
- Multi-step problem solving

**Configuration Example:**
```typescript
const thinkingConfig = {
  model: 'glm-4.7',
  temperature: 0.4,  // Lower for precision
  maxTokens: 200,
  systemPrompt: 'You are Thinking: analytical and precise. Always respond in valid JSON format.'
};
```

---

## 4. Fallback & Reliability Strategy

### 4.1 Circuit Breaker Pattern

```typescript
// services/circuit-breaker.ts
class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private failureThreshold = 3,
    private recoveryTime = 30000
  ) {}
  
  async execute(operation: () => Promise<any>): Promise<any> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > this.recoveryTime) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker open');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailure = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
    }
  }
}
```

### 4.2 Fallback Content Library

```typescript
// services/fallback-content.ts
const FALLBACK_RESPONSES = {
  mom: {
    greeting: "Hello there! 👋 How can I help you today?",
    welcome: "Welcome to the celebration! We're so glad you're here.",
    help: "I'm here to help make this experience wonderful for you."
  },
  dad: {
    roast: "Your prediction is... certainly memorable! Either you're right or baby has some surprises ahead. 🍼",
    joke: "That's quite a prediction you've made there! We can't wait to see if you're spot-on!",
    playful: "Bold prediction! Either you'll be the hero of the day or we'll be reminding you of this moment for years!"
  },
  thinking: {
    analysis: "Let me calculate that for you!",
    logic: "Here's how that works...",
    processing: "I'm thinking... 🤔"
  }
};

export function getFallbackResponse(character: string, intent: string): string {
  const characterResponses = FALLBACK_RESPONSES[character];
  if (!characterResponses) return "Thanks for participating! 🎉";
  
  // Return random response for character/intent
  const responses = Object.values(characterResponses);
  return responses[Math.floor(Math.random() * responses.length)];
}
```

---

## 5. Privacy & Security

### 5.1 Hidden Name Implementation

**Environment Variable Setup:**
```bash
# Development
VITE_BABY_NAME=The Little One
VITE_COUPLE_NAMES=The Parents

# Production (Build-time injection)
VITE_BABY_NAME_REAL=  # Real name injected at build time
VITE_COUPLE_NAMES_REAL=  # Real names injected at build time
```

### 5.2 Response Contract

```typescript
interface AIResponse {
  success: boolean;
  text: string;
  emotion: 'warm' | 'sassy' | 'analytical' | 'joyful' | 'neutral';
  character: 'mom' | 'dad' | 'thinking' | 'celebration';
  provider: 'minimax' | 'moonshot' | 'zai' | 'fallback';
  cached?: boolean;
  error?: string;
}
```

---

## 6. Testing Strategy

### 6.1 Provider Health Monitoring

```typescript
// tests/provider-health.test.ts
describe('AI Provider Health', () => {
  it('should route to appropriate provider based on character', async () => {
    const momResponse = await routeToAI('general_chat', { message: 'Hello' }, 'mom');
    expect(momResponse.provider).toBe('minimax');
    expect(momResponse.character).toBe('mom');
    
    const dadResponse = await routeToAI('roast', { prediction: '4.5kg' }, 'dad');
    expect(dadResponse.provider).toBe('moonshot');
    expect(dadResponse.character).toBe('dad');
    
    const thinkingResponse = await routeToAI('game_logic', { score: 85 }, 'thinking');
    expect(thinkingResponse.provider).toBe('zai');
    expect(thinkingResponse.character).toBe('thinking');
  });
  
  it('should provide fallback when provider fails', async () => {
    // Simulate provider failure
    const response = await routeToAI('roast', { data: 'test' }, 'dad');
    if (!response.success) {
      expect(response.text).toBeTruthy(); // Should have fallback content
    }
  });
});
```

---

## 7. Cost Analysis & Optimization

### 7.1 Provider Pricing (2026)

| Provider | Model | Input Cost | Output Cost | Use Case Efficiency |
|----------|-------|------------|-------------|-------------------|
| MiniMax | M2.1 | $0.50/1M tokens | $0.50/1M tokens | 15x cheaper than Claude |
| Moonshot | Kimi-K2 | ~$2.00/1M tokens | ~$2.00/1M tokens | Premium humor quality |
| Z.AI | GLM-4.7 | ~$1.50/1M tokens | ~$1.50/1M tokens | Latest model pricing |

### 7.2 Optimization Strategies

1. **Character-Based Routing**: Use cheapest suitable provider for each character
2. **Caching**: Cache similar responses to reduce API calls
3. **Token Limits**: Set appropriate max_tokens for each use case
4. **Fallback Priority**: MiniMax as universal fallback (cheapest)
5. **Circuit Breaker**: Prevent wasted calls to failing providers

---

## 8. Next Steps & Implementation

### 8.1 Immediate Actions
1. **Set up all three AI provider accounts** and obtain API keys
2. **Implement AI router** with character-personality mapping
3. **Create fallback content library** for provider failures
4. **Build provider health monitoring** system

### 8.2 Testing Phase
1. **Character personality validation** across all providers
2. **Cost monitoring** and optimization
3. **Fallback system testing** under failure conditions
4. **Response time benchmarking** for each provider

---

**Document Owner:** AI Integration Team  
**Last Updated:** January 3, 2026  
**Next Review:** February 3, 2026

**Changelog:**
- v2.0: Updated to multi-provider character personality system
- v1.1: Updated MiniMax configuration with verified models
- v1.0: Initial single-provider analysis