# Architecture Diagrams and System Design

**Document Version:** 1.0  
**Date:** 2026-01-02  
**Project:** Baby Shower App Redesign  
**Status:** Research Complete

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        Browser["Web Browser"]
        Mobile["Mobile Device"]
        Tablet["Tablet"]
    end

    subgraph Vercel["Vercel Platform"]
        Edge["Edge Network"]
        Static["Static Assets CDN"]
        Serverless["Serverless Functions"]
        Analytics["Vercel Analytics"]
    end

    subgraph Supabase["Supabase Backend"]
        EdgeFunctions["Edge Functions"]
        Database["PostgreSQL 17.6"]
        Realtime["Realtime Engine"]
        Storage["Storage Buckets"]
        Auth["Authentication"]
        Triggers["Database Triggers"]
    end

    subgraph AI["AI Services"]
        MiniMax["MiniMax API"]
        OpenAI["OpenAI (Backup)"]
    end

    subgraph External["External Services"]
        GoogleSheets["Google Sheets"]
        Email["Email Service"]
    end

    %% Client connections
    Browser --> Edge
    Mobile --> Edge
    Tablet --> Edge

    %% Vercel connections
    Edge --> Static
    Edge --> Serverless

    %% Serverless to Backend
    Serverless --> EdgeFunctions

    %% Edge Functions connections
    EdgeFunctions --> Database
    EdgeFunctions --> Realtime
    EdgeFunctions --> Storage
    EdgeFunctions --> Auth
    EdgeFunctions --> MiniMax
    EdgeFunctions --> Triggers

    %% Database triggers
    Triggers --> GoogleSheets
    Triggers --> Email

    %% Realtime back to clients
    Realtime --> Browser
    Realtime --> Mobile
    Realtime --> Tablet

    %% Analytics
    Edge --> Analytics

    classDef client fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef platform fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef backend fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    classDef ai fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef external fill:#fce4ec,stroke:#c2185b,stroke-width:2px

    class Browser,Mobile,Tablet client
    class Edge,Static,Serverless,Analytics platform
    class EdgeFunctions,Database,Realtime,Storage,Auth,Triggers backend
    class MiniMax,OpenAI ai
    class GoogleSheets,Email external
```

### 1.2 Component Diagram

```mermaid
flowchart LR
    subgraph Frontend["Frontend Application"]
        UI["UI Components"]
        State["State Management"]
        API["API Client"]
        Realtime["Realtime Client"]
        Offline["Offline Manager"]
    end

    subgraph Vercel["Vercel Layer"]
        Edge["Edge Network"]
        Middleware["Edge Middleware"]
        Functions["Serverless Functions"]
    end

    subgraph Supabase["Supabase Layer"]
        EF["Edge Functions"]
        DB["PostgreSQL"]
        RealtimeEngine["Realtime Engine"]
        StorageEngine["Storage Engine"]
        AuthEngine["Auth Engine"]
        Webhooks["Webhooks"]
    end

    subgraph Storage["Data Storage"]
        Submissions["submissions table"]
        Archive["event_archive table"]
        Milestones["milestones table"]
        Photos["Photo Storage"]
    end

    %% Frontend connections
    UI --> State
    State --> API
    State --> Realtime
    State --> Offline
    API --> Vercel
    Realtime --> Vercel

    %% Vercel connections
    Vercel --> Edge
    Edge --> Middleware
    Middleware --> Functions

    %% Supabase connections
    Functions --> EF
    EF --> DB
    EF --> RealtimeEngine
    EF --> StorageEngine
    EF --> AuthEngine
    EF --> Webhooks

    %% Storage connections
    DB --> Submissions
    DB --> Archive
    DB --> Milestones
    StorageEngine --> Photos

    classDef frontend fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef vercel fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef supabase fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    classDef storage fill:#fff8e1,stroke:#f57f17,stroke-width:2px

    class Frontend,UI,State,API,Realtime,Offline frontend
    class Edge,Middleware,Functions vercel
    class EF,DB,RealtimeEngine,StorageEngine,AuthEngine,Webhooks supabase
    class Submissions,Archive,Milestones,Photos storage
