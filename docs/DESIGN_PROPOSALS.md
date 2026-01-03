# Design Proposals for Baby Shower App Redesign

**Document Version:** 2.0 (Aligned with AGENTS.md vision)  
**Date:** 2026-01-03  
**Project:** Baby Shower App Redesign  
**Status:** Aligned with MiniMax Vision

---

## 1. Executive Summary

This document outlines comprehensive design proposals for the Baby Shower app redesign, building upon the technical research completed for Supabase, Vercel, and AI integration. The proposals address both the "System Core" (Reliability) and "Soul Core" (Emotional Connection) requirements identified in the Master Plan.

### 1.1 Design Philosophy

The redesign follows the "Digital Living Room" vision—a high-performance engine wrapped in a warm embrace. This means:

- **Robust Foundation**: Enterprise-grade infrastructure with graceful degradation
- **Warm User Experience**: Emotional connection through thoughtful interactions
- **Legacy Preservation**: Data formats suitable for long-term readability
- **Cultural Inclusivity**: Features that honor the significance of the event
- **Privacy First**: Baby's name protected, never exposed in source code

### 1.2 Proposed Enhancements

| Category | Current State | Proposed State | Priority |
|----------|---------------|----------------|----------|
| **UI/UX** | Functional prototype | Cozy, themed experience | High |
| **Realtime Updates** | Polling-based | Live WebSocket subscriptions | High |
| **AI Features** | Single provider | Multi-provider character personalities | High |
| **Character System** | Basic avatars | Personality-driven AI hosts | High |
| **Privacy** | Hardcoded names | Environment variable protection | High |
| **Legacy Features** | Raw data export | Digital book format | Medium |
| **Offline Support** | None | Full offline capability | Medium |

---

## 2. User Experience Redesign

### 2.1 Visual Design System

#### Color Palette Proposal

The "Cozy Barnyard" theme focuses on soft, nature-inspired colors:

```css
/* styles/theme.css */

:root {
  /* Primary - Sage Green (Nature/Growth) */
  --color-primary: #8B9D77;
  --color-primary-light: #A8B89A;
  --color-primary-dark: #6B7D57;
  
  /* Secondary - Cream (Warmth/Comfort) */
  --color-secondary: #F5F2E8;
  --color-secondary-light: #FDFBF5;
  --color-secondary-dark: #E8E4D6;
  
  /* Accent - Terracotta (Earth/Clay) */
  --color-accent: #D4A574;
  --color-accent-light: #E6C299;
  --color-accent-dark: #B8935F;
  
  /* Neutral - Warm Grays */
  --color-neutral: #8A7F72;
  --color-neutral-light: #A69B8E;
  --color-neutral-dark: #6B6257;
  
  /* Semantic Colors */
  --color-success: #7A8471;
  --color-warning: #D4A574;
  --color-error: #A67F78;
  --color-info: #8B9D77;
}
```

#### Typography System

```css
/* styles/typography.css */
:root {
  /* Heading Font: Fredoka One for playful personality */
  --font-heading: 'Fredoka One', cursive;
  --font-heading-weight: 400;
  
  /* Body Font: Quicksand for readability */
  --font-body: 'Quicksand', sans-serif;
  --font-body-weight: 400;
  --font-body-weight-bold: 600;
  
  /* Font Sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
}
```

### 2.2 Component Architecture

#### Vue 3 Component Structure
```typescript
// components/CharacterHost.vue
<template>
  <div class="character-host" :class="character.type">
    <CharacterAvatar :character="character" :emotion="response.emotion" />
    <CharacterDialogue 
      :text="response.text" 
      :character="character.type"
      :emotion="response.emotion"
    />
  </div>
</template>

<script setup lang="ts">
import type { Character, AIResponse } from '../types';

const props = defineProps<{
  character: Character;
  response: AIResponse;
}>();
</script>
```

