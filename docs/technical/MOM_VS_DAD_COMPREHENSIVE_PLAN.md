# 🎮 Mom vs Dad Game - Comprehensive Analysis & Implementation Plan

## Executive Summary

The Mom vs Dad game has been analyzed by 3 specialized agents. The findings reveal **critical UI issues** preventing proper gameplay and a **complex admin/session system** that was never fully implemented. This document synthesizes all findings and provides a complete implementation roadmap using the **simplified lobby architecture**.

---

## 📊 Analysis Summary from 3 Agents

### ✅ Researcher Agent: Architecture Analysis
**Key Findings:**
1. **Background Image Overlay Bug** (Critical)
   - Location: `index.html:376-385`, `styles/main.css:3302-3318`
   - 4 corner decorations use `position: absolute` with `z-index: 0`
   - Fixed positioning causes scroll issues
   - Low opacity (0.15) but still visually distracting

2. **Missing Backend Infrastructure** (Critical)
   - Edge Functions (`game-session`, `game-scenario`, `game-vote`, `game-reveal`) exist but are NOT deployed
   - Database schema exists but backend integration incomplete
   - All API calls in `mom-vs-dad.js` will fail

3. **Complex Admin/Session System** (Design Flaw)
   - Requires 6-character session codes AND 4-digit admin PINs
   - No session persistence or validation
   - No error handling for invalid codes

### ✅ Code Generator Agent: Simplified Architecture
**Key Deliverables:**
1. **4 Pre-created Lobbies** - No session codes needed
2. **First Joiner = Admin** - Automatic admin assignment
3. **Max 6 Players** - AI fills empty slots
4. **Database Schema** - Complete with RLS policies
5. **5 Edge Functions** - Lobby management and game logic
6. **Real-time Sync** - Supabase subscriptions

### ✅ UI Builder Agent: Simplified UI Design
**Key Deliverables:**
1. **Lobby Selection Screen** - 4 clean cards, tap to join
2. **Waiting Room** - Player list, hidden admin controls
3. **Game Screen** - Michelle left, Jazeel right, no scrolling
4. **Results Screen** - Final scores, play again option
5. **CSS Architecture** - ~800 lines, mobile-first, accessible

---

## 🚨 Critical Issues (P0 - Must Fix)

### Issue #1: Background Image Overlays
**Problem:**
```css
.section-decoration {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    opacity: 0.15;
    z-index: 0;
}
```
**Solution:** Remove fixed positioning, reduce opacity to 0.05, use `overflow: hidden` on game sections.

### Issue #2: Missing Backend Functions
**Problem:** Frontend calls `functions/v1/game-session` but function doesn't exist
**Solution:** Implement 5 new Edge Functions (lobby-create, lobby-join, game-start, game-vote, game-reveal)

### Issue #3: Complex Admin System
**Problem:** Requires session code + 4-digit PIN
**Solution:** First player to join automatically becomes admin, no codes needed

---

## 🎯 Proposed Architecture: Simplified Lobbies

### Database Schema (New)
```sql
-- 4 pre-created lobbies
baby_shower.mom_dad_lobbies (
    lobby_key VARCHAR(20) UNIQUE,  -- 'LOBBY-A', 'LOBBY-B', 'LOBBY-C', 'LOBBY-D'
    lobby_name VARCHAR(100),
    status VARCHAR(20),  -- waiting, active, completed
    max_players INTEGER DEFAULT 6,
    current_players INTEGER DEFAULT 0,
    admin_player_id UUID  -- NULL until first player joins
)

-- Players in lobbies
baby_shower.mom_dad_players (
    lobby_id UUID REFERENCES lobbies,
    player_name VARCHAR(100),
    player_type VARCHAR(10),  -- human, ai
    is_admin BOOLEAN DEFAULT false
)

-- Game sessions
baby_shower.mom_dad_game_sessions (
    lobby_id UUID REFERENCES lobbies,
    round_number INTEGER,
    scenario_text TEXT,
    status VARCHAR(20)  -- voting, revealed, completed
)
```

### Edge Functions Required
1. ✅ `lobby-create` - Create player, auto-assign admin
2. ✅ `lobby-join` - Reconnection handling
3. ✅ `game-start` - Admin starts game, generates scenarios
4. ✅ `game-vote` - Submit vote for current round
5. ✅ `game-reveal` - Calculate results, generate roasts

### Frontend Components
1. ✅ `LobbySelector` - 4 lobby cards with status
2. ✅ `LobbyWaitingRoom` - Player list, admin controls
3. ✅ `GameActive` - Question, voting, results
4. ✅ `GameResults` - Final scores

