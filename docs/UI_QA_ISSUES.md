# Baby Shower 2026 Web App - Comprehensive UI QA Report

**Date:** January 4, 2026  
**App URL:** https://baby-shower-qr-app.vercel.app/  
**Version:** v2026010201  
**QA Performed By:** Automated QA System  
**Environment:** Production (Vercel Deployment)

---

## Executive Summary

The Baby Shower 2026 web app has several critical visual and functional issues that need to be addressed before the event. The most pressing issues are:

1. **Backend Infrastructure Issues**: DNS resolution failures for Supabase storage images (wrong project URL being used)
2. **Icon/Character Enhancement Issues**: Activity card icons were enhanced with anime characters + sparkles instead of being removed as requested
3. **Visual Degradation**: Ghost placeholder elements (sparkle ✨ icons) appearing when images fail to load
4. **CORS Configuration**: Cross-origin resource sharing errors blocking API functionality

**Overall Assessment:** The app is functionally operational but has significant visual polish issues that degrade the user experience. Critical infrastructure fixes needed immediately.

---

## Critical Issues (Must Fix Before Event)

### 🔴 CRIT-001: Supabase Storage DNS Resolution Failure

**Location:** Global - All image loading from old Supabase project  
**Severity:** CRITICAL  
**Status:** Broken

**Issue Description:**
All images are attempting to load from the wrong Supabase storage project (`zrqjzjhxylsogkcbpshs.supabase.co`) instead of the correct project (`bkszmvfsfgvdwzacgmfz.supabase.co`). This results in DNS resolution failures.

**Current Behavior:**
```
Failed to load resource: net::ERR_NAME_NOT_RESOLVED @ https://zrqjzjhxylsogkcbpshs.supabase.co/storage/v1/object/public/baby_content/...
```

**Affected Components:**
- Hero image on landing page
- Partner avatars (Michelle & Jazeel)
- Baby photo decorations  
- All activity card background images
- Section decoration images (corner decorations)
- Footer gallery images
- Gallery timeline images

**Expected Behavior:**
All images should load successfully from the correct Supabase storage bucket.

**Root Cause:**
The image service configuration is pointing to the old Supabase project URL. Only the anime-characters.js component has been updated to use the correct URLs.

**Suggested Fix:**
1. Update all Supabase storage URLs from `zrqjzjhxylsogkcbpshs.supabase.co` to `bkszmvfsfgvdwzacgmfz.supabase.co`
2. Update the bucket name from `baby_content` to `baby-shower-pictures` (as used in anime-characters.js)
3. Update environment variables for consistency
4. Verify all image paths match the actual storage structure

**Files to Modify:**
- `scripts/image-service.js` - Update BASE_URL and storage configuration
- `scripts/gallery.js` - Update image paths in GALLERY_ITEMS and ACTIVITY_BACKGROUNDS
- `index.html` - Update all hardcoded image URLs in HTML

---

### 🔴 CRIT-002: CORS Error Blocking API Functionality

**Location:** Voting API and other Supabase Edge Functions  
**Severity:** CRITICAL  
**Status:** Partially Broken

**Issue Description:**
Cross-origin resource sharing (CORS) errors prevent the frontend from accessing Supabase Edge Functions.

**Current Behavior:**
```
Access to fetch at 'https://bkszmvfsfgvdwzacgmfz.supabase.co/functions/v1/vote' from origin 'https://baby-shower-qr-app.vercel.app' has been blocked by CORS policy
```

**Impact:**
- Voting functionality cannot fetch initial vote counts (falls back to realtime only)
- Potential issues with other API functionality
- Degraded user experience for name voting feature

**Root Cause:**
Missing CORS headers in Edge Function configuration.

**Suggested Fix:**
1. Add proper CORS headers to all Supabase Edge Functions:
   ```typescript
   const corsHeaders = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
   }
   ```
2. Handle OPTIONS preflight requests in all functions
3. Configure Edge Function CORS settings in Supabase dashboard

**Files to Modify:**
- `supabase/functions/vote/index.ts` - Add CORS headers
- All other Edge Function files - Add CORS headers

---

### 🔴 CRIT-003: Activity Card Icons Not Removed (Enhanced Instead)

**Location:** Landing page activity cards  
**Severity:** CRITICAL  
**Status:** Visual Issue

**Issue Description:**
Instead of removing icons from activity card titles as requested, the system enhanced them with anime character images + sparkle effects, creating visual clutter and confusion.

**Current Behavior:**
Each activity card has:
- Anime character image (img element)
- 4 sparkle ✨ elements
- Card title and subtitle below

**Expected Behavior:**
Activity cards should display only the card title and subtitle, without icons/images overlaying the background.

**Root Cause:**
The anime-characters.js script's `enhanceActivityCards()` function (line 334-358) replaces emoji icons with character images + sparkles instead of removing them.

