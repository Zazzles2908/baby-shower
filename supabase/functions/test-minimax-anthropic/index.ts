import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req: Request) => {
  const apiKey = Deno.env.get('MINIMAX_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ 
      error: 'MINIMAX_API_KEY not configured',
      message: 'Set MINIMAX_API_KEY in Supabase environment variables'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const url = new URL(req.url)
  const testEndpoint = url.searchParams.get('endpoint') || 'anthropic'
  
  const endpoints = {
    current: 'https://api.minimax.io/v1/text/chatcompletion_v2',
    chat: 'https://api.minimax.io/v1/chat/completions'
  }

  const targetEndpoint = endpoints.current

  console.log(`Testing MiniMax endpoint: ${targetEndpoint}`)
  console.log(`API Key present: ${apiKey ? 'yes (length: ' + apiKey.length + ')' : 'no'}`)

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(targetEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.1',
        messages: [{ role: 'user', content: 'Say hello in one word' }],
        max_tokens: 10
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    const data = await response.json().catch(() => ({ raw: 'Unable to parse response' }))

    console.log(`Response status: ${response.status}`)
    console.log(`Response ok: ${response.ok}`)
    console.log(`Response data:`, JSON.stringify(data, null, 2))

    return new Response(JSON.stringify({
      success: response.ok,
      endpoint: targetEndpoint,
      status: response.status,
      statusText: response.statusText,
      response: data,
      headers: {
        'content-type': response.headers.get('content-type'),
        'authorization': 'Bearer [REDACTED]'
      }
    }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Request failed:', error.message)
    return new Response(JSON.stringify({
      success: false,
      endpoint: targetEndpoint,
      error: error.message,
      type: error.name
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
