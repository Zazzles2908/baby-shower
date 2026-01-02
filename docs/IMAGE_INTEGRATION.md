# Baby Shower 2026 - Image Integration Guide

## Phase 2: Backend/Storage Integration

This document covers the image storage and delivery infrastructure for the Baby Shower 2026 application.

## Overview

Images are hosted on Supabase Storage with CDN delivery for optimal performance. The infrastructure includes:

- **Storage Bucket**: `baby-shower-pictures` (public access)
- **CDN**: Supabase CDN with automatic caching
- **Format**: WebP with PNG fallback for transparency
- **Sizes**: thumbnail, small, medium, large, hero

## Supabase Storage Configuration

### Bucket Details

| Property | Value |
|----------|-------|
| Bucket ID | `baby-shower-pictures` |
| Public Access | Enabled |
| Max File Size | 10MB |
| Allowed Formats | PNG, JPEG, GIF, WebP, SVG, PDF |

### Folder Structure

```
baby-shower-pictures/
├── hero/                    # Hero/couple images
│   ├── app_hero_chibi.png
│   ├── app_hero_anime.png
│   └── ...
├── gallery/
│   ├── jazeel_baby/        # Jazeel's baby pictures
│   └── michelle_baby/      # Michelle's baby pictures
├── decorations/            # Theme decorations
│   └── chibi_farm_animals.png
├── icons/
│   ├── jazeel_avatar/
│   ├── michelle_avatar/
│   └── shared/            # Shared icons (heart, think, win)
└── documents/
    └── Myuna Farm Map.pdf
```

### Access Policies

- **Public Read**: Anyone can view images
- **Admin Write**: Authenticated users can upload/update/delete
- Images are served via public CDN URLs

## Image Service API

### CDN Base URL

```
https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures
```

### JavaScript Usage

```javascript
// Initialize image service
const imageService = ImageService.init({
  lazyLoad: true,
  preloadHero: true,
  heroImage: 'hero/app_hero_chibi.png'
});

// Get image URL for specific size
const heroUrl = imageService.getImageUrl('hero/app_hero_chibi.png', 'hero');

// Generate responsive srcset
const srcset = imageService.getResponsiveSrcset('hero/app_hero_chibi.png', ['small', 'medium', 'large']);

// Get named image
const avatarUrl = imageService.getNamedImage('icons', 'jazeel_avatar', 'medium');

// Generate picture element
const picture = imageService.generatePictureElement('hero/app_hero_chibi.png', {
  alt: 'Jazeel and Michelle chibi illustration',
  className: 'hero-image',
  lazy: false,  // Hero loads immediately
  context: 'hero'
});
```

### Available Sizes

| Size | Width | Height | Use Case |
|------|-------|--------|----------|
| thumbnail | 150px | 150px | Avatars, icons |
| small | 400px | 400px | Mobile cards |
| medium | 600px | 600px | Default, tablets |
| large | 800px | 800px | Desktop cards |
| hero | 1200px | 630px | Hero section (16:9) |

## Image Optimization Scripts

### Prerequisites

```bash
# Install dependencies
npm install sharp axios form-data dotenv
```

### Optimize Images (PNG → WebP + resize)

```bash
# Optimize all images
node scripts/optimize-images.js

# Generate manifest from existing optimized images
node scripts/optimize-images.js manifest
```

Output: `baby_content/Pictures_optimized/` with WebP versions in all sizes.

### Upload to Supabase Storage

```bash
# Upload all optimized images
node scripts/upload-images.js upload

# Verify bucket configuration
node scripts/upload-images.js verify

# Create folder structure only
node scripts/upload-images.js folders
```

### Environment Variables

Create `.env.local` with:

```env
SUPABASE_URL=https://bkszmvfsfgvdwzacgmfz.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

## Performance Optimization

### Loading Strategy

| Content | Loading | Caching |
|---------|---------|---------|
| Hero image | Eager (preloaded) | 1 year |
| Above fold | Eager | 1 year |
| Below fold | Lazy (IntersectionObserver) | 1 year |
| Gallery | Lazy on scroll | 1 year |

### CSS Classes

```html
<!-- Lazy loading wrapper -->
<div class="image-wrapper loading">
    <img data-src="hero/app_hero.png" alt="Description" class="responsive-img">
