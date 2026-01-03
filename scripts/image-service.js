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

  // Configuration - Updated to support both local files and Supabase Storage
  const CONFIG = {
    // Local file configuration
    USE_LOCAL_FILES: false,  // Changed to false to use Supabase Storage by default
    LOCAL_BASE_PATH: '/baby_content/Pictures',
    
    // Supabase configuration (for fallback or mixed usage)
    SUPABASE_URL: window.ENV?.NEXT_PUBLIC_SUPABASE_URL || 'https://bkszmvfsfgvdwzacgmfz.supabase.co',
    SUPABASE_ANON_KEY: window.ENV?.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    BUCKET_NAME: 'baby-shower-pictures',
    CDN_ENABLED: true, // Set to true for Supabase CDN
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
   * Map expected application paths to actual file system paths
   * Converts virtual paths to real directory structure
   * @param {string} path - The expected application path
   * @returns {string} The actual file system path
   */
  function mapPathToActualLocation(path) {
    if (!path) return path;

    // Define path mappings from expected paths to actual Supabase Storage paths
    // Maps application paths to Supabase Storage structure (Pictures/Icon_Name/)
    const pathMappings = {
      // Hero images: hero/* -> Pictures/Michelle_Jazeel/*
      'hero/': 'Pictures/Michelle_Jazeel/',
      
      // Gallery baby images
      'gallery/jazeel_baby/': 'Pictures/Jazeel_Baby/',
      'gallery/michelle_baby/': 'Pictures/Michelle_Baby/',
      
      // Icons mapping for avatar files (app paths -> Supabase storage paths)
      'icons/avatar_m.png': 'Pictures/Jazeel_Icon/asset_chibi_avatar_m.png',
      'icons/avatar_f.png': 'Pictures/Michelle_Icon/asset_chibi_avatar_f.png',
      'icons/heart.png': 'Pictures/Jazeel&Michelle_Icon/asset_chibi_heart.png',
      'icons/think.png': 'Pictures/Jazeel&Michelle_Icon/asset_chibi_think.png',
      'icons/win.png': 'Pictures/Jazeel&Michelle_Icon/asset_chibi_win.png',
      
      // Handle icon subdirectories used in IMAGE_PATHS
      'icons/jazeel_avatar/': 'Pictures/Jazeel_Icon/',
      'icons/michelle_avatar/': 'Pictures/Michelle_Icon/',
      'icons/shared/': 'Pictures/Jazeel&Michelle_Icon/',
      
      // Theme images
      'theme/': 'Pictures/Theme/',
      
      // Map subdirectory (for event location)
      'map/': 'Pictures/Map/',

      // New Images - Michelle (11 images)
      'new_images/michelle/': 'Pictures/New Images/Michelle/',
      'new_images/michelle/chibi_china_031.png': 'Pictures/New Images/Michelle/chibi_china_031.png',
      'new_images/michelle/chibi_girl_blue_ivy.png': 'Pictures/New Images/Michelle/chibi_girl_blue_ivy.png',
      'new_images/michelle/chibi_girl_red_008.png': 'Pictures/New Images/Michelle/chibi_girl_red_008.png',
      'new_images/michelle/chibi_michelle_cheer.png': 'Pictures/New Images/Michelle/chibi_michelle_cheer.png',
      'new_images/michelle/chibi_michelle_excited_red.png': 'Pictures/New Images/Michelle/chibi_michelle_excited_red.png',
      'new_images/michelle/chibi_michelle_happy_jump.png': 'Pictures/New Images/Michelle/chibi_michelle_happy_jump.png',
      'new_images/michelle/chibi_michelle_surprised.png': 'Pictures/New Images/Michelle/chibi_michelle_surprised.png',
      'new_images/michelle/chibi_michelle_sweet_smile.png': 'Pictures/New Images/Michelle/chibi_michelle_sweet_smile.png',
      'new_images/michelle/chibi_mix_icon_1.png': 'Pictures/New Images/Michelle/chibi_mix_icon_1.png',
      'new_images/michelle/chibi_mix_icon_2.png': 'Pictures/New Images/Michelle/chibi_mix_icon_2.png',
      'new_images/michelle/chibi_mix_icon_3.png': 'Pictures/New Images/Michelle/chibi_mix_icon_3.png',

      // New Images - Jazeel (10 images)
      'new_images/jazeel/': 'Pictures/New Images/Jazeel/',
      'new_images/jazeel/chibi_boy_mix_icon_1.png': 'Pictures/New Images/Jazeel/chibi_boy_mix_icon_1.png',
      'new_images/jazeel/chibi_boy_mix_icon_2.png': 'Pictures/New Images/Jazeel/chibi_boy_mix_icon_2.png',
      'new_images/jazeel/chibi_boy_mix_icon_3.png': 'Pictures/New Images/Jazeel/chibi_boy_mix_icon_3.png',
      'new_images/jazeel/chibi_jazeel_boy_action.png': 'Pictures/New Images/Jazeel/chibi_jazeel_boy_action.png',
      'new_images/jazeel/chibi_jazeel_boy_icon.png': 'Pictures/New Images/Jazeel/chibi_jazeel_boy_icon.png',
      'new_images/jazeel/chibi_jazeel_confused.png': 'Pictures/New Images/Jazeel/chibi_jazeel_confused.png',
      'new_images/jazeel/chibi_jazeel_eating.png': 'Pictures/New Images/Jazeel/chibi_jazeel_eating.png',
      'new_images/jazeel/chibi_jazeel_love.png': 'Pictures/New Images/Jazeel/chibi_jazeel_love.png',
      'new_images/jazeel/chibi_jazeel_sad.png': 'Pictures/New Images/Jazeel/chibi_jazeel_sad.png',
      'new_images/jazeel/chibi_jazeel_think.png': 'Pictures/New Images/Jazeel/chibi_jazeel_think.png',

      // New Images - Duo (1 image)
      'new_images/duo/': 'Pictures/New Images/Duo/',
      'new_images/duo/chibi_duo_highfive.png': 'Pictures/New Images/Duo/chibi_duo_highfive.png'
    };

    // Check for exact matches first, then prefix matches
    for (const [expected, actual] of Object.entries(pathMappings)) {
      // Check if path starts with the expected prefix
      if (path.startsWith(expected)) {
        const mappedPath = path.replace(expected, actual);
        console.log(`[ImageService] Path mapped: "${path}" -> "${mappedPath}"`);
        return mappedPath;
      }
    }

    // No mapping found, return original path
    return path;
  }

  /**
   * Get the base storage URL for Supabase or local files
   */
  function getBaseUrl() {
    if (CONFIG.USE_LOCAL_FILES) {
      // Return local file path base URL
      return CONFIG.LOCAL_BASE_PATH;
    } else {
      // Return Supabase storage URL
      return `${CONFIG.SUPABASE_URL}/storage/v1/object/public/${CONFIG.BUCKET_NAME}`;
    }
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
    
    // For local files, apply path mapping and return direct path without size variants
    if (CONFIG.USE_LOCAL_FILES) {
      const mappedPath = mapPathToActualLocation(path);
      return `${baseUrl}/${mappedPath}`;
    }

    // If requesting original, return direct Supabase URL
    if (size === 'original' || size === '') {
      return `${baseUrl}/${path}`;
    }

    // Check if size variant exists
    const sizeConfig = CONFIG.IMAGE_SIZES[size];
    if (!sizeConfig) {
      console.warn(`[ImageService] Unknown size: ${size}, using default`);
      return `${baseUrl}/${path}`;
    }

    // Construct path with size suffix for Supabase
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
    const mappedPath = CONFIG.USE_LOCAL_FILES ? mapPathToActualLocation(path) : path;
    
    const variants = Object.keys(sizeConfig).map(size => ({
      size,
      width: sizeConfig[size].width,
      height: sizeConfig[size].height,
      url: getImageUrl(mappedPath, size)
    }));

    return {
      path,
      mappedPath,
      originalUrl: getImageUrl(mappedPath, 'original'),
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
      pixar: 'hero/app_hero_pixar.png',
      couple_expecting: 'hero/chibi_couple_expecting.png',
      anime_portrait: 'hero/asset_anime_portrait.png',
      anime_scene: 'hero/asset_anime_scene.png'
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
      },
      // Direct path mapping for gallery items
      jazeel_birthday: 'gallery/jazeel_baby/chibi_jazeel_birthday_edit.png',
      jazeel_cake: 'gallery/jazeel_baby/chibi_jazeel_cake.png',
      jazeel_dad: 'gallery/jazeel_baby/chibi_jazeel_dad_couch_edit.png',
      michelle_birthday: 'gallery/michelle_baby/chibi_michelle_1st_birthday.png',
      michelle_garden: 'gallery/michelle_baby/chibi_michelle_garden.png',
      michelle_sisters: 'gallery/michelle_baby/chibi_michelle_sisters.png'
    },
    // Theme decorations
    theme: {
      farm_animals: 'theme/chibi_farm_animals.png'
    },
    // Icons/Avatars
    icons: {
      jazeel_avatar: 'icons/jazeel_avatar/asset_chibi_avatar_m.png',
      michelle_avatar: 'icons/michelle_avatar/asset_chibi_avatar_f.png',
      heart: 'icons/shared/asset_chibi_heart.png',
      think: 'icons/shared/asset_chibi_think.png',
      win: 'icons/shared/asset_chibi_win.png',
      shared: {
        heart: 'icons/shared/asset_chibi_heart.png',
        think: 'icons/shared/asset_chibi_think.png',
        win: 'icons/shared/asset_chibi_win.png'
      }
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
    
    // Handle baby category with various naming patterns
    if (category === 'baby') {
      // Try direct lookup first (for cases like 'jazeel_birthday', 'michelle_birthday')
      path = categoryPaths[name];
      
      // If not found, try parsing the name pattern (e.g., 'jazeel_birthday' -> jazeel.birthday)
      if (!path && name.includes('_')) {
        const parts = name.split('_');
        const subCategory = parts[0]; // 'jazeel' or 'michelle'
        const imageName = parts.slice(1).join('_'); // 'birthday', 'cake', etc.
        path = categoryPaths[subCategory]?.[imageName];
      }
      
      // Handle old format like 'jazeel_birthday' -> jazeel.birthday (where key is just 'birthday')
      if (!path && name.includes('_')) {
        const parts = name.split('_');
        const subCategory = parts[0];
        const imageName = parts[1]; // Just take the second part
        path = categoryPaths[subCategory]?.[imageName];
      }
    } else {
      // For other categories, direct lookup
      path = categoryPaths[name];
      
      // Also try to find by checking if path ends with the name
      if (!path && typeof categoryPaths === 'object') {
        for (const key in categoryPaths) {
          if (categoryPaths[key].includes(name) || categoryPaths[key].endsWith(name)) {
            path = categoryPaths[key];
            break;
          }
        }
      }
    }

    if (!path) {
      console.warn(`[ImageService] Image not found: ${category}/${name}`);
      return '';
    }

    // Apply path mapping for local files
    const mappedPath = CONFIG.USE_LOCAL_FILES ? mapPathToActualLocation(path) : path;
    return getImageUrl(mappedPath, size);
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

    console.log(`[ImageService] Initialized with ${CONFIG.USE_LOCAL_FILES ? 'local files' : 'Supabase CDN'}: ${CONFIG.USE_LOCAL_FILES ? CONFIG.LOCAL_BASE_PATH : CONFIG.SUPABASE_URL}`);
    
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
      mapPathToActualLocation,
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
    mapPathToActualLocation,
    IMAGE_PATHS,
    CONFIG
  };

})(typeof window !== 'undefined' ? window : global);
