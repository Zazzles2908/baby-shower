/**
 * Baby Shower Gallery & Image Interactions
 * 
 * Handles hero image loading, gallery timeline, and image interactions
 * @version 1.0.0
 */

(function() {
    'use strict';

    /**
     * Gallery timeline items
     * Updated to use correct Supabase Storage paths
     */
    const GALLERY_ITEMS = [
        {
            id: 'jazeel-newborn',
            title: 'Welcome to the World',
            date: 'Newborn',
            caption: 'Your very first hello to the world',
            image: 'Pictures/Jazeel_Baby/chibi_jazeel_newborn_edit.png',
            alt: 'Baby Jazeel as newborn'
        },
        {
            id: 'jazeel-birthday',
            title: 'First Birthday!',
            date: '1st Birthday',
            caption: 'Celebrating your very first milestone',
            image: 'Pictures/Jazeel_Baby/chibi_jazeel_birthday_edit.png',
            alt: 'Baby Jazeel first birthday'
        },
        {
            id: 'jazeel-cake',
            title: 'Cake Time',
            date: 'Cake Smash',
            caption: 'Sweet memories of your cake adventure',
            image: 'Pictures/Jazeel_Baby/chibi_jazeel_cake.png',
            alt: 'Baby Jazeel with birthday cake'
        },
        {
            id: 'jazeel-dad',
            title: 'Daddy\'s Little Helper',
            date: 'Quality Time',
            caption: 'Helping Daddy on the couch',
            image: 'Pictures/Jazeel_Baby/chibi_jazeel_dad_couch_edit.png',
            alt: 'Baby Jazeel with dad'
        },
        {
            id: 'michelle-birthday',
            title: 'Big Girl\'s Day',
            date: '1st Birthday',
            caption: 'A beautiful day filled with love and joy',
            image: 'Pictures/Michelle_Baby/chibi_michelle_1st_birthday.png',
            alt: 'Baby Michelle first birthday'
        },
        {
            id: 'michelle-garden',
            title: 'Garden Adventures',
            date: 'Outdoors',
            caption: 'Exploring the beautiful garden together',
            image: 'Pictures/Michelle_Baby/chibi_michelle_garden.png',
            alt: 'Baby Michelle in garden'
        },
        {
            id: 'michelle-sisters',
            title: 'Sisterly Love',
            date: 'Family Time',
            caption: 'Bonds that last a lifetime',
            image: 'Pictures/Michelle_Baby/chibi_michelle_sisters.png',
            alt: 'Baby Michelle with sisters'
        },
        {
            id: 'couple-portrait',
            title: 'Our Love Story',
            date: 'Together',
            caption: 'Jazeel and Michelle expecting our little girl',
            image: 'Pictures/Michelle_Jazeel/asset_anime_portrait.png',
            alt: 'Jazeel and Michelle portrait'
        }
    ];

    /**
     * Activity card background images
     * Updated with new chibi character images showing clear character faces
     * Using new high-quality images from New Images folder
     */
    const ACTIVITY_BACKGROUNDS = {
        guestbook: 'Pictures/New Images/Michelle/chibi_michelle_excited_red.png',
        pool: 'Pictures/New Images/Jazeel/chibi_jazeel_eating.png',
        quiz: 'Pictures/New Images/Jazeel/chibi_jazeel_confused.png',
        advice: 'Pictures/New Images/Michelle/chibi_michelle_sweet_smile.png',
        voting: 'Pictures/New Images/Duo/chibi_duo_highfive.png',
        'mom-vs-dad': 'Pictures/New Images/Duo/chibi_duo_highfive.png'
    };

    /**
     * Initialize gallery and image interactions
     */
    function init() {
        console.log('[Gallery] Initializing...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeGallery);
        } else {
            initializeGallery();
        }
    }

    /**
     * Initialize gallery components
     */
    function initializeGallery() {
        loadHeroImage();
        populateGalleryTimeline();
        setupActivityCardBackgrounds();
        setupImageInteractions();
        setupLightbox();
        
        console.log('[Gallery] Initialized successfully');
    }

    /**
     * Load hero image with enhanced error handling and fallback support
     */
    function loadHeroImage() {
        const heroContainer = document.getElementById('hero-image-container');
        if (!heroContainer) {
            console.warn('[Gallery] Hero container not found');
            return;
        }

        console.log('[Gallery] Loading hero image...');

        // Use the new Duo high-five image for better presentation
        // Use 'original' size since we don't have sized variants
        const heroImageUrl = ImageService.getImageUrl('Pictures/New Images/Duo/chibi_duo_highfive.png', 'original');
        
        if (heroImageUrl) {
            // Set loading state immediately
            heroContainer.classList.add('loading');
            heroContainer.classList.remove('loaded', 'error');
            
            heroContainer.innerHTML = `
                <img 
                    src="${heroImageUrl}" 
                    alt="Jazeel and Michelle expecting their baby girl - High Five"
                    class="hero-img"
                    loading="eager"
                >
            `;
            
            // Add image wrapper styling after image loads
            const img = heroContainer.querySelector('img');
            
            img.addEventListener('load', () => {
                heroContainer.classList.remove('loading');
                heroContainer.classList.add('loaded');
                console.log('[Gallery] Hero image loaded successfully');
            });
            
            img.addEventListener('error', () => {
                console.warn('[Gallery] Hero image failed to load, using fallback');
                heroContainer.classList.remove('loading');
                heroContainer.classList.add('error');
                
                // Fallback to emoji if image fails
                heroContainer.innerHTML = '<span class="hero-placeholder">👨‍👩‍👧 🍊</span>';
                console.log('[Gallery] Fallback emoji displayed');
            });
        } else {
            // Fallback to emoji if image service not available
            console.warn('[Gallery] Image service not available, using fallback emoji');
            heroContainer.innerHTML = '<span class="hero-placeholder">👨‍👩‍👧 🍊</span>';
        }
    }

    /**
     * Populate gallery timeline with items
     */
    function populateGalleryTimeline() {
        const container = document.getElementById('gallery-container');
        if (!container) return;

        const timelineHTML = GALLERY_ITEMS.map((item, index) => {
            const imageUrl = ImageService.getImageUrl(item.image, 'medium');
            
            return `
                <div class="gallery-item" data-id="${item.id}">
                    <div class="gallery-item-image-wrapper">
                        <img 
                            src="${imageUrl}" 
                            alt="${item.alt}"
                            class="gallery-item-image"
                            loading="lazy"
                            data-full-image="${ImageService.getImageUrl(item.image, 'large')}"
                            data-caption="${item.caption}"
                        >
                    </div>
                    <div class="gallery-item-content">
                        <span class="gallery-item-date">${item.date}</span>
                        <h3 class="gallery-item-title">${item.title}</h3>
                        <p class="gallery-item-caption">${item.caption}</p>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = timelineHTML;
        
        // Add click handlers for lightbox
        setupGalleryImageClicks();
        
        console.log('[Gallery] Timeline populated with', GALLERY_ITEMS.length, 'items');
    }

    /**
     * Setup background images for activity cards
     */
    function setupActivityCardBackgrounds() {
        const cards = document.querySelectorAll('.activity-card');
        
        cards.forEach(card => {
            const section = card.getAttribute('data-section');
            const bgImageContainer = card.querySelector('.card-background-image');
            
            if (bgImageContainer && ACTIVITY_BACKGROUNDS[section]) {
                const bgUrl = ImageService.getImageUrl(ACTIVITY_BACKGROUNDS[section], 'medium');
                bgImageContainer.style.backgroundImage = `url(${bgUrl})`;
                console.log('[Gallery] Background set for', section);
            }
        });
    }

    /**
     * Setup image interactions (hover effects, lazy loading)
     */
    function setupImageInteractions() {
        // Setup image loading handlers
        const images = document.querySelectorAll('img[loading="lazy"]');
        
        images.forEach(img => {
            img.addEventListener('load', () => {
                img.classList.add('loaded');
                img.classList.remove('loading');
            });
            
            img.addEventListener('error', () => {
                img.classList.add('error');
                img.classList.remove('loading');
            });
        });
        
        // Initialize image service lazy loading
        if (window.ImageService && ImageService.setupLazyLoading) {
            ImageService.setupLazyLoading();
        }
    }

    /**
     * Setup gallery image clicks for lightbox
     */
    function setupGalleryImageClicks() {
        const galleryImages = document.querySelectorAll('.gallery-item-image');
        
        galleryImages.forEach(img => {
            img.addEventListener('click', (e) => {
                const fullImageUrl = img.getAttribute('data-full-image');
                const caption = img.getAttribute('data-caption');
                const alt = img.getAttribute('alt');
                
                if (fullImageUrl) {
                    openLightbox(fullImageUrl, caption, alt);
                }
            });
            
            // Add keyboard navigation
            img.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    img.click();
                }
            });
            
            // Make images focusable
            img.setAttribute('tabindex', '0');
            img.setAttribute('role', 'button');
            img.setAttribute('aria-label', `Click to enlarge: ${img.getAttribute('alt')}`);
        });
    }

    /**
     * Setup lightbox modal functionality
     */
    function setupLightbox() {
        const lightbox = document.getElementById('lightbox-modal');
        const lightboxImage = document.getElementById('lightbox-image');
        const lightboxCaption = document.getElementById('lightbox-caption');
        const closeBtn = lightbox.querySelector('.lightbox-close');
        
        if (!lightbox || !lightboxImage) return;

        // Close lightbox
        closeBtn.addEventListener('click', closeLightbox);
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !lightbox.classList.contains('hidden')) {
                closeLightbox();
            }
        });
        
        // Close when clicking outside image
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox || e.target === lightboxImage) {
                closeLightbox();
            }
        });
        
        // Focus trap for accessibility
        lightbox.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const focusableElements = lightbox.querySelectorAll('button, img');
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];
                
                if (e.shiftKey && document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        });
    }

    /**
     * Open lightbox with image
     * @param {string} imageUrl - Full image URL
     * @param {string} caption - Image caption
     * @param {string} alt - Alt text
     */
    function openLightbox(imageUrl, caption, alt) {
        const lightbox = document.getElementById('lightbox-modal');
        const lightboxImage = document.getElementById('lightbox-image');
        const lightboxCaption = document.getElementById('lightbox-caption');
        
        if (!lightbox || !lightboxImage) return;

        // Set image and caption
        lightboxImage.src = imageUrl;
        lightboxImage.alt = alt || 'Enlarged image';
        lightboxCaption.textContent = caption || '';
        
        // Show lightbox
        lightbox.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Focus on close button for accessibility
        setTimeout(() => {
            lightbox.querySelector('.lightbox-close').focus();
        }, 100);
        
        console.log('[Gallery] Lightbox opened:', caption);
    }

    /**
     * Close lightbox modal
     */
    function closeLightbox() {
        const lightbox = document.getElementById('lightbox-modal');
        const lightboxImage = document.getElementById('lightbox-image');
        
        if (!lightbox) return;

        lightbox.classList.add('hidden');
        document.body.style.overflow = '';
        
        // Clear image source to prevent ghost image
        setTimeout(() => {
            lightboxImage.src = '';
            lightboxImage.alt = '';
        }, 300);
        
        // Return focus to triggering element
        const activeElement = document.activeElement;
        if (activeElement && activeElement.classList.contains('gallery-item-image')) {
            activeElement.focus();
        }
        
        console.log('[Gallery] Lightbox closed');
    }

    /**
     * Expose functions globally
     */
    window.Gallery = {
        init,
        openLightbox,
        closeLightbox,
        GALLERY_ITEMS,
        ACTIVITY_BACKGROUNDS
    };

    // Auto-initialize on script load
    init();

})();
