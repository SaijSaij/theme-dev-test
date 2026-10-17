<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\Inspector;

use WebCodingCat\WpAppFramework\Block\Block;
use WebCodingCat\WpAppFramework\Block\BlockCategory;
use WebCodingCat\WpAppFramework\Twig\TemplateRenderer;

/**
 * Fields edited in the inspector (inspector: true), also inside list items.
 */
#[Block('inspector', title: 'Inspector check', category: BlockCategory::Widgets, icon: 'admin-settings')]
final readonly class Inspector
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(InspectorAttributes $attrs): string
    {
        return $this->renderer->render('Block/Inspector/Inspector.twig', ['attrs' => $attrs]);
    }
}