#### Character System Implementation
```typescript
// types/character.ts
export interface Character {
  type: 'mom' | 'dad' | 'thinking' | 'celebration';
  name: string;
  personality: string;
  aiProvider: 'minimax' | 'moonshot' | 'zai';
  emotions: string[];
}

export const CHARACTERS: Record<string, Character> = {
  mom: {
    type: 'mom',
    name: 'Mom',
    personality: 'warm, welcoming, supportive',
    aiProvider: 'minimax',
    emotions: ['warm', 'helpful', 'encouraging']
  },
  dad: {
    type: 'dad', 
    name: 'Dad',
    personality: 'sassy, irreverent, playful',
    aiProvider: 'moonshot',
    emotions: ['sassy', 'playful', 'witty']
  },
  thinking: {
    type: 'thinking',
    name: 'Thinking',
    personality: 'analytical, precise, curious',
    aiProvider: 'zai',
    emotions: ['analytical', 'curious', 'processing']
  }
};
```

---

## 3. AI Personality System

### 3.1 Multi-Provider AI Architecture

#### Character-AI Provider Mapping
```typescript
// config/ai-providers.ts
export const AI_PROVIDERS = {
  mom: {
    provider: 'minimax',
    model: 'MiniMax-M2.1',
    baseUrl: 'https://api.minimax.chat/v1',
    temperature: 0.7,
    systemPrompt: 'You are Mom: warm, welcoming, and supportive. Always family-friendly.'
  },
  dad: {
    provider: 'moonshot',
    model: 'kimi-k2',
    baseUrl: 'https://api.moonshot.ai/v1',
    temperature: 0.85,
    systemPrompt: 'You are Dad: playful, slightly sarcastic, but always family-friendly and loving.'
  },
  thinking: {
    provider: 'zai',
    model: 'glm-4.7',
    baseUrl: 'https://api.z.ai/api/paas/v4',
    temperature: 0.4,
    systemPrompt: 'You are Thinking: analytical and precise. Always respond in valid JSON format.'
  }
};
```

#### AI Router Implementation
```typescript
// services/ai-router.ts
export async function routeToAI(
  intent: 'roast' | 'game_logic' | 'general_chat',
  data: any,
  character: Character
): Promise<AIResponse> {
  
  const config = AI_PROVIDERS[character.type];
  
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getApiKey(config.provider)}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: config.systemPrompt },
        { role: 'user', content: buildPrompt(intent, data) }
      ],
      temperature: config.temperature,
      max_tokens: 200
    })
  });
  
  const result = await response.json();
  
  return {
    success: true,
    text: result.choices?.[0]?.message?.content,
    emotion: inferEmotion(intent, character.type),
    character: character.type,
    provider: config.provider
  };
}
```

---

## 4. Privacy & Security Implementation

### 4.1 Hidden Name Standard

#### Environment Variable Configuration
```bash
# .env.local
VITE_BABY_NAME=The Little One          # Development placeholder
VITE_COUPLE_NAMES=The Parents          # Development placeholder
VITE_BABY_NAME_REAL=                   # Production: Build-time injection
VITE_COUPLE_NAMES_REAL=               # Production: Build-time injection
```

#### Build-Time Name Injection
```typescript
// utils/name-provider.ts
export function getBabyName(): string {
  // Development: Use placeholder
  if (import.meta.env.DEV) {
    return 'The Little One';
  }
  
  // Production: Build-time injection
  return import.meta.env.VITE_BABY_NAME_REAL || 'The Little One';
}

export function getCoupleNames(): string {
  if (import.meta.env.DEV) {
    return 'The Parents';
  }
  
  return import.meta.env.VITE_COUPLE_NAMES_REAL || 'The Parents';
}
```

#### HTML Template Updates
```html
<!-- Replace hardcoded names with dynamic placeholders -->
<h2 class="couple-names">{{ coupleNames }}'s</h2>
<h3 class="event-title">{{ babyName }}'s Shower</h3>
<img src="/images/couple-photo.jpg" alt="{{ coupleNames }}" class="couple-photo">
```

### 4.2 Firewall Pattern Implementation

#### Multi-Schema Database Design
```sql
-- Create internal schema for sensitive data
CREATE SCHEMA internal;

-- Public tables: Insert-only access
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  activity_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Internal tables: Service role only
CREATE TABLE internal.metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insert_only" ON public.submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "no_select" ON public.submissions FOR SELECT USING (false);
```

---

## 5. Animation & Motion System

