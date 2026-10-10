<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Inspector;

use Saij\WpAppFramework\Block\Block;
use Saij\WpAppFramework\Block\BlockCategory;
use Saij\WpAppFramework\Twig\TemplateRenderer;

/**
 * Fields edited in the inspector (inspector: true), also inside list items.
 */
#[Block('dev-test/inspector', title: 'Inspector check', category: BlockCategory::Widgets, icon: 'admin-settings')]
final readonly class Inspector
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(InspectorAttributes $attrs): string
    {
        return $this->renderer->render('Block/Inspector/Inspector.twig', ['attrs' => $attrs]);
    }
}
