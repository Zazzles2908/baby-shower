# Current System Architecture

**Document Version:** 1.0  
**Date:** 2026-01-02  
**Project:** Baby Shower App Redesign

---

## System Overview

### 1.1 Current Architecture

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        Browser["Web Browser"]
        Mobile["Mobile Device"]
    end

    subgraph Vercel["Vercel Platform"]
        Edge["Edge Network"]
        Static["Static Assets"]
    end

    subgraph Supabase["Supabase Backend"]
        EdgeFunctions["Edge Functions"]
        Database["PostgreSQL Database"]
        Realtime["Realtime Subscriptions"]
        Storage["Storage Buckets"]
    end

    subgraph AI["AI Services"]
        MiniMax["MiniMax API"]
    end

    Browser --> Edge
    Mobile --> Edge
    Edge --> Static
    Static --> Browser
    Edge --> EdgeFunctions
    EdgeFunctions --> Database
    EdgeFunctions --> Realtime
    EdgeFunctions --> Storage
    EdgeFunctions --> MiniMax
    Realtime --> Browser
```

### 1.2 Component Inventory

| Component | Technology | Status |
|-----------|------------|--------|
| Frontend | Vanilla HTML/JS/CSS | Production |
| Hosting | Vercel | Active |
| Database | PostgreSQL 17.6.1 | Active |
| Edge Functions | Deno Runtime | Active |
| Realtime | Supabase Realtime | Active |
| AI | MiniMax API | Active |

---

## References

- [`docs/architecture/`](docs/architecture/) - Architecture documentation
- [`docs/research/`](docs/research/) - Research findings

---

**Document Maintainer:** Infrastructure Analysis System  
**Last Updated:** 2026-01-02