**Code Causing Issue:**
```javascript
// scripts/anime-characters.js lines 350-356
if (cardIcon) {
    const animeIcon = this.createCharacterIcon(characterId, 'large', 'happy');
    cardIcon.innerHTML = animeIcon;  // This replaces emoji with image + sparkles
    cardIcon.classList.add('anime-character-wrapper');
}
```

**Suggested Fix:**
Modify the `enhanceActivityCards()` function to either:
1. Remove the `.card-icon` element entirely
2. Clear the `.card-icon` innerHTML to be empty
3. Comment out the function call in the initialization

**Files to Modify:**
- `scripts/anime-characters.js` - Update enhanceActivityCards() function

---

## High Priority Issues

### 🟠 HIGH-001: Ghost Placeholder Elements (Sparkle ✨ Icons)

**Location:** Activity cards, partner avatars, and all character image containers  
**Severity:** HIGH  
**Status:** Visual Issue

**Issue Description:**
When anime character images fail to load, users see multiple sparkle ✨ emoji elements as ghost placeholders, creating visual clutter.

**Current Behavior:**
Each character image container includes 4 sparkle elements:
```html
<div class="anime-character large emotion-happy" data-character="mom" data-emotion="happy">
    <img src="..." alt="..." class="anime-character-image" />
    <div class="anime-sparkle">✨</div>
    <div class="anime-sparkle">✨</div>
    <div class="anime-sparkle">✨</div>
    <div class="anime-sparkle">✨</div>
</div>
```

**Expected Behavior:**
If images fail to load, fall back gracefully to emoji or remove the container entirely. No ghost placeholder elements should be visible.

**Root Cause:**
The `createCharacterIcon()` function in anime-characters.js always includes sparkle elements regardless of whether images load successfully.

**Suggested Fix:**
1. Hide sparkle elements when images load successfully
2. Hide sparkle elements when images fail to load
3. Add CSS to manage sparkle visibility
4. Implement proper fallback behavior

**Files to Modify:**
- `scripts/anime-characters.js` - Update createCharacterIcon() function
- `styles/animations.css` or `styles/main.css` - Add sparkle visibility rules

---

### 🟠 HIGH-002: Activity Card Background Images Not Loading

**Location:** All 7 activity cards on landing page  
**Severity:** HIGH  
**Status:** Broken

**Issue Description:**
Activity card background images are not loading due to the Supabase DNS issue, making cards appear incomplete.

**Current Behavior:**
Cards show only the character image and sparkles without the intended background imagery.

**Expected Behavior:**
Each activity card should display a themed background image:
- Guestbook: Couple chibi illustration
- Pool: Farm animals theme
- Quiz: Michelle character image
- Advice: Win/celebration image
- Voting: Another Michelle character
- Mom vs Dad: Couple portrait

**Root Cause:**
The `setupActivityCardBackgrounds()` function uses the wrong Supabase URL.

**Code Reference:**
```javascript
// scripts/gallery.js lines 206-219
const ACTIVITY_BACKGROUNDS = {
    guestbook: 'Pictures/Michelle_Jazeel/app_hero_chibi.png',
    pool: 'Pictures/Theme/chibi_farm_animals.png',
    // ... other entries
};
```

**Suggested Fix:**
1. Update ACTIVITY_BACKGROUNDS paths to use correct Supabase configuration
2. Ensure ImageService.getImageUrl() returns correct URLs
3. Verify bucket name and project ID in configuration

**Files to Modify:**
- `scripts/gallery.js` - Update ACTIVITY_BACKGROUNDS paths
- `scripts/image-service.js` - Verify URL generation logic

---

### 🟠 HIGH-003: Partner Avatars Not Displaying

**Location:** Landing page hero section (Michelle & Jazeel avatars)  
**Severity:** HIGH  
**Status:** Broken

**Issue Description:**
The main partner avatars in the hero section are not displaying, breaking the landing page visual design.

**Current Behavior:**
Avatar image containers are empty or showing broken image icons.

**Expected Behavior:**
Michelle and Jazeel chibi avatars should display prominently in the hero section.

**Root Cause:**
Same Supabase DNS resolution issue affecting all images.

**Files to Modify:**
- `index.html` - Lines 32, 39 (hardcoded avatar URLs)

---

### 🟠 HIGH-004: Baby Photo Decorations Missing

**Location:** Landing page hero section (Baby Michelle & Baby Jazeel photos)  
**Severity:** HIGH  
**Status:** Broken

**Issue Description:**
Baby photo decorations in the hero section are not displaying.

**Current Behavior:**
Baby Michelle and Baby Jazeel photo containers are empty or showing broken images.

**Expected Behavior:**
Two baby photos should display as decorative elements in the hero section.

**Root Cause:**
Supabase DNS resolution issue.

