<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Hero;

use Saij\WpAppFramework\Block\Align;
use Saij\WpAppFramework\Block\Block;
use Saij\WpAppFramework\Block\BlockCategory;
use Saij\WpAppFramework\Block\Supports;
use Saij\WpAppFramework\Twig\TemplateRenderer;

#[Block('dev-test/hero', title: 'Hero', category: BlockCategory::Design, icon: 'cover-image', description: 'Intro with topline, headline, image and buttons.')]
#[Supports(align: [Align::Wide, Align::Full])]
final readonly class Hero
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(HeroAttributes $attrs): string
    {
        return $this->renderer->render('Block/Hero/Hero.twig', ['attrs' => $attrs]);
    }
}
