/**
 * GPC Simple Slider JavaScript
 * Файл: gpc-simple-slider/assets/js/slider.js
 */

(function($) {
    'use strict';

    // Класс слайдера
    class GPCSlider {
        constructor(element) {
            this.slider = $(element);
            this.slides = this.slider.find('.gpc-slider-slide');
            this.dots = this.slider.find('.gpc-slider-dot');
            this.prevBtn = this.slider.find('.gpc-slider-prev');
            this.nextBtn = this.slider.find('.gpc-slider-next');
            this.counter = this.slider.find('.gpc-slider-counter .current');
            
            // Настройки
            this.settings = {
                autoplay: this.slider.data('autoplay') === true,
                speed: parseInt(this.slider.data('speed')) || 5000,
                showDots: this.slider.data('dots') !== false,
                showArrows: this.slider.data('arrows') !== false,
                showCounter: this.slider.data('counter') !== false
            };
            
            // Состояние
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
            
            // Предзагрузка изображений
            this.preloadImages();
        }
        
        bindEvents() {
            // Кнопки навигации
            this.prevBtn.on('click', () => this.previousSlide());
            this.nextBtn.on('click', () => this.nextSlide());
            
            // Точки
            this.dots.on('click', (e) => {
                const slideIndex = parseInt($(e.target).data('slide'));
                this.goToSlide(slideIndex);
            });
            
            // Клавиатурная навигация
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
            
            // Touch события с passive опциями
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
            
            // Пауза автовоспроизведения при наведении
            if (this.settings.autoplay) {
                this.slider.on('mouseenter', () => this.pauseAutoplay());
                this.slider.on('mouseleave', () => this.startAutoplay());
            }
            
            // Пауза при потере фокуса
            $(document).on('visibilitychange', () => {
                if (document.hidden) {
                    this.pauseAutoplay();
                } else if (this.settings.autoplay) {
                    this.startAutoplay();
                }
            });
        }
        
        setupAccessibility() {
            // ARIA атрибуты
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
            
            // Кнопки навигации
            this.prevBtn.attr('aria-label', gpcSlider.strings.prev || 'Previous slide');
            this.nextBtn.attr('aria-label', gpcSlider.strings.next || 'Next slide');
            
            // Точки
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
            
            // Анимация перехода
            this.animateSlides(previousSlide, index);
            
            // Обновление UI
            this.updateNavigation();
            this.updateAccessibility();
            
            // Событие смены слайда
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
            
            // Убираем активный класс с текущего слайда
            $currentSlide.removeClass('active');
            
            // Добавляем активный класс к следующему слайду
            setTimeout(() => {
                $nextSlide.addClass('active');
            }, 50);
        }
        
        updateNavigation() {
            // Обновление точек
            this.dots.removeClass('active').eq(this.currentSlide).addClass('active');
            
            // Обновление счетчика
            if (this.counter.length) {
                this.counter.text(this.currentSlide + 1);
            }
        }
        
        updateAccessibility() {
            // Обновление ARIA атрибутов для слайдов
            this.slides.attr('aria-hidden', true).eq(this.currentSlide).attr('aria-hidden', false);
            
            // Обновление ARIA атрибутов для точек
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
            // Предзагружаем следующие 2 изображения
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
    
    // Инициализация слайдеров
    function initSliders() {
        $('.gpc-slider').each(function() {
            if (!$(this).data('gpc-slider-initialized')) {
                new GPCSlider(this);
                $(this).data('gpc-slider-initialized', true);
            }
        });
    }
    
    // Инициализация при загрузке DOM
    $(document).ready(initSliders);
    
    // Intersection Observer для ленивой загрузки (если нужно)
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
        
        // Инициализируем ленивую загрузку при старте
        $(document).ready(function() {
            $('img[data-src]').each(function() {
                lazyImageObserver.observe(this);
            });
        });
    }
    
    // Глобальный доступ к классу
    window.GPCSlider = GPCSlider;
    
})(jQuery);