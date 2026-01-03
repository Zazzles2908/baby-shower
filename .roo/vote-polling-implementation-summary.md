# Vote Count Polling Implementation - Summary

**Date:** 2026-01-03
**Task:** Add live vote count polling to Mom vs Dad game

## Changes Made

### 1. Added Vote Polling State Variable
- **Location:** Line 22 in `scripts/mom-vs-dad.js`
- **Change:** Added `votePollingInterval` variable to track the polling timer

### 2. New Functions Added

#### `startVotePolling()`
- **Location:** Lines 219-293
- **Purpose:** Starts polling for vote count updates when on voting screen
- **Behavior:**
  - Polls the `game-vote` Edge Function every 2 seconds via GET request
  - Updates the tug-of-war bar with live percentages
  - Updates the percentage text displays (mom-pct, dad-pct)
  - Handles both raw vote counts and pre-calculated percentages
  - Continues polling even if an error occurs (logs error but doesn't stop)

#### `stopVotePolling()`
- **Location:** Lines 295-304
- **Purpose:** Stops the vote count polling timer
- **Behavior:** Clears the interval and resets the votePollingInterval variable

#### `calculatePercentage(momVotes, dadVotes)`
- **Location:** Lines 306-314
- **Purpose:** Helper function to calculate percentages from vote counts
- **Behavior:** Returns 50-50 split if no votes, otherwise calculates actual percentage

### 3. Modified Functions

#### `showVotingScreen(scenario)`
- **Location:** Lines 1058-1130
- **Changes:**
  - Added `stopVotePolling()` call at the beginning to clear any existing polling
  - Added `startVotePolling()` call at the end to start polling when voting screen is displayed

#### `showResults(result)`
- **Location:** Lines 1280-1305
- **Changes:** Added `stopVotePolling()` call to stop polling when results are shown

#### `showJoinScreen()`
- **Location:** Lines 884-903
- **Changes:** Added `stopVotePolling()` call to stop polling when returning to join screen

#### `showAdminLoginScreen()`
- **Location:** Lines 974-991
- **Changes:** Added `stopVotePolling()` call to stop polling when showing admin login

## How It Works

1. **User joins game** → Shows voting screen → **Starts polling**
2. **Every 2 seconds**, the polling function:
   - Calls `GET /functions/v1/game-vote?scenario_id=...`
   - Receives vote count data (either raw votes or percentages)
   - Updates the tug-of-war bar animation
   - Updates the percentage text displays
3. **User leaves voting screen** → **Stops polling** (join screen, results screen, admin login)
4. **User sees results** → Polling stops automatically

## API Integration

### GET Request to game-vote Function
```
URL: https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/game-vote?scenario_id={scenario_id}
Method: GET
Headers:
  - Authorization: Bearer {anon_key}
  - Content-Type: application/json
```

### Expected Response Format
```json
{
  "mom_votes": 5,
  "dad_votes": 3,
  "mom_pct": 62.5,
  "dad_pct": 37.5
}
```

## Features

✅ **Automatic polling** - Starts when voting screen loads, stops when leaving
✅ **2-second refresh rate** - Fast enough for live updates, not too aggressive
✅ **Error handling** - Logs errors but continues polling (doesn't stop on transient errors)
✅ **Dual format support** - Handles both raw vote counts and pre-calculated percentages
✅ **Visual updates** - Updates both tug-of-war bar and text displays
✅ **Clean shutdown** - Properly stops polling in all screen transitions

## Testing

✅ **Syntax validation** - JavaScript syntax is valid (no errors with node -c)
✅ **Script inclusion** - Script is properly included in index.html (line 380)
✅ **UI load test** - The polling mechanism doesn't interfere with initial UI loading

## Benefits

1. **No refresh required** - Users see live vote updates automatically
2. **Better UX** - Real-time feedback makes the game feel more engaging
3. **Efficient** - Only polls when on voting screen, stops otherwise
4. **Resilient** - Continues polling even if one request fails
5. **Simple implementation** - Uses standard setInterval with fetch API

## Notes

- Polling interval: 2 seconds (can be adjusted by changing the value at line 290)
- Polling only runs when user is on voting screen
- Uses the existing `calculatePercentage()` helper if backend doesn't provide percentages
- Leverages existing `updateTugOfWar()` function for visual updates
