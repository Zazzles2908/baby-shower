/**
 * Baby Shower Image Service
 * 
 * Provides utilities for managing and serving images from Supabase Storage.
 * Supports responsive images, lazy loading, and performance optimization.
 * 
 * @version 1.0.0
 * @author Baby Shower 2026 Team
 */

(function(global) {
  'use strict';

  // Configuration - Replace with your Supabase project details
  const CONFIG = {
    SUPABASE_URL: import.meta.env?.VITE_SUPABASE_URL || 'https://bkszmvfsfgvdwzacgmfz.supabase.co',
    SUPABASE_ANON_KEY: import.meta.env?.VITE_SUPABASE_ANON_KEY || '',
    BUCKET_NAME: 'baby-shower-pictures',
    CDN_ENABLED: true,
    IMAGE_SIZES: {
      thumbnail: { width: 150, height: 150, suffix: 'thumb' },
      small: { width: 400, height: 400, suffix: 'small' },
      medium: { width: 600, height: 600, suffix: 'medium' },
      large: { width: 800, height: 800, suffix: 'large' },
      hero: { width: 1200, height: 630, suffix: 'hero' }
    },
    DEFAULT_SIZE: 'medium',
    FALLBACK_FORMAT: 'png',
    OPTIMIZED_FORMAT: 'webp',
    CACHE_MAX_AGE: 31536000 // 1 year in seconds
  };

  /**
   * Get the base storage URL for Supabase
   */
  function getBaseUrl() {
    return `${CONFIG.SUPABASE_URL}/storage/v1/object/public/${CONFIG.BUCKET_NAME}`;
  }

  /**
   * Get image URL for a specific path and size
   * @param {string} path - Image path within bucket (e.g., 'hero/app_hero_chibi.png')
   * @param {string} size - Size variant (thumbnail, small, medium, large, hero, original)
   * @returns {string} Full URL to the image
   */
  function getImageUrl(path, size = CONFIG.DEFAULT_SIZE) {
    if (!path) {
      console.warn('[ImageService] No path provided');
      return '';
    }

    const baseUrl = getBaseUrl();
    
    // If requesting original, return direct URL
    if (size === 'original' || size === '') {
      return `${baseUrl}/${path}`;
    }

    // Check if size variant exists
    const sizeConfig = CONFIG.IMAGE_SIZES[size];
    if (!sizeConfig) {
      console.warn(`[ImageService] Unknown size: ${size}, using default`);
      return `${baseUrl}/${path}`;
    }

    // Construct path with size suffix
    const pathParts = path.split('/');
    const filename = pathParts.pop();
    const directory = pathParts.join('/');
    const baseName = filename.replace(/\.[^.]+$/, '');
    const extension = filename.split('.').pop();
    
    // Try WebP first, fallback to original extension
    const sizePath = size === CONFIG.DEFAULT_SIZE 
      ? path 
      : `${directory}/${baseName}-${sizeConfig.suffix}.${CONFIG.OPTIMIZED_FORMAT}`;
    
    return `${baseUrl}/${sizePath}`;
  }

  /**
   * Generate responsive srcset string for an image
   * @param {string} path - Image path within bucket
   * @param {string[]} sizes - Array of sizes to include
   * @returns {string} srcset attribute value
   */
  function getResponsiveSrcset(path, sizes = ['small', 'medium', 'large']) {
    if (!path) return '';

    const srcsetParts = sizes.map(size => {
      const url = getImageUrl(path, size);
      const width = CONFIG.IMAGE_SIZES[size]?.width || 400;
      return `${url} ${width}w`;
    });

    return srcsetParts.join(', ');
  }

  /**
   * Get sizes attribute for responsive images
   * @param {string} context - Usage context (hero, card, gallery, icon)
   * @returns {string} sizes attribute value
   */
  function getSizes(context = 'card') {
    const sizes = {
      hero: '(max-width: 768px) 100vw, 1200px',
      card: '(max-width: 768px) 100vw, 400px',
      gallery: '(max-width: 768px) 50vw, 33vw',
      icon: '150px',
      section: '(max-width: 768px) 100vw, 600px'
    };
    return sizes[context] || sizes.card;
  }

  /**
   * Generate complete picture element for art direction
   * @param {string} path - Image path
   * @param {Object} options - Configuration options
   * @returns {string} HTML picture element
   */
  function generatePictureElement(path, options = {}) {
    const {
      alt = '',
      className = '',
      lazy = true,
      context = 'card',
      sizes: customSizes
    } = options;

    if (!path) return '';

    const sizes = customSizes || getSizes(context);
    const srcset = getResponsiveSrcset(path, ['small', 'medium', 'large']);
    const fallbackUrl = getImageUrl(path, 'medium');
    const loading = lazy ? 'lazy' : 'eager';
    const decoding = lazy ? 'async' : 'sync';

    return `
      <picture>
        <source srcset="${srcset}" sizes="${sizes}" type="image/webp">
        <img 
          src="${fallbackUrl}" 
          alt="${alt}"
          class="${className}"
          loading="${loading}"
          decoding="${decoding}"
          width="${CONFIG.IMAGE_SIZES.medium.width}"
          height="${CONFIG.IMAGE_SIZES.medium.height}"
        >
      </picture>
    `;
  }

  /**
   * Preload critical hero image for better LCP
   * @param {string} path - Hero image path
   */
  function preloadHeroImage(path) {
    if (!path) return;

    const heroUrl = getImageUrl(path, 'hero');
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = heroUrl;
    link.type = 'image/webp';
    document.head.appendChild(link);
    
    console.log(`[ImageService] Preloading hero image: ${heroUrl}`);
  }

  /**
   * Setup lazy loading for all images with data-src attribute
   */
  function setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.dataset.src;
            const srcset = img.dataset.srcset;

            if (src) {
              img.src = src;
              img.classList.add('loaded');
              img.removeAttribute('data-src');
            }

            if (srcset) {
              img.srcset = srcset;
              img.removeAttribute('data-srcset');
            }

            observer.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });

      console.log('[ImageService] Lazy loading observer initialized');
    } else {
      console.warn('[ImageService] IntersectionObserver not supported, using fallback');
      document.querySelectorAll('img[data-src]').forEach(img => {
        img.src = img.dataset.src;
      });
    }
  }

  /**
   * Add loading skeleton to image element
   * @param {string} selector - CSS selector for image container
   */
  function addImageSkeleton(selector = '.image-wrapper') {
    document.querySelectorAll(`${selector} img`).forEach(img => {
      img.parentElement.classList.add('loading');
      
      img.addEventListener('load', () => {
        img.parentElement.classList.remove('loading');
        img.parentElement.classList.add('loaded');
      });

      img.addEventListener('error', () => {
        img.parentElement.classList.remove('loading');
        img.parentElement.classList.add('error');
      });
    });
  }

  /**
   * Get image metadata (for database storage)
   * @param {string} path - Image path
   * @returns {Object} Image metadata
   */
  function getImageMetadata(path) {
    const sizeConfig = CONFIG.IMAGE_SIZES;
    const variants = Object.keys(sizeConfig).map(size => ({
      size,
      width: sizeConfig[size].width,
      height: sizeConfig[size].height,
      url: getImageUrl(path, size)
    }));

    return {
      path,
      originalUrl: getImageUrl(path, 'original'),
      variants,
      cdnUrl: getBaseUrl(),
      bucket: CONFIG.BUCKET_NAME,
      optimizedFormat: CONFIG.OPTIMIZED_FORMAT,
      cacheMaxAge: CONFIG.CACHE_MAX_AGE
    };
  }

  /**
   * Fallback handler for failed image loads
   * @param {string} emoji - Fallback emoji
   * @param {string} alt - Alt text
   */
  function handleImageError(emoji = '🖼️', alt = 'Image') {
    return {
      emoji,
      alt,
      fallback: true
    };
  }

  /**
   * Image path mapping for the baby shower app
   */
  const IMAGE_PATHS = {
    // Hero images
    hero: {
      chibi: 'hero/app_hero_chibi.png',
      anime: 'hero/app_hero_anime.png',
      illustration: 'hero/app_hero_illustration.png',
      pixar: 'hero/app_hero_pixar.png'
    },
    // Couple images
    couple: {
      portrait: 'hero/asset_anime_portrait.png',
      scene: 'hero/asset_anime_scene.png',
      expecting: 'hero/chibi_couple_expecting.png'
    },
    // Baby pictures
    baby: {
      jazeel: {
        newborn: 'gallery/jazeel_baby/chibi_jazeel_newborn_edit.png',
        birthday: 'gallery/jazeel_baby/chibi_jazeel_birthday_edit.png',
        cake: 'gallery/jazeel_baby/chibi_jazeel_cake.png',
        dad: 'gallery/jazeel_baby/chibi_jazeel_dad_couch_edit.png'
      },
      michelle: {
        first_birthday: 'gallery/michelle_baby/chibi_michelle_1st_birthday.png',
        garden: 'gallery/michelle_baby/chibi_michelle_garden.png',
        sisters: 'gallery/michelle_baby/chibi_michelle_sisters.png'
      }
    },
    // Theme decorations
    theme: {
      farm_animals: 'decorations/chibi_farm_animals.png'
    },
    // Icons/Avatars
    icons: {
      jazeel_avatar: 'icons/jazeel_avatar/asset_chibi_avatar_m.png',
      michelle_avatar: 'icons/michelle_avatar/asset_chibi_avatar_f.png',
      heart: 'icons/shared/asset_chibi_heart.png',
      think: 'icons/shared/asset_chibi_think.png',
      win: 'icons/shared/asset_chibi_win.png'
    }
  };

  /**
   * Get URL for a named image
   * @param {string} category - Image category (hero, couple, baby, theme, icons)
   * @param {string} name - Image name within category
   * @param {string} size - Size variant
   * @returns {string} Full image URL
   */
  function getNamedImage(category, name, size = CONFIG.DEFAULT_SIZE) {
    const categoryPaths = IMAGE_PATHS[category];
    if (!categoryPaths) {
      console.warn(`[ImageService] Unknown category: ${category}`);
      return '';
    }

    let path;
    if (category === 'baby') {
      const subCategory = name.split('_')[0]; // jazeel or michelle
      const imageName = name.split('_').slice(1).join('_');
      path = categoryPaths[subCategory]?.[imageName];
    } else {
      path = categoryPaths[name];
    }

    if (!path) {
      console.warn(`[ImageService] Image not found: ${category}/${name}`);
      return '';
    }

    return getImageUrl(path, size);
  }

  /**
   * Initialize image service
   * @param {Object} options - Initialization options
   */
  function init(options = {}) {
    const { lazyLoad = true, preloadHero = true, heroImage = null } = options;

    if (lazyLoad) {
      setupLazyLoading();
    }

    if (preloadHero && heroImage) {
      preloadHeroImage(heroImage);
    }

    console.log('[ImageService] Initialized with CDN:', CONFIG.CDN_ENABLED);
    
    return {
      version: '1.0.0',
      config: CONFIG,
      getImageUrl,
      getResponsiveSrcset,
      getSizes,
      generatePictureElement,
      preloadHeroImage,
      setupLazyLoading,
      getImageMetadata,
      getNamedImage,
      IMAGE_PATHS
    };
  }

  // Export to global scope
  global.ImageService = {
    init,
    getImageUrl,
    getResponsiveSrcset,
    getSizes,
    generatePictureElement,
    preloadHeroImage,
    setupLazyLoading,
    getImageMetadata,
    getNamedImage,
    IMAGE_PATHS,
    CONFIG
  };

})(typeof window !== 'undefined' ? window : global);
