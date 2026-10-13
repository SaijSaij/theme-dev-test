<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Unmarked;

use Saij\WpAppFramework\Block\Block;
use Saij\WpAppFramework\Block\BlockCategory;
use Saij\WpAppFramework\Twig\TemplateRenderer;

/**
 * Intentionally incomplete: its template does not mark the inline field, so
 * the editor runtime warns in development mode. Only inserted in the editor by
 * the browser tests.
 */
#[Block('unmarked', title: 'Unmarked field check', category: BlockCategory::Widgets, icon: 'warning')]
final readonly class Unmarked
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(UnmarkedAttributes $attrs): string
    {
        return $this->renderer->render('Block/Unmarked/Unmarked.twig', ['attrs' => $attrs]);
    }
}
