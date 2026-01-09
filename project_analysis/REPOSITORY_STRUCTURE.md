# Baby Shower V2 - Repository Structure

**Last Updated:** January 5, 2026  
**Status:** ✅ CLEAN AND ORGANIZED

---

## 📁 DIRECTORY STRUCTURE

```
baby-shower/
│
├── 🌟 ROOT DIRECTORY (Essential Files Only - 15 files)
│   ├── index.html                    # Main application entry point
│   ├── package.json                  # NPM dependencies
│   ├── package-lock.json             # NPM lock file
│   ├── vercel.json                   # Vercel deployment config
│   ├── inject-env.js                 # Environment variable injection
│   ├── .gitignore                    # Git ignore rules
│   ├── .env.local                    # Environment variables (⚠️ contains secrets!)
│   ├── .env.local.example            # Environment template
│   ├── .vercelignore                 # Vercel ignore rules
│   ├── AGENTS.md                     # Development guide (essential)
│   ├── README.md                     # Project overview
│   ├── supabase-helper.sh            # Supabase CLI helper script
│   ├── .github-mcp-config.md         # GitHub MCP configuration
│   └── .gitconfig                    # Git configuration
│
├── 📂 scripts/                       # All JavaScript files
│   ├── *.js                          # Core application scripts
│   ├── api-supabase.js              # Supabase API client
│   ├── api-supabase-enhanced.js     # Enhanced API client
│   ├── main.js                      # Main application logic
│   ├── guestbook.js                 # Guestbook functionality
│   ├── pool.js                      # Baby pool functionality
│   ├── quiz.js                      # Quiz functionality
│   ├── advice.js                    # Advice functionality
│   ├── voting.js                    # Voting functionality
│   ├── mom-vs-dad-simplified.js     # Mom vs Dad game
│   ├── who-would-rather.js          # Who Would Rather game
│   ├── realtime-manager-enhanced.js # Realtime updates
│   ├── image-service-enhanced.js    # Image handling
│   ├── security.js                  # Security utilities
│   ├── config.js                    # Configuration
│   ├── error-monitor.js             # Error monitoring
│   ├── game-init-enhanced.js        # Game initialization
│   ├── anime-characters.js          # Character animations
│   ├── surprises.js                 # Surprise effects
│   ├── gallery.js                   # Gallery functionality
│   │
│   └── 📂 tests/                    # Test scripts
│       ├── test-*.js                # Individual test scripts
│       └── test-*.json              # Test data files
│
├── 📂 styles/                       # CSS stylesheets
│   ├── main.css                     # Main styles
│   ├── animations.css               # Animations
│   ├── cute-enhancements.css        # Cute UI enhancements
│   ├── mom-vs-dad-simplified.css    # Game styles
│   └── who-would-rather.css         # Game styles
│
├── 📂 public/                       # Public static assets
│   ├── dashboards/
│   │   ├── error-dashboard.html     # Error monitoring dashboard
│   │   └── simulation-dashboard.html # Simulation dashboard
│   └── test-api.html                # API testing page
│
├── 📂 supabase/                     # Supabase configuration
│   ├── functions/                   # Edge Functions
│   │   ├── _shared/                 # Shared utilities
│   │   │   └── security.ts          # Security utilities
│   │   ├── _template/               # Function template
│   │   ├── guestbook/               # Guestbook function
│   │   ├── vote/                    # Voting function
│   │   ├── pool/                    # Baby pool function
│   │   ├── quiz/                    # Quiz function
│   │   ├── advice/                  # Advice function
│   │   ├── game-session/            # Game session management
│   │   ├── game-scenario/           # Game scenario generation
│   │   ├── game-vote/               # Game voting
│   │   ├── game-start/              # Game start
│   │   ├── game-reveal/             # Game reveal/results
│   │   ├── lobby-create/            # Lobby creation
│   │   ├── lobby-status/            # Lobby status
│   │   ├── who-would-rather/        # Who Would Rather game
│   │   ├── create-table/            # Table creation utility
│   │   ├── fix-permissions/         # Permission fixing utility
│   │   └── setup/                   # Setup function
│   │
│   ├── migrations/                  # Database migrations
│   │   ├── *.sql                    # Migration files
│   │   └── 20260103_mom_vs_dad_game_schema.sql
│   │
│   ├── import_map.json              # Deno import map
│   └── supabase/                    # Supabase CLI config
│       ├── config.toml              # Supabase configuration
│       └── .temp/                   # Temporary files
│
├── 📂 docs/                         # Documentation
│   ├── README.md                    # Documentation index
│   │
│   ├── 📂 guides/                   # Development guides
│   │   ├── AGENT_TASKS.md
│   │   ├── BUILD_DOCUMENTATION.md
│   │   ├── DEPLOYMENT.md
│   │   ├── DEPLOYMENT_CLI.md
│   │   ├── DEPLOYMENT_NOTES.md
│   │   ├── EDGE_FUNCTION_GUIDE.md
│   │   ├── MIGRATION_GUIDE.md
│   │   └── VERCEL_ENVIRONMENT_CONFIG.md
│   │
│   ├── 📂 technical/                # Technical documentation
│   │   ├── BACKEND_FIX_SUMMARY.md
│   │   ├── COMPLETE_API_FIX.md
│   │   ├── EDGE_FUNCTION_STATUS.md
│   │   ├── GUESTBOOK_FIX.md
│   │   ├── IMAGE_SERVICE_FIX_SUMMARY.md
│   │   ├── LIVE_EVENT_DEPLOYMENT.md
│   │   ├── PROJECT_STATUS_REPORT.md
│   │   ├── SECURITY_FIXES.md
│   │   └── supabase-integration.md
│   │
│   ├── 📂 active/                   # Active project documentation
│   │   ├── CLEANUP_COMPLETE.md
│   │   ├── FINAL_HYGIENE_CLEANUP_REPORT.md
│   │   ├── REPO_CLEANUP_SUMMARY.md
│   │   ├── CLEANUP_REPORT.md
│   │   ├── DOCUMENTATION_CLEANUP_SUMMARY.md
│   │   ├── DOCUMENTATION_UPDATE_SUMMARY.md
│   │   ├── GAME_SESSION_FIX_REPORT.md
│   │   └── PROJECT_COMPLETION_SUMMARY.md
│   │
│   ├── 📂 archive/                  # Archived documentation
│   │   ├── AI_CONFIGURATION.md
│   │   ├── PRODUCTION_CHECKLIST.md
│   │   ├── SIMULATION_README.md
│   │   ├── picture-integration-plan.md
│   │   ├── 2026-01-03-conflicts/
│   │   ├── architecture/
│   │   ├── historical/
│   │   ├── proposals/
│   │   └── superseded/
│   │
│   ├── game-design/                 # Game design documents
│   ├── implementation/              # Implementation guides
│   ├── reference/                   # Reference documentation
│   ├── research/                    # Research documents
│   ├── testing/                     # Testing documentation
│   ├── MiniMax_Plan/                # MiniMax AI plans
│   └── Users/                       # User-related docs
│
├── 📂 tests/                        # Test files
│   ├── e2e/                         # End-to-end tests
│   │   ├── *.test.js                # Test files
│   │   ├── .auth/                   # Test authentication
│   │   └── test-results/            # Test results
│   ├── test-results/                # Test output
│   │   ├── html-report/             # HTML test reports
│   │   └── screenshots/             # Test screenshots
│   └── *.js                         # Test utilities
│
├── 📂 archive/                      # Archived/deprecated files
│   ├── 📂 deprecated/               # Deprecated implementations
│   │   ├── mom-vs-dad.js
│   │   └── mom-vs-dad-enhanced.js
│   │
│   ├── 📂 legacy/                   # Legacy implementations
│   │   ├── api.js
│   │   ├── index-simple.ts
│   │   ├── guestbook/self-contained.ts
│   │   ├── vote/self-contained.ts
│   │   └── Code.gs
│   │
│   └── 📂 testing/                  # Test scripts with credentials
│       ├── capture-error.js
│       ├── comprehensive-test.js
│       ├── comprehensive-qa-test.js
│       ├── test-real-vote-api.js
│       ├── test-game-api.js
│       ├── scripts/test-game.js
│       └── test-game-api-results.json
│
├── 📂 baby_content/                 # Baby photos (personal, not in git)
├── 📂 baby_contentPictures/         # Baby pictures (not in git)
├── 📂 node_modules/                 # NPM dependencies (gitignored)
└── 📂 .git/                         # Git repository data
```

