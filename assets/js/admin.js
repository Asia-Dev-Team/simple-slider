/**
 * GPC Simple Slider Admin JavaScript
 * Файл: gpc-simple-slider/assets/js/admin.js
 */

(function($) {
    'use strict';
    
    $(document).ready(function() {
        // Демо функциональность для админки
        initSliderDemo();
        initCodeCopy();
    });
    
    function initSliderDemo() {
        // Если есть демо слайдер на странице настроек
        if ($('.gpc-slider-demo').length) {
            // Добавляем демо изображения
            const demoImages = [
                'https://picsum.photos/800/400?random=1',
                'https://picsum.photos/800/400?random=2',
                'https://picsum.photos/800/400?random=3'
            ];
            
            // Создаем демо слайдер
            const demoSlider = `
                <div class="gpc-slider" data-autoplay="true" data-speed="3000">
                    <div class="gpc-slider-container">
                        <div class="gpc-slider-track">
                            ${demoImages.map((img, index) => `
                                <div class="gpc-slider-slide ${index === 0 ? 'active' : ''}">
                                    <img src="${img}" alt="Demo Image ${index + 1}">
                                </div>
                            `).join('')}
                        </div>
                        <button class="gpc-slider-arrow gpc-slider-prev">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                            </svg>
                        </button>
                        <button class="gpc-slider-arrow gpc-slider-next">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                            </svg>
                        </button>
                        <div class="gpc-slider-counter">
                            <span class="current">1</span> / <span class="total">3</span>
                        </div>
                    </div>
                    <div class="gpc-slider-dots">
                        <button class="gpc-slider-dot active" data-slide="0"></button>
                        <button class="gpc-slider-dot" data-slide="1"></button>
                        <button class="gpc-slider-dot" data-slide="2"></button>
                    </div>
                </div>
            `;
            
            $('.gpc-slider-demo').html(demoSlider);
        }
    }
    
    function initCodeCopy() {
        // Добавляем кнопки копирования к примерам кода
        $('code').each(function() {
            const $code = $(this);
            const text = $code.text();
            
            if (text.includes('[gpc_slider') || text.includes('gpc_simple_slider')) {
                const $wrapper = $('<div class="code-wrapper"></div>');
                const $copyBtn = $('<button class="copy-btn">Copy</button>');
                
                $code.wrap($wrapper);
                $code.after($copyBtn);
                
                $copyBtn.on('click', function() {
                    navigator.clipboard.writeText(text).then(() => {
                        $copyBtn.text('Copied!').addClass('copied');
                        setTimeout(() => {
                            $copyBtn.text('Copy').removeClass('copied');
                        }, 2000);
                    });
                });
            }
        });
    }
    
})(jQuery);