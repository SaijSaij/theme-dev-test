<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Styled;

use Saij\WpAppFramework\Block\Block;
use Saij\WpAppFramework\Block\BlockCategory;
use Saij\WpAppFramework\Twig\TemplateRenderer;

/**
 * Styled with Tailwind utilities of the theme's stylesheet (src/styles.css).
 */
#[Block('styled', title: 'Styled', category: BlockCategory::Design, icon: 'art', description: 'Styled with the utilities of the theme stylesheet.')]
final readonly class Styled
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(StyledAttributes $attrs): string
    {
        return $this->renderer->render('Block/Styled/Styled.twig', ['attrs' => $attrs]);
    }
}