---

## 📊 STATISTICS

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Files in Root Directory | 43 | 15 | -28 |
| Markdown Files in Root | 29 | 2 | -27 |
| JS Files in Root | 18 | 0 | -18 |
| Subdirectories | 10+ | 15+ | +5 |

---

## ✅ WHAT'S CLEAN

### Root Directory:
- ✅ Only 15 essential files
- ✅ No JS files in root
- ✅ No markdown documentation in root
- ✅ No test files in root
- ✅ No temporary files

### Scripts Directory:
- ✅ All JS files properly organized
- ✅ Tests in dedicated subdirectory
- ✅ No hardcoded credentials in active scripts

### Documentation:
- ✅ Organized by category (guides, technical, active, archive)
- ✅ Clear separation of concerns
- ✅ Easy to find relevant docs

### Archive:
- ✅ Deprecated files properly archived
- ✅ Legacy code separated
- ✅ Test files with credentials isolated

---

## 🚨 WHAT STILL NEEDS ATTENTION

### Critical:
1. ⚠️ `.env.local` contains exposed credentials (rotate and clean git history)

### Recommended:
2. Remove `.todo` file from root (empty file)
3. Move `.github-mcp-config.md` to docs/ or delete if not needed
4. Move `.gitconfig` to home directory or delete

