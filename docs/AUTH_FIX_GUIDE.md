# Mom vs Dad Game - Authentication Fix Guide

## 🔑 **ROOT CAUSE: Legacy JWT Secret**

Your Supabase project is using a **legacy JWT secret**, which is causing 401 Unauthorized errors in the Edge Functions. This is why:
- The functions exist (not 404)
- But reject all requests (returns 401)

## 🛠️ **TWO SOLUTIONS**

### **Solution 1: Migrate to New JWT Secret (15 minutes)**

This is the "proper" fix with full authentication.

**Steps:**
1. Go to Supabase Dashboard: https://database.new/bkszmvfsfgvdwzacgmfz
2. Navigate to: Settings → API → JWT Settings
3. Click **"Rotate JWT Secret"** or **"Generate new secret"**
4. **Check the box** to also rotate the anon key
5. **Copy** the new anon key (starts with `eyJ...`)
6. Update `scripts/config.js` line 22 with the new key
7. Deploy to Vercel
8. Test

**Result:** Full authentication, secure, proper JWT tokens

---

### **Solution 2: Make Functions Public (RECOMMENDED for this app)**

Since this is a baby shower game where guests shouldn't log in, **disable authentication** for the 4 game functions.

**Steps:**
1. Go to Supabase Dashboard: https://database.new/bkszmvfsfgvdwzacgmfz
2. Navigate to: **Edge Functions**
3. For **EACH** of these 4 functions:
   - `game-session`
   - `game-vote`
   - `game-scenario`
   - `game-reveal`
   
   Do this:
   - Click on the function name
   - Find **"Verify JWT"** or **"Authentication"** toggle
   - **Turn it OFF** (disable JWT verification)
   - **Save** changes
   - Wait ~1 minute for redeployment

4. **Test immediately** at: https://baby-shower-qr-app.vercel.app/

**Result:** No authentication needed, guests can join and play immediately!

---

## 🎮 **TEST SESSION READY**

I've created a complete test session for you:

```
Session Code: TESTME
Admin PIN: 1234
Parents: Emma vs Oliver
Status: voting (ready for votes)
```

**After applying the fix:**
1. Visit: https://baby-shower-qr-app.vercel.app/
2. Click: "Mom vs Dad - The Truth Revealed"
3. Enter code: `TESTME`
4. Enter your name
5. Vote mom or dad
6. Login as admin with PIN: `1234`
7. Lock your answer
8. Trigger reveal

## 📊 **CURRENT STATUS**

| Component | Status | Notes |
|-----------|--------|-------|
| Database | ✅ Working | All tables created, data inserted |
| Edge Functions | ✅ Deployed | 4 functions, 401 auth errors |
| Frontend | ✅ Loaded | No JS errors |
| Authentication | ❌ Legacy JWT | Needs fix |
| End-to-End | 🔄 Pending | Awaiting auth fix |

## 🧪 **WHAT'S BEEN TESTED**

All database operations work via SQL:
- ✅ Create sessions
- ✅ Generate scenarios
- ✅ Submit votes
- ✅ Lock parent answers
- ✅ Calculate perception gap
- ✅ Generate roast commentary

The only missing piece is the API calls from the frontend, which are blocked by the legacy JWT.

## 📁 **DOCUMENTATION**

- `docs/GAME_IMPLEMENTATION_SUMMARY.md` - Complete game docs
- `docs/AUTH_FIX_NEEDED.md` - This guide
- `scripts/test-game.sql` - SQL test queries

## 🎯 **RECOMMENDED ACTION**

**Go with Solution 2** (make functions public):
1. Disable `verify_jwt` for the 4 game functions
2. Wait 1 minute for redeployment
3. Test at https://baby-shower-qr-app.vercel.app/
4. Enjoy the game!

This is perfect for a baby shower app where guests should be able to join immediately without logging in.

---

**Need help?** The Supabase Dashboard is at: https://database.new/bkszmvfsfgvdwzacgmfz
