/**
 * Test MiniMax API - Game Reveal Roast Generation
 * Tests MiniMax for generating witty roast commentary
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req: Request) => {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  })

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  try {
    const apiKey = Deno.env.get('MINIMAX_API_KEY')
    
    if (!apiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'MINIMAX_API_KEY not configured in environment variables'
      }), { status: 500, headers })
    }

    if (apiKey.length < 20) {
      return new Response(JSON.stringify({
        success: false,
        error: 'MINIMAX_API_KEY appears to be too short',
        keyLength: apiKey.length
      }), { status: 500, headers })
    }

    // Test MiniMax API with a roast generation prompt
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const response = await fetch('https://api.minimax.io/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.1',
        messages: [
          {
            role: 'system',
            content: `You are a witty, playful host for a baby shower game called "Mom vs Dad: The Truth Revealed". 
Your job is to roast the crowd for their predictions about what mom or dad would do in silly scenarios.
Be funny, teasing, and family-friendly. Use emojis and keep it SHORT (under 100 characters).
Never be mean-spirited - the goal is playful teasing that makes everyone laugh.`
          },
          {
            role: 'user',
            content: `Generate a witty roast for this "Mom vs Dad" round:

📊 VOTE RESULTS:
- Mom got 75.0% of votes (🗳️ Crowd picked MOM)
- Dad got 25.0% of votes
- Perception gap: 50.0%

👨‍👩‍👧 THE CONTESTANTS:
- Mom: Sarah
- Dad: Mike

📝 THE SCENARIO:
"It's 3 AM and the baby has a dirty diaper that requires immediate attention."
- Mom's choice: "Sarah would gently clean it up while singing a lullaby"
- Dad's choice: "Mike would make a dramatic production of it while holding their breath"

🎯 ROAST THE CROWD:
Be funny and teasing! They were way off! Give them a good roasting!

Keep it SHORT, punchy, and family-friendly!`
          }
        ],
        max_tokens: 150,
        temperature: 0.8
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      return new Response(JSON.stringify({
        success: false,
        error: `MiniMax API returned status ${response.status}`,
        details: errorText
      }), { status: response.status, headers })
    }

    const data = await response.json()
    
    // Check if we got a valid response
    const content = data.choices?.[0]?.message?.content || ''
    
    return new Response(JSON.stringify({
      success: true,
      provider: 'MiniMax',
      model: 'MiniMax-M2.1',
      endpoint: 'https://api.minimax.io/v1/text/chatcompletion_v2',
      response: content,
      rawResponse: data,
      timestamp: new Date().toISOString()
    }), { status: 200, headers })

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), { status: 500, headers })
  }
})
