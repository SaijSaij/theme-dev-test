<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\Section;

use WebCodingCat\ThemeDevTest\Block\Hero\Hero;
use WebCodingCat\WpAppFramework\Block\Align;
use WebCodingCat\WpAppFramework\Block\Block;
use WebCodingCat\WpAppFramework\Block\BlockCategory;
use WebCodingCat\WpAppFramework\Block\InnerBlocks;
use WebCodingCat\WpAppFramework\Block\Supports;
use WebCodingCat\WpAppFramework\Twig\TemplateRenderer;

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