---

## 📋 Implementation Plan

### Phase 1: Quick Wins (1 hour)
**Owner:** code_generator agent

**Tasks:**
1. Fix background image overlay in `index.html` and `styles/main.css`
   - Remove fixed positioning from corner decorations
   - Add `overflow: hidden` to game sections
   - Reduce opacity to 0.05

2. Add temporary fallback in `mom-vs-dad.js`
   - Mock data for scenarios
   - Local state management
   - Error handling for missing backend

### Phase 2: Database & Backend (6-8 hours)
**Owner:** code_generator agent

**Tasks:**
1. Create migration: `supabase/migrations/20260104_simplified_lobby_schema.sql`
2. Deploy 5 Edge Functions:
   - `supabase/functions/lobby-create/index.ts`
   - `supabase/functions/lobby-join/index.ts`
   - `supabase/functions/game-start/index.ts`
   - `supabase/functions/game-vote/index.ts`
   - `supabase/functions/game-reveal/index.ts`
3. Insert 4 pre-created lobbies
4. Test all endpoints with curl

### Phase 3: Frontend Implementation (8-10 hours)
**Owner:** ui_builder agent

**Tasks:**
1. Create `scripts/mom-vs-dad-simplified.js`
   - LobbySelector component
   - LobbyWaitingRoom component
   - GameActive component
   - State management
2. Create `styles/mom-vs-dad-simplified.css`
   - Clean lobby cards
   - Waiting room layout
   - Game screen (no scrolling)
   - Results display
3. Update `index.html`
   - New game section structure
   - Include new scripts
4. Remove old `scripts/mom-vs-dad.js` and `scripts/mom-vs-dad-enhanced.js`

### Phase 4: Testing & QA (4-6 hours)
**Owner:** debug_expert agent

**Tasks:**
1. Unit tests for Edge Functions
2. Integration tests for API endpoints
3. E2E tests for complete game flows
4. Mobile responsiveness testing
5. Accessibility testing

---

## 👥 Agent Allocation

### Code Generator Agent
**Focus:** Backend + Database + Quick Fixes
**Files to Create/Modify:**
- `supabase/migrations/20260104_simplified_lobby_schema.sql`
- `supabase/functions/lobby-create/index.ts`
- `supabase/functions/lobby-join/index.ts`
- `supabase/functions/game-start/index.ts`
- `supabase/functions/game-vote/index.ts`
- `supabase/functions/game-reveal/index.ts`
- `styles/main.css` (background fix)
- `scripts/mom-vs-dad-simplified.js` (backend integration)

**Estimated Time:** 8-10 hours

### UI Builder Agent
**Focus:** Frontend + UX + Visual Design
**Files to Create/Modify:**
- `scripts/mom-vs-dad-simplified.js` (components + state)
- `styles/mom-vs-dad-simplified.css` (800 lines)
- `index.html` (game section structure)
- Remove: `scripts/mom-vs-dad.js`, `scripts/mom-vs-dad-enhanced.js`

**Estimated Time:** 8-10 hours

### Debug Expert Agent
**Focus:** Testing + Error Handling + QA
**Files to Test:**
- All new Edge Functions (unit tests)
- Complete game flow (E2E tests)
- Mobile responsiveness
- Accessibility (WCAG AA)
- Error scenarios

**Estimated Time:** 4-6 hours

### Researcher Agent (Ongoing)
**Focus:** Documentation + Architecture Review
**Files to Create/Update:**
- `docs/technical/MOM_VS_DAD_SIMPLIFIED_ARCHITECTURE.md` ✅ Done
- `docs/technical/MOM_VS_DAD_SIMPLIFIED_UI.md` ✅ Done
- `docs/technical/MOM_VS_DAD_ANALYSIS.md` ✅ Done
- Update `docs/reference/SCHEMA.md`
- Update `docs/reference/API.md`

**Estimated Time:** 2-3 hours (mostly done)

---

## 🗓️ Implementation Timeline

### Week 1: Quick Wins & Backend Foundation
- **Day 1:** Fix background images, add fallback (code_generator)
- **Day 2-3:** Database migration, Edge Functions (code_generator)
- **Day 4:** Frontend components (ui_builder)

### Week 2: Frontend & Testing
- **Day 5-6:** Complete frontend implementation (ui_builder)
- **Day 7:** Integration testing (debug_expert)
- **Weekend:** E2E testing, bug fixes (debug_expert)

