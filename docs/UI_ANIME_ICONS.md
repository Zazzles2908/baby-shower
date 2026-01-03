# Anime Icon System - "Digital Living Room" Character Hosts

**Created:** 2026-01-04
**Purpose:** Transform static UI into warm, character-based hospitality experience
**Status:** ✅ IMPLEMENTED

---

## 🎯 Design Philosophy

The Anime Icon System embodies the "digital living room" concept from AGENTS.md, where guests feel welcomed through **character-based hospitality** rather than form-based transactions.

### Core Principles
- **Warmth over efficiency** - Every interaction feels like a host greeting you
- **Character over components** - Users talk to hosts, not fill forms
- **Motion serves emotion** - Animations enhance feeling, not just decorate
- **Cozy farm theme** - Fits the baby shower's farm/cozy/baby aesthetic

### Three Character Types

1. **Main Hosts** (Mom & Dad) - Primary welcoming characters
2. **Baby Mascot** - Adorable, curious companion
3. **Farm Animals** - Themed decorative characters (Pig, Sheep, Cow, Chicken)

---

## 📋 Character Roster

### Main Hosts

#### Sakura Mom
- **Role:** Hostess
- **Personality:** Warm, nurturing, encouraging
- **Colors:**
  - Primary: Soft Pink `#FF69B4`
  - Secondary: Light Pink `#FFB6C1`
  - Accent: Gold `#FFD700`
  - Skin: Bisque `#FFE4C4`
  - Eyes: Soft Purple `#6B5B95`
- **Emotions:** Happy, Excited, Thinking, Surprised, Proud, Celebrating, Welcoming, Loving
- **Phrases:**
  - "Welcome, dear guest! 🌸"
  - "Oh my, what lovely energy! ✨"
  - "Let me help you get comfortable~"
  - "So excited to have you here!"
  - "Your kindness warms my heart! 💖"

#### Takeshi Dad
- **Role:** Host
- **Personality:** Playful, fun, enthusiastic
- **Colors:**
  - Primary: Royal Blue `#4169E1`
  - Secondary: Sky Blue `#87CEEB`
  - Accent: Gold `#FFD700`
  - Skin: Wheat `#F5DEB3`
  - Eyes: Dark Slate Gray `#2F4F4F`
- **Emotions:** Happy, Excited, Thinking, Surprised, Proud, Celebrating, Welcoming, Funny
- **Phrases:**
  - "Hey there, awesome guest! 🌟"
  - "Let fun begin! 🎮"
  - "You're gonna love this!"
  - "Best day ever, right?!"
  - "High five for being here! ✋"

### Baby Mascot

#### Mochi Baby
- **Role:** Mascot
- **Personality:** Curious, adorable, innocent
- **Colors:**
  - Primary: Light Pink `#FFB6C1`
  - Secondary: Lavender `#E6E6FA`
  - Accent: Gold `#FFD700`
  - Skin: Lavender Blush `#FFF0F5`
  - Eyes: Blue `#4169E1`
- **Emotions:** Happy, Excited, Curious, Sleepy, Hungry, Playful, Loving, Surprised
- **Phrases:**
  - "Mochi happy! 🍡"
  - "Sparkle sparkle~ ✨"
  - "Baby love you! 💕"
  - "So many exciting things!"
  - "Welcome to baby world! 🌟"

### Farm Animals

#### Piggy-Chan (Pig)
- **Role:** Decorative
- **Personality:** Cute, bubbly, loving
- **Colors:** Light Pink `#FFB6C1`, Accent: Hot Pink `#FF69B4`
- **Emoji:** 🐷

#### Mimi Sheep (Sheep)
- **Role:** Decorative
- **Personality:** Gentle, soft, kind
- **Colors:** White Smoke `#F5F5F5`, Accent: Lavender `#E6E6FA`
- **Emoji:** 🐑

#### Moo-Moo (Cow)
- **Role:** Decorative
- **Personality:** Calm, wise, nurturing
- **Colors:** White `#FFFFFF`, Accent: Black `#000000`
- **Emoji:** 🐄

#### Chick-Chan (Chicken)
- **Role:** Decorative
- **Personality:** Energetic, cheerful, helpful
- **Colors:** Gold `#FFD700`, Accent: Orange `#FFA500`
- **Emoji:** 🐔

