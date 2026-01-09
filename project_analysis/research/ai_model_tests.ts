# AI Model Testing Edge Functions

## MiniMax Model Test
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req: Request) => {
  const apiKey = Deno.env.get('MINIMAX_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'MINIMAX_API_KEY not configured' }), { status: 500 })
  }

  try {
    const response = await fetch('https://api.minimax.chat/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.1',
        messages: [{ role: 'user', content: 'Say hello in one word' }],
        max_tokens: 10
      })
    })

    const data = await response.json()
    return new Response(JSON.stringify({
      success: response.ok,
      model: 'MiniMax-M2.1',
      response: data,
      status: response.status
    }))
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
```

## Kimi Model Test
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req: Request) => {
  const apiKey = Deno.env.get('KIMI_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'KIMI_API_KEY not configured' }), { status: 500 })
  }

  try {
    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'kimi-k2-thinking-turbo',
        messages: [{ role: 'user', content: 'Say hello in one word' }],
        max_tokens: 10
      })
    })

    const data = await response.json()
    return new Response(JSON.stringify({
      success: response.ok,
      model: 'kimi-k2-thinking-turbo',
      response: data,
      status: response.status
    }))
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
```

## GLM Model Test
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req: Request) => {
  const apiKey = Deno.env.get('Z_AI_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Z_AI_API_KEY not configured' }), { status: 500 })
  }

  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v3/modelapi/chatglm_pro/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        prompt: 'Say hello in one word',
        max_tokens: 10
      })
    })

    const data = await response.json()
    return new Response(JSON.stringify({
      success: response.ok,
      model: 'GLM4.7',
      response: data,
      status: response.status
    }))
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
```