### Week 3: Polish & Deploy
- **Monday:** Accessibility audit (debug_expert)
- **Tuesday:** Performance optimization (code_generator)
- **Wednesday:** Final QA, documentation (all agents)
- **Thursday:** Production deployment
- **Friday:** Monitoring, bug fixes

---

## 🎯 Success Criteria

### Functional Requirements ✅
- [ ] Players can select from 4 lobbies
- [ ] First joiner becomes auto-admin
- [ ] Max 6 players per lobby
- [ ] AI fills empty slots
- [ ] Game flows: lobby → waiting → game → results
- [ ] Real-time updates work

### UI Requirements ✅
- [ ] No background image overlays
- [ ] No scrolling issues in game
- [ ] Michelle avatar on LEFT, Jazeel on RIGHT
- [ ] Clean, simple interface
- [ ] Mobile-responsive

### Technical Requirements ✅
- [ ] Edge Functions deployed and working
- [ ] Database tables created with RLS
- [ ] Realtime subscriptions functioning
- [ ] Error handling for all failure scenarios
- [ ] Load tested with 4 concurrent lobbies

---

## 📁 Files Created by Agents

### Analysis Documents (Researcher)
1. ✅ `docs/technical/MOM_VS_DAD_ANALYSIS.md`
2. ✅ `docs/technical/MOM_VS_DAD_SIMPLIFIED_ARCHITECTURE.md`
3. ✅ `docs/technical/MOM_VS_DAD_SIMPLIFIED_UI.md`

### Backend (Code Generator)
4. ⏳ `supabase/migrations/20260104_simplified_lobby_schema.sql`
5. ⏳ `supabase/functions/lobby-create/index.ts`
6. ⏳ `supabase/functions/lobby-join/index.ts`
7. ⏳ `supabase/functions/game-start/index.ts`
8. ⏳ `supabase/functions/game-vote/index.ts`
9. ⏳ `supabase/functions/game-reveal/index.ts`

### Frontend (UI Builder)
10. ⏳ `scripts/mom-vs-dad-simplified.js`
11. ⏳ `styles/mom-vs-dad-simplified.css`

### Documentation (Researcher)
12. ⏳ Update `docs/reference/SCHEMA.md`
13. ⏳ Update `docs/reference/API.md`
14. ⏳ Update `AGENTS.md`

---

## 🚀 Immediate Next Steps

1. **Deploy quick fixes** (background images) - code_generator
2. **Start backend implementation** - code_generator
3. **Begin frontend design** - ui_builder
4. **Continue analysis documentation** - researcher

**Total Estimated Effort:** 20-26 hours
**Team Size:** 3-4 agents working in parallel
**Risk Level:** Medium (depends on Edge Function deployment)

---

**Document Version:** 1.0  
**Created:** January 4, 2026  
**Status:** Ready for Implementation

---

## 🎮 Mom vs Dad Game - Simplified UI Design

This document provides complete UI specifications for the Mom vs Dad game, designed to fix all the issues identified in the architecture analysis. The new design prioritizes simplicity, accessibility, and mobile-first responsive behavior while eliminating the background image overlay problems and complex admin flows.

## Screen Overview

The Mom vs Dad game consists of four distinct screens that guide players through the complete game experience. Each screen has been carefully designed to address specific usability issues while maintaining the fun, engaging nature of the original game concept. The screens flow naturally from selection to waiting to gameplay to results, with clear visual feedback at each stage.

The first screen, the Lobby Selection, presents four pre-configured lobbies that players can choose from. This eliminates the need for session codes entirely and reduces friction for new players. Each lobby card shows current status, player count, and whether a game is in progress. The visual design uses the established sage green color palette with clean, modern styling that works equally well on mobile devices and desktop computers.

The second screen, the Waiting Room, displays all current players in the lobby along with their connection status. The admin controls are hidden by default and only visible to the first player who joined (the auto-assigned admin). Non-admin players see a simple "Waiting for admin to start..." message, reducing confusion about what to do next. The design uses avatar placeholders with initials and clear name labels to make it easy to identify who's in the lobby.

The third screen, the Active Game, presents one question at a time with clear voting options. Michelle's avatar appears on the left side and Jazeel's avatar appears on the right side, consistent with the simplified design requirements. The question card is centered and uses a clean background without any decorative images that could interfere with readability. Vote buttons are large and touch-friendly, with clear visual feedback when selected.