</div>

<!-- Hero image -->
<div class="hero-image-wrapper">
    <img src="hero/app_hero-hero.webp" alt="Couple illustration" class="img-responsive">
</div>

<!-- Card image -->
<img src="icons/avatar-small.webp" alt="Avatar" class="card-image">

<!-- Avatar -->
<img src="icons/avatar-medium.webp" alt="User" class="avatar">
<img src="icons/avatar-medium.webp" alt="User" class="avatar small">
<img src="icons/avatar-medium.webp" alt="User" class="avatar large">
```

### Image Optimization Classes

Added to `styles/main.css`:

- `.image-wrapper` - Container for lazy loading
- `.image-wrapper.loading` - Loading skeleton state
- `.image-wrapper.loaded` - Image loaded state
- `.image-wrapper.error` - Error state
- `.hero-image-wrapper` - Hero image container
- `.card-image` - Activity card images
- `.gallery-grid` - Gallery layout
- `.gallery-item` - Gallery item
- `.avatar` / `.avatar.small` / `.avatar.large` - Avatar sizes
- `.img-responsive` / `.img-fluid` - Responsive utilities

## CDN Delivery

### Cache Headers

All images include aggressive caching:

```
Cache-Control: public, max-age=31536000, immutable
```

### CDN Regions

Supabase CDN serves from edge locations globally. The Baby project is deployed in `us-east-1`.

### URL Format

```
https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/{path}
```

## Image Inventory

### Total Assets: 28 files

| Category | Count | Description |
|----------|-------|-------------|
| Hero/Couple | 7 | Main hero illustrations |
| Jazeel Baby | 7 | Baby pictures |
| Michelle Baby | 4 | Baby pictures |
| Theme | 1 | Farm animals decoration |
| Icons | 7 | Avatars and emoji replacements |
| Documents | 1 | Venue map PDF |

## Usage in HTML

### Basic Image

```html
<img 
    src="https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/baby-shower-pictures/hero/app_hero_chibi.png"
    alt="Jazeel and Michelle chibi illustration"
    class="img-responsive"
>
```

### Responsive Picture Element

```html
<picture>
    <source 
        srcset="hero/app_hero_chibi-small.webp 400w, hero/app_hero_chibi-medium.webp 600w, hero/app_hero_chibi-large.webp 800w"
        sizes="(max-width: 768px) 100vw, 800px"
        type="image/webp"
    >
    <img 
        src="hero/app_hero_chibi-medium.png"
        alt="Jazeel and Michelle chibi illustration"
        class="img-responsive"
    >
</picture>
```

### Using Image Service

```javascript
// Get optimized URL
const url = ImageService.getImageUrl('hero/app_hero_chibi.png', 'medium');

// Preload hero
ImageService.preloadHeroImage('hero/app_hero_chibi.png');

// Setup lazy loading
ImageService.setupLazyLoading();
```

## Success Criteria

| Metric | Target | Status |
|--------|--------|--------|
| Storage Bucket | Created & configured | ✅ |
| Public Access | RLS policies enabled | ✅ |
| Image Upload | All 27 images + 1 PDF | ⏳ |
| WebP Conversion | All images optimized | ⏳ |
| Responsive Images | srcset implemented | ✅ |
| Lazy Loading | IntersectionObserver | ✅ |
| Hero Preload | LCP optimization | ✅ |
| CDN Delivery | Active & caching | ✅ |

## Next Steps

1. **Run image optimization**: `node scripts/optimize-images.js`
2. **Upload to Supabase**: `node scripts/upload-images.js upload`
3. **Verify CDN delivery**: Check image URLs in browser
4. **GLM-UI Integration**: UI components will use ImageService API

## Troubleshooting

### Images not loading

1. Check browser console for 404 errors
2. Verify bucket policies allow public read
3. Confirm file paths are correct (case-sensitive)

### Slow loading

1. Check CDN cache status (should be HIT)
2. Verify WebP versions are being served
3. Check image file sizes (should be <100KB for thumbnails)

### Upload failures

1. Verify SUPABASE_SERVICE_KEY has admin permissions
2. Check file size < 10MB
3. Confirm file format is allowed