```

---

## 2. Data Flow Diagrams

### 2.1 Submission Data Flow

```mermaid
flowchart TD
    Start([User submits form])
    
    subgraph Validation["Client Validation"]
        V1[Check required fields]
        V2[Validate data types]
        V3[Format input]
    end
    
    subgraph Queue["Offline Queue"]
        Q1{Online?}
        Q2[Add to queue]
        Q3[Process queue]
    end
    
    subgraph API["API Layer"]
        A1[Send to Edge Function]
        A2[Verify JWT]
        A3[Validate request]
    end
    
    subgraph Business["Business Logic"]
        B1{AI needed?}
        B2[Generate AI content]
        B3[Apply formatting]
    end
    
    subgraph Database["Database"]
        D1[Insert to submissions]
        D2[Trigger audit log]
        D3[Check milestones]
        D4[Notify realtime]
    end
    
    subgraph Response["Response"]
        R1[Return result]
        R2[Update UI]
        R3[Trigger celebration]
    end
    
    Start --> V1
    V1 --> V2
    V2 --> V3
    V3 --> Q1
    Q1 -->|No| Q2
    Q2 -->|Later| Q3
    Q1 -->|Yes| A1
    A1 --> A2
    A2 --> A3
    A3 --> B1
    B1 -->|Yes| B2
    B2 --> B3
    B1 -->|No| B3
    B3 --> D1
    D1 --> D2
    D2 --> D3
    D3 --> D4
    D4 --> R1
    R1 --> R2
    R2 --> R3
    Q3 --> A1

    classDef process fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef storage fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    classDef startend fill:#fce4ec,stroke:#c2185b,stroke-width:2px

    class V1,V2,V3,A1,A2,A3,B2,B3,D1,D2,D3,D4,R1,R2,R3 process
    class Q1,B1 decision
    class Submissions,Archive,Milestones storage
    class Start,R3 startend
```

### 2.2 Realtime Update Flow

```mermaid
flowchart TB
    subgraph Source["Data Source"]
        DB[("PostgreSQL Database")]
        Trigger[("Database Trigger")]
        Publish[("pg_notify")]
    end

    subgraph SupabaseRealtime["Supabase Realtime"]
        Channel["Realtime Channel"]
        Broadcast["Broadcast Engine"]
        Presence["Presence System"]
        PostgresChange["Postgres Changes"]
    end

    subgraph Server["Server Side"]
        WebSocket["WebSocket Server"]
        Subscription["Subscription Manager"]
    end

    subgraph Client["Client Side"]
        Browser1[("Browser A")]
        Browser2[("Browser B")]
        Browser3[("Browser C")]
        Handler1["Update Handler"]
        Handler2["Update Handler"]
        Handler3["Update Handler"]
    end

    %% Data flow
    DB --> Trigger
    Trigger --> Publish
    Publish --> Channel
    Channel --> Broadcast
    Channel --> PostgresChange
    PostgresChange --> Subscription
    Subscription --> WebSocket
    WebSocket --> Browser1
    WebSocket --> Browser2
    WebSocket --> Browser3
    Browser1 --> Handler1
    Browser2 --> Handler2
    Browser3 --> Handler3

    classDef database fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    classDef server fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef client fill:#e3f2fd,stroke:#1565c0,stroke-width:2px

    class DB,Trigger,Publish,Channel,Broadcast,Presence,PostgresChange database
    class WebSocket,Subscription server
    class Browser1,Browser2,Browser3,Handler1,Handler2,Handler3 client
