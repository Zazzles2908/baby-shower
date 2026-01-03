# 02. Technical Architecture: The "System"

**⚠️ AI CONFIGURATIONS UPDATED - VERIFY BEFORE PRODUCTION**

**Status:** CONFIRMED (Updated with verified AI configs)
**Stack:** Vue 3 + Supabase + Multi-Agent AI

---

## 1. Frontend: Vue 3 Ecosystem
The "Soul" needs a robust engine.

*   **Core:** Vue 3 (Composition API) + Vite (Build Tool).
*   **State Management:** Pinia (Lightweight, intuitive store).
*   **Routing:** Vue Router (Standard).
*   **Animation:**
    *   `@vueuse/motion`: For physics-based spring animations and gestures.
    *   `lottie-web`: (Optional) If we need complex vector animations later.
*   **Styling:** Tailwind CSS (configured with the custom "Farm" palette).

---

## 2. Backend: Supabase "Firewall" Pattern
We segregate public interaction from internal data to ensure security.

### Schema Zones
1.  **`public` Schema**:
    *   `guestbook_entries`: Raw submissions from users.
    *   `votes`: Raw game interactions.
    *   *Permissions:* Insert-only for anonymous users.
2.  **`internal` Schema**:
    *   `event_archive`: Approved/Curated content.
    *   `user_metadata`: Sensitive user details.
    *   *Permissions:* No public access. Only accessible via Edge Functions.

### Realtime Strategy
*   **Channel:** `room_status`
*   **Events:**
    *   `new_vote`: Triggers UI chart update.
    *   `new_roast`: Triggers the "Dad" avatar appearance.

---

## 3. The AI "Personality" Router
We move beyond a single LLM to a specialized "Team".

**Location:** Supabase Edge Function (`/functions/ai-router`).

### The Routing Logic - UPDATED 2026-01-03
The Request Handler analyzes the `intent` and routes accordingly:

| Intent Type | Assigned Provider | Model | Base URL | Reason |
| :--- | :--- | :--- | :--- | :--- |
| **"Roast" / Humor** | **Moonshot AI** | `kimi-k2` | `https://api.moonshot.ai/v1` | High "Attitude", excellent at cultural nuance and sass. |
| **Game Logic / UI** | **Z.AI** | `glm-4-plus` | `https://api.z.ai/api/paas/v4` | "Agentic" capabilities, strong at structured JSON output. |
| **General Chat** | **MiniMax** | `MiniMax-M2.1` | `https://api.minimax.chat/v1` | Balanced latency/quality, reliable "Workhorse". |

### Data Flow
1.  User sends message -> Frontend.
2.  Frontend -> Supabase Edge Function.
3.  Edge Function decides `intent`.
4.  Edge Function calls specific Provider API.
5.  Edge Function returns: `{ "text": "...", "emotion": "happy", "avatar": "mom" }`.
6.  Frontend renders the specific Avatar based on `avatar` field.

---

## 4. Privacy Implementation
*   **File:** `.env`
*   **Key:** `VITE_BABY_NAME`
*   **Usage:**
    ```javascript
    // In Vue Components
    const babyName = import.meta.env.VITE_BABY_NAME || "The Little One";
    ```
*   **Restriction:** The string literal of the real name must **never** be committed to Git.
