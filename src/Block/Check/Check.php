<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Check;

use Saij\WpAppFramework\Block\Align;
use Saij\WpAppFramework\Block\Block;
use Saij\WpAppFramework\Block\BlockCategory;
use Saij\WpAppFramework\Block\Supports;
use Saij\WpAppFramework\Twig\TemplateRenderer;
use WP_Block;

/**
 * Covers escaping and sanitizing of every value type, the supports and the render arguments.
 */
#[Block('dev-test/check', title: 'Check', category: BlockCategory::Widgets, icon: 'yes', description: 'Escaping, sanitizing and supports of the framework.')]
#[Supports(anchor: true, align: [Align::Wide], customCSS: false)]
final readonly class Check
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(WP_Block $block, string $content, CheckAttributes $attrs): string
    {
        return $this->renderer->render('Block/Check/Check.twig', [
            'attrs' => $attrs,
            'content' => $content,
            'block_name' => $block->name,
        ]);
    }
}
