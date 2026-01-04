# 🎮 Mom vs Dad Game - Multi-Agent Simulation Suite

This directory contains a comprehensive simulation suite for testing the Mom vs Dad game with multiple AI agents playing as users. The simulation exercises all aspects of the game system and can be monitored via Supabase logs.

## 📁 Files Overview

| File | Purpose |
|------|---------|
| `scripts/simulate-game.js` | Main multi-agent simulation engine |
| `scripts/monitor-game.js` | Supabase monitoring dashboard |
| `scripts/run-simulation.js` | Orchestrates simulation + monitoring |
| `simulation-dashboard.html` | Visual web interface for simulation |

## 🚀 Quick Start

### Option 1: Run Complete Suite
```bash
node scripts/run-simulation.js
```

### Option 2: Quick Test (1 agent, 1 round)
```bash
node scripts/run-simulation.js --quick
```

### Option 3: Browser Dashboard
Open `simulation-dashboard.html` in a browser and click "Start Simulation"

## 🤖 Agent Personalities

The simulation creates 5 AI agents with distinct personalities:

### 1. Dr. Rational (Analytical)
- **Voting Pattern:** Balanced (52% mom, 48% dad)
- **Decision Speed:** Slow (analyzes scenarios thoroughly)
- **Confidence:** 80%
- **Behavior:** Uses logical reasoning to predict parent behavior

### 2. Heartfelt Hannah (Emotional)  
- **Voting Pattern:** Emotional (goes with dramatic option)
- **Decision Speed:** Fast (trusts gut feelings)
- **Confidence:** 60%
- **Behavior:** Votes based on emotional connection to scenarios

### 3. Winner Wilson (Competitive)
- **Voting Pattern:** Contrarian (tends to go against crowd)
- **Decision Speed:** Medium
- **Confidence:** 90%
- **Behavior:** Tries to predict and counter majority opinion