The fourth screen, the Results screen, shows final scores after all rounds are complete. It celebrates the winner with a subtle animated badge while maintaining a friendly, non-competitive tone appropriate for a baby shower game. Options to play again or return to the lobby selection are provided, allowing groups to quickly start a new game or switch to a different lobby.

## Design Principles

The design follows five core principles that address the issues identified in the architecture analysis. First, content isolation ensures that decorative elements never overlap with game content, eliminating the background image overlay problem that plagued the original implementation. All game content is contained within a dedicated area with proper z-index management, and decorative elements use low opacity and are positioned to avoid interfering with interactive elements.

Second, semantic HTML structure provides clear document flow that works correctly with scrolling. Instead of using fixed or absolute positioning for game sections, the design relies on the natural document flow with appropriate padding and margins. This ensures that content renders consistently across different screen sizes and browser configurations.

Third, progressive enhancement means the core game functionality works even if JavaScript fails or is disabled. All interactive elements use semantic HTML buttons and forms that work without JavaScript, while JavaScript enhances the experience with real-time updates and smoother transitions.

Fourth, accessibility compliance ensures the game can be used by players with diverse abilities. All interactive elements meet minimum size requirements of 48x48 pixels for touch targets, color contrast ratios meet WCAG AA standards of 4.5:1 for text, and all images include descriptive alt text. Keyboard navigation is fully supported with visible focus indicators.

Fifth, mobile-first responsive design means the game is optimized for mobile devices first, with desktop layouts enhancing the mobile experience rather than the other way around. This approach ensures the majority of players who access the game from their phones during the baby shower have the best possible experience.

## Color Palette and Typography

The game uses the established sage green theme from the Baby Shower application, maintaining visual consistency across all activities. The primary color is sage green at #9CAF88, used for main buttons, headers, and active states. A darker shade at #7A8F6A provides depth for hover states and borders. Soft gold #F4E4BC serves as the secondary color for backgrounds and accents, while soft peach #E8C4A0 adds warmth to highlights and notifications.

The background colors use warm cream #FFF8E8 for main content areas and beige #F5EDD8 for secondary surfaces. Text colors use dark brown #3A3326 for primary text and lighter brown #4A4238 for secondary text. These colors were selected to maintain consistency with the existing Baby Shower app design while providing sufficient contrast for readability.

The accent colors for Michelle and Jazeel distinguish their respective sections clearly. Michelle's section uses pink #FF9FF3 for her avatar border, voting buttons, and accent elements. Jazeel's section uses blue #74B9FF for his avatar border, voting buttons, and accent elements. These colors are used consistently throughout all screens to create clear visual association.

Typography follows the established font stack of Nunito for headings and Quicksand for body text, loaded from Google Fonts. The font sizes use a modular scale with base size of 16px, scaling up to 20px for subheadings and 24px for headings on desktop (scaled down to 18px and 22px on mobile). Line height is set to 1.5 for body text and 1.2 for headings to ensure readability.

## Lobby Selection Screen

The lobby selection screen presents four lobby cards in a responsive grid layout that adapts from single column on mobile to two-by-two on tablet and four-in-row on desktop. Each card represents a distinct lobby with its own character and atmosphere, giving players a choice that feels meaningful even though all lobbies function identically from a technical perspective.

The four lobbies are named to reflect the barnyard/farm theme consistent with the Baby Shower app: Sunny Meadows, Cozy Barn,星光谷 (Starlight Valley in Chinese), and月光屋 (Moonlight House in Chinese). This multilingual approach welcomes all guests while maintaining thematic consistency. Each lobby can accommodate up to 6 players, with AI automatically filling empty slots to ensure lively games even with few human participants.

Each lobby card displays the lobby name prominently at the top in the primary sage green color. Below the name, a status indicator shows the current state using color-coded badges and text. Green indicates the lobby is waiting for players and ready to join, yellow indicates the lobby is filling up with 4-5 players, red indicates the lobby is full with 6 players, and purple indicates a game is in progress.

A player count display shows the current number of players out of the maximum capacity, for example "3/6 Players" or "6/6 Full". This helps players choose lobbies that match their group size preference. When a game is in progress, the text changes to "Game in Progress" and the card shows a subtle animation to indicate activity.

The tap-to-join interaction is straightforward: players tap a lobby card to see a confirmation modal. The modal displays the lobby name and asks the player to enter their name if they haven't played before. Upon confirmation, the player is immediately added to the lobby and redirected to the waiting room screen.

The CSS implementation uses flexbox for the grid layout with wrapping enabled. Each card uses a white background with a subtle shadow and rounded corners. The hover state adds a slight lift transformation and increased shadow to provide tactile feedback. The tap interaction uses active state styles to confirm the touch was registered.