### 5.1 VueUse Motion Integration

```typescript
// composables/useMotion.ts
import { useMotion } from '@vueuse/motion';

export function useCharacterMotion(character: Character, emotion: string) {
  const motionInstance = useMotion();
  
  const motionVariants = {
    initial: { scale: 0.8, opacity: 0 },
    enter: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 20
      }
    },
    bounce: {
      y: [0, -10, 0],
      transition: {
        duration: 600,
        ease: 'easeInOut'
      }
    }
  };
  
  return motionVariants;
}
```

### 5.2 Character-Specific Animations

```css
/* animations/character-motion.css */

/* Mom: Gentle, nurturing movements */
.character-mom {
  animation: gentle-sway 4s ease-in-out infinite;
}

@keyframes gentle-sway {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-2px) rotate(1deg); }
}

/* Dad: Playful, confident movements */
.character-dad {
  animation: confident-bounce 3s ease-in-out infinite;
}

@keyframes confident-bounce {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-4px) scale(1.02); }
}

/* Thinking: Curious, processing movements */
.character-thinking {
  animation: curious-tilt 2s ease-in-out infinite;
}

@keyframes curious-tilt {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-2deg); }
  75% { transform: rotate(2deg); }
}
```

---

## 6. Testing Strategy

### 6.1 Character Personality Testing
```typescript
// tests/character-personality.test.ts
describe('Character AI Personality', () => {
  it('Mom should respond with warmth and support', async () => {
    const response = await routeToAI('general_chat', { message: 'Hello' }, CHARACTERS.mom);
    expect(response.emotion).toBe('warm');
    expect(response.character).toBe('mom');
    expect(response.text).toMatch(/welcome|hello|hi/i);
  });
  
  it('Dad should respond with humor and sass', async () => {
    const response = await routeToAI('roast', { prediction: '4.5kg' }, CHARACTERS.dad);
    expect(response.emotion).toBe('sassy');
    expect(response.character).toBe('dad');
    expect(response.text.length).toBeLessThan(150); // Keep it short and punchy
  });
  
  it('Thinking should provide structured JSON', async () => {
    const response = await routeToAI('game_logic', { score: 85 }, CHARACTERS.thinking);
    expect(response.emotion).toBe('analytical');
    expect(response.character).toBe('thinking');
    expect(() => JSON.parse(response.text)).not.toThrow();
  });
});
```

### 6.2 Privacy Testing
```typescript
// tests/privacy.test.ts
describe('Hidden Name Privacy', () => {
  it('should never expose real baby name in source', async () => {
    const sourceCode = await fs.readFile('dist/index.html', 'utf-8');
    const babyName = getBabyName();
    expect(sourceCode).not.toContain(babyName);
    expect(sourceCode).toContain('{{ babyName }}');
  });
  
  it('should use environment variables for names', () => {
    expect(process.env.VITE_BABY_NAME_REAL).toBeDefined();
    expect(process.env.VITE_COUPLE_NAMES_REAL).toBeDefined();
  });
});
```

---

## 7. Implementation Timeline

### Phase 1: Foundation (Weeks 1-2)
- [ ] Vue 3 + Vite setup with TypeScript
- [ ] Character component architecture
- [ ] Basic motion system with @vueuse/motion
- [ ] Pinia state management setup

### Phase 2: AI Integration (Weeks 3-4)
- [ ] AI router implementation
- [ ] Multi-provider integration
- [ ] Character personality testing
- [ ] Response contract implementation

### Phase 3: Privacy & Security (Weeks 5-6)
- [ ] Hidden name build-time injection
- [ ] Multi-schema database design
- [ ] RLS policies implementation
- [ ] Privacy testing suite

### Phase 4: Polish & Launch (Weeks 7-8)
- [ ] Animation refinement
- [ ] Cross-browser testing
- [ ] Performance optimization
- [ ] Documentation finalization

---

**Document Owner:** Design Team  
**Last Updated:** January 3, 2026  
**Next Review:** February 3, 2026

**Changelog:**
- v2.0: Aligned with AGENTS.md vision, fixed hardcoded names, updated to Vue 3 architecture
- v1.0: Initial design proposals with vanilla JS approach