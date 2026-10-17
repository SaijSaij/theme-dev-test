<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\Check;

use WebCodingCat\WpAppFramework\Block\Align;
use WebCodingCat\WpAppFramework\Block\Block;
use WebCodingCat\WpAppFramework\Block\BlockCategory;
use WebCodingCat\WpAppFramework\Block\Supports;
use WebCodingCat\WpAppFramework\Twig\TemplateRenderer;
use WP_Block;

/**
 * Covers escaping and sanitizing of every value type, the supports and the render arguments.
 */
#[Block('check', title: 'Check', category: BlockCategory::Widgets, icon: 'yes', description: 'Escaping, sanitizing and supports of the framework.')]
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
