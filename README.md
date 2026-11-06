# GPC Simple Slider

Lightweight WordPress image slider. Add it to any post or page with a shortcode, or call it from theme code. Images keep their full proportions without cropping.

## What it does

- Shortcode `[gpc_slider]` and PHP function `gpc_simple_slider()`.
- Images from the media library (by attachment ID, with alt text and captions) or from direct URLs.
- Previous / next arrows, slide counter (`2 / 5`), optional autoplay that pauses on hover and when the page loses focus.
- Keyboard navigation and touch swipe.
- ARIA attributes for slides; transitions are disabled for users who prefer reduced motion.
- First image loads eagerly, the rest lazily; the next two images are preloaded.
- Responsive layout for desktop, tablet, phone, and very small screens.

## Requirements

- WordPress. The front-end script uses jQuery, which WordPress provides.

## Installation

1. Copy the plugin folder to `wp-content/plugins/`.
2. Activate **GPC Simple Slider** in **Plugins**.
3. Usage examples are on **Settings → GPC Simple Slider** (with copy buttons).

## Usage

Media library images:

```
[gpc_slider ids="12,15,18"]
```

Direct URLs:

```
[gpc_slider images="https://example.com/1.jpg,https://example.com/2.jpg"]
```

Theme code:

```php
echo gpc_simple_slider(
    ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
    ['height' => '500px', 'autoplay' => true]
);
```

`ids` takes priority: when it yields at least one image, `images` is ignored.

## Shortcode attributes

| Attribute | Meaning | Default |
|---|---|---|
| `ids` | Comma-separated attachment IDs | — |
| `images` | Comma-separated image URLs | — |
| `size` | Image size for `ids` (`thumbnail`, `medium`, `large`, `full`, …) | `large` |
| `height` | Slider height, any CSS length | `400px` |
| `autoplay` | Switch slides automatically | off |
| `speed` | Autoplay interval in milliseconds | `5000` |
| `arrows` | Show arrows | on |
| `counter` | Show the slide counter | on |
| `class` | Extra CSS class on the slider | — |

## Project structure

```
gpc-simple-slider.php   Plugin class: shortcode, image loading, HTML rendering, settings page, AJAX, helper function
assets/js/slider.js     Slider behavior: navigation, autoplay, touch, keyboard, ARIA, preloading
assets/js/admin.js      Demo slider and copy buttons on the settings page
assets/css/slider.css   Slider styles and responsive breakpoints
```

## Known limitations

- Boolean attributes cannot be turned off with text: `autoplay="false"`, `arrows="false"`, or `counter="false"` are read as on, because any non-empty string is true in PHP. Use `arrows=""` or `arrows="0"`.
- The `dots` attribute and the `show_dots` setting exist, but dots are never rendered.
- The `gpc_slider_settings` option is created on activation but never read; changing it has no effect.
- The `size` attribute applies only to `ids`; direct URLs are used as given.