```css
.lobby-selector {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.lobby-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
    padding: 20px 0;
}

.lobby-card {
    background: white;
    border-radius: 20px;
    padding: 32px 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 12px rgba(156, 175, 136, 0.15);
    border: 2px solid transparent;
}

.lobby-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(156, 175, 136, 0.25);
    border-color: #9CAF88;
}

.lobby-card:active {
    transform: translateY(-2px);
}

.lobby-card.full {
    opacity: 0.7;
    cursor: not-allowed;
}

.lobby-card.active {
    border-color: #9CAF88;
    background: linear-gradient(135deg, #FFF8E8 0%, #F4E4BC 100%);
}

.lobby-icon {
    font-size: 3rem;
    margin-bottom: 16px;
}

.lobby-name {
    font-size: 1.5rem;
    font-weight: 700;
    color: #3A3326;
    margin: 0 0 12px 0;
}

.lobby-status {
    display: inline-block;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 600;
}

.lobby-status.available {
    background: #E8F5E9;
    color: #2E7D32;
}

.lobby-status.filling {
    background: #FFF3E0;
    color: #E65100;
}

.lobby-status.full {
    background: #FFEBEE;
    color: #C62828;
}

.lobby-status.active {
    background: #E3F2FD;
    color: #1565C0;
}
```

## Waiting Room Screen

The waiting room displays the current state of the lobby with a clean, focused layout that eliminates the visual clutter and scrolling issues of the original implementation. The screen is divided into three main sections: a header showing the lobby name and player count, a player list showing all participants, and an action area that adapts based on the current player's admin status.

The player list uses a vertical stack of player cards, each showing the player's avatar (generated from their initials), their name, and their connection status. The admin player is distinguished by a crown icon and "Admin" badge. Human players are shown with a person icon while AI players show a robot icon. The list updates in real-time as players join and leave, with smooth animations for additions and removals.

For non-admin players, the action area displays a simple "Waiting for admin to start the game..." message with a subtle animation. This eliminates confusion about what to do next and reduces the cognitive load on players who just want to participate without managing the game settings.

For the admin player, the action area expands to reveal game settings and the start button. Settings include a dropdown for selecting the number of rounds (3, 5, 7, or 10) and a slider or dropdown for selecting the comedy intensity (Mild, Medium, Spicy, or Wild). The start button is disabled until at least 2 players have joined the lobby.

The layout uses a maximum-width container centered on the screen, with the player list taking up the majority of the space. The action area is pinned to the bottom of the screen on mobile devices, ensuring the start button is always accessible even with many players in the lobby.

```css
.waiting-room {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
}

.waiting-header {
    text-align: center;
    margin-bottom: 32px;
}

.lobby-title {
    font-size: 2rem;
    font-weight: 700;
    color: #9CAF88;
    margin: 0 0 8px 0;
}

.player-count {
    font-size: 1.1rem;
    color: #4A4238;
}

.player-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 32px;
}

.player-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 2px 8px rgba(156, 175, 136, 0.1);
}

.player-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #F4E4BC;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    font-weight: 700;
    color: #3A3326;
}

.player-card.ai .player-avatar {
    background: #E8C4A0;
}

.player-name {
    flex: 1;
    font-size: 1.1rem;
    font-weight: 600;
    color: #3A3326;
}

.admin-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;
    background: #FFF8E8;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #9CAF88;
}

.admin-controls {
    background: white;
    border-radius: 20px;
    padding: 24px;
    box-shadow: 0 4px 16px rgba(156, 175, 136, 0.15);
}

.admin-controls h3 {
    font-size: 1.2rem;
    font-weight: 700;
    color: #3A3326;
    margin: 0 0 20px 0;
}

.setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
}

.setting-row label {
    font-size: 1rem;
    font-weight: 600;
    color: #4A4238;
}

.setting-row select {
    padding: 12px 16px;
    border: 2px solid #F5EDD8;
    border-radius: 12px;
    font-size: 1rem;
    font-family: inherit;
    background: white;
    cursor: pointer;
}

.setting-row select:focus {
    outline: none;
    border-color: #9CAF88;
}

.start-game-btn {
    width: 100%;
    padding: 16px;
    background: linear-gradient(135deg, #9CAF88 0%, #7A8F6A 100%);
    color: white;
    border: none;
    border-radius: 16px;
    font-size: 1.2rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 8px;
}

.start-game-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(156, 175, 136, 0.35);
}

.start-game-btn:disabled {
    background: #C5C5C5;
    cursor: not-allowed;
}
```

