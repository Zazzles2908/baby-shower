# Migration Guide: Aligning Implementation with Design Vision

**Status:** Action Plan | **Version:** 2.0 | **Date:** January 3, 2026

> **Implementation Alignment** - Step-by-step guide to transition from current state to design-aligned architecture.

---

## 🎯 Current State vs. Vision Alignment

### **✅ What's Already Working**
- Frontend Vue 3 foundation with animations
- Supabase backend with basic edge functions
- Character HTML structure (Mom/Dad/Thinking/Celebration)
- Basic AI integration with MiniMax

### **❌ Critical Gaps to Fix**
1. **Single AI Provider** → All characters use MiniMax regardless of personality
2. **No AI Router** → Direct API calls instead of intelligent routing
3. **Hidden Name Exposure** → Baby names hardcoded in source
4. **Missing Response Contract** → No emotion/character metadata
5. **Incomplete Security** → Firewall pattern partially implemented

---

## 🚀 Phase 1: AI Router Implementation (Priority 1)

### **Step 1: Create AI Router Function**
```bash
# Create the central AI router
touch supabase/functions/ai-router/index.ts
```

**Implementation:**
```typescript
// supabase/functions/ai-router/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

interface AIRequest {
  intent: 'roast' | 'game_logic' | 'general_chat' | 'celebration';
  data: Record<string, unknown>;
  options?: {
    personality?: string;
    avatar?: 'mom' | 'dad' | 'thinking' | 'celebration';
  };
}

interface AIResponse {
  success: boolean;
  text?: string;
  emotion?: string;
  character?: string;
  provider?: string;
  cached?: boolean;
  error?: string;
}

// Character-Provider Mapping (FINAL CONFIGURATION)
const CHARACTER_ROUTER = {
  roast: {
    provider: 'moonshot',
    model: 'kimi-k2',
    baseUrl: 'https://api.moonshot.ai/v1',
    character: 'dad',
    emotion: 'sassy'
  },
  game_logic: {
    provider: 'zai', 
    model: 'glm-4.7',
    baseUrl: 'https://api.z.ai/api/paas/v4',
    character: 'thinking',
    emotion: 'analytical'
  },
  general_chat: {
    provider: 'minimax',
    model: 'MiniMax-M2.1',
    baseUrl: 'https://api.minimax.chat/v1',
    character: 'mom', 
    emotion: 'warm'
  },
  celebration: {
    provider: 'minimax',
    model: 'MiniMax-M2.1',
    baseUrl: 'https://api.minimax.chat/v1',
    character: 'celebration',
    emotion: 'joyful'
  }
};

Deno.serve(async (req: Request) => {
  try {
    const body: AIRequest = await req.json();
    const intent = body.intent || classifyIntent(body.data);
    
    const config = CHARACTER_ROUTER[intent] || CHARACTER_ROUTER.general_chat;
    const response = await executeAIRequest(config, body.data, body.options);
    
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      fallback: true,
      text: getFallbackResponse('general_chat')
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
});
```

### **Step 2: Update Frontend API Client**
```typescript
// scripts/api-supabase.ts
async function routeToAI(intent: string, data: any, options?: any): Promise<AIResponse> {
  const { data: response, error } = await this.supabase.functions.invoke('ai-router', {
    body: { intent, data, options }
  });
  
  if (error) throw error;
  return response as AIResponse;
}

// Replace direct AI calls with router
async generateRoast(prediction: PredictionData): Promise<AIResponse> {
  return this.routeToAI('roast', prediction, { avatar: 'dad' });
}

async chatWithAI(message: string): Promise<AIResponse> {
  return this.routeToAI('general_chat', { message }, { avatar: 'mom' });
}
```

---

## 🔒 Phase 2: Hidden Name Implementation (Priority 2)

### **Step 1: Environment Variable Setup**
```bash
# .env.local
VITE_BABY_NAME=The Little One  # Development placeholder
BABY_NAME=The Little One       # Build-time injection
```

### **Step 2: Build-Time Injection System**
```typescript
// scripts/build-config.js
export function getBabyName(): string {
  // Development: Use placeholder
  if (import.meta.env.DEV) {
    return 'The Little One';
  }
  
  // Production: Build-time injection
  return import.meta.env.VITE_BABY_NAME || process.env.BABY_NAME || 'The Little One';
}

// Use in components
const babyName = getBabyName();
```

### **Step 3: Remove Hardcoded Names**
```diff
// Remove from all HTML/JS files
- <h1>Welcome to Baby Maya's Shower!</h1>
+ <h1>Welcome to {{ babyName }}'s Shower!</h1>

- const babyName = 'Maya';
+ const babyName = getBabyName();
```

---

## 🧠 Phase 3: Character Response Contract (Priority 3)

### **Step 1: Define Response Contract**
```typescript
// types/ai.ts
export interface AIResponse {
  success: boolean;
  text: string;
  emotion: 'warm' | 'sassy' | 'analytical' | 'joyful' | 'neutral';
  character: 'mom' | 'dad' | 'thinking' | 'celebration';
  provider: 'minimax' | 'moonshot' | 'zai' | 'fallback';
  cached?: boolean;
  error?: string;
}
```