---

## 🎨 Visual Design

### Chibi Style Proportions
- **Head Scale:** 1.0 (exaggerated large head)
- **Body Scale:** 0.7 (small body)
- **Eye Size:** Large (expressive eyes)
- **Expression:** Exaggerated emotions

### SVG Architecture
All characters are rendered as lightweight SVGs with:
- **Semantic grouping:** Hair, face, eyes, mouth, blush
- **Layering:** Proper z-index for overlapping elements
- **Filters:** Drop shadows for depth
- **Animations:** CSS transforms for smooth motion

### Color System
Characters use the baby shower's cohesive color palette:
- **Primary:** Sage Green `#9CAF88`
- **Secondary:** Soft Gold `#F4E4BC`
- **Accent:** Soft Peach `#E8C4A0`
- **Backgrounds:** Warm Cream `#FFF8E7`
- **Text:** Warm Brown `#3A3326`

---

## 💫 Animation System

### Emotion Animations
| Emotion | Duration | Description |
|---------|-----------|-------------|
| Happy | 500ms | Gentle smile scaling |
| Excited | 300ms | Quick bounce |
| Thinking | 1500ms | Slow nodding motion |
| Surprised | 400ms | Eye pulse |
| Proud | 600ms | Puff up effect |
| Celebrating | 800ms | Full spin |
| Welcoming | 1000ms | Side-to-side wave |
| Loving | 800ms | Heart beat |

### Interactive Animations
| Animation | Duration | Trigger |
|-----------|-----------|---------|
| Hover Bounce | 0.5s | Mouse enter |
| Click Reaction | 0.4s | Button click |
| Success Celebration | 1.2s | Form success |
| Error Shake | 0.5s | Validation error |
| Loading Pulse | 1.5s infinite | API request |

### Ambient Animations
| Animation | Duration | Purpose |
|-----------|-----------|---------|
| Float | 4s infinite | Floating decorations |
| Sparkle | 1.5s infinite | Character sparkles |
| Avatar Glow | 3s infinite | Host avatar glow |
| Banner Shimmer | 3s infinite | Welcome banner |

---

## 📐 Size Variants

| Size | Pixels | Use Case |
|------|---------|----------|
| Tiny | 24px | Inline icons, buttons |
| Small | 32px | Form labels, compact cards |
| Medium | 48px | Activity cards, default |
| Large | 64px | Host avatars, headers |
| XLarge | 96px | Hero sections, welcome |
| Hero | 128px | Main banners, game selection |

---

## 🎮 Implementation Guide

### Basic Usage

```javascript
// Create a character icon
const characterHTML = AnimeCharacters.createCharacterIcon(
    'mom',           // character ID
    'medium',        // size
    'welcoming'      // emotion
);

// Insert into DOM
element.innerHTML = characterHTML;
```

### Emotion States

```javascript
// Update character emotion
const characterEl = document.querySelector('[data-character="mom"]');
AnimeCharacters.setEmotion(characterEl, 'happy');
```

### Speech Bubbles

```javascript
// Create speech bubble
const bubbleHTML = AnimeCharacters.createSpeechBubble(
    'Welcome, dear guest!',
    'mom'
);
element.innerHTML += bubbleHTML;
```

### Loading States

```javascript
// Show loading
AnimeCharacters.showLoading(characterEl);

// Hide loading
AnimeCharacters.hideLoading(characterEl);
```

### Error States

```javascript
// Show error
AnimeCharacters.showError(characterEl);
```

---

## 🌐 Integration Points

### 1. Welcome Banner
**Location:** Top of welcome section
**Characters:** Sakura Mom (large, welcoming emotion)
**Purpose:** First impression, warm greeting

```html
<div class="anime-welcome-banner">
    <div class="anime-welcome-character">
        <!-- Mom character, xlarge size, welcoming emotion -->
    </div>
    <div class="anime-welcome-content">
        <h2>Welcome to Our Baby Shower!</h2>
        <p>We're so excited to celebrate with you!</p>
    </div>
</div>
```

### 2. Host Section
**Location:** Below activities heading
**Characters:** Sakura Mom & Takeshi Dad (large size)
**Purpose:** Ongoing hospitality, welcoming presence

