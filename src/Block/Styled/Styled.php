<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\Styled;

use WebCodingCat\WpAppFramework\Block\Block;
use WebCodingCat\WpAppFramework\Block\BlockCategory;
use WebCodingCat\WpAppFramework\Twig\TemplateRenderer;

/**
 * Styled with Tailwind utilities of the theme's stylesheet (assets/styles.css).
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