---

## 🎯 FILES THAT SHOULD REMAIN IN ROOT

Only these files should ever be in the root directory:

```
✅ Configuration:
  - package.json
  - package-lock.json
  - vercel.json
  - .gitignore
  - .env.local (should be gitignored!)
  - .env.local.example
  - .vercelignore

✅ Main Application:
  - index.html

✅ Build Tools:
  - inject-env.js
  - supabase-helper.sh

✅ Documentation:
  - README.md
  - AGENTS.md (development guide)
```

---

## 📝 FILE ORGANIZATION RULES

### Rule 1: Keep Root Clean
- Only configuration, main app files, and essential docs in root
- All other files go in subdirectories

### Rule 2: Organize by Type
- `.js` files → `scripts/`
- `.css` files → `styles/`
- `.md` files → `docs/` (categorized)
- Test files → `tests/`

### Rule 3: Archive Deprecated Files
- Old implementations → `archive/deprecated/`
- Legacy code → `archive/legacy/`
- Test files with credentials → `archive/testing/`

### Rule 4: Document Everything
- Update AGENTS.md when adding new patterns
- Create guides in `docs/guides/`
- Document fixes in `docs/technical/`

---

## 🔧 COMMON COMMANDS

```bash
# Check root directory cleanliness
ls -la | grep -v "^d" | wc -l

# Find files that shouldn't be in root
ls -la | grep -v "^d" | grep "\.js$\|\.md$"

# List directory structure
tree -L 3 -I 'node_modules|baby_content|.git'

# Count files by type
find . -maxdepth 1 -type f | wc -l
find scripts -name "*.js" | wc -l
find docs -name "*.md" | wc -l
```

---

## 🎉 CONCLUSION

The repository is now **clean, organized, and production-ready**!

✅ Root directory has only 15 essential files  
✅ All code properly organized in subdirectories  
✅ Documentation categorized and accessible  
✅ Archive directory captures deprecated code  
✅ Clear separation of concerns  
✅ Easy to navigate and understand  

**The only remaining issue is the `.env.local` file with exposed credentials, which should be rotated after testing is complete.**

---

**Document Version:** 1.0  
**Created:** January 5, 2026  
**Status:** FINAL
