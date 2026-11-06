/**
 * GPC Simple Slider JavaScript
 * File: gpc-simple-slider/assets/js/slider.js
 */

(function($) {
    'use strict';

    // Slider class
    class GPCSlider {
        constructor(element) {
            this.slider = $(element);
            this.slides = this.slider.find('.gpc-slider-slide');
            this.dots = this.slider.find('.gpc-slider-dot');
            this.prevBtn = this.slider.find('.gpc-slider-prev');
            this.nextBtn = this.slider.find('.gpc-slider-next');
            this.counter = this.slider.find('.gpc-slider-counter .current');
            
            // Settings
            this.settings = {
                autoplay: this.slider.data('autoplay') === true,
                speed: parseInt(this.slider.data('speed')) || 5000,
                showDots: this.slider.data('dots') !== false,
                showArrows: this.slider.data('arrows') !== false,
                showCounter: this.slider.data('counter') !== false
            };
            
            // State
            this.currentSlide = 0;
            this.totalSlides = this.slides.length;
            this.isAnimating = false;
            this.autoplayTimer = null;
            this.touchStartX = 0;
            this.touchEndX = 0;
            
            this.init();
        }
        
        init() {
            if (this.totalSlides <= 1) {
                this.hideNavigation();
                return;
            }
            
            this.bindEvents();
            this.setupAccessibility();
            
            if (this.settings.autoplay) {
                this.startAutoplay();
            }
            
            // Preload images
            this.preloadImages();
        }
        
        bindEvents() {
            // Navigation buttons
            this.prevBtn.on('click', () => this.previousSlide());
            this.nextBtn.on('click', () => this.nextSlide());
            
            // Dots
            this.dots.on('click', (e) => {
                const slideIndex = parseInt($(e.target).data('slide'));
                this.goToSlide(slideIndex);
            });
            
            // Keyboard navigation
            this.slider.on('keydown', (e) => {
                switch(e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.previousSlide();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.nextSlide();
                        break;
                    case 'Home':
                        e.preventDefault();
                        this.goToSlide(0);
                        break;
                    case 'End':
                        e.preventDefault();
                        this.goToSlide(this.totalSlides - 1);
                        break;
                }
            });
            
            // Touch events with passive listeners
            const sliderElement = this.slider[0];
            
            sliderElement.addEventListener('touchstart', (e) => {
                this.touchStartX = e.touches[0].clientX;
                this.pauseAutoplay();
            }, {passive: true});
            
            sliderElement.addEventListener('touchend', (e) => {
                this.touchEndX = e.changedTouches[0].clientX;
                this.handleSwipe();
                
                if (this.settings.autoplay) {
                    this.startAutoplay();
                }
            }, {passive: true});
            
            // Pause autoplay on hover
            if (this.settings.autoplay) {
                this.slider.on('mouseenter', () => this.pauseAutoplay());
                this.slider.on('mouseleave', () => this.startAutoplay());
            }
            
            // Pause when the page loses focus
            $(document).on('visibilitychange', () => {
                if (document.hidden) {
                    this.pauseAutoplay();
                } else if (this.settings.autoplay) {
                    this.startAutoplay();
                }
            });
        }
        
        setupAccessibility() {
            // ARIA attributes
            this.slider.attr({
                'role': 'region',
                'aria-label': gpcSlider.strings.slider || 'Image Slider',
                'tabindex': '0'
            });
            
            this.slides.each((index, slide) => {
                $(slide).attr({
                    'role': 'tabpanel',
                    'aria-hidden': index !== this.currentSlide,
                    'aria-label': `${gpcSlider.strings.slide || 'Slide'} ${index + 1} ${gpcSlider.strings.of || 'of'} ${this.totalSlides}`
                });
            });
            
            // Navigation buttons
            this.prevBtn.attr('aria-label', gpcSlider.strings.prev || 'Previous slide');
            this.nextBtn.attr('aria-label', gpcSlider.strings.next || 'Next slide');
            
            // Dots
            this.dots.each((index, dot) => {
                $(dot).attr({
                    'role': 'tab',
                    'aria-selected': index === this.currentSlide,
                    'aria-label': `${gpcSlider.strings.goto || 'Go to slide'} ${index + 1}`
                });
            });
        }
        
        previousSlide() {
            if (this.isAnimating) return;
            
            const prevIndex = this.currentSlide === 0 ? this.totalSlides - 1 : this.currentSlide - 1;
            this.goToSlide(prevIndex);
        }
        
        nextSlide() {
            if (this.isAnimating) return;
            
            const nextIndex = this.currentSlide === this.totalSlides - 1 ? 0 : this.currentSlide + 1;
            this.goToSlide(nextIndex);
        }
        
        goToSlide(index) {
            if (this.isAnimating || index === this.currentSlide || index < 0 || index >= this.totalSlides) {
                return;
            }
            
            this.isAnimating = true;
            const previousSlide = this.currentSlide;
            this.currentSlide = index;
            
            // Transition animation
            this.animateSlides(previousSlide, index);
            
            // Update the UI
            this.updateNavigation();
            this.updateAccessibility();
            
            // Slide change event
            this.slider.trigger('gpc:slideChanged', {
                current: index,
                previous: previousSlide,
                total: this.totalSlides
            });
            
            setTimeout(() => {
                this.isAnimating = false;
            }, 300);
        }
        
        animateSlides(from, to) {
            const $currentSlide = this.slides.eq(from);
            const $nextSlide = this.slides.eq(to);
            
            // Remove the active class from the current slide
            $currentSlide.removeClass('active');
            
            // Add the active class to the next slide
            setTimeout(() => {
                $nextSlide.addClass('active');
            }, 50);
        }
        
        updateNavigation() {
            // Update dots
            this.dots.removeClass('active').eq(this.currentSlide).addClass('active');
            
            // Update the counter
            if (this.counter.length) {
                this.counter.text(this.currentSlide + 1);
            }
        }
        
        updateAccessibility() {
            // Update ARIA attributes for slides
            this.slides.attr('aria-hidden', true).eq(this.currentSlide).attr('aria-hidden', false);
            
            // Update ARIA attributes for dots
            this.dots.attr('aria-selected', false).eq(this.currentSlide).attr('aria-selected', true);
        }
        
        handleSwipe() {
            const swipeThreshold = 50;
            const diff = this.touchStartX - this.touchEndX;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    this.nextSlide();
                } else {
                    this.previousSlide();
                }
            }
        }
        
        startAutoplay() {
            if (!this.settings.autoplay || this.totalSlides <= 1) return;
            
            this.pauseAutoplay();
            this.autoplayTimer = setInterval(() => {
                this.nextSlide();
            }, this.settings.speed);
        }
        
        pauseAutoplay() {
            if (this.autoplayTimer) {
                clearInterval(this.autoplayTimer);
                this.autoplayTimer = null;
            }
        }
        
        preloadImages() {
            // Preload the next 2 images
            const preloadCount = Math.min(3, this.totalSlides);
            
            for (let i = 1; i < preloadCount; i++) {
                const slideIndex = (this.currentSlide + i) % this.totalSlides;
                const $img = this.slides.eq(slideIndex).find('img');
                
                if ($img.length && !$img.data('preloaded')) {
                    const img = new Image();
                    img.onload = () => $img.data('preloaded', true);
                    img.src = $img.attr('src');
                }
            }
        }
        
        hideNavigation() {
            this.prevBtn.hide();
            this.nextBtn.hide();
            this.dots.parent().hide();
            this.counter.parent().hide();
        }
        
        destroy() {
            this.pauseAutoplay();
            this.slider.off();
            $(document).off('visibilitychange');
        }
    }
    
    // Initialize sliders
    function initSliders() {
        $('.gpc-slider').each(function() {
            if (!$(this).data('gpc-slider-initialized')) {
                new GPCSlider(this);
                $(this).data('gpc-slider-initialized', true);
            }
        });
    }
    
    // Initialize on DOM load
    $(document).ready(initSliders);
    
    // Intersection Observer for lazy loading (if needed)
    if ('IntersectionObserver' in window) {
        const lazyImageObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        lazyImageObserver.unobserve(img);
                    }
                }
            });
        });
        
        // Initialize lazy loading on start
        $(document).ready(function() {
            $('img[data-src]').each(function() {
                lazyImageObserver.observe(this);
            });
        });
    }
    
    // Expose the class globally
    window.GPCSlider = GPCSlider;
    
})(jQuery);