### 4. Laid-Back Liam (Casual)
- **Voting Pattern:** Random (50/50 split)
- **Decision Speed:** Fast (doesn't overthink)
- **Confidence:** 40%
- **Behavior:** Just wants to have fun, votes randomly

### 5. Strategic Sam (Strategic)
- **Voting Pattern:** Adaptive (adjusts based on history)
- **Decision Speed:** Slow (plans ahead)
- **Confidence:** 85%
- **Behavior:** Tracks voting patterns and adapts strategy

## 🎮 Simulation Phases

### Phase 1: Session Creation
- Generates unique 6-character session code
- Sets up game configuration (mom/dad names, rounds)
- Creates admin PIN for parent controls

### Phase 2: Agent Joining
- Agents join the session with their names
- Each agent is assigned a personality
- Verifies all agents can connect

### Phase 3: Scenario Generation
- AI generates funny "who would rather" scenarios
- Uses configurable intensity (comedy level)
- Themes: farm, funny, parenting, cozy

### Phase 4: Voting
- Each agent votes based on their personality
- Simulates realistic voting patterns
- Tracks individual vote history

### Phase 5: Answer Locking
- Simulates parents locking in answers
- Uses random decision-making for parent choices
- Tracks lock status for each scenario

### Phase 6: Result Reveal
- Calculates vote counts and percentages
- Determines perception gap (how wrong crowd was)
- Generates AI roast commentary
- Applies particle effects based on results

## 📊 Monitoring

### Real-Time Metrics
- **Total Requests:** Number of Supabase operations
- **Success Rate:** Percentage of successful requests
- **Response Time:** Average Edge Function duration
- **Error Count:** Number of failed operations

### Edge Function Tracking
Each Edge Function is monitored separately:
- `game-session` - Session creation
- `game-scenario` - Scenario generation  
- `game-vote` - Vote submission
- `game-reveal` - Result revelation
- `game-answer` - Parent answer locking

## 🔧 Configuration

Edit `CONFIG` object in each file to customize:

```javascript
const CONFIG = {
    // Supabase
    SUPABASE_URL: 'https://your-project.supabase.co',
    SUPABASE_ANON_KEY: 'your-anon-key',
    
    // Simulation
    TOTAL_AGENTS: 5,
    SESSION_CODE: '', // Auto-generated
    ADMIN_CODE: '1234',
    TOTAL_ROUNDS: 3,
    
    // Timing
    DELAY_BETWEEN_ACTIONS: 1000, // ms
    DELAY_BETWEEN_ROUNDS: 2000, // ms
};
```

## 📈 Output

### Console Output
The simulation provides detailed console logs:
- Phase progression
- Agent activities
- Vote results
- Performance metrics

### Report Generation
After completion, a comprehensive JSON report is generated:
```json
{
  "timestamp": "2026-01-03T12:00:00Z",
  "sessionCode": "ABC123",
  "agentSummary": [...],
  "scenarioSummary": [...],
  "votingStats": {...},
  "performanceMetrics": {...}
}
```

### Log Export
Logs can be exported in JSON format:
```javascript
const logs = monitor.exportLogs('json');
// Or CSV format
const csvLogs = monitor.exportLogs('csv');
```

## 🎯 Testing Scenarios

### Basic Functionality Test
```bash
node scripts/run-simulation.js --quick
```
- 1 agent
- 1 round
- No monitoring
- ~10 seconds

### Full Load Test
```bash
node scripts/run-simulation.js
```
- 5 agents
- 3 rounds
- With monitoring
- ~45 seconds

### Stress Test
Modify CONFIG for maximum load:
```javascript
TOTAL_AGENTS: 10
TOTAL_ROUNDS: 5
DELAY_BETWEEN_ACTIONS: 100
```

## 🔍 Monitoring Supabase Logs

### Via Dashboard
Open `simulation-dashboard.html` for visual monitoring

### Via Console
```javascript
const monitor = new SupabaseMonitor();
await monitor.init();
monitor.start();
```

### Key Metrics to Watch
1. **Response Times:** Should be < 5 seconds for most operations
2. **Error Rate:** Should be < 1% in normal conditions
3. **Edge Function Calls:** Verify all expected functions are called
4. **Realtime Updates:** Confirm subscriptions are working

## 🚨 Troubleshooting

### Common Issues

**Issue:** "Failed to initialize Supabase"
```bash
# Check your Supabase URL and keys
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

**Issue:** "Session creation failed"
- Verify `baby_shower.game_sessions` table exists
- Check RLS policies allow inserts

**Issue:** "Vote submission failed"
- Verify `baby_shower.game_votes` table exists
- Check scenario ID is valid

**Issue:** "No realtime updates"
- Verify publication `baby_shower_realtime` exists
- Check table is added to publication

### Debug Mode
Enable detailed logging:
```javascript
LOG_LEVEL: 'detailed'
```

## 📊 Example Output

```
🎮 Multi-Agent Simulation Complete

Session Summary:
   Session Code: ABC123
   Total Agents: 5
   Rounds Played: 3

Agent Performance:
   Dr. Rational: 3 votes [complete]
   Heartfelt Hannah: 3 votes [complete]
   Winner Wilson: 3 votes [complete]
   Laid-Back Liam: 3 votes [complete]
   Strategic Sam: 3 votes [complete]

Voting Results:
   Total Votes: 15
   Mom Votes: 8
   Dad Votes: 7

Performance Metrics:
   Total Requests: 45
   Successful: 44
   Failed: 1
   Success Rate: 97.8%
```

## 🎓 Learning Outcomes

This simulation helps verify:

1. **System Reliability:** Can the system handle multiple concurrent users?
2. **AI Integration:** Are AI-generated scenarios working correctly?
3. **Database Performance:** Are queries optimized?
4. **Realtime Updates:** Are subscriptions functioning?
5. **Edge Cases:** What happens with edge cases and errors?

## 🔗 Related Documentation

- [Game Design Document](../../docs/game-design/mom-vs-dad-GAME_DESIGN.md)
- [Database Schema](../../docs/reference/SCHEMA.md)
- [API Reference](../../docs/reference/API.md)
- [Edge Functions](../../docs/reference/EDGE_FUNCTIONS.md)

---

**Happy Testing! 🎮**

*Mom vs Dad Game - Simulation Suite v1.0*