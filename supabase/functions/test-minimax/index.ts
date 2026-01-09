import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req: Request) => {
  const apiKey = Deno.env.get('MINIMAX_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'MINIMAX_API_KEY not configured' }), { status: 500 })
  }

  const url = new URL(req.url)
  const useAnthropicEndpoint = url.searchParams.get('anthropic') === 'true'
  
   const endpoint = 'https://api.minimax.io/v1/text/chatcompletion_v2'

  console.log(`Testing MiniMax API: ${endpoint}`)

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.1',
        messages: [{ role: 'user', content: 'Say hello in one word' }],
        max_tokens: 10
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    const data = await response.json()
    
    console.log(`MiniMax API response:`, JSON.stringify(data, null, 2))

    return new Response(JSON.stringify({
      success: response.ok,
      endpoint: endpoint,
      model: 'MiniMax-M2.1',
      response: data,
      status: response.status
    }))
  } catch (error) {
    console.error('MiniMax API error:', error.message)
    return new Response(JSON.stringify({ 
      error: error.message,
      endpoint: endpoint
    }), { status: 500 })
  }
})