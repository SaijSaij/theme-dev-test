<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Cache;

use Saij\ThemeDevTest\Setting\LayoutSettings;
use Saij\WpAppFramework\Block\Block;
use Saij\WpAppFramework\Block\BlockCategory;
use Saij\WpAppFramework\Cache\Cache;
use Saij\WpAppFramework\Cache\Tag\PostTypeTag;
use Saij\WpAppFramework\Cache\Tag\SettingsTag;
use Saij\WpAppFramework\Cache\Vary\QueryParamVary;
use Saij\WpAppFramework\Twig\TemplateRenderer;
use WP_Block;

/**
 * A cached block that shows how often it rendered (Counter), the URL parameter "variant" and the post of its
 * context; its view script marks the root element (cache.spec.js).
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
    ) {}

    public function render(CachedAttributes $attrs, WP_Block $block): string
    {
        $variant = $_GET['variant'] ?? '';

        return $this->renderer->render('Cache/Cached.twig', [
            'attrs' => $attrs,
            'render' => $this->counter->next('block'),
            'variant' => is_string($variant) ? sanitize_text_field(wp_unslash($variant)) : '',
            'postId' => $block->context['postId'] ?? null,
        ]);
    }
}
