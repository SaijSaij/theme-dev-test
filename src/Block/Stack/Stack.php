<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\Stack;

use WebCodingCat\ThemeDevTest\Block\Category;
use WebCodingCat\ThemeDevTest\Block\Hero\Hero;
use WebCodingCat\WpAppFramework\Block\Appender;
use WebCodingCat\WpAppFramework\Block\Block;
use WebCodingCat\WpAppFramework\Block\CoreBlock;
use WebCodingCat\WpAppFramework\Block\Example;
use WebCodingCat\WpAppFramework\Block\InnerBlocks;
use WebCodingCat\WpAppFramework\Block\Supports;
use WebCodingCat\WpAppFramework\Twig\TemplateRenderer;

/**
 * A container without lock that offers headings first in its quick inserter (prioritized), adds blocks with the
 * "+" button (appender) and has no inserter preview (containers.spec.js).
 */
#[Block('stack', title: 'Stack', category: Category::Sections, icon: 'excerpt-view')]
#[Supports(contentRole: true)]
#[InnerBlocks(
    allowed: [CoreBlock::Paragraph, CoreBlock::Heading, CoreBlock::List, Hero::class],
    prioritized: [CoreBlock::Heading, Hero::class],
    appender: Appender::Button,
)]
#[Example(false)]
final readonly class Stack
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(string $content): string
    {
        return $this->renderer->render('Block/Stack/Stack.twig', ['content' => $content]);
    }
}
