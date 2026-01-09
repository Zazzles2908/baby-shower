import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req: Request) => {
  const apiKey = Deno.env.get('Z_AI_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Z_AI_API_KEY not configured' }), { status: 500 })
  }

  try {
    // UPDATED: Using v4 endpoint with OpenAI-compatible format
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'glm-4.7',  // UPDATED: Correct model name
        messages: [{ role: 'user', content: 'Say hello in one word' }],  // UPDATED: OpenAI format
        max_tokens: 10
      })
    })

    const data = await response.json()
    return new Response(JSON.stringify({
      success: response.ok,
      model: 'glm-4.7',  // UPDATED: Correct model name
      response: data,
      status: response.status,
      endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions'  // UPDATED: v4 endpoint
    }))
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})