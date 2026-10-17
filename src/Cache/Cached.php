<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Cache;

use WebCodingCat\ThemeDevTest\Setting\LayoutSettings;
use WebCodingCat\WpAppFramework\Block\Block;
use WebCodingCat\WpAppFramework\Block\BlockCategory;
use WebCodingCat\WpAppFramework\Cache\Cache;
use WebCodingCat\WpAppFramework\Cache\Tag\PostTypeTag;
use WebCodingCat\WpAppFramework\Cache\Tag\SettingsTag;
use WebCodingCat\WpAppFramework\Cache\Vary\QueryParamVary;
use WebCodingCat\WpAppFramework\Twig\TemplateRenderer;
use WebCodingCat\WpAppFramework\View\ViewData;
use WP_Block;

/**
 * A cached block that shows how often it rendered (Counter), the URL parameter "variant" and the post of its
 * context; its view script marks the root element (cache.spec.js). It passes the render count to its view script
 * as view data, which a cache hit sets again (document-views.spec.js).
 */
#[Block('cached', title: 'Cached', category: BlockCategory::Widgets, icon: 'database', description: 'Shows how often it rendered; cached.', usesContext: ['postId'])]
#[Cache(
    ttl: 300,
    tags: [new PostTypeTag('post'), new SettingsTag(LayoutSettings::class), Feed::Stats],
    vary: [new QueryParamVary('variant')],
)]
final readonly class Cached
{
    public function __construct(
        private TemplateRenderer $renderer,
        private Counter $counter,
        private ViewData $viewData,
    ) {}

    public function render(CachedAttributes $attrs, WP_Block $block): string
    {
        $variant = $_GET['variant'] ?? '';
        $render = $this->counter->next('block');
        $this->viewData->set('cached', ['render' => $render]);

        return $this->renderer->render('Cache/Cached.twig', [
            'attrs' => $attrs,
            'render' => $render,
            'variant' => is_string($variant) ? sanitize_text_field(wp_unslash($variant)) : '',
            'postId' => $block->context['postId'] ?? null,
        ]);
    }
}
