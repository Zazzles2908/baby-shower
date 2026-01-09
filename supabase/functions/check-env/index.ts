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
    // List all environment variables (but mask sensitive ones)
    const envVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'Z_AI_API_KEY',
      'KIMI_API_KEY',
      'MINIMAX_API_KEY',
      'OPENROUTER_API_KEY'
    ]

    const result: Record<string, any> = {}
    
    for (const varName of envVars) {
      const value = Deno.env.get(varName)
      if (value) {
        // Mask the actual value but show length and first/last characters
        if (varName.includes('KEY') || varName.includes('SECRET')) {
          result[varName] = {
            configured: true,
            length: value.length,
            preview: value.substring(0, 4) + '...' + value.substring(value.length - 4),
            firstFew: value.substring(0, 8),
            lastFew: value.substring(value.length - 8)
          }
        } else {
          result[varName] = {
            configured: true,
            value: value
          }
        }
      } else {
        result[varName] = {
          configured: false,
          message: 'Not set in environment'
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      environmentCheck: result,
      timestamp: new Date().toISOString()
    }), { status: 200, headers })

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500, headers })
  }
})
