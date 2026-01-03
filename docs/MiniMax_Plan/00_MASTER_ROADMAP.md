# 00. Master Roadmap: The "Digital Living Room"

**Status:** CONFIRMED
**Date:** 2026-01-03
**Vision:** Creating a "Soulful" Baby Shower platform that balances System (Reliability) with Soul (Warmth).

---

## 1. Core Philosophy: System vs. Soul
We are building a "Living" application, not just a form.

*   **The Soul (Frontend):**
    *   **Technology:** Vue 3 + Vite.
    *   **Goal:** Cinematic, animated, reactive. "Ghibli-meets-Stardew Valley" aesthetic.
    *   **Why:** Vue offers the best balance of performance and ease of use for complex animations (via `<Transition>` and `@vueuse/motion`).
*   **The System (Backend):**
    *   **Technology:** Supabase (PostgreSQL + Edge Functions).
    *   **Goal:** Secure, Realtime, "Firewalled" data.
*   **The Brain (AI):**
    *   **Technology:** Multi-Provider Router (MiniMax, Moonshot, Z.AI).
    *   **Goal:** Personality-driven interactions (Sassy, Helpful, Agentic).

---

## 2. Implementation Phases (The "Strangler Fig")

### Phase 1: The New Foundation
*   Initialize `baby-shower-v2` (Vue 3).
*   Implement the "Cozy Barnyard" Visual Design System.
*   Setup Supabase Connection & State Management (Pinia).
*   **Deliverable:** A beautiful, animated Landing Page using the new assets.

### Phase 2: The Intelligent Backend
*   Deploy Supabase Edge Functions for the **AI Router**.
*   Implement the "Personality Switchboard" (Routing tasks to specific AI models).
*   **Deliverable:** Functional Chat/Guestbook with personality-driven AI responses.

### Phase 3: Privacy & Security
*   Implement Environment Variable masking for the Baby's Name.
*   Ensure `internal` vs `public` schema separation in Supabase.

### Phase 4: Interactive Games (TBD)
*   *Pending detailed design discussion.*
*   Focus: Agentic games powered by Z.AI and Realtime events.

---

## 3. Privacy Standard: "The Hidden Name"
*   **Development:** The name is NEVER hardcoded. It is represented by `VITE_BABY_NAME` in `.env`, defaulting to "The Little One".
*   **Production:** The real name is injected only at build time via secure environment variables.