## Active Game Screen

The active game screen is designed to present one question at a time with clear, unambiguous voting options. The screen eliminates the background image overlay issue by using a clean, solid-color background with the question content centered in the viewport. No decorative images overlap with the question or voting areas, and the layout uses fixed positioning to prevent any scrolling during gameplay.

The screen is divided into four main sections arranged vertically from top to bottom. The first section is a progress header showing the current round number and total rounds, for example "Round 3 of 5", along with a visual progress bar. The second section is the question card, which displays the scenario in large, readable text centered on the screen. The third section is the voting area with two large buttons, Michelle's avatar and voting option on the left and Jazeel's avatar and voting option on the right. The fourth section is a feedback area that shows a confirmation message after the player votes.

The question card uses a white background with a subtle shadow and rounded corners, positioned centrally on the screen. The text size is large enough to be easily readable from a distance, making it suitable for the phone-passing-around gameplay style common at baby showers. The question uses the dark brown primary text color with appropriate line height for comfortable reading.

The voting buttons are large touch targets measuring at least 80x80 pixels, meeting accessibility requirements for mobile interaction. Each button includes the player's avatar (Michelle or Jazeel), their name, and the voting option text. The buttons use the established pink and blue color coding respectively, making it immediately clear which button represents which parent. The buttons have clear hover and active states with subtle animations to provide tactile feedback.

After voting, the button becomes disabled and displays a checkmark to confirm the vote was recorded. The feedback area below the buttons shows "You voted for [Parent]!" with a brief animation to acknowledge the selection. This feedback persists until the round results are revealed.

```css
.game-screen {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.game-progress {
    text-align: center;
    padding: 16px;
    background: white;
    border-radius: 16px;
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(156, 175, 136, 0.1);
}

.progress-text {
    font-size: 1.2rem;
    font-weight: 700;
    color: #3A3326;
    margin-bottom: 12px;
}

.progress-bar {
    height: 8px;
    background: #F5EDD8;
    border-radius: 4px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #9CAF88 0%, #E8C4A0 100%);
    border-radius: 4px;
    transition: width 0.5s ease;
}

.question-card {
    background: white;
    border-radius: 24px;
    padding: 40px 32px;
    text-align: center;
    margin-bottom: 32px;
    box-shadow: 0 4px 20px rgba(156, 175, 136, 0.15);
    border: 3px solid #9CAF88;
}

.question-text {
    font-size: 1.4rem;
    font-weight: 700;
    color: #3A3326;
    line-height: 1.5;
    margin: 0;
}

.voting-area {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 24px;
}

.vote-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 32px 24px;
    border: none;
    border-radius: 24px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.vote-option:disabled {
    cursor: default;
    opacity: 0.8;
}

.vote-option.mom {
    background: linear-gradient(135deg, #FF9FF3 0%, #FF6B9D 100%);
    color: white;
}

.vote-option.dad {
    background: linear-gradient(135deg, #74B9FF 0%, #0984E3 100%);
    color: white;
}

.vote-option:not(:disabled):hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.vote-option:not(:disabled):active {
    transform: translateY(-2px);
}

.vote-avatar {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border: 4px solid white;
    object-fit: cover;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.vote-name {
    font-size: 1.5rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 2px;
}

.vote-feedback {
    text-align: center;
    padding: 16px 24px;
    background: #E8F5E9;
    border-radius: 16px;
    font-size: 1.1rem;
    font-weight: 600;
    color: #2E7D32;
    animation: fadeInUp 0.3s ease;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```

## Results Screen

The results screen celebrates the completion of the game with a clean, positive design that emphasizes fun and togetherness over competition. The screen presents final scores in a way that makes everyone feel like a winner while still acknowledging the most accurate voter or voters.

The header section displays a large celebration icon with a subtle bounce animation and the text "Game Complete!" in the primary sage green color. This immediately communicates that the game has finished and creates a positive emotional tone for the results reveal.

The scores section presents the final tallies in a clear, easy-to-understand format. Rather than showing individual scores for each player (which could feel competitive), the screen shows aggregate statistics such as total votes for Michelle versus Jazeel across all rounds. This keeps the focus on the fun "Mom vs Dad" theme rather than inter-player competition.

A winner badge is displayed for the parent (Michelle or Jazeel) who received more votes overall, but the design emphasizes the fun and playful nature of this designation rather than treating it as a competitive victory. The badge uses a subtle bounce animation that runs once when the screen loads, drawing attention without being distracting.

