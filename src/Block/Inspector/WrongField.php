<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\Inspector;

use WebCodingCat\WpAppFramework\Block\Block;
use WebCodingCat\WpAppFramework\Block\BlockCategory;
use WebCodingCat\WpAppFramework\Twig\TemplateRenderer;

/**
 * Intentionally wrong: its template marks a field edited in the inspector
 * with field(), which throws when rendering. Only inserted in the editor by
 * the browser tests, never stored.
 */
#[Block('wrong-field', title: 'Wrong field check', category: BlockCategory::Widgets, icon: 'warning')]
final readonly class WrongField
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(WrongFieldAttributes $attrs): string
    {
        return $this->renderer->render('Block/Inspector/WrongField.twig', ['attrs' => $attrs]);
    }
}
