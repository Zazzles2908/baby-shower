# Baby Shower Repository Cleanup Report
**Generated:** 2026-01-07

## Summary

This report documents the cleanup of deprecated files and the organization of the Baby Shower repository structure.

---

## Files Archived

### Migrations (supabase/migrations/)

| File | Reason for Archival |
|------|---------------------|
| `20260104_simplified_lobby_schema.sql` | Uses deprecated `mom_dad_lobbies`, `mom_dad_players`, `mom_dad_game_sessions` tables. Replaced by `20260103_mom_vs_dad_game_schema.sql` which uses `game_sessions`, `game_scenarios`, `game_votes`, `game_answers`, `game_results` tables. |
| `20260104_who_would_rather_schema.sql` | Creates separate `who_would_rather_*` tables for a different game variant. This is an alternative game mode, not the canonical Mom vs Dad game. |
| `20260108_game_setup.sql` | Creates tables with hardcoded demo lobbies (LOBBY-A, LOBBY-B, LOBBY-C, LOBBY-D). Replaced by `20260103_mom_vs_dad_game_schema.sql` which uses the proper schema with `generate_session_code()` function. |

**Location:** `docs/cleanup/migrations/`

### Edge Functions

| File | Reason for Archival |
|------|---------------------|
| `supabase/functions/who-would-rather/` | Alternative game implementation using different schema. The canonical Mom vs Dad game uses `game-*` functions. |

**Location:** `docs/cleanup/functions/`

### HTML Test/Debug Files

| File | Reason for Archival |
|------|---------------------|
| `mom-vs-dad-debug.html` | Debug page for mom vs dad game. Replaced by proper game UI in main application. |
| `debug-test.html` | Generic debug testing page. No longer needed. |
| `comprehensive-test.html` | Test harness page. Tests should be in `tests/` folder. |
| `test-mom-vs-dad-init.html` | Initialization test page. Replaced by proper test suite. |

**Location:** `docs/cleanup/html/`

---

## Current Active Files

### Canonical Schema Migration

| File | Status | Description |
|------|--------|-------------|
| `supabase/migrations/20260103_mom_vs_dad_game_schema.sql` | ACTIVE | Main schema for Mom vs Dad game. Defines: game_sessions, game_scenarios, game_votes, game_answers, game_results |

### Edge Functions (Active)

| Function | Purpose |
|----------|---------|
| `game-session/` | Create/manage game sessions |
| `game-scenario/` | Generate AI scenarios (Z.AI) |
| `game-vote/` | Submit guest votes |
| `game-reveal/` | Generate roast commentary (Moonshot) |
| `game-start/` | Start game, generate scenarios |
| `lobby-create/` | Create new game session |
| `lobby-status/` | Get session status |
| `lobby-join/` | Join existing session |
| `advice/` | AI advice generator |
| `guestbook/` | Guestbook submissions |
| `pool/` | Baby pool predictions |
| `quiz/` | Quiz functionality |
| `vote/` | Voting functionality |
| `pool/` | Baby pool activity |
| `setup/` | Database setup utility |

### Scripts (Active)

| File | Purpose |
|------|---------|
| `main.js` | Main application logic |
| `config.js` | Configuration management |
| `api-supabase.js` | Supabase API client |
| `guestbook.js` | Guestbook feature |
| `pool.js` | Baby pool activity |
| `quiz.js` | Quiz feature |
| `who-would-rather.js` | Shoe game (different from who-would-rather game variant) |

---

## Files Requiring Manual Review

### Potential Duplicates

1. **Multiple pool-related functions:**
   - `supabase/functions/pool/` - Pool activity
   - Need to verify if `pool.js` and the pool function serve different purposes

2. **Game initialization:**
   - `scripts/game-init-enhanced.js` vs `scripts/mom-vs-dad-simplified.js`
   - Both appear to be for Mom vs Dad game initialization

3. **Deployment scripts:**
   - Multiple deploy scripts in root: `deploy.bat`, `deploy.sh`, `deploy-mom-vs-dad-fix.bat`, `deploy-mom-vs-dad-fix.sh`, `deploy-edge-functions-fix.bat`, `deploy-edge-functions-fix.sh`
   - Need to consolidate to single deployment mechanism

### Files to Review Later

| File | Notes |
|------|-------|
| `archive/deprecated/mom-vs-dad*.js` | Already archived but may contain useful code snippets |
| `tests/mom-vs-dad-game.test.js` | Test file - verify it uses correct schema |
| `index.html.clean` | Backup of index.html - can be deleted if not needed |
| `GAME_DIAGNOSTIC.js` | Diagnostic script - verify if still needed |

---

## Recommendations

### Immediate Actions

1. **Apply canonical schema:** Run `20260103_mom_vs_dad_game_schema.sql` migration on database
2. **Verify Edge Functions:** Ensure `game-*` functions work with the canonical schema
3. **Clean up deployment:** Consolidate deploy scripts into `scripts/deploy.js`

### Future Cleanup

1. **Tests:** Move all test HTML files to `tests/` folder
2. **Documentation:** Keep only essential docs in `docs/`, move others to `docs/archive/`
3. **Scripts:** Consolidate utility scripts into single files where possible

### Schema Reference

Per AGENTS.md, the canonical table names are:
- `baby_shower.game_sessions`
- `baby_shower.game_scenarios`
- `baby_shower.game_votes`
- `baby_shower.game_answers`
- `baby_shower.game_results`

Avoid using deprecated tables:
- `baby_shower.mom_dad_lobbies` (replaced by `game_sessions`)
- `baby_shower.mom_dad_players` (consolidated into `game_votes`)
- `baby_shower.mom_dad_game_sessions` (replaced by `game_scenarios`)
- `baby_shower.who_would_rather_sessions` (alternative game variant)
- `baby_shower.who_would_rather_questions` (alternative game variant)
- `baby_shower.who_would_rather_votes` (alternative game variant)

---

## Verification Checklist

- [ ] Canonical schema migration applied to database
- [ ] All `game-*` Edge Functions work correctly
- [ ] Frontend `mom-vs-dad-simplified.js` uses correct schema
- [ ] Tests updated to use correct table names
- [ ] Documentation references updated schema