The action buttons at the bottom of the screen offer clear next steps: "Play Again" restarts the game in the same lobby with the same or adjusted settings, while "Back to Lobbies" returns to the lobby selection screen. Both buttons use the established styling with the primary action (Play Again) in the sage green theme and the secondary action (Back to Lobbies) in a softer styling.

```css
.results-screen {
    max-width: 600px;
    margin: 0 auto;
    padding: 40px 20px;
    text-align: center;
}

.results-header {
    margin-bottom: 40px;
}

.celebration-icon {
    font-size: 5rem;
    margin-bottom: 16px;
    animation: celebrateBounce 1s ease;
}

@keyframes celebrateBounce {
    0%, 100% {
        transform: scale(1);
    }
    25% {
        transform: scale(1.2) rotate(-5deg);
    }
    50% {
        transform: scale(1.1) rotate(5deg);
    }
    75% {
        transform: scale(1.15) rotate(-3deg);
    }
}

.results-title {
    font-size: 2.5rem;
    font-weight: 800;
    color: #9CAF88;
    margin: 0;
}

.winner-badge {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 20px 32px;
    background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%);
    border-radius: 20px;
    margin-bottom: 32px;
    border: 3px solid #FFB74D;
}

.winner-avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.winner-info {
    text-align: left;
}

.winner-label {
    font-size: 0.9rem;
    font-weight: 600;
    color: #E65100;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.winner-name {
    font-size: 1.5rem;
    font-weight: 800;
    color: #3A3326;
}

.results-stats {
    background: white;
    border-radius: 24px;
    padding: 32px;
    margin-bottom: 32px;
    box-shadow: 0 4px 16px rgba(156, 175, 136, 0.15);
}

.stat-row {
    display: flex;
    justify-content: space-between;
    padding: 16px 0;
    border-bottom: 1px solid #F5EDD8;
}

.stat-row:last-child {
    border-bottom: none;
}

.stat-label {
    font-size: 1.1rem;
    font-weight: 600;
    color: #4A4238;
}

.stat-value {
    font-size: 1.1rem;
    font-weight: 700;
    color: #3A3326;
}

.results-actions {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.btn-primary {
    padding: 18px 32px;
    background: linear-gradient(135deg, #9CAF88 0%, #7A8F6A 100%);
    color: white;
    border: none;
    border-radius: 16px;
    font-size: 1.2rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-secondary {
    padding: 16px 32px;
    background: white;
    color: #4A4238;
    border: 2px solid #F5EDD8;
    border-radius: 16px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(156, 175, 136, 0.35);
}

.btn-secondary:hover {
    border-color: #9CAF88;
    background: #FFF8E8;
}
```

## Responsive Breakpoints

The design uses three main responsive breakpoints to ensure optimal presentation across device sizes. The base styles target mobile devices with screen widths up to 599 pixels. At this size, the lobby grid displays as a single column, the voting area uses full-width buttons stacked vertically, and all interactive elements use minimum touch targets of 48x48 pixels.

The tablet breakpoint covers screen widths from 600 to 767 pixels. At this size, the lobby grid displays as two columns, the voting area side-by-side buttons with reduced spacing, and the waiting room player list uses a two-column grid for player cards.

The desktop breakpoint covers screen widths from 768 pixels and above. At this size, the lobby grid displays as four columns in a single row, the game screen uses centered content with maximum width of 800 pixels, and all interactive elements maintain comfortable spacing regardless of viewport size.

The implementation uses CSS custom properties for all spacing and sizing values, making it easy to adjust measurements across breakpoints while maintaining consistency. The mobile-first approach means base styles are written for mobile, with min-width media queries adding enhancements for larger screens.

```css
:root {
    --spacing-xs: 8px;
    --spacing-sm: 12px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;
    --spacing-xxl: 48px;
    
    --border-radius-sm: 12px;
    --border-radius-md: 16px;
    --border-radius-lg: 20px;
    --border-radius-xl: 24px;
    
    --font-size-sm: 0.9rem;
    --font-size-md: 1rem;
    --font-size-lg: 1.2rem;
    --font-size-xl: 1.5rem;
    --font-size-xxl: 2rem;
    
    --touch-target-min: 48px;
}

@media (max-width: 599px) {
    :root {
        --font-size-xxl: 1.7rem;
        --spacing-xl: 24px;
        --spacing-xxl: 32px;
    }
    
    .lobby-grid {
        grid-template-columns: 1fr;
    }
    
    .voting-area {
        grid-template-columns: 1fr;
    }
    
    .vote-option {
        flex-direction: row;
        padding: 20px;
    }
    
    .question-card {
        padding: 24px 20px;
    }
    
    .question-text {
        font-size: 1.2rem;
    }
}

@media (min-width: 600px) and (max-width: 767px) {
    .lobby-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .voting-area {
        gap: 16px;
    }
    
    .player-list {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (min-width: 768px) {
    .lobby-grid {
        grid-template-columns: repeat(4, 1fr);
    }
    
    .game-screen {
        padding: 32px;
    }
    
    .question-card {
        padding: 48px 40px;
    }
    
    .question-text {
        font-size: 1.6rem;
    }
}
```

