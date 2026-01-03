# Design Proposals for Baby Shower App Redesign

**Document Version:** 2.0  
**Date:** 2026-01-02  
**Project:** Baby Shower App Redesign  
**Status:** Research Complete (Verified)

---

## Agent Tool Usage

- **MiniMax MCP**: Use for MiniMax-specific queries
- **Web Search**: Use for Moonshot AI and Z.AI documentation
- **Supabase MCP**: Use for schema changes and Edge Function updates

---

## 1. Executive Summary

This document outlines design proposals for the Baby Shower app redesign, with **corrected AI use case assignments** based on verified provider capabilities.

### 1.1 Corrected AI Use Cases

| Feature | Previous (Incorrect) | Current (Verified) |
|---------|---------------------|-------------------|
| Baby Pool Roasts | Any AI | **MiniMax only** |
| Content Moderation | Any AI | **MiniMax only** |
| Complex Reasoning | Not assigned | **Moonshot AI (fallback)** |
| Code Generation | Not assigned | **Z.AI GLM only** |

---

## 2. AI-Powered Features (Verified)

### 2.1 Baby Pool Roast Generation

**Provider:** MiniMax (M2.1)

```typescript
// supabase/functions/pool/index.ts

export default async function handler(req: Request): Promise<Response> {
  const prediction = await req.json();

  // Generate AI roast using MiniMax
  const roast = await generateMiniMaxRoast(prediction);

  // Store in Supabase
  const { data, error } = await supabase
    .from('submissions')
    .insert({
      name: prediction.name,
      activity_type: 'baby_pool',
      activity_data: {
        ...prediction,
        roast,
        roast_generated_at: new Date().toISOString()
      }
    })
    .select()
    .single();

  return new Response(
    JSON.stringify({ success: true, prediction: data, roast }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

async function generateMiniMaxRoast(prediction: PredictionData): Promise<string> {
  const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('MINIMAX_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'M2.1',
      messages: [{
        role: 'user',
        content: buildRoastPrompt(prediction)
      }],
      temperature: 0.8,
      max_tokens: 200
    })
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content || generateFallbackRoast();
}
```

### 2.2 Content Moderation

**Provider:** MiniMax (M2.1)

```typescript
async function moderateContent(submission: Submission): Promise<{
  approved: boolean;
  reason?: string;
}> {
  const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('MINIMAX_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'M2.1',
      messages: [{
        role: 'user',
        content: `Check if this message is appropriate for a baby shower guestbook:
        
Name: ${submission.name}
Message: ${submission.message}

Respond with ONLY a JSON object:
{ "approved": true/false, "reason": "brief explanation if rejected" }`
      }],
      temperature: 0.1,
      max_tokens: 50
    })
  });

  const data = await response.json();
  return JSON.parse(data.choices?.[0]?.message?.content || '{"approved": true}');
}
```

### 2.3 Fallback Reasoning

**Provider:** Moonshot AI (Kimi K2 Thinking)

```typescript
async function generateComplexReasoning(
  prompt: string
): Promise<string | null> {
  // Only use Moonshot when MiniMax fails or for complex reasoning
  try {
    const response = await fetch('https://api.moonshot.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('MOONSHOT_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'kimi-k2-thinking',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content;
  } catch (error) {
    console.error('Moonshot fallback failed:', error);
    return null;
  }
}
```

### 2.4 Code Generation

**Provider:** Z.AI GLM (glm-4.6 or glm-4.7)

```typescript
// Use Z.AI ONLY for code generation tasks
async function generateCode(task: string, language: string): Promise<string> {
  const response = await fetch(
    'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('ZAI_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'glm-4.6',
        messages: [{
          role: 'user',
          content: `Generate ${language} code for: ${task}`
        }],
        temperature: 0.3,
        max_tokens: 2000
      })
    }
  );

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '// Code generation failed';
}
```

---

## 3. Technology Decisions (Verified)

| Decision | Recommendation | Rationale |
|----------|----------------|-----------|
| **Primary AI Provider** | MiniMax | Cost-effective, reliable for text generation |
| **AI Fallback** | Moonshot Kimi | Better for complex reasoning |
| **Coding Assistant** | Z.AI GLM | Purpose-built for coding tasks |
| **Content Moderation** | MiniMax | Already integrated, sufficient quality |
| **Caching Strategy** | Local cache + TTL | Simple, effective, no additional infra |

---

## 4. References

### 4.1 Official Documentation

- [MiniMax API Documentation](https://platform.minimax.io/docs)
- [Moonshot AI Documentation](https://platform.moonshot.ai/docs)
- [Zhipu AI Documentation](https://docs.z.ai/guides/llm/glm-4.5)

### 4.2 Related Files

- [`docs/research/03-ai-providers.md`](docs/research/03-ai-providers.md) - AI provider details
- [`docs/research/04-integration-patterns.md`](docs/research/04-integration-patterns.md) - Integration patterns
- [`docs/architecture/`](docs/architecture/) - Architecture documentation

---

**Document Maintainer:** Infrastructure Analysis System  
**Last Updated:** 2026-01-02  
**Next Review:** 2026-02-02
