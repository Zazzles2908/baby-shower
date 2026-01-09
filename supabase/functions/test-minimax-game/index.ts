/**
 * Test MiniMax API - Game Scenario Generation
 * Tests MiniMax for generating "who would rather" scenarios
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

    // Test MiniMax API with a scenario generation prompt
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
            role: 'user',
            content: `Generate a funny "who would rather" scenario for a baby shower game about Sarah (mom) vs Mike (dad).

Theme: farm and barnyard themed scenarios

Requirements:
1. Write a realistic, relatable scenario that could happen with a new baby
2. Make it funny but not offensive - keep it family-friendly
3. The scenario should highlight personality differences between them
4. Generate two options - one that Sarah would do, one that Mike would do
5. Include an intensity score from 0.1 (mildly funny) to 1.0 (hilarious)

Return ONLY a JSON object with this exact format:
{
  "scenario": "The scenario description",
  "mom_option": "What Sarah would do",
  "dad_option": "What Mike would do",
  "intensity": 0.7
}

Do not include any other text or formatting.`
          }
        ],
        max_tokens: 500,
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
    
    // Try to parse the JSON from the response
    let parsedResult = null
    if (content) {
      try {
        const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim()
        parsedResult = JSON.parse(cleanContent)
      } catch (parseError) {
        // Return raw content if JSON parsing fails
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      provider: 'MiniMax',
      model: 'MiniMax-M2.1',
      endpoint: 'https://api.minimax.io/v1/text/chatcompletion_v2',
      rawResponse: content,
      parsedResult: parsedResult,
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
