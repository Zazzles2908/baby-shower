# Research: AI API Integration for Baby Shower Game

## Executive Summary

This research analyzes the current best practices for integrating two Chinese AI APIs - Z.AI (BigModel/ChatGLM) and Moonshot AI (Kimi) - into a baby shower game application. The analysis covers API endpoints, authentication formats, request/response schemas, error handling patterns, and implementation recommendations based on existing code analysis and available documentation.

## Information Sources

- **Z.AI API Documentation**: GLM Cookbook repository (MetaGLM/glm-cookbook)
- **Moonshot AI API**: Platform documentation and existing implementation patterns
- **Existing Implementation**: Analysis of current game-scenario and game-reveal Edge Functions
- **API Examples**: HTTP request patterns and OpenAI SDK compatibility

## 1. Z.AI (BigModel/ChatGLM) API Analysis

### Base URL and Authentication

**Primary Endpoint**: `https://open.bigmodel.cn/api/paas/v4/chat/completions`
**Alternative Endpoint**: `https://open.bigmodel.cn/api/paas/v3/modelapi/chatglm_pro/completions`

**Authentication Format**: JWT Token-based
```typescript
// JWT Generation Pattern
function generateToken(apikey: string, expSeconds: number): string {
  const [id, secret] = apikey.split(".");
  const payload = {
    "api_key": id,
    "exp": Math.round(Date.now() * 1000) + expSeconds * 1000,
    "timestamp": Math.round(Date.now() * 1000)
  };
  
  return jwt.sign(payload, secret, {
    algorithm: "HS256",
    headers: {"alg": "HS256", "sign_type": "SIGN"}
  });
}
```

### Request Schema

**Standard Chat Completion**:
```json
{
  "model": "glm-4-flash",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant"
    },
    {
      "role": "user", 
      "content": "Generate a funny scenario"
    }
  ],
  "max_tokens": 500,
  "temperature": 0.8,
  "top_p": 0.7,
  "stream": false
}
```

**Direct API (v3) Alternative**:
```json
{
  "prompt": "Generate a funny baby shower scenario...",
  "temperature": 0.8,
  "max_tokens": 500
}
```

### Response Schema

**Standard Response**:
```json
{
  "choices": [
    {
      "finish_reason": "stop",
      "index": 0,
      "message": {
        "content": "Generated scenario content...",
        "role": "assistant"
      }
    }
  ],
  "created": 1705933810,
  "id": "8313804547540260859",
  "model": "glm-4",
  "usage": {
    "completion_tokens": 26,
    "prompt_tokens": 19,
    "total_tokens": 45
  }
}
```

### Recommended Parameters for Scenario Generation

- **Model**: `glm-4-flash` (cost-effective) or `glm-4.5` (higher quality)
- **Temperature**: 0.8 (creative but coherent)
- **Max Tokens**: 500 (sufficient for detailed scenarios)
- **Top P**: 0.7-0.9 (controls diversity)

## 2. Moonshot AI (Kimi) API Analysis

### Base URL and Authentication

**Primary Endpoint**: `https://api.moonshot.cn/v1/chat/completions`

**Authentication Format**: Bearer Token
```typescript
headers: {
  'Authorization': `Bearer ${Deno.env.get('KIMI_API_KEY')}`,
  'Content-Type': 'application/json'
}
```

### Request Schema

**Standard Chat Completion**:
```json
{
  "model": "kimi-k2-thinking",
  "messages": [
    {
      "role": "system",
      "content": "You are a sassy barnyard host roasting wrong predictions..."
    },
    {
      "role": "user",
      "content": "Crowd thought: 60% picked Mom. Reality: Dad. Roast this gap!"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 200
}
```

### Response Schema

**Standard Response**:
```json
{
  "choices": [
    {
      "message": {
        "content": "🤡 Complete disaster! The crowd has NO idea...",
        "role": "assistant"
      },
      "finish_reason": "stop",
      "index": 0
    }
  ],
  "model": "kimi-k2-thinking",
  "usage": {
    "completion_tokens": 45,
    "prompt_tokens": 32,
    "total_tokens": 77
  }
}
```

### Recommended Parameters for Roast Generation

- **Model**: `kimi-k2-thinking` (reasoning model for better context understanding)
- **Temperature**: 0.7 (balanced creativity and coherence)
- **Max Tokens**: 200 (sufficient for witty commentary)
- **System Prompt**: Essential for establishing the "sassy barnyard host" persona

## 3. Best Practices and Implementation Patterns

### Error Handling Patterns

**Standardized Error Response**:
```typescript
// From existing game-scenario implementation
try {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
    signal: controller.signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI API error:', response.status, errorText);
    return null;
  }

  const data = await response.json();
  return parseAIResponse(data);
} catch (error) {
  console.error('AI request failed:', error);
  return generateFallbackScenario(); // Always have fallback
}
```

