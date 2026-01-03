# Master Development Plan: The "Digital Living Room"

**Date:** 2026-01-02
**Target:** Jazeel & Michelle's Baby Shower App
**Vision:** A "Ferrari Engine" (System) wrapped in a "Warm Embrace" (Soul).

---

## 🏗️ Strategic Overview

This plan bridges the gap between the current "functional prototype" and the "legacy-building experience" required by Jazeel and Michelle. It assigns specific roles to your AI agents (GLM, Minimax) under the orchestration of Kilo/Kimi.

### The "Dual Core" Philosophy
1.  **The Jazeel Core (System):** Robust, fast, transparent, realtime.
2.  **The Michelle Core (Soul):** Warm, symbolic, legacy-focused, culturally inclusive.

---

## 🗓️ Phase 1: The "Warmth" Upgrade (UI/UX) ✅ COMPLETE
**Primary Agent:** GLM-4.7 (UI Experience Architect)
**Goal:** Transform "Forms" into "moments of connection."

### 1.1 Design System & Palette (The "Yin-Yin" Theme)
*   **Action:** Implement a soft, nature-inspired color palette.
    *   *Primary:* Sage Green (Nature/Growth).
    *   *Secondary:* Soft Gold/Moonlight (Representing "Yin-Yin").
    *   *Background:* Warm Cream (Not harsh white).
*   **Typography:** Switch to rounded, approachable fonts (e.g., Nunito or Quicksand) to reduce "corporate" feel.

### 1.2 Landing Page Redesign
*   **Context:** Currently text-heavy. Needs to say "Welcome" visually.
*   **Implementation:**
    *   Hero Section: Placeholder for a photo of Jazeel & Michelle.
    *   "Welcome Text": Use a script font for "Welcome to Baby Maya's Shower".
    *   Activity Grid: Replace list links with "Action Cards" using icons (e.g., a 💌 icon for Guestbook, 🧸 for Pool).

### 1.3 The "Advice Capsule" Experience (Priority for Michelle)
*   **Context:** This is the legacy feature.
*   **Implementation:**
    *   Make the text area look like a piece of stationery/letter.
    *   Add a visual toggle for "Open Now" vs "Open on 18th Birthday" (Visual metaphor: Envelope vs Time Capsule).

---

## ⚡ Phase 2: The "Pulse" Upgrade (Realtime & Interaction) ⚠️ PARTIAL (30%)
**Primary Agent:** Minimax (Coder)
**Goal:** Satisfy Jazeel's need for "System Aliveness."

### 2.1 Supabase Realtime Integration
*   **Target:** `voting` activity.
*   **Logic:**
    *   Frontend subscribes to `postgres_changes` on `public.submissions`.
    *   When a new vote comes in, the bar chart animates automatically.
*   **Jazeel's Win:** He sees the system working in real-time. "It's alive."

### 2.2 Live "Ticker" (Optional)
*   **Concept:** A subtle ticker at the bottom: *"Auntie May just guessed 3.5kg!"*
*   **Why:** Creates a sense of shared activity in the room.

---

## 🪄 Phase 3: The "Magic" Upgrade (AI Integration) ⚠️ PARTIAL (15%)
**Primary Agent:** Minimax (Backend) + GLM (Frontend Display)
**Goal:** Surprise and Delight (Gamification).
> **⚠️ Note:** AI integration is limited to roasts and clever comments only. No "Baby's Voice" simulation per user request.

### 3.1 "Baby's Voice" Auto-Reply (Guestbook)
> **[REMOVED]** User explicitly requested NO AI voice simulation. This feature has been removed.

### 3.2 "Roast My Prediction" (Baby Pool)
*   **Logic:**
    *   Update `pool` Edge Function.
    *   Compare guess to averages. Call LLM for a witty comment.
*   **UI:** Display comment immediately after submission.

### 3.3 The "Milestone" Unlock
*   **Logic:**
    *   Frontend tracks total submission count (via Realtime or periodic fetch).
    *   At 50 submissions: Trigger full-screen confetti.
    *   Show message: "We hit 50 Wishes! Cake time!" (or similar).

---

## 📚 Phase 4: The "Legacy" Upgrade (Data Preservation) ⚠️ PARTIAL (50%)
**Primary Agent:** Kilo (Orchestrator) / Minimax (Scripts)
**Goal:** Ensure the data is readable forever (Michelle's need).

### 4.1 Google Sheets "Book Format"
*   **Action:** Update the Google Apps Script.
*   **Change:** Ensure "Advice" and "Guestbook" entries are formatted with text wrapping and wider columns.
*   **Why:** Michelle will likely print this or read it later. It shouldn't look like a raw database dump.

### 4.2 "The Digital Book" (Post-Event View)
*   **Concept:** A hidden `/admin/book` route.
*   **Implementation:** A simple page that fetches all `guestbook` and `advice` entries and renders them like a blog/book layout.
*   **Why:** Easier to read than a spreadsheet.

---

## 🛠️ Technical Execution Order (Updated)

1.  **Step 0 (Urgent - Pre-Event):** Sync Git repositories, commit uncommitted changes, deploy to Vercel
2.  **Step 1 (Event Day):** Monitor and support live event using current production-ready build
3.  **Step 2 (Phase 2 - Realtime):** Implement Supabase realtime subscriptions (vote updates, activity feed)
4.  **Step 3 (Phase 3 - AI Roasts):** Add LLM calls to Edge Functions for witty prediction roasts
5.  **Step 4 (Phase 3 - Celebration):** Build server-side milestone trigger for confetti at 50 submissions
6.  **Step 5 (Phase 4 - Legacy):** Create /admin/book route for post-event digital viewing

---

## 📝 Note for the Orchestrator (Kimi)

*   **Constraint:** Do not break the "Offline/Cold" reliability. Even if the AI fails, the submission **must** be saved. Wrap AI calls in `try/catch` blocks in the Edge Functions.
*   **Constraint:** Mobile responsiveness is non-negotiable. Most users are holding a phone in one hand and a plate of food in the other.

---

## 📊 Current Implementation Status (2026-01-02)

| Phase | Status | Completion | Notes |
|-------|--------|------------|-------|
| 1. UI/UX Warmth | ✅ Complete | 100% | Cozy Animal Nursery theme deployed |
| 2. Realtime Pulse | ⚠️ Partial | 30% | Configured, not subscribed |
| 3. AI Magic | ⚠️ Partial | 15% | Roasts & celebration pending |
| 4. Legacy | ⚠️ Partial | 50% | Sheets done, no book view |

### Completed Features ✅
- 5 core activities (Guestbook, Pool, Quiz, Advice, Voting)
- Supabase backend with Edge Functions
- Google Sheets webhook integration
- Mobile-first responsive UI with custom theme
- LocalStorage persistence
- Centralized name collection

### Pending Features ❌
- Supabase realtime subscriptions for live updates
- Live activity ticker
- AI-powered roasts (without "Baby's Voice")
- 50-submission milestone server trigger
- /admin/book digital legacy view
