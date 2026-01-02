# Baby Shower Application - Development Plan

## 📋 Executive Summary

**Project**: Baby Shower 2026 Interactive Web Application  
**Version**: 1.0.0  
**Target Deployment**: Vercel + Supabase  
**Event Date**: January 4th, 2026  
**Expected Users**: 50-100 concurrent guests

---

## 🎯 Application Overview

The Baby Shower 2026 application is an interactive web platform designed to engage guests through five distinct activities during the celebration. The application provides real-time updates, milestone celebrations, and a seamless user experience optimized for mobile and desktop devices.

### Core Features
1. **Guestbook** - Leave wishes and messages for the baby
2. **Baby Pool** - Guess birth date, time, weight, and length
3. **Baby Emoji Pictionary** - Interactive quiz game
4. **Advice Time Capsule** - Parenting advice and wishes for baby's 18th birthday
5. **Name Voting** - Vote for favorite baby names with heart reactions

---

## 🏗️ Architecture

### Technology Stack

```
Frontend:
├── HTML5 (semantic, accessible)
├── CSS3 (custom properties, animations, responsive)
└── JavaScript (ES6+, Supabase client, realtime subscriptions)

Backend:
├── Vercel Serverless Functions (api/guestbook, api/pool, etc.)
└── Supabase (PostgreSQL, Realtime, Storage)

Infrastructure:
├── Vercel (hosting, CDN, serverless functions)
└── Supabase (managed database with RLS policies)
```

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Browser                          │
├─────────────────────────────────────────────────────────────┤
│  index.html + styles/ + scripts/                             │
│  • SPA navigation between sections                           │
│  • Supabase realtime subscriptions                           │
│  • Local storage for personal progress                       │
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTP POST/GET
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   Vercel API Routes                          │
├─────────────────────────────────────────────────────────────┤
│  /api/guestbook  → Supabase REST API                        │
│  /api/pool       → Supabase REST API                        │
│  /api/quiz       → Supabase REST API                        │
│  /api/advice     → Supabase REST API                        │
│  /api/vote       → Supabase REST API                        │
└─────────────────┬───────────────────────────────────────────┘
                  │ REST API (Service Role)
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase Platform                          │
├─────────────────────────────────────────────────────────────┤
│  baby_shower schema                                          │
│  ├── submissions table (single table for all activities)    │
│  ├── Row Level Security policies                             │
│  ├── Indexed queries (activity_type, name, created_at)      │
│  └── Realtime publication                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
baby-shower/
├── index.html                    # Main SPA entry point
├── vercel.json                   # Vercel deployment config
├── .vercelignore                 # Build exclusions
├── .env.local                    # Environment variables (local)
├── .gitignore
├── README.md
│
├── styles/
│   ├── main.css                  # Core styles (443 lines)
│   └── animations.css            # CSS animations (464 lines)
│
├── api/
│   ├── index.js                  # API health check
│   ├── guestbook.js              # Guestbook submissions
│   ├── pool.js                   # Baby pool predictions
│   ├── quiz.js                   # Quiz answers
│   ├── advice.js                 # Advice submissions
│   └── vote.js                   # Name voting
│
├── scripts/
│   ├── config.js                 # Application configuration
│   ├── api.js                    # API client functions
│   ├── main.js                   # Main application logic
│   ├── supabase.js               # Supabase client wrapper
│   ├── guestbook.js              # Guestbook-specific logic
│   ├── pool.js                   # Pool-specific logic
│   ├── quiz.js                   # Quiz-specific logic
│   ├── advice.js                 # Advice-specific logic
│   ├── voting.js                 # Voting-specific logic
│   └── surprises.js              # Milestone celebrations
│
└── backend/
    ├── supabase-schema.sql       # Database schema (143 lines)
    └── supabase-integration.md   # Integration documentation
