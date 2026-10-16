<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Hero;

use Saij\ThemeDevTest\Support\Accent;
use Saij\ThemeDevTest\Support\Surface;
use Saij\WpAppFramework\Block\Block;
use Saij\WpAppFramework\Block\BlockCategory;
use Saij\WpAppFramework\Block\Support\UseSupport;
use Saij\WpAppFramework\Twig\TemplateRenderer;

/**
 * Full-width intro: headline, subline, up to three badges and three buttons on a background color and image
 * (#[Color], #[ListOf] with max, #[Image] in the inspector).
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
