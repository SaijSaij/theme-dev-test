<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\Hero;

use WebCodingCat\ThemeDevTest\Support\Accent;
use WebCodingCat\ThemeDevTest\Support\Surface;
use WebCodingCat\WpAppFramework\Block\Block;
use WebCodingCat\WpAppFramework\Block\BlockCategory;
use WebCodingCat\WpAppFramework\Block\Support\UseSupport;
use WebCodingCat\WpAppFramework\Twig\TemplateRenderer;

/**
 * Full-width intro: headline, subline, up to three badges and three buttons on a background color and image
 * (#[Color], #[ListOf] with max and appender, #[Image] in the inspector).
 */
#[Block('hero', title: 'Hero', category: BlockCategory::Design, icon: 'cover-image', description: 'Full-width intro with headline, subline, badges and buttons on a background color or image.')]
#[UseSupport(Surface::class)]
#[UseSupport(Accent::class)]
final readonly class Hero
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(HeroAttributes $attrs): string
    {
        return $this->renderer->render('Block/Hero/Hero.twig', ['attrs' => $attrs]);
    }
}