**Files to Modify:**
- `index.html` - Lines 51, 52 (hardcoded baby photo URLs)

---

## Medium Priority Issues

### 🟡 MED-001: Activity Card Visual Overlap

**Location:** All activity cards on landing page  
**Severity:** MEDIUM  
**Status:** Visual Issue

**Issue Description:**
Character images and sparkle elements overlap with card titles and subtitles, creating visual clutter.

**Current Behavior:**
Each activity card displays:
1. Background image (not loading)
2. Character image (replaces icon)
3. Sparkle elements (4x ✨)
4. Card title
5. Card subtitle

**Expected Behavior:**
Activity cards should have clean visual hierarchy with clear separation between icon/title and background.

**Root Cause:**
The anime character enhancement was applied to all cards without considering visual layout.

**Suggested Fix:**
1. Remove character images from card icons
2. Adjust CSS to properly layer card elements
3. Ensure text remains readable over backgrounds

**Files to Modify:**
- `styles/main.css` - Update activity-card styling
- `scripts/anime-characters.js` - Modify or disable enhancement

---

### 🟡 MED-002: Section Decoration Images Not Loading

**Location:** All game/section pages (Guestbook, Pool, Quiz, Advice, Voting, Mom vs Dad, Who Would Rather)  
**Severity:** MEDIUM  
**Status:** Broken

**Issue Description:**
Corner decoration images on individual section pages are not displaying.

**Current Behavior:**
Section pages show empty decoration image containers.

**Expected Behavior:**
Each section should have themed corner decorations:
- Guestbook: Farm animals, win, think, heart icons
- Pool: Couple, Baby Michelle, Baby Jazeel images
- Quiz: Michelle character images
- Advice: Floral borders (CSS-based, should work)
- Voting: Heart and couple illustrations
- Mom vs Dad: Baby and couple images
- Who Would Rather: Couple and baby images

**Root Cause:**
Supabase DNS resolution issue.

**Files to Modify:**
- `index.html` - Multiple lines (140-149, 186-192, 234-241, 353-363, 382-392, 407-418)

---

### 🟡 MED-003: Footer Gallery Images Not Loading

**Location:** Personalized footer section  
**Severity:** MEDIUM  
**Status:** Broken

**Issue Description:**
Footer gallery images are not displaying.

**Current Behavior:**
Footer photo gallery shows broken images.

**Expected Behavior:**
Footer should display 5 decorative photos:
1. Baby Jazeel
2. Baby Michelle  
3. Couple chibi
4. Baby Michelle garden
5. Baby Jazeel dad couch

**Root Cause:**
Supabase DNS resolution issue.

**Files to Modify:**
- `index.html` - Lines 501-505 (hardcoded footer image URLs)

---

### 🟡 MED-004: Hero Image Not Loading

**Location:** Landing page hero section  
**Severity:** MEDIUM  
**Status:** Broken

**Issue Description:**
The main hero image ("Jazeel and Michelle expecting their baby girl") is not displaying.

**Current Behavior:**
Hero image container shows error/fallback content.

**Expected Behavior:**
Large hero image should display as the main visual element.

**Root Cause:**
Supabase DNS resolution issue.

**Files to Modify:**
- `index.html` - Line 26 (hero image container)
- `scripts/gallery.js` - Line 131 (hero image URL generation)

---

## Low Priority Issues / Nice to Have

### 🟢 LOW-001: Who Would Rather Game Animation Concerns

**Location:** Who Would Rather game section  
**Severity:** LOW  
**Status:** Functionality OK, UX Concern

**Issue Description:**
User reports bouncing animation causing discomfort. Need to verify if animations meet accessibility standards.

**Current Behavior:**
Game animations may include bouncing/movement effects.

**Expected Behavior:**
All animations should be subtle and not cause discomfort. Consider adding:
- Reduced motion preferences
- Animation speed controls
- Pause functionality

**Suggested Fix:**
1. Audit CSS animations for accessibility
2. Add `@media (prefers-reduced-motion)` support
3. Add animation toggle in game settings

---

### 🟢 LOW-002: Mobile Responsiveness Check

**Location:** All sections  
**Severity:** LOW  
**Status:** Needs Verification

**Issue Description:**
Need to verify mobile responsiveness across all sections.

**Current Behavior:**
Not verified during this QA session.

**Expected Behavior:**
App should work well on mobile devices (phones and tablets).

**Suggested Fix:**
1. Test on various screen sizes
2. Verify touch targets are adequate
3. Check for horizontal scrolling issues

---

### 🟢 LOW-003: Activity Ticker Visual Polish

**Location:** Activity ticker component  
**Severity:** LOW  
**Status:** Functional, Visual Improvement Possible

**Issue Description:**
Activity ticker shows "Loading..." state initially.

**Current Behavior:**
Ticker displays loading state briefly on page load.