### Timeout Recommendations

**Primary Timeout**: 10 seconds (sufficient for most AI responses)
**Fallback Strategy**: Always implement fallback content generation
**Retry Logic**: Maximum 2 retries with exponential backoff

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000);

try {
  const response = await fetch(apiUrl, options);
  clearTimeout(timeoutId);
  // Process response
} catch (error) {
  clearTimeout(timeoutId);
  if (error.name === 'AbortError') {
    console.error('AI API timeout');
  }
  return fallbackContent();
}
```

### Rate Limiting Considerations

**Z.AI Limits**: 
- Free tier: 100 requests/day
- Paid tiers: Higher limits with per-minute restrictions

**Moonshot AI Limits**:
- Variable based on subscription tier
- Recommended: Implement request queuing for high-traffic scenarios

**Implementation Strategy**:
```typescript
// Rate limiting with queue
class AIRequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  
  async addRequest(requestFn: () => Promise<any>): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      if (!this.processing) {
        this.processQueue();
      }
    });
  }
  
  private async processQueue() {
    this.processing = true;
    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (request) {
        await request();
        // Add delay between requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    this.processing = false;
  }
}
```

### Fallback Strategies

**Content Fallbacks**:
```typescript
function generateFallbackScenario(momName: string, dadName: string): Scenario {
  const scenarios = [
    {
      scenario: "It's 3 AM and the baby has a dirty diaper that requires immediate attention.",
      momOption: `${momName} would gently clean it up while singing a lullaby`,
      dadOption: `${dadName} would make a dramatic production of it while holding their breath`,
      intensity: 0.6
    },
    // Additional fallback scenarios...
  ];
  
  return scenarios[Math.floor(Math.random() * scenarios.length)];
}

function generateFallbackRoast(perceptionGap: number): string {
  if (perceptionGap < 10) {
    return "🎯 Spot on! The crowd knew exactly what would happen!";
  } else if (perceptionGap < 30) {
    return "🤔 Close, but the reality was a bit different...";
  } else if (perceptionGap < 50) {
    return "😱 Wow, the crowd was WAY off! What were you thinking?!";
  } else {
    return "🤡 Complete disaster! The crowd has NO idea how this family works!";
  }
}
```

## 4. Integration Recommendations

### Dual API Strategy

Based on the existing implementation, use both APIs with fallback chains:

1. **Primary**: Z.AI direct API
2. **Secondary**: OpenRouter (provides access to GLM models)
3. **Tertiary**: Local fallback content

### Environment Configuration

```bash
# Required for Z.AI
Z_AI_API_KEY="your.zai.api.key"

# Optional fallback
OPENROUTER_API_KEY="your.openrouter.key"

# Required for Moonshot
KIMI_API_KEY="your.moonshot.api.key"
```

### Response Parsing Patterns

**Standardized Response Handling**:
```typescript
function parseAIResponse(data: any, provider: 'zai' | 'moonshot'): string {
  try {
    if (provider === 'zai') {
      // Handle Z.AI response format
      return data.choices?.[0]?.message?.content || 
             data.data?.choices?.[0]?.message?.content || 
             '';
    } else if (provider === 'moonshot') {
      // Handle Moonshot response format
      return data.choices?.[0]?.message?.content || '';
    }
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    return '';
  }
  return '';
}
```

## 5. Security Considerations

### API Key Management
- Never expose API keys in client-side code
- Use environment variables for all API keys
- Implement key rotation mechanisms
- Monitor API usage for anomalies

### Content Filtering
- Implement content moderation for AI-generated content
- Add profanity filters for family-friendly content
- Validate JSON responses before parsing
- Sanitize user inputs in prompts

## 6. Performance Optimization

### Caching Strategy
- Cache successful AI responses for similar prompts
- Implement scenario deduplication
- Use Redis or similar for distributed caching

### Request Optimization
- Batch multiple requests when possible
- Implement request deduplication
- Use connection pooling for HTTP requests

## Technical Implementation Summary

The research reveals that both APIs follow modern REST patterns with good TypeScript support. The existing implementation in your Edge Functions demonstrates best practices including:

1. **Timeout protection** (10-second limits)
2. **Fallback content generation** 
3. **Error handling with logging**
4. **Response format normalization**
5. **Environment-based API key management**

The recommended approach is to maintain the current dual-API strategy with Z.AI for scenarios and Moonshot for roasts, ensuring robust fallback mechanisms and proper error handling throughout the integration.

## Sources

- GLM Cookbook Repository: MetaGLM/glm-cookbook
- Existing Baby Shower Game Implementation: game-scenario/index.ts, game-reveal/index.ts
- Z.AI API Documentation: open.bigmodel.cn
- Moonshot AI Platform: platform.moonshot.cn