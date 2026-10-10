<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Inspector;

use Saij\WpAppFramework\Block\Block;
use Saij\WpAppFramework\Block\BlockCategory;
use Saij\WpAppFramework\Twig\TemplateRenderer;

/**
 * Intentionally wrong: its template marks a field edited in the inspector
 * with field(), which throws when rendering. Only inserted in the editor by
 * the browser tests, never stored.
 */
#[Block('dev-test/wrong-field', title: 'Wrong field check', category: BlockCategory::Widgets, icon: 'warning')]
final readonly class WrongField
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(WrongFieldAttributes $attrs): string
    {
        return $this->renderer->render('Block/Inspector/WrongField.twig', ['attrs' => $attrs]);
    }
}