**Expected Behavior:**
Ticker should show actual live activity data immediately.

**Root Cause:**
Realtime subscription initialization timing.

---

## Backend Issues (Supabase)

### 🔧 BACKEND-001: Supabase Project URL Mismatch

**Issue:** Two different Supabase projects being referenced:
- Old (broken): `zrqjzjhxylsogkcbpshs.supabase.co`
- New (working): `bkszmvfsfgvdwzacgmfz.supabase.co`

**Impact:** All image loading fails from old project

**Fix Required:**
1. Consolidate to single Supabase project
2. Migrate all images to correct bucket
3. Update all URL references

---

### 🔧 BACKEND-002: Edge Function CORS Configuration

**Issue:** Missing CORS headers in Edge Functions

**Impact:** API calls from frontend blocked

**Fix Required:**
1. Add CORS headers to vote function
2. Add CORS headers to all other Edge Functions
3. Handle OPTIONS preflight requests

---

### 🔧 BACKEND-003: Supabase Storage Bucket Structure

**Issue:** Inconsistent bucket naming

**Impact:** Image paths not resolving correctly

**Current Usage:**
- `baby_content` bucket (failing)
- `baby-shower-pictures` bucket (working in anime-characters.js)

**Fix Required:**
1. Standardize bucket name across app
2. Verify folder structure matches expectations
3. Update all path references

---

## Recommended Agent Assignments

### Frontend Fixes (Priority 1)
**Agent:** Frontend UI Specialist

1. **CRIT-001**: Update all Supabase storage URLs
2. **CRIT-003**: Remove character icons from activity cards
3. **HIGH-001**: Fix ghost sparkle placeholders
4. **HIGH-002**: Fix activity card background images

### Backend Fixes (Priority 2)  
**Agent:** Backend/Supabase Specialist

1. **CRIT-002**: Add CORS headers to Edge Functions
2. **BACKEND-001**: Consolidate Supabase project URLs
3. **BACKEND-002**: Configure CORS properly
4. **BACKEND-003**: Standardize storage bucket structure

### Visual/UX Polish (Priority 3)
**Agent:** UI/UX Designer

1. **MED-001**: Fix activity card visual overlap
2. **MED-002**: Section decoration images
3. **MED-003**: Footer gallery images
4. **LOW-001**: Who Would Rather animation accessibility
5. **LOW-002**: Mobile responsiveness verification

---

## Testing Checklist

### Pre-Fix Verification
- [ ] Verify all Supabase storage URLs are documented
- [ ] Document all hardcoded image URLs in HTML
- [ ] List all JavaScript files that reference Supabase
- [ ] Capture current state with screenshots

### Post-Fix Verification
- [ ] Test hero image loads correctly
- [ ] Test partner avatars display
- [ ] Test baby photo decorations
- [ ] Test all 7 activity card backgrounds
- [ ] Test section decoration images
- [ ] Test footer gallery images
- [ ] Test voting API functionality
- [ ] Test activity ticker realtime updates
- [ ] Test mobile responsiveness
- [ ] Test animation accessibility
- [ ] Verify no console errors
- [ ] Test on multiple browsers (Chrome, Safari, Firefox)

### Performance Testing
- [ ] Image loading performance
- [ ] API response times
- [ ] Realtime subscription latency

---

## Detailed File Analysis

### Files Requiring Updates

#### High Priority Updates Needed:
1. **`scripts/image-service.js`** - Central image URL configuration
2. **`scripts/gallery.js`** - Gallery items and activity backgrounds
3. **`scripts/anime-characters.js`** - Character icon generation
4. **`index.html`** - Hardcoded image URLs throughout

#### Medium Priority Updates:
1. **`styles/main.css`** - Activity card styling
2. **`styles/animations.css`** - Animation and sparkle handling
3. **All Edge Function files** - CORS headers

#### Low Priority Review:
1. **`scripts/main.js`** - Navigation and section management
2. **`scripts/voting.js`** - API interaction
3. **Other game scripts** - Quiz, Pool, Advice, Guestbook

---

## Conclusion

The Baby Shower 2026 web app has significant but fixable issues. The critical path forward is:

1. **Immediate**: Fix Supabase storage URL mismatch (CRIT-001)
2. **Immediate**: Fix CORS configuration (CRIT-002)  
3. **High**: Remove character icons from activity cards (CRIT-003)
4. **High**: Fix ghost placeholder elements (HIGH-001)

Once these core issues are resolved, the visual polish issues can be addressed systematically. The underlying functionality (voting, games, guestbook, etc.) appears to be working correctly - the issues are primarily visual and configuration-related.

**Estimated Fix Time:** 4-6 hours for critical issues, 2-3 days for complete polish

**Risk Level:** Medium - configuration changes with broad impact

**Recommended Approach:** Fix critical issues first, then systematically address visual polish items while testing thoroughly at each step.