### **Step 2: Update Character Components**
```vue
<!-- components/CharacterResponse.vue -->
<template>
  <div class="character-response" :class="response.character">
    <div class="character-avatar" :data-emotion="response.emotion">
      <img :src="`/assets/characters/${response.character}.svg`" />
    </div>
    <div class="response-text" :data-character="response.character">
      {{ response.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AIResponse } from '../types/ai';

const props = defineProps<{
  response: AIResponse;
}>();

// Trigger animations based on emotion
watch(() => props.response.emotion, (emotion) => {
  triggerCharacterAnimation(props.response.character, emotion);
});
</script>
```

---

## 🔐 Phase 4: Complete Firewall Pattern (Priority 4)

### **Step 1: Multi-Schema Database Setup**
```sql
-- Enable RLS on all tables
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_predictions ENABLE ROW LEVEL SECURITY;

-- Create internal schema for sensitive data
CREATE SCHEMA internal;
CREATE TABLE internal.metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies: Insert-only for public
CREATE POLICY "insert_only" ON public.submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "no_read" ON public.submissions
  FOR SELECT USING (false);

-- Internal schema: Service role only
CREATE POLICY "service_role_only" ON internal.metadata
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

### **Step 2: Update Edge Functions**
```typescript
// Use service role for internal operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, // Service role for internal access
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Store sensitive data in internal schema
await supabase.from('internal.metadata').insert({
  key: 'baby_name_real',
  value: Deno.env.get('BABY_NAME')
});
```

---

## 🧪 Testing & Validation

### **Step 1: Provider Health Checks**
```typescript
// tests/ai-providers.test.ts
import { describe, it, expect } from 'vitest';

describe('AI Provider Integration', () => {
  it('should route roasts to Dad character (Moonshot)', async () => {
    const response = await routeToAI('roast', { prediction: '4.5kg baby boy' });
    expect(response.character).toBe('dad');
    expect(response.provider).toBe('moonshot');
    expect(response.emotion).toBe('sassy');
  });

  it('should route game logic to Thinking character (Z.AI)', async () => {
    const response = await routeToAI('game_logic', { score: 85 });
    expect(response.character).toBe('thinking');
    expect(response.provider).toBe('zai');
    expect(response.emotion).toBe('analytical');
  });

  it('should route general chat to Mom character (MiniMax)', async () => {
    const response = await routeToAI('general_chat', { message: 'Hello!' });
    expect(response.character).toBe('mom');
    expect(response.provider).toBe('minimax');
    expect(response.emotion).toBe('warm');
  });
});
```

### **Step 2: Hidden Name Validation**
```typescript
// tests/privacy.test.ts
it('should never expose real baby name in source', () => {
  const sourceCode = fs.readFileSync('dist/index.html', 'utf-8');
  expect(sourceCode).not.toContain('Maya'); // Replace with actual name
  expect(sourceCode).toContain('{{ babyName }}');
});

it('should use environment variable for baby name', () => {
  expect(process.env.BABY_NAME).toBeDefined();
  expect(getBabyName()).toBe(process.env.BABY_NAME);
});
```

---

## 📋 Migration Checklist

### **Phase 1: AI Router (Do First)**
- [ ] Create `supabase/functions/ai-router/index.ts`
- [ ] Implement character-provider mapping
- [ ] Add intent classification logic
- [ ] Update frontend API client
- [ ] Test all three providers work correctly
- [ ] Add circuit breaker pattern

### **Phase 2: Hidden Name (Do Second)**
- [ ] Set up environment variables
- [ ] Create build-time injection system
- [ ] Remove all hardcoded names from source
- [ ] Update build process for production
- [ ] Test name masking in production build

### **Phase 3: Response Contract (Do Third)**
- [ ] Define TypeScript interfaces for AI responses
- [ ] Update character components for emotion/character display
- [ ] Implement animation triggers based on emotion
- [ ] Test response contract across all characters

### **Phase 4: Security Hardening (Do Fourth)**
- [ ] Implement multi-schema database structure
- [ ] Update RLS policies for insert-only access
- [ ] Migrate sensitive data to internal schema
- [ ] Update all edge functions to use service role
- [ ] Security audit of data access patterns

---

## 🚨 Rollback Plan

### **If AI Router Fails**
1. Keep existing direct MiniMax calls as fallback
2. Deploy AI router alongside current system
3. Switch over gradually with feature flag

### **If Provider Issues**
1. Circuit breaker automatically falls back to MiniMax
2. Pre-generated content library as final fallback
3. Monitor and alert on provider health

### **If Hidden Name Breaks**
1. Revert to placeholder "The Little One"
2. Manual build process until fixed
3. No real names exposed in emergency

---

## 📊 Success Metrics

### **Alignment Verification**
- [ ] **Character Personality Match**: >95% of responses match intended personality
- [ ] **Provider Routing Accuracy**: >99% correct provider selection
- [ ] **Response Time**: <3 seconds for all AI responses
- [ ] **Fallback Rate**: <5% of requests need fallback

### **Privacy Verification**
- [ ] **Name Exposure**: Zero real names in source code
- [ ] **Data Access**: Public schema insert-only verified
- [ ] **Internal Security**: Service role access only

---

**Migration Owner:** Technical Lead  
**Estimated Timeline:** 2-3 weeks  
**Risk Level:** Medium (well-defined rollback plan)  
**Dependencies:** All AI provider API keys must be available

**Next Steps:**
1. Gather all required API keys
2. Set up development environment with new architecture
3. Implement Phase 1 (AI Router) first
4. Test thoroughly before production deployment