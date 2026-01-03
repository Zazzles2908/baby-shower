# Proposed Architecture Options

**Document Version:** 1.0  
**Date:** 2026-01-02  
**Project:** Baby Shower App Redesign

---

## 1. Proposed Architecture Options

### 1.1 Option A: Enhanced Current Architecture

**Recommended for:** Single event, minimal changes needed

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        Browser["Web Browser"]
        Mobile["Mobile Device"]
    end

    subgraph Vercel["Vercel Platform"]
        Edge["Edge Network"]
        Serverless["Serverless Functions"]
        Static["Static Assets"]
    end

    subgraph Supabase["Supabase Backend"]
        EdgeFunctions["Edge Functions"]
        Database["PostgreSQL Database"]
        Realtime["Realtime Subscriptions"]
        Storage["Storage Buckets"]
    end

    subgraph AI["AI Services (Verified)"]
        MiniMax["MiniMax - Primary"]
        Moonshot["Moonshot - Fallback"]
        ZAI["Z.AI - Coding"]
    end

    Browser --> Edge
    Mobile --> Edge
    Edge --> Static
    Edge --> Serverless
    Serverless --> EdgeFunctions
    EdgeFunctions --> Database
    EdgeFunctions --> Realtime
    EdgeFunctions --> Storage
    EdgeFunctions --> MiniMax
    Serverless --> Moonshot
    Serverless --> ZAI
    Realtime --> Browser
```

### 1.2 Option B: Full Redesign

**Recommended for:** Multiple events, advanced features

| Feature | Option A | Option B |
|---------|----------|----------|
| AI Routing | MiniMax only | Multi-provider |
| Caching | None | Redis/Edge cache |
| Analytics | Basic | Advanced |
| Admin Panel | None | Full dashboard |
| Cost | $0-10/mo | $25-50/mo |

---

## 2. AI Provider Routing (Verified)

| Task | Provider | Fallback |
|------|----------|----------|
| Text Generation | MiniMax | Moonshot |
| Complex Reasoning | Moonshot | MiniMax |
| Code Generation | Z.AI | Manual |
| Content Moderation | MiniMax | Rule-based |

---

## References

- [`docs/architecture/01-current-system.md`](docs/architecture/01-current-system.md) - Current system
- [`docs/architecture/03-data-flows.md`](docs/architecture/03-data-flows.md) - Data flows
- [`docs/research/03-ai-providers.md`](docs/research/03-ai-providers.md) - AI providers

---

**Document Maintainer:** Infrastructure Analysis System  
**Last Updated:** 2026-01-02
