/**
 * Test MiniMax API with Anthropic-compatible endpoint
 * Run with: npx tsx test-minimax-anthropic.ts
 */

import 'dotenv/config'

const API_KEY = process.env.MINIMAX_API_KEY

if (!API_KEY) {
  console.error('❌ MINIMAX_API_KEY not found in environment variables')
  console.log('Set it in .env.local or as environment variable')
  process.exit(1)
}

console.log('API Key length:', API_KEY.length)
console.log('API Key prefix:', API_KEY.substring(0, 10) + '...')

const endpoints = [
  {
    name: 'Original Chat API',
    url: 'https://api.minimax.io/v1/chat/completions',
    body: {
      model: 'MiniMax-M2.1',
      messages: [{ role: 'user', content: 'Say hello in one word' }],
      max_tokens: 10
    }
  },
  {
    name: 'Anthropic-compatible API',
    url: 'https://api.minimax.io/anthropic/v1/completions',
    body: {
      model: 'MiniMax-M2.1',
      messages: [{ role: 'user', content: 'Say hello in one word' }],
      max_tokens: 10
    }
  },
  {
    name: 'Chat API (alt domain)',
    url: 'https://api.minimax.chat/v1/chat/completions',
    body: {
      model: 'abab6.5s-chat',
      messages: [{ role: 'user', content: 'Say hello in one word' }],
      max_tokens: 10
    }
  }
]

async function testEndpoint(endpoint: { name: string; url: string; body: object }) {
  console.log(`\n🧪 Testing: ${endpoint.name}`)
  console.log(`   URL: ${endpoint.url}`)
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'x-api-key': API_KEY
      },
      body: JSON.stringify(endpoint.body),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    const status = response.status
    const statusText = response.statusText
    const contentType = response.headers.get('content-type')

    let data
    try {
      data = await response.json()
    } catch {
      data = { raw: await response.text() }
    }

    console.log(`   Status: ${status} ${statusText}`)
    console.log(`   Content-Type: ${contentType}`)
    console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 500))

    if (response.ok) {
      console.log(`   ✅ SUCCESS`)
      return { success: true, endpoint: endpoint.name, data }
    } else {
      console.log(`   ❌ FAILED`)
      return { success: false, endpoint: endpoint.name, error: data }
    }
  } catch (error) {
    clearTimeout(timeoutId)
    console.log(`   ❌ ERROR: ${error.message}`)
    return { success: false, endpoint: endpoint.name, error: error.message }
  }
}

async function main() {
  console.log('🚀 MiniMax API Endpoint Test')
  console.log('='.repeat(50))

  const results = []
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint)
    results.push(result)
  }

  console.log('\n📊 Summary')
  console.log('='.repeat(50))
  
  const successCount = results.filter(r => r.success).length
  console.log(`Passed: ${successCount}/${results.length}`)

  const workingEndpoints = results.filter(r => r.success).map(r => r.endpoint)
  if (workingEndpoints.length > 0) {
    console.log(`\n✅ Working endpoints: ${workingEndpoints.join(', ')}`)
  }

  const failedEndpoints = results.filter(r => !r.success)
  if (failedEndpoints.length > 0) {
    console.log(`\n❌ Failed endpoints:`)
    for (const r of failedEndpoints) {
      console.log(`   - ${r.endpoint}: ${JSON.stringify(r.error)}`)
    }
  }

  process.exit(successCount > 0 ? 0 : 1)
}

main().catch(console.error)
