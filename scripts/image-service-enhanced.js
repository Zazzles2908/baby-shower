/**
 * Baby Shower App - Enhanced Image Loading Service
 * Robust image loading with retry logic and comprehensive fallbacks
 */

(function() {
    'use strict';
    
    console.log('[ImageService] Loading enhanced image service...');
    
    // Configuration
    const CONFIG = {
        MAX_RETRIES: 2,
        RETRY_DELAY: 1000,
        IMAGE_TIMEOUT: 10000,
        FALLBACK_EMOJI: '🖼️',
        FALLBACK_COLORS: ['#FFB6C1', '#87CEEB', '#98FB98', '#DDA0DD', '#F0E68C'],
        // PRELOAD_IMAGES removed - these images don't exist and cause 404 errors
        // Images are loaded lazily via browser native lazy loading
    };
    
    // State
    let imageCache = new Map();
    let loadingPromises = new Map();
    let retryAttempts = new Map();
    
    // Public API
    window.ImageService = {
        loadImage: loadImageWithRetry,
        preloadImages: preloadCriticalImages,
        getFallback: getFallbackImage,
        clearCache: clearImageCache,
        getStats: getLoadingStats,
        getImageUrl: getImageUrl
    };
    
    /**
     * Get image URL for different image sources
     * Provides backward compatibility for scripts expecting getImageUrl()
     */
    function getImageUrl(imagePath, size = 'original') {
        // Handle empty or undefined paths
        if (!imagePath) {
            console.warn('[ImageService] getImageUrl called with empty path');
            return null;
        }
        
        // If it's already a full URL, return as-is
        if (imagePath.startsWith('http')) {
            return imagePath;
        }
        
        // Map size variants to Supabase transform parameters
        const sizeMap = {
            'thumbnail': '?width=100&height=100',
            'small': '?width=200&height=200',
            'medium': '?width=400&height=400',
            'large': '?width=800&height=800',
            'original': ''
        };
        
        const sizeSuffix = sizeMap[size] || '';
        
        // Handle Supabase storage paths
        if (imagePath.includes('baby-shower-pictures')) {
            return `https://bkszmvfsfgvdwzacgmfz.supabase.co/storage/v1/object/public/${imagePath}${sizeSuffix}`;
        }
        
        // Local images (starting with /)
        if (imagePath.startsWith('/')) {
            return imagePath;
        }
        
        // Default: return the path as-is
        return imagePath;
    }
    
    /**
     * Load image with comprehensive retry and fallback logic
     */
    async function loadImageWithRetry(src, options = {}) {
        // Handle undefined, null, or empty src
        if (!src || typeof src !== 'string' || src.trim() === '') {
            console.warn('[ImageService] loadImageWithRetry called with invalid src:', src);
            
            // Return fallback immediately for invalid src
            if (options.fallbackType === 'emoji' || options.fallbackType === undefined) {
                return {
                    src: null,
                    emoji: CONFIG.FALLBACK_EMOJI,
                    color: CONFIG.FALLBACK_COLORS[0],
                    width: 200,
                    height: 200,
                    loaded: true,
                    fallback: true,
                    type: 'emoji'
                };
            } else if (options.fallbackType === 'color') {
                return {
                    src: null,
                    color: CONFIG.FALLBACK_COLORS[0],
                    width: 200,
                    height: 200,
                    loaded: true,
                    fallback: true,
                    type: 'color'
                };
            } else {
                return getFallbackImage(src, options.fallbackType);
            }
        }
        
        const {
            maxRetries = CONFIG.MAX_RETRIES,
            timeout = CONFIG.IMAGE_TIMEOUT,
            fallbackType = 'emoji',
            onProgress = null,
            onError = null
        } = options;
        
        // Check cache first
        if (imageCache.has(src)) {
            console.log(`[ImageService] Using cached image: ${src}`);
            return imageCache.get(src);
        }
        
        // Check if already loading
        if (loadingPromises.has(src)) {
            console.log(`[ImageService] Image already loading: ${src}`);
            return loadingPromises.get(src);
        }
        
        // Create loading promise
        const loadingPromise = attemptImageLoad(src, {
            maxRetries,
            timeout,
            fallbackType,
            onProgress,
            onError
        });
        
        loadingPromises.set(src, loadingPromise);
        
        try {
            const result = await loadingPromise;
            imageCache.set(src, result);
            return result;
        } catch (error) {
            console.error(`[ImageService] Failed to load image: ${src}`, error);
            
            // Log to error monitor
            if (window.ErrorMonitor) {
                window.ErrorMonitor.logCustom('image_load_failed', error.message, {
                    src: src,
                    retries: retryAttempts.get(src) || 0,
                    fallbackType: fallbackType
                });
            }
            
            throw error;
        } finally {
            loadingPromises.delete(src);
            retryAttempts.delete(src);
        }
    }
    
    /**
     * Attempt to load image with retry logic
     */
    async function attemptImageLoad(src, options) {
        const { maxRetries, timeout, fallbackType, onProgress, onError } = options;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`[ImageService] Loading image (attempt ${attempt}): ${src}`);
                
                if (onProgress) {
                    onProgress({ attempt, totalAttempts: maxRetries, status: 'loading' });
                }
                
                const result = await loadImageWithTimeout(src, timeout);
                
                console.log(`[ImageService] Image loaded successfully: ${src}`);
                
                if (onProgress) {
                    onProgress({ attempt, totalAttempts: maxRetries, status: 'success' });
                }
                
                return result;
                
            } catch (error) {
                console.warn(`[ImageService] Image load attempt ${attempt} failed:`, error.message);
                
                retryAttempts.set(src, attempt);
                
                if (onError) {
                    onError({ attempt, totalAttempts: maxRetries, error: error.message });
                }
                
                if (attempt === maxRetries) {
                    // All attempts failed, use fallback
                    console.log(`[ImageService] All attempts failed, using fallback for: ${src}`);
                    
                    if (onProgress) {
                        onProgress({ attempt, totalAttempts: maxRetries, status: 'fallback' });
                    }
                    
                    return getFallbackImage(src, fallbackType);
                }
                
                // Wait before retry with exponential backoff
                const delay = CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
                console.log(`[ImageService] Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    /**
     * Load image with timeout
     */
    function loadImageWithTimeout(src, timeout) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const timeoutId = setTimeout(() => {
                reject(new Error(`Image load timeout after ${timeout}ms`));
            }, timeout);
            
            img.onload = () => {
                clearTimeout(timeoutId);
                resolve({
                    src: src,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    loaded: true,
                    fallback: false
                });
            };
            
            img.onerror = () => {
                clearTimeout(timeoutId);
                reject(new Error('Image load error'));
            };
            
            img.onabort = () => {
                clearTimeout(timeoutId);
                reject(new Error('Image load aborted'));
            };
            
            // Start loading
            img.src = src;
        });
    }
    
    /**
     * Get fallback image based on type
     * Gracefully handles undefined/null src parameters
     */
    function getFallbackImage(originalSrc, type = 'emoji') {
        // Handle undefined, null, or empty src
        if (!originalSrc) {
            console.warn('[ImageService] getFallbackImage called with empty src, using default fallback');
            originalSrc = 'default-fallback';
        }
        
        const fallbackId = generateFallbackId(originalSrc);
        
        switch (type) {
            case 'emoji':
                return {
                    src: null,
                    emoji: CONFIG.FALLBACK_EMOJI,
                    color: CONFIG.FALLBACK_COLORS[fallbackId % CONFIG.FALLBACK_COLORS.length],
                    width: 200,
                    height: 200,
                    loaded: true,
                    fallback: true,
                    type: 'emoji'
                };
                
            case 'color':
                return {
                    src: null,
                    color: CONFIG.FALLBACK_COLORS[fallbackId % CONFIG.FALLBACK_COLORS.length],
                    width: 200,
                    height: 200,
                    loaded: true,
                    fallback: true,
                    type: 'color'
                };
                
            case 'placeholder':
                // Generate SVG placeholder
                const svg = generatePlaceholderSVG(fallbackId);
                return {
                    src: svg,
                    width: 200,
                    height: 200,
                    loaded: true,
                    fallback: true,
                    type: 'placeholder'
                };
                
            default:
                return getFallbackImage(originalSrc, 'emoji');
        }
    }
    
    /**
     * Generate unique fallback ID from URL
     * Safely handles undefined/null/empty URLs
     */
    function generateFallbackId(url) {
        // Handle undefined, null, or empty URL
        if (!url || typeof url !== 'string' || url.length === 0) {
            console.warn('[ImageService] generateFallbackId called with invalid URL, using default');
            return 0; // Return 0 to use first color in fallback colors array
        }
        
        let hash = 0;
        for (let i = 0; i < url.length; i++) {
            const char = url.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
    
    /**
     * Generate SVG placeholder
     */
    function generatePlaceholderSVG(id) {
        const color = CONFIG.FALLBACK_COLORS[id % CONFIG.FALLBACK_COLORS.length];
        const svg = `
            <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                <rect width="200" height="200" fill="${color}" opacity="0.3"/>
                <text x="50%" y="50%" text-anchor="middle" dy=".3em" 
                      font-family="Arial, sans-serif" font-size="48" fill="${color}">
                    ${CONFIG.FALLBACK_EMOJI}
                </text>
            </svg>
        `;
        return 'data:image/svg+xml;base64,' + btoa(svg);
    }
    
    /**
     * Preload critical images - DISABLED
     * These images don't exist and cause 404 errors
     * Browser native lazy loading handles images efficiently now
     */
    async function preloadCriticalImages() {
        console.log('[ImageService] Preloading disabled - using native lazy loading');
        // Images load on scroll via browser native lazy loading
        // No manual preloading needed
    }
    
    /**
     * Clear image cache
     */
    function clearImageCache() {
        imageCache.clear();
        loadingPromises.clear();
        retryAttempts.clear();
        console.log('[ImageService] Image cache cleared');
    }
    
    /**
     * Get loading statistics
     */
    function getLoadingStats() {
        return {
            cacheSize: imageCache.size,
            activeLoads: loadingPromises.size,
            retryAttempts: Object.fromEntries(retryAttempts),
            config: CONFIG
        };
    }
    
    /**
     * Enhanced gallery image loading
     */
    function enhanceGalleryImages() {
        const galleryImages = document.querySelectorAll('.gallery-image, .activity-card img, .hero-image');
        
        galleryImages.forEach(img => {
            if (img.dataset.enhanced) return; // Already enhanced
            
            img.dataset.enhanced = 'true';
            const originalSrc = img.src;
            
            // Skip if src is empty or undefined
            if (!originalSrc || originalSrc.trim() === '') {
                console.warn('[ImageService] Skipping image with empty src');
                img.alt = 'Image not available';
                return;
            }
            
            // Replace with loading state
            img.style.opacity = '0.5';
            img.style.filter = 'blur(2px)';
            
            loadImageWithRetry(originalSrc, {
                onProgress: (progress) => {
                    if (progress.status === 'loading') {
                        img.alt = `Loading image... (attempt ${progress.attempt}/${progress.totalAttempts})`;
                    }
                },
                onError: (error) => {
                    console.warn(`[ImageService] Gallery image failed: ${originalSrc}`, error);
                }
            }).then(result => {
                if (result.fallback) {
                    // Apply fallback
                    if (result.type === 'emoji') {
                        img.style.backgroundColor = result.color;
                        img.alt = `Image unavailable ${result.emoji}`;
                        img.src = 'data:image/svg+xml;base64,' + btoa(`
                            <svg width="${result.width}" height="${result.height}" xmlns="http://www.w3.org/2000/svg">
                                <rect width="100%" height="100%" fill="${result.color}"/>
                                <text x="50%" y="50%" text-anchor="middle" dy=".3em" 
                                      font-family="Arial, sans-serif" font-size="48" fill="white">
                                    ${result.emoji}
                                </text>
                            </svg>
                        `);
                    } else {
                        img.src = result.src;
                    }
                } else {
                    // Image loaded successfully
                    img.src = result.src;
                }
                
                // Remove loading state
                img.style.opacity = '1';
                img.style.filter = 'none';
                
            }).catch(error => {
                console.error(`[ImageService] Failed to load gallery image: ${originalSrc}`, error);
                
                // Show error state
                img.style.opacity = '0.3';
                img.style.filter = 'grayscale(100%)';
                img.alt = 'Image failed to load';
                img.title = 'Image failed to load - please refresh to try again';
            });
        });
    }
    
    // Auto-initialize
    function initializeImageService() {
        console.log('[ImageService] Initializing...');
        
        // Preload critical images
        preloadCriticalImages();
        
        // Enhance existing images
        setTimeout(enhanceGalleryImages, 1000);
        
        // Monitor for new images
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Convert NodeList to Array for push support
                        const images = node.querySelectorAll ? Array.from(node.querySelectorAll('img')) : [];
                        if (node.tagName === 'IMG') images.push(node);
                        
                        images.forEach(img => {
                            if (!img.dataset.enhanced && img.src) {
                                enhanceGalleryImages();
                            }
                        });
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('[ImageService] Initialized successfully');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeImageService);
    } else {
        initializeImageService();
    }
    
})();