```

### 2.3 AI Request Flow

```mermaid
flowchart TD
    subgraph Request["Request Initiation"]
        R1[User submits activity]
        R2[AI feature triggered]
    end

    subgraph Cache["Cache Layer"]
        C1{Cached?}
        C2[Return cached]
        C3[Store response]
    end

    subgraph RateLimit["Rate Limiting"]
        RL1{Within limit?}
        RL2[Process request]
        RL3[Use fallback]
    end

    subgraph AIRequest["AI Processing"]
        AI1[Build prompt]
        AI2[Call API]
        AI3[Parse response]
        AI4{Cacheable?}
    end

    subgraph Fallback["Fallback System"]
        F1[Pre-written messages]
        F2[Random selection]
        F3[Return fallback]
    end

    subgraph Response["Response Processing"]
        RP1[Validate response]
        RP2[Store in DB]
        RP3[Return to user]
    end

    %% Flow connections
    R1 --> R2
    R2 --> C1
    C1 -->|Yes| C2
    C1 -->|No| RL1
    RL1 -->|No| F1
    RL1 -->|Yes| AI1
    AI1 --> AI2
    AI2 --> AI3
    AI3 --> RP1
    RP1 -->|Valid| AI4
    RP1 -->|Invalid| F1
    AI4 -->|Yes| C3
    AI4 -->|No| RP2
    C3 --> RP2
    RP2 --> RP3
    F1 --> F2
    F2 --> F3
    F3 --> RP3

    classDef process fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef cache fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    classDef fallback fill:#fce4ec,stroke:#c2185b,stroke-width:2px

    class R1,R2,AI1,AI2,AI3,RP1,RP2,RP3 process
    class C1,RL1,AI4 decision
    class C2,C3 cache
    class F1,F2,F3 fallback
```

---

## 3. Database Schema Diagrams

### 3.1 Current Schema Architecture

```mermaid
erDiagram
    submissions ||--|| event_archive : "replicates to"
    
    submissions {
        bigint id PK
        timestamptz created_at
        text name
        text activity_type
        jsonb activity_data
    }
    
    event_archive {
        bigint id PK
        timestamptz created_at
        text guest_name
        text activity_type
        jsonb raw_data
        jsonb processed_data
        inet source_ip
        text user_agent
        int processing_time_ms
    }
    
    baby_shower.submissions {
        bigint id PK
        timestamptz created_at
        text name
        text activity_type
        jsonb activity_data
        text message
        text advice_type
        date date_guess
        time time_guess
        numeric weight_guess
        integer length_guess
        text puzzle1
        text puzzle2
        text puzzle3
        text puzzle4
        text puzzle5
        integer score
        text selected_names
        text photo_url
        text relationship
    }
