# 01. UI Visual Design: "The Cozy Digital Barnyard"

**Status:** CONFIRMED
**Theme:** Ghibli-meets-Stardew Valley
**Key Emotion:** Warm, Wholesome, Nostalgic, Alive.

---

## 1. Visual Language

### The Aesthetic
We are moving away from standard "Flat Web" design to a **"Game UI" / "Storybook" aesthetic**.
*   **Backgrounds:** Painterly, lush, animated (Parallax).
*   **Characters:** Chibi style, expressive, reacting to user input.
*   **Motion:** Everything breathes. Leaves sway, clouds drift, buttons bounce.

### Color Palette
Extracted from `app_hero_anime.png` and Chibi assets.

| Color Name | Hex Code | Usage |
| :--- | :--- | :--- |
| **Meadow Green** | `#4caf50` | Primary buttons, success states, lush accents. |
| **Azure Sky** | `#2196f3` | Secondary accents, links, info states. |
| **Cream Paper** | `#fff9e6` | Main content backgrounds (cards, text areas). Warm replacement for white. |
| **Chibi Pink** | `#ffc1e3` | Hearts, blushes, "Love" reactions, highlighting the "Mom" agent. |
| **Earth Brown** | `#795548` | Text, borders, "Wood" UI elements. |

### Typography
*   **Headings:** *Quicksand* or *Fredoka One* (Rounded, friendly, soft).
*   **Body:** *Nunito* (highly readable but with rounded terminals).

---

## 2. Asset Mapping Strategy

We will explicitly map the provided PNG assets to dynamic Vue components.

### The "Living" Background
*   **Assets:** `asset_anime_scene.png` (Back), `app_hero_anime.png` (Mid).
*   **Behavior:** Parallax scrolling. As the user scrolls down, the background moves slower than the foreground.
*   **Motion:** Gentle sway effect on the "Mid" layer using `@vueuse/motion`.

### The "Agents" (Avatars)
The interface is not a static form; it is a conversation hosted by characters.

| Role | Asset | Trigger / Context |
| :--- | :--- | :--- |
| **The Host (Mom)** | `asset_chibi_avatar_f.png` | Welcoming users, "Supportive" AI responses, Instructions. |
| **The Comic Relief (Dad)** | `asset_chibi_avatar_m.png` | "Roast" AI responses (Moonshot), technical errors, "Dad Jokes". |
| **The Brain (Thinking)** | `asset_chibi_think.png` | **Loading State.** Bobs up and down while the AI is generating a response. |
| **Celebration** | `asset_chibi_win.png` | **Success State.** Slides in (Toast) when a vote is cast or a game is won. |

### The "Love" System (Particles)
*   **Asset:** `asset_chibi_heart.png`
*   **Behavior:** When a user likes a message or submits a wish, these hearts spawn and float upwards, fading out.

---

## 3. UI Component Directives

*   **Buttons:** Should look like "Wood" or "Candy" (slightly 3D, rounded corners).
*   **Cards:** translucent Cream Paper (`#fff9e6`) with a blur backdrop (`backdrop-filter: blur(10px)`).
*   **Transitions:** All UI elements (modals, chats) must enter with a `spring` physics transition, not a linear fade.