```html
<div class="anime-host-container">
    <div class="anime-host-avatar">
        <!-- Mom or Dad character -->
    </div>
    <div class="anime-host-content">
        <div class="anime-host-name">Character Name ✨</div>
        <div class="anime-host-role">Role</div>
        <p class="anime-host-message">Random phrase</p>
    </div>
</div>
```

### 3. Activity Cards
**Location:** Main activity buttons
**Characters:** Character mapped to each activity
**Purpose:** Visual identity for each activity

| Activity | Character |
|----------|-----------|
| Guestbook | Mom |
| Pool | Dad |
| Quiz | Baby |
| Advice | Mom |
| Voting | Baby |
| Mom vs Dad | Dad |

### 4. Floating Decorations
**Location:** Corners of welcome section
**Characters:** Baby, Pig, Sheep, Chicken (medium size)
**Purpose:** Playful atmosphere, farm theme reinforcement

```html
<div class="anime-floating-character top-left medium">
    <!-- Baby character -->
</div>
```

### 5. Mom vs Dad Game
**Location:** Game selection screen
**Characters:** Mom & Dad (xlarge size)
**Purpose:** Team selection, game identity

```html
<div class="anime-selection-options">
    <div class="anime-selection-option" data-choice="mom">
        <!-- Mom character, xlarge -->
        <span>Team Mom</span>
    </div>
    <div class="anime-selection-option" data-choice="dad">
        <!-- Dad character, xlarge -->
        <span>Team Dad</span>
    </div>
</div>
```

---

## 🎨 CSS Classes Reference

### Character Container
```css
.anime-character               /* Base class */
.anime-character.tiny         /* 24px */
.anime-character.small        /* 32px */
.anime-character.medium       /* 48px (default) */
.anime-character.large        /* 64px */
.anime-character.xlarge       /* 96px */
.anime-character.hero         /* 128px */
```

### Emotion States
```css
.anime-character.emotion-happy
.anime-character.emotion-excited
.anime-character.emotion-thinking
.anime-character.emotion-surprised
.anime-character.emotion-proud
.anime-character.emotion-celebrating
.anime-character.emotion-welcoming
.anime-character.emotion-loving
```

### State Classes
```css
.anime-character.state-loading     /* Loading state */
.anime-character.state-success    /* Success state */
.anime-character.state-error      /* Error state */
.anime-character.interactive      /* Clickable */
.anime-character.clicked         /* Click reaction */
```

### Component Classes
```css
.anime-speech-bubble           /* Speech bubble */
.anime-host-container          /* Host section */
.anime-host-avatar            /* Host avatar */
.anime-host-content           /* Host text */
.anime-welcome-banner          /* Welcome banner */
.anime-floating-character      /* Floating decoration */
.anime-character-selection    /* Game selection */
.anime-selection-option       /* Selection option */
```

---

## 🔧 Configuration

### Adding New Characters

Add to `scripts/config.js` under `ANIME_CHARACTERS`:

```javascript
ANIME_CHARACTERS: {
    // Existing characters...

    newCharacter: {
        id: 'new-id',
        name: 'Character Name',
        role: 'host/mascot/decorative',
        personality: 'adjective, adjective, adjective',
        colors: {
            primary: '#HEX',
            secondary: '#HEX',
            accent: '#HEX',
            skin: '#HEX',
            eyes: '#HEX'
        },
        emotions: {
            happy: '😊',
            excited: '😆',
            // ... more emotions
        },
        phrases: [
            "Phrase 1",
            "Phrase 2"
        ]
    }
}
```

### Customizing Animations

Modify animation speeds in `scripts/config.js`:

```javascript
ANIME_ICONS: {
    animations: {
        idle: 3000,      // ms
        happy: 500,
        excited: 300,
        thinking: 1500,
        surprised: 400,
        celebrate: 800
    }
}
```

---

## ♿ Accessibility

### ARIA Support
- All anime characters have `role="img"` for screen readers
- Emotion states conveyed through `aria-label` updates
- Animated elements respect `prefers-reduced-motion`

### Keyboard Navigation
- Interactive characters are focusable with `tabindex="0"`
- Enter/Space triggers character interaction
- Escape closes character speech bubbles

### Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
    .anime-character,
    .anime-character svg {
        animation: none !important;
        transition: none !important;
    }
}
```

---

## 📱 Responsive Design

### Breakpoints
- **Desktop:** > 768px - Full host section, all floating characters
- **Tablet:** 481px - 768px - Stacked hosts, fewer floating characters
- **Mobile:** ≤ 480px - Simplified hosts, no floating characters

### Mobile Optimizations
```css
@media (max-width: 600px) {
    .anime-host-container {
        flex-direction: column;    /* Stack avatar and text */
        text-align: center;         /* Center content */
    }

    .anime-floating-character {
        display: none;             /* Hide decorations */
    }

    .anime-character.xlarge {
        max-width: 96px;           /* Reduce hero size */
    }
}
```

---

## 🚀 Performance

### Optimization Strategies

1. **SVG Rendering**
   - Lightweight vector graphics (no raster images)
   - CSS transforms instead of JS animations
   - Hardware-accelerated transforms

2. **Animation Efficiency**
   - `transform` and `opacity` only (no layout thrashing)
   - `will-change` hint for GPU acceleration
   - Reduced motion support disables animations

3. **Lazy Loading**
   - Characters initialized on DOM ready
   - Speech bubbles created on demand
   - Floating decorations optional

### File Size Impact
- **anime-characters.js:** ~12KB (minified)
- **CSS additions:** ~8KB (minified)
- **Total overhead:** ~20KB

---

## 🎯 Usage Examples

### Example 1: Welcome Message
```javascript
// Create welcome banner with Mom character
const banner = `
    <div class="anime-welcome-banner">
        <div class="anime-welcome-character">
            ${AnimeCharacters.createCharacterIcon('mom', 'xlarge', 'welcoming')}
        </div>
        <div class="anime-welcome-content">
            <h2>Welcome to Our Baby Shower! 🌸</h2>
            <p>${AnimeCharacters.getRandomPhrase('mom')}</p>
        </div>
    </div>
`;
document.querySelector('.hero-section').insertAdjacentHTML('afterbegin', banner);
```

### Example 2: Activity Card Enhancement
```javascript
// Enhance activity card with character
const activityCard = document.querySelector('[data-section="guestbook"]');
const cardIcon = activityCard.querySelector('.card-icon');
cardIcon.innerHTML = AnimeCharacters.createCharacterIcon('mom', 'large', 'happy');
```

### Example 3: Success Feedback
```javascript
// Show celebration on form success
function showSuccess() {
    const characterEl = document.querySelector('[data-character="mom"]');
    AnimeCharacters.setEmotion(characterEl, 'celebrating');

    // Create confetti
    if (window.MomVsDadEnhanced && window.MomVsDadEnhanced.triggerFloatingParticles) {
        window.MomVsDadEnhanced.triggerFloatingParticles('confetti', 20);
    }
}
```

### Example 4: Game Character Selection
```javascript
// Handle character selection in Mom vs Dad game
document.querySelectorAll('.anime-selection-option').forEach(option => {
    option.addEventListener('click', () => {
        // Remove selected from all
        document.querySelectorAll('.anime-selection-option').forEach(opt => {
            opt.classList.remove('selected');
            const char = opt.querySelector('.anime-character');
            AnimeCharacters.setEmotion(char, 'happy');
        });

        // Add selected to clicked
        option.classList.add('selected');
        const char = option.querySelector('.anime-character');
        AnimeCharacters.setEmotion(char, 'excited');
    });
});
```

---

## 📚 API Reference

### AnimeCharacterManager

#### Methods

##### `init()`
Initialize anime character system. Called automatically on DOM ready.

```javascript
AnimeCharacters.init();
```

##### `createCharacterIcon(characterId, size, emotion)`
Create anime character icon HTML string.

**Parameters:**
- `characterId` (string): Character ID ('mom', 'dad', 'baby', 'pig', etc.)
- `size` (string): Size class ('tiny', 'small', 'medium', 'large', 'xlarge', 'hero')
- `emotion` (string): Emotion state ('happy', 'excited', 'thinking', etc.)

**Returns:** HTML string

```javascript
const icon = AnimeCharacters.createCharacterIcon('mom', 'medium', 'welcoming');
```

##### `setEmotion(element, emotion)`
Update character emotion state.

**Parameters:**
- `element` (HTMLElement): Character DOM element
- `emotion` (string): New emotion state

```javascript
AnimeCharacters.setEmotion(characterEl, 'excited');
```

##### `createSpeechBubble(message, characterId)`
Create speech bubble HTML string.

**Parameters:**
- `message` (string): Bubble text content
- `characterId` (string): Character ID

**Returns:** HTML string

```javascript
const bubble = AnimeCharacters.createSpeechBubble('Hello!', 'mom');
```

##### `showLoading(element)`
Show loading state on character.

```javascript
AnimeCharacters.showLoading(characterEl);
```

##### `hideLoading(element)`
Hide loading state on character.

```javascript
AnimeCharacters.hideLoading(characterEl);
```

##### `showError(element)`
Show error animation on character.

```javascript
AnimeCharacters.showError(characterEl);
```

##### `getRandomPhrase(characterId)`
Get random welcome phrase for character.

**Parameters:**
- `characterId` (string): Character ID

**Returns:** Phrase string

```javascript
const phrase = AnimeCharacters.getRandomPhrase('mom');
```

---

## 🎨 Customization Guide

### Changing Character Colors
Edit color hex values in `scripts/config.js`:

```javascript
mom: {
    colors: {
        primary: '#FF69B4',      // Change to your color
        secondary: '#FFB6C1',
        // ... etc
    }
}
```

### Adding Custom Emotions
1. Add emotion to character config
2. Create CSS animation in `animations.css`
3. Map emotion in `getEyeStyle()` and `getMouthStyle()`

```css
@keyframes customEmotion {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.2); }
}

