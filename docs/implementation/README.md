# Implementation Guides

**Document Version:** 1.0  
**Date:** 2026-01-02  
**Project:** Baby Shower App Redesign

---

## 1. Setup Instructions

### 1.1 Environment Variables

Create a `.env` file with the following variables:

```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Providers (Verified)
MINIMAX_API_KEY=your_minimax_api_key
MOONSHOT_API_KEY=your_moonshot_api_key
ZAI_API_KEY=your_zai_api_key

# External Services
GOOGLE_SHEETS_WEBHOOK_URL=your_webhook_url
```

### 1.2 Install Dependencies

```bash
npm install
```

---

## 2. Deployment Checklist

### 2.1 Pre-Deployment

- [ ] Verify all environment variables are set
- [ ] Test AI provider connections
- [ ] Run local tests
- [ ] Review error handling

### 2.2 Deployment Steps

```bash
# Deploy to Vercel
npx vercel --prod

# Deploy Supabase functions
cd supabase
supabase functions deploy
```

---

## 3. Testing Strategy

### 3.1 Unit Tests

```typescript
// tests/unit/ai-routing.test.ts

describe('AI Routing', () => {
  it('should route text generation to MiniMax', async () => {
    const request = { type: 'roast', data: {} };
    const provider = selectProvider(request.type);
    expect(provider).toBe('minimax');
  });

  it('should route code generation to Z.AI', async () => {
    const request = { type: 'code', data: {} };
    const provider = selectProvider(request.type);
    expect(provider).toBe('zai');
  });
});
```

### 3.2 Integration Tests

- Test AI provider connections
- Test fallback routing
- Test error handling

---

## 4. References

- [`docs/implementation/`](docs/implementation/) - Implementation guides
- [`docs/research/`](docs/research/) - Research findings
- [`docs/architecture/`](docs/architecture/) - Architecture documentation

---

**Document Maintainer:** Infrastructure Analysis System  
**Last Updated:** 2026-01-02
