<?php
/**
 * Plugin Name: GPC Simple Slider
 * Plugin URI: https://trueresort.net
 * Description: A simple, fast, and stylish image slider plugin for WordPress.
 * Version: 1.0.0
 * Author: Mike Art (@trueresort)
 * License: GPL v2 or later
 * Text Domain: gpc-slider
 * 
 * Файл: gpc-simple-slider/gpc-simple-slider.php
 */

// Защита от прямого доступа
if (!defined('ABSPATH')) {
    exit;
}

// Константы плагина
define('GPC_SLIDER_VERSION', '1.0.0');
define('GPC_SLIDER_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('GPC_SLIDER_PLUGIN_URL', plugin_dir_url(__FILE__));
define('GPC_SLIDER_PLUGIN_BASENAME', plugin_basename(__FILE__));

/**
 * Главный класс плагина
 */
class GPC_Simple_Slider {
    
    private static $instance = null;
    private static $slider_count = 0;
    
    /**
     * Singleton pattern
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Конструктор
     */
    private function __construct() {
        $this->init_hooks();
    }
    
    /**
     * Инициализация хуков WordPress
     */
    private function init_hooks() {
        // Основные хуки
        add_action('init', array($this, 'init'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
        
        // Хуки активации/деактивации
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
        
        // Shortcode
        add_shortcode('gpc_slider', array($this, 'slider_shortcode'));
        
        // AJAX хуки
        add_action('wp_ajax_gpc_slider_get_media', array($this, 'ajax_get_media'));
        add_action('wp_ajax_nopriv_gpc_slider_get_media', array($this, 'ajax_get_media'));
        
        // Админ хуки
        if (is_admin()) {
            add_action('admin_menu', array($this, 'admin_menu'));
            add_action('admin_enqueue_scripts', array($this, 'admin_enqueue_assets'));
        }
    }
    
    /**
     * Инициализация плагина
     */
    public function init() {
        // Загрузка переводов
        load_plugin_textdomain('gpc-slider', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }
    
    /**
     * Подключение ассетов на фронтенде
     */
    public function enqueue_assets() {
        // CSS
        wp_enqueue_style(
            'gpc-slider-style',
            GPC_SLIDER_PLUGIN_URL . 'assets/css/slider.css',
            array(),
            GPC_SLIDER_VERSION
        );
        
        // JavaScript
        wp_enqueue_script(
            'gpc-slider-script',
            GPC_SLIDER_PLUGIN_URL . 'assets/js/slider.js',
            array('jquery'),
            GPC_SLIDER_VERSION,
            true
        );
        
        // Локализация
        wp_localize_script('gpc-slider-script', 'gpcSlider', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('gpc_slider_nonce'),
            'strings' => array(
                'loading' => __('Loading...', 'gpc-slider'),
                'error' => __('Error loading image', 'gpc-slider'),
                'prev' => __('Previous', 'gpc-slider'),
                'next' => __('Next', 'gpc-slider')
            )
        ));
    }
    
    /**
     * Активация плагина
     */
    public function activate() {
        // Создаем базовые опции
        add_option('gpc_slider_version', GPC_SLIDER_VERSION);
        add_option('gpc_slider_settings', array(
            'autoplay' => false,
            'autoplay_speed' => 5000,
            'show_dots' => true,
            'show_arrows' => true,
            'show_counter' => true,
            'lazy_load' => true
        ));
        
        // Очищаем кеш rewrite rules
        flush_rewrite_rules();
    }
    
    /**
     * Деактивация плагина
     */
    public function deactivate() {
        flush_rewrite_rules();
    }
    
    /**
     * Shortcode для слайдера
     */
    public function slider_shortcode($atts, $content = null) {
        $atts = shortcode_atts(array(
            'images' => '',
            'ids' => '',
            'size' => 'large',
            'autoplay' => false,
            'speed' => 5000,
            'dots' => true,
            'arrows' => true,
            'counter' => true,
            'height' => '400px',
            'class' => ''
        ), $atts, 'gpc_slider');
        
        // Получаем изображения
        $images = $this->get_images($atts);
        
        if (empty($images)) {
            return '<div class="gpc-slider-error">' . __('No images found for slider', 'gpc-slider') . '</div>';
        }
        
        return $this->render_slider($images, $atts);
    }
    
    /**
     * Получение изображений для слайдера
     */
    private function get_images($atts) {
        $images = array();
        
        // Если переданы ID изображений
        if (!empty($atts['ids'])) {
            $ids = explode(',', $atts['ids']);
            foreach ($ids as $id) {
                $id = intval(trim($id));
                if ($id > 0) {
                    $image_data = $this->get_image_data($id, $atts['size']);
                    if ($image_data) {
                        $images[] = $image_data;
                    }
                }
            }
        }
        
        // Если переданы прямые URL
        if (!empty($atts['images']) && empty($images)) {
            $urls = explode(',', $atts['images']);
            foreach ($urls as $url) {
                $url = trim($url);
                if (filter_var($url, FILTER_VALIDATE_URL)) {
                    $images[] = array(
                        'url' => $url,
                        'alt' => '',
                        'caption' => ''
                    );
                }
            }
        }
        
        return $images;
    }
    
    /**
     * Получение данных изображения из медиабиблиотеки
     */
    private function get_image_data($attachment_id, $size = 'large') {
        $image_src = wp_get_attachment_image_src($attachment_id, $size);
        
        if (!$image_src) {
            return false;
        }
        
        return array(
            'url' => $image_src[0],
            'width' => $image_src[1],
            'height' => $image_src[2],
            'alt' => get_post_meta($attachment_id, '_wp_attachment_image_alt', true),
            'caption' => wp_get_attachment_caption($attachment_id),
            'id' => $attachment_id
        );
    }
    
/**
 * Рендеринг HTML слайдера БЕЗ ТОЧЕК
 */
private function render_slider($images, $atts) {
    self::$slider_count++;
    $slider_id = 'gpc-slider-' . self::$slider_count;
    
    $classes = array('gpc-slider');
    if (!empty($atts['class'])) {
        $classes[] = sanitize_html_class($atts['class']);
    }
    
    // Настройки слайдера в data-атрибутах
    $data_attrs = array(
        'data-autoplay' => $atts['autoplay'] ? 'true' : 'false',
        'data-speed' => intval($atts['speed']),
        'data-arrows' => $atts['arrows'] ? 'true' : 'false',
        'data-counter' => $atts['counter'] ? 'true' : 'false'
    );
    
    ob_start();
    ?>
    <div id="<?php echo esc_attr($slider_id); ?>" 
         class="<?php echo esc_attr(implode(' ', $classes)); ?>"
         <?php foreach ($data_attrs as $key => $value): ?>
            <?php echo $key; ?>="<?php echo esc_attr($value); ?>"
         <?php endforeach; ?>
         style="--slider-height: <?php echo esc_attr($atts['height']); ?>;">
        
        <div class="gpc-slider-container">
            <div class="gpc-slider-track">
                <?php foreach ($images as $index => $image): ?>
                    <div class="gpc-slider-slide <?php echo $index === 0 ? 'active' : ''; ?>">
                        <img src="<?php echo esc_url($image['url']); ?>" 
                             alt="<?php echo esc_attr($image['alt']); ?>"
                             loading="<?php echo $index === 0 ? 'eager' : 'lazy'; ?>">
                        <?php if (!empty($image['caption'])): ?>
                            <div class="gpc-slider-caption">
                                <?php echo wp_kses_post($image['caption']); ?>
                            </div>
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>
            </div>
            
            <?php if ($atts['arrows'] && count($images) > 1): ?>
                <button class="gpc-slider-arrow gpc-slider-prev" aria-label="<?php esc_attr_e('Previous slide', 'gpc-slider'); ?>">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                    </svg>
                </button>
                <button class="gpc-slider-arrow gpc-slider-next" aria-label="<?php esc_attr_e('Next slide', 'gpc-slider'); ?>">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                    </svg>
                </button>
            <?php endif; ?>
            
            <?php if ($atts['counter'] && count($images) > 1): ?>
                <div class="gpc-slider-counter">
                    <span class="current">1</span> / <span class="total"><?php echo count($images); ?></span>
                </div>
            <?php endif; ?>
        </div>
        
        <!-- УБРАЛИ ТОЧКИ НАХУЙ -->
        
    </div>
    <?php
    
    return ob_get_clean();
}
    
    /**
     * Добавление админ меню
     */
    public function admin_menu() {
        add_options_page(
            __('GPC Slider Settings', 'gpc-slider'),
            __('GPC Slider', 'gpc-slider'),
            'manage_options',
            'gpc-slider-settings',
            array($this, 'admin_page')
        );
    }
    
    /**
     * Подключение админ ассетов
     */
    public function admin_enqueue_assets($hook) {
        if ($hook !== 'settings_page_gpc-slider-settings') {
            return;
        }
        
        wp_enqueue_media();
        wp_enqueue_script(
            'gpc-slider-admin',
            GPC_SLIDER_PLUGIN_URL . 'assets/js/admin.js',
            array('jquery', 'media-upload'),
            GPC_SLIDER_VERSION,
            true
        );
    }
    
    /**
     * Страница настроек в админке
     */
    public function admin_page() {
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            
            <div class="gpc-slider-admin">
                <h2><?php _e('How to use', 'gpc-slider'); ?></h2>
                
                <h3><?php _e('Shortcode Examples', 'gpc-slider'); ?></h3>
                <code>[gpc_slider ids="123,456,789"]</code><br>
                <code>[gpc_slider images="https://example.com/img1.jpg,https://example.com/img2.jpg"]</code><br>
                <code>[gpc_slider ids="123,456" autoplay="true" speed="3000" height="300px"]</code>
                
                <h3><?php _e('PHP Function', 'gpc-slider'); ?></h3>
                <code>echo gpc_simple_slider($image_urls_array);</code>
                
                <h3><?php _e('Shortcode Parameters', 'gpc-slider'); ?></h3>
                <ul>
                    <li><strong>ids</strong> - <?php _e('Comma-separated image IDs from media library', 'gpc-slider'); ?></li>
                    <li><strong>images</strong> - <?php _e('Comma-separated image URLs', 'gpc-slider'); ?></li>
                    <li><strong>autoplay</strong> - true/false (<?php _e('default: false', 'gpc-slider'); ?>)</li>
                    <li><strong>speed</strong> - <?php _e('Autoplay speed in milliseconds (default: 5000)', 'gpc-slider'); ?></li>
                    <li><strong>dots</strong> - true/false (<?php _e('default: true', 'gpc-slider'); ?>)</li>
                    <li><strong>arrows</strong> - true/false (<?php _e('default: true', 'gpc-slider'); ?>)</li>
                    <li><strong>counter</strong> - true/false (<?php _e('default: true', 'gpc-slider'); ?>)</li>
                    <li><strong>height</strong> - <?php _e('Slider height (default: 400px)', 'gpc-slider'); ?></li>
                    <li><strong>size</strong> - <?php _e('Image size (default: large)', 'gpc-slider'); ?></li>
                </ul>
            </div>
        </div>
        <?php
    }
    
    /**
     * AJAX обработчик для получения медиа
     */
    public function ajax_get_media() {
        check_ajax_referer('gpc_slider_nonce', 'nonce');
        
        $attachment_id = intval($_POST['attachment_id']);
        $size = sanitize_text_field($_POST['size']) ?: 'large';
        
        $image_data = $this->get_image_data($attachment_id, $size);
        
        if ($image_data) {
            wp_send_json_success($image_data);
        } else {
            wp_send_json_error(__('Image not found', 'gpc-slider'));
        }
    }
}

/**
 * Простая функция для использования в коде
 */
function gpc_simple_slider($images, $args = array()) {
    $default_args = array(
        'autoplay' => false,
        'speed' => 5000,
        'dots' => true,
        'arrows' => true,
        'counter' => true,
        'height' => '400px',
        'size' => 'large'
    );
    
    $args = wp_parse_args($args, $default_args);
    
    // Преобразуем массив URL в формат для shortcode
    if (is_array($images)) {
        $args['images'] = implode(',', $images);
    } else {
        $args['images'] = $images;
    }
    
    $slider = GPC_Simple_Slider::get_instance();
    return $slider->slider_shortcode($args);
}

// Инициализация плагина
add_action('plugins_loaded', array('GPC_Simple_Slider', 'get_instance'));