```

---

## 🗄️ Database Schema

### Single Table Design
The application uses a unified `baby_shower.submissions` table with a JSONB column for activity-specific data:

```sql
CREATE TABLE baby_shower.submissions (
    id BIGINT PRIMARY KEY,
    created_at TIMESTAMPTZ,
    name TEXT NOT NULL,
    activity_type TEXT NOT NULL,  -- 'guestbook', 'baby_pool', 'quiz', 'advice', 'voting'
    activity_data JSONB DEFAULT '{}'
);
```

### Activity Data Schemas

| Activity | Key Fields in activity_data |
|----------|---------------------------|
| guestbook | relationship, message, photo_url |
| baby_pool | date_guess, time_guess, weight_guess, length_guess |
| quiz | puzzle1-5, score |
| advice | advice_type, message |
| voting | names (array of selected names) |

### Indexes
- `idx_baby_shower_activity` - Query by activity type
- `idx_baby_shower_name` - Query by guest name
- `idx_baby_shower_created` - Sort by submission time

### RLS Policies
- `Allow anonymous reads` - SELECT for all authenticated users
- `Allow anonymous inserts` - INSERT for all authenticated users

---

## 🎨 UI/UX Design

### Color Palette
```css
:root {
    --color-primary: #8B4513;      /* Saddle Brown */
    --color-secondary: #D2691E;    /* Chocolate */
    --color-accent: #FFA500;       /* Orange */
    --color-cream: #FFF8DC;        /* Cornsilk */
    --color-beige: #F5F5DC;        /* Beige */
    --color-green: #556B2F;        /* Dark Olive Green */
    --color-text: #3E2723;         /* Dark Brown */
    --color-white: #FFFFFF;
    --color-success: #4CAF50;
    --color-error: #F44336;
}
```

### Theme: Warm, Rustic Farm
- Appropriate for outdoor farm venue (Myuna Farm, Doveton)
- Warm, inviting color scheme
- Playful animations and confetti effects

### Responsive Breakpoints
- Mobile: < 600px (single column layout)
- Tablet: 600px - 800px (2-column grid)
- Desktop: > 800px (multi-column layout)

---

## 🔒 Security Measures

### Supabase RLS
- All tables protected with Row Level Security
- Service role key used only in server-side API routes
- Anon key exposed to client for realtime subscriptions only

### CORS Configuration
```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

### Input Validation
- Server-side validation of all required fields
- Client-side maxlength constraints
- File type and size validation for photo uploads

---

## 🚀 Deployment Strategy

### Vercel Configuration
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
      ]
    }
  ]
}
```

### Environment Variables
Required in Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Build Process
1. Static files served directly from CDN
2. API routes deployed as serverless functions
3. Supabase client initialized in browser

---

## 🧪 Testing Strategy

### End-to-End Tests (Playwright)
1. **Navigation Tests** - Verify section transitions
2. **Form Submission Tests** - Test each activity form
3. **Validation Tests** - Verify required field enforcement
4. **Realtime Tests** - Test Supabase subscription updates
5. **Responsive Tests** - Test mobile and desktop layouts

### Manual Testing Checklist
- [ ] Guestbook form submits and shows success
- [ ] Baby pool accepts valid date/time/weight/length
- [ ] Quiz scores answers correctly
- [ ] Advice form submits with type selection
- [ ] Voting limits to 3 hearts per person
- [ ] Milestone modals appear at thresholds
- [ ] Confetti animation triggers on success
- [ ] Back buttons navigate correctly
- [ ] Loading overlay appears during submission
- [ ] Error messages display on failure

---

## 📊 Performance Requirements

### Load Time Targets
| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| API Response Time | < 500ms |

### Scalability
- Expected concurrent users: 50-100
- Database supports unlimited concurrent connections
- Vercel serverless scales automatically

### Caching Strategy
- No caching for dynamic API responses
- Static assets cached by CDN
- LocalStorage for personal progress only

---

## 🗓️ Implementation Timeline

### Phase 1: Foundation (Current State) ✅
- [x] Database schema design
- [x] API endpoint implementation
- [x] Frontend HTML structure
- [x] CSS styling and animations
- [x] JavaScript application logic

### Phase 2: Integration & Testing (Current)
- [ ] Docker Compose setup for local development
- [ ] Playwright E2E test suite
- [ ] Test execution and bug fixes
- [ ] Performance benchmarking

### Phase 3: Production Hardening
- [ ] Security audit
- [ ] Error handling improvements
- [ ] Fallback for Supabase unavailability
- [ ] Loading state optimization

### Phase 4: Deployment
- [ ] Vercel production deployment
- [ ] DNS configuration
- [ ] SSL certificate verification
- [ ] Final acceptance testing

---

## 🔧 Maintenance & Monitoring

### Supabase Dashboard
- Monitor query performance
- Track realtime subscription counts
- Review RLS policy effectiveness

### Vercel Analytics
- Track page views and API calls
- Monitor function execution time
- Set up error alerting

### Backup Strategy
- Supabase provides automatic daily backups
- Point-in-time recovery available
- Export schema documentation maintained

---

## 📝 Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-01 | Initial development plan |

---

## ✅ Definition of Done

- [ ] All 5 activities functional
- [ ] API endpoints return correct responses
- [ ] Database schema applied and verified
- [ ] Playwright tests pass (100% pass rate)
- [ ] Mobile responsive design verified
- [ ] Confetti and milestone animations working
- [ ] Supabase realtime subscriptions active
- [ ] Error handling graceful degradation
- [ ] Performance targets met
- [ ] Security review passed
- [ ] Production deployment successful
- [ ] Stakeholder acceptance complete