.anime-character.emotion-custom {
    animation: customEmotion 0.6s ease-out;
}
```

### Creating New Character Types

1. Add character config to `ANIME_CHARACTERS`
2. If human: Create SVG rendering in `createChibiSVG()`
3. If animal: Use `createFarmAnimalSVG()` with emoji
4. Add character to appropriate UI sections

---

## 📊 Testing Checklist

### Visual Testing
- [ ] Characters render correctly on all pages
- [ ] All emotions display properly
- [ ] Animations run smoothly
- [ ] Size variants scale correctly
- [ ] Color palette matches theme

### Interactive Testing
- [ ] Hover effects trigger
- [ ] Click reactions work
- [ ] Emotion changes respond to user actions
- [ ] Speech bubbles appear/disappear correctly

### Responsive Testing
- [ ] Desktop (>768px): Full layout
- [ ] Tablet (481-768px): Stacked layout
- [ ] Mobile (≤480px): Simplified layout
- [ ] Floating characters hide on mobile

### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Screen readers announce characters
- [ ] Reduced motion preference respected
- [ ] Color contrast meets WCAG AA

### Performance Testing
- [ ] Page load time < 2s
- [ ] Animation framerate > 30fps
- [ ] No layout thrashing
- [ ] Memory usage stable

---

## 🔗 Related Documentation

- **AGENTS.md** - Design philosophy and character-based hospitality concept
- **animations.css** - Animation system reference
- **main.css** - Color palette and theming
- **mom-vs-dad.js** - Game character integration

---

## 📝 Changelog

### Version 1.0 (2026-01-04)
- ✅ Initial implementation
- ✅ 3 main characters (Mom, Dad, Baby)
- ✅ 4 farm animal characters
- ✅ 8 emotion states per character
- ✅ 6 size variants
- ✅ Welcome banner integration
- ✅ Host section integration
- ✅ Activity card enhancement
- ✅ Mom vs Dad game selection
- ✅ Floating decorations
- ✅ Speech bubble system
- ✅ Loading/error states
- ✅ Responsive design
- ✅ Accessibility support
- ✅ Reduced motion preference

---

## 💡 Future Enhancements

### Planned Features
- [ ] Voice lines for characters (optional)
- [ ] Seasonal outfits (Christmas, Halloween)
- [ ] Achievement unlocks (new character skins)
- [ ] Character interaction mini-games
- [ ] Custom character creation
- [ ] Character friendship system
- [ ] Animated SVG (SMIL) support
- [ ] 3D character rendering (WebGL)

### Community Contributions
- [ ] User-submitted character designs
- [ ] Custom emotion animations
- [ ] Translation support for phrases
- [ ] Theme-specific character variants

---

**Document Version:** 1.0
**Last Updated:** 2026-01-04
**Maintained By:** UI Builder System
