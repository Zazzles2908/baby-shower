import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req: Request) => {
  const apiKey = Deno.env.get('Z_AI_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Z_AI_API_KEY not configured' }), { status: 500 })
  }

  try {
    const response = await fetch('https://api.z.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'glm-4.7',
        messages: [{ role: 'user', content: 'Say hello in one word' }],
        max_tokens: 10,
        temperature: 0.1
      })
    })

    const data = await response.json()
    return new Response(JSON.stringify({
      success: response.ok,
      model: 'GLM-4.7',
      endpoint: 'https://api.z.ai/v1/chat/completions',
      response: data,
      status: response.status
    }))
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})