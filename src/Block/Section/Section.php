<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Section;

use Saij\ThemeDevTest\Block\Hero\Hero;
use Saij\WpAppFramework\Block\Align;
use Saij\WpAppFramework\Block\Block;
use Saij\WpAppFramework\Block\BlockCategory;
use Saij\WpAppFramework\Block\InnerBlocks;
use Saij\WpAppFramework\Block\Supports;
use Saij\WpAppFramework\Twig\TemplateRenderer;

#[Block('section', title: 'Section', category: BlockCategory::Design, icon: 'columns', description: 'Container for hero blocks.', excerptWrapper: true)]
#[InnerBlocks(allowed: [Hero::class])]
#[Supports(contentRole: true, align: [Align::Wide, Align::Full])]
final readonly class Section
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(string $content): string
    {
        return $this->renderer->render('Block/Section/Section.twig', ['content' => $content]);
    }
}