## Accessibility Requirements

The design meets WCAG 2.1 Level AA accessibility standards to ensure all guests can participate in the game regardless of ability. All interactive elements meet minimum touch target sizes of 48x48 pixels, making them easy to activate for users with motor impairments. Text colors use contrast ratios of at least 4.5:1 against their backgrounds, meeting readability requirements for users with low vision.

Focus indicators are clearly visible and use a high-contrast outline that meets the 3:1 contrast ratio requirement against adjacent colors. The focus style is consistent across all interactive elements and uses a recognizable pattern that users can learn to anticipate. Keyboard navigation is fully supported with logical tab order that follows the visual layout.

All images include descriptive alt text that conveys the information and purpose of the image. Avatar images use the player's name as the alt text, while decorative icons use descriptions like "Lobby icon showing farm theme" or "Admin badge indicating lobby creator". Form inputs include associated labels that are programmatically connected using the for attribute.

The design supports reduced motion preferences through the prefers-reduced-motion media query. When this preference is detected, all animations are reduced to brief transitions of 0.1 seconds or less, eliminating motion that could cause discomfort for users with vestibular disorders. Essential information is still conveyed through color and layout when animations are reduced.

Screen reader compatibility is ensured through semantic HTML structure with proper heading hierarchy, ARIA labels where needed, and descriptive text for all interactive elements. The lobby selection uses heading level 2 for the main title and heading level 3 for individual lobby names. The game screen uses a consistent heading structure that allows screen reader users to navigate quickly between sections.

```css
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}

:focus-visible {
    outline: 3px solid #9CAF88;
    outline-offset: 2px;
}

button:focus:not(:focus-visible),
a:focus:not(:focus-visible) {
    outline: none;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
    :root {
        --color-primary: #6B8E23;
        --color-text: #000000;
        --color-background: #FFFFFF;
        --color-border: #000000;
    }
    
    .lobby-card,
    .player-card,
    .question-card {
        border: 2px solid #000000;
    }
}

/* Touch target size enforcement */
button,
[role="button"],
input[type="submit"],
input[type="button"] {
    min-height: var(--touch-target-min);
    min-width: var(--touch-target-min);
}
```

## Performance Considerations

The design prioritizes fast load times and smooth interactions through several optimization strategies. CSS animations use only transform and opacity properties, which are GPU-accelerated and don't trigger expensive layout recalculations. This ensures 60fps animations even on lower-powered mobile devices.

The layout uses CSS Grid and Flexbox rather than floats or table-based layouts, resulting in faster rendering and more predictable behavior across browsers. All decorative images use lazy loading to defer loading until they're about to enter the viewport, reducing initial page weight.

JavaScript is minimal and follows the IIFE pattern established in the Baby Shower application, avoiding global namespace pollution and enabling efficient minification. Event handlers use event delegation where possible to reduce the number of attached listeners. State management uses a centralized store pattern that enables efficient updates without unnecessary re-renders.

The game screens use a single-page application approach where all screens are present in the DOM but hidden using CSS, rather than removing and re-adding elements. This approach reduces memory churn and enables instant screen transitions without loading states. The initial bundle size is kept under 50KB gzipped to ensure fast load times on mobile networks.

All third-party resources are loaded with appropriate crossorigin attributes to enable HTTP/2 multiplexing. Font loading uses font-display: swap to ensure text is visible immediately even if the web fonts haven't loaded yet. Critical CSS is inlined in the HTML head to eliminate render-blocking stylesheet requests.

---

**Document Version:** 1.0  
**Created:** January 4, 2026  
**Status:** Complete Design Specification Ready for Implementation

The complete UI design specification is now available for implementation. The design addresses all identified issues from the architecture analysis while providing a clear, accessible, and performant user experience. All screens are fully specified with CSS properties, HTML structure, and responsive behavior defined.