```

### 3.2 Proposed Multi-Table Schema

```mermaid
erDiagram
    guestbook ||--o{ milestones : "triggers"
    votes ||--o{ milestones : "triggers"
    pool_predictions ||--o{ milestones : "triggers"
    quiz_results ||--o{ milestones : "triggers"
    advice ||--o{ milestones : "triggers"
    
    baby_shower.guestbook {
        bigint id PK
        timestamptz created_at
        text name
        text message
        text relationship
        text photo_url
        boolean is_milestone
        text milestone_type
        jsonb metadata
    }
    
    baby_shower.votes {
        bigint id PK
        timestamptz created_at
        text voter_name
        text[] names
        jsonb metadata
    }
    
    baby_shower.pool_predictions {
        bigint id PK
        timestamptz created_at
        text guest_name
        text prediction
        date due_date
        numeric weight_kg
        integer length_cm
        text roast
        timestamptz roast_generated_at
        jsonb metadata
    }
    
    baby_shower.quiz_results {
        bigint id PK
        timestamptz created_at
        text participant_name
        jsonb answers
        integer score
        integer total_questions
        numeric percentage
        integer time_taken_seconds
        jsonb metadata
    }
    
    baby_shower.advice {
        bigint id PK
        timestamptz created_at
        text advisor_name
        text advice_text
        text category
        boolean is_sealed
        timestamptz sealed_until
        boolean is_approved
        boolean ai_generated
        jsonb ai_enhancements
        jsonb metadata
    }
    
    baby_shower.milestones {
        bigint id PK
        timestamptz created_at
        text milestone_type
        integer threshold
        timestamptz reached_at
        boolean celebration_triggered
        jsonb celebration_metadata
    }
    
    baby_shower.ai_roasts {
        bigint id PK
        timestamptz created_at
        text topic
        text roast_type
        text generated_advice
        text roast_level
        integer tokens_used
        text model
        jsonb metadata
    }
```

---

## 4. Sequence Diagrams

### 4.1 Guestbook Submission Sequence

```mermaid
sequenceDiagram
    participant User as User
    participant UI as Frontend UI
    participant API as API Client
    participant Edge as Edge Function
    participant DB as Database
    participant Trigger as Trigger
    participant Archive as Archive Table
    participant Realtime as Realtime Engine

    User->>UI: Fills guestbook form
    UI->>UI: Validate input
    UI->>API: submitGuestbook(data)
    
    API->>Edge: POST /functions/v1/guestbook
    
    Edge->>Edge: Verify JWT
    Edge->>Edge: Validate schema
    
    Edge->>DB: INSERT INTO submissions
    DB->>Trigger: AFTER INSERT trigger
    
    Trigger->>Archive: INSERT INTO event_archive
    Trigger->>Realtime: pg_notify('submission_events')
    
    Archive-->>Edge: Insert complete
    Realtime-->>Edge: Broadcast ready
    
    Edge-->>API: { success: true, data }
    API-->>UI: Response
    UI-->>User: Show confirmation
    
    Realtime->>UI: postgres_changes event
    UI->>UI: Update activity feed
```

### 4.2 AI Roast Generation Sequence

```mermaid
sequenceDiagram
    participant User as User
    participant Pool as Pool Form
    participant Edge as Edge Function
    participant Cache as Cache
    participant AI as MiniMax API
    participant Fallback as Fallback System
    participant DB as Database

    User->>Pool: Submit prediction
    Pool->>Edge: POST /functions/v1/pool
    
    Edge->>Cache: getCache(key)
    
    alt Cache Hit
        Cache-->>Edge: Cached roast
        Edge->>DB: Store with cached roast
    else Cache Miss
        Edge->>AI: POST /chatcompletion_v2
        
        alt AI Success
            AI-->>Edge: Generated roast
            Edge->>Cache: Store response
            Edge->>DB: Store with AI roast
        else AI Failed
            Edge->>Fallback: getFallback(prediction)
            Fallback-->>Edge: Pre-written message
            Edge->>DB: Store with fallback
        end
    end
    
    Edge-->>Pool: { success, prediction, roast }
    Pool-->>User: Show prediction + roast
```

### 4.3 Realtime Vote Update Sequence

```mermaid
sequenceDiagram
    participant User1 as User A
    participant User2 as User B
    participant UI1 as Browser A UI
    participant UI2 as Browser B UI
    participant Realtime as Supabase Realtime
    participant Edge as Vote Edge Function
    participant DB as Database

    User1->>UI1: Casts vote
    UI1->>Edge: POST /functions/v1/vote
    
    Edge->>DB: INSERT INTO votes
    DB-->>Edge: Vote inserted
    
    Edge-->>UI1: Vote confirmed
    
    Note over Realtime, DB: Database trigger fires
    
    DB->>Realtime: Broadcast INSERT event
    Realtime->>UI2: postgres_changes event
    
    UI2->>UI2: Update vote counts
    UI2-->>User2: Show new totals
```

---

## 5. Infrastructure Deployment Diagram

### 5.1 Current Deployment Architecture

```mermaid
flowchart TB
    subgraph Internet["Public Internet"]
        Users["Users"]
    end
    
    subgraph Vercel["Vercel Deployment"]
        Edge["Edge Network"]
        Static["Static Hosting"]
        Functions["Serverless Functions"]
        Analytics["Analytics"]
    end
    
    subgraph Supabase["Supabase Cloud"]
        FunctionsSupabase["Edge Functions"]
        Postgres["PostgreSQL 17.6"]
        Storage["Storage"]
        Realtime["Realtime"]
    end
    
    subgraph External["External Services"]
        MiniMax["MiniMax API"]
        Google["Google Sheets"]
    end
    
    Users --> Edge
    Edge --> Static
    Edge --> Functions
    Functions --> FunctionsSupabase
    FunctionsSupabase --> Postgres
    FunctionsSupabase --> Realtime
    FunctionsSupabase --> Storage
    FunctionsSupabase --> MiniMax
    FunctionsSupabase --> Google
    Edge --> Analytics
```

### 5.2 Proposed Deployment Architecture

```mermaid
flowchart TB
    subgraph CDN["Global CDN"]
        VercelEdge["Vercel Edge Network"]
        Cloudflare["Cloudflare (Optional)"]
    end
    
    subgraph Compute["Compute Layer"]
        VercelFunc["Vercel Functions"]
        SupabaseEF["Supabase Edge Functions"]
        EdgeMiddleware["Edge Middleware"]
    end
    
    subgraph Data["Data Layer"]
        Postgres["PostgreSQL 17.6"]
        Redis["Redis (Caching)"]
        S3Storage["S3-compatible Storage"]
    end
    
    subgraph AI["AI Layer"]
        MiniMax["MiniMax API"]
        OpenAIBackup["OpenAI (Backup)"]
        LocalCache["Local Cache"]
    end
    
    subgraph Monitoring["Monitoring"]
        VercelAnalytics["Vercel Analytics"]
        Sentry["Error Tracking"]
        CustomMetrics["Custom Metrics"]
    end
    
    subgraph Integration["Integrations"]
        GoogleSheets["Google Sheets"]
        Webhooks["Webhooks"]
    end
    
    %% Connections
    CDN --> VercelEdge
    VercelEdge --> EdgeMiddleware
    EdgeMiddleware --> VercelFunc
    VercelFunc --> SupabaseEF
    
    SupabaseEF --> Postgres
    SupabaseEF --> Redis
    SupabaseEF --> S3Storage
    SupabaseEF --> MiniMax
    SupabaseEF --> OpenAIBackup
    
    VercelFunc --> LocalCache
    
    SupabaseEF --> Webhooks
    Webhooks --> GoogleSheets
    
    VercelEdge --> VercelAnalytics
    VercelFunc --> Sentry
    SupabaseEF --> CustomMetrics
```

---

## 6. Security Architecture

### 6.1 Security Flow Diagram

```mermaid
flowchart TB
    subgraph Client["Client"]
        Browser["Browser"]
        AuthToken["Auth Token"]
    end
    
    subgraph Security["Security Layers"]
        HTTPS["HTTPS/TLS"]
        JWT["JWT Verification"]
        RLS["Row Level Security"]
        CORS["CORS Policies"]
        RateLimit["Rate Limiting"]
    end
    
    subgraph Backend["Backend"]
        EdgeFunc["Edge Function"]
        DB["Database"]
    end
    
    subgraph Data["Data Protection"]
        Encryption["Encryption at Rest"]
        Backup["Automated Backups"]
        Audit["Audit Logging"]
    end
    
    Browser --> HTTPS
    HTTPS --> JWT
    JWT --> RLS
    RLS --> CORS
    CORS --> RateLimit
    RateLimit --> EdgeFunc
    EdgeFunc --> DB
    DB --> Encryption
    Encryption --> Backup
    Backup --> Audit
```

### 6.2 Authentication Flow

```mermaid
flowchart TD
    subgraph Auth["Authentication Flow"]
        Start[("Start")]
        
        subgraph Token["Token Management"]
            T1[Generate JWT]
            T2[Sign with service role]
            T3[Include user claims]
            T4[Set expiration]
        end
        
        subgraph Verification["Token Verification"]
            V1[Extract token from header]
            V2[Verify signature]
            V3[Check expiration]
            V4[Validate claims]
        end
        
        subgraph RLS["Row Level Security"]
            R1{Authenticated?}
            R2{Service role?}
            R3[Allow read]
            R4[Allow insert]
            R5[Allow all]
        end
        
        subgraph Response["Response"]
            Success[("Success 200")]
            Fail401[("Fail 401")]
            Fail403[("Fail 403")]
        end
        
        Start --> T1
        T1 --> T2
        T2 --> T3
        T3 --> T4
        T4 --> V1
        V1 --> V2
        V2 --> V3
        V3 --> V4
        V4 --> R1
        R1 -->|No| Fail401
        R1 -->|Yes| R2
        R2 -->|No| R3
        R2 -->|Yes| R5
        R3 --> R4
        R4 --> Success
        R5 --> Success
    end
```

---

## 7. Monitoring and Observability

### 7.1 Monitoring Architecture

```mermaid
flowchart TB
    subgraph Collect["Collection"]
        Logs["Application Logs"]
        Metrics["Metrics"]
        Traces["Traces"]
    end
    
    subgraph Process["Processing"]
        Aggregator["Log Aggregator"]
        MetricsProcessor["Metrics Processor"]
        TraceProcessor["Trace Processor"]
    end
    
    subgraph StorageStore["Storage"]
        Loki["Loki (Logs)"]
        Prometheus["Prometheus (Metrics)"]
        Tempo["Tempo (Traces)"]
    end
    
    subgraph Visualize["Visualization"]
        Grafana["Grafana Dashboards"]
        Alerts["AlertManager"]
    end
    
    subgraph Notify["Notification"]
        Email["Email"]
        Slack["Slack"]
        PagerDuty["PagerDuty"]
    end
    
    Logs --> Aggregator
    Metrics --> MetricsProcessor
    Traces --> TraceProcessor
    
    Aggregator --> Loki
    MetricsProcessor --> Prometheus
    TraceProcessor --> Tempo
    
    Loki --> Grafana
    Prometheus --> Grafana
    Tempo --> Grafana
    
    Grafana --> Alerts
    Alerts --> Email
    Alerts --> Slack
    Alerts --> PagerDuty
```

### 7.2 Key Metrics to Monitor

```mermaid
flowchart LR
    subgraph Business["Business Metrics"]
        B1[Submissions/hour]
        B2[Unique visitors]
        B3[Activity breakdown]
        B4[Conversion rates]
    end
    
    subgraph Performance["Performance Metrics"]
        P1[Response time p95]
        P2[Response time p99]
        P3[Error rate]
        P4[Availability]
    end
    
    subgraph Infrastructure["Infrastructure Metrics"]
        I1[CPU utilization]
        I2[Memory usage]
        I3[Network I/O]
        I4[Storage I/O]
    end
    
    subgraph AI["AI Metrics"]
        A1[API latency]
        A2[Token usage]
        A3[Fallback rate]
        A4[Cost/hour]
    end
    
    B1 --> Business
    B2 --> Business
    B3 --> Business
    B4 --> Business
    P1 --> Performance
    P2 --> Performance
    P3 --> Performance
    P4 --> Performance
    I1 --> Infrastructure
    I2 --> Infrastructure
    I3 --> Infrastructure
    I4 --> Infrastructure
    A1 --> AI
    A2 --> AI
    A3 --> AI
    A4 --> AI
```

---

## 8. Error Handling Architecture

### 8.1 Error Flow Diagram

```mermaid
flowchart TD
    subgraph Error["Error Occurs"]
        E1[Error thrown]
    end
    
    subgraph Detection["Detection"]
        D1{Catch in code?}
        D2[Global error handler]
        D3[Promise rejection]
    end
    
    subgraph Classification["Classification"]
        C1[Network Error]
        C2[Validation Error]
        C3[Auth Error]
        C4[Database Error]
        C5[AI Error]
        C6[Unknown Error]
    end
    
    subgraph Handling["Handling"]
        H1[Retry logic]
        H2[User message]
        H3[Fallback content]
        H4[Error reporting]
        H5[Recovery action]
    end
    
    subgraph Response["Response"]
        R1[Show to user]
        R2[Log to console]
        R3[Send to Sentry]
        R4[Retry request]
    end
    
    E1 --> D1
    D1 -->|Yes| D2
    D1 -->|No| D3
    D2 --> C1
    D3 --> C1
    C1 --> H1
    C2 --> H2
    C3 --> H4
    C4 --> H4
    C5 --> H3
    C6 --> H4
    H1 --> R4
    H2 --> R1
    H3 --> R1
    H4 --> R2
    H4 --> R3
    H5 --> R4
    R1 --> R2
```

---

## 9. References

### 9.1 Diagram Sources

- [Mermaid Documentation](https://mermaid.js.org/)
- [C4 Model](https://c4model.com/)
- [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/)

### 9.2 Related Documentation

- [`docs/RESEARCH_SUPABASE.md`](docs/RESEARCH_SUPABASE.md) - Supabase capabilities
- [`docs/RESEARCH_VERCEL.md`](docs/RESEARCH_VERCEL.md) - Vercel capabilities
- [`docs/RESEARCH_AI.md`](docs/RESEARCH_AI.md) - AI integration
- [`docs/INTEGRATION_PATTERNS.md`](docs/INTEGRATION_PATTERNS.md) - Integration patterns
- [`docs/DESIGN_PROPOSALS.md`](docs/DESIGN_PROPOSALS.md) - Design proposals

### 9.3 External Resources

- [Supabase Architecture](https://supabase.com/docs/guides/api#architecture)
- [Vercel Platform](https://vercel.com/docs/concepts/architecture)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/triggers.html)

---

**Document Maintainer:** Infrastructure Analysis System  
**Last Updated:** 2026-01-02  
**Next Review:** 2026-02-02
