<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Stack;

use Saij\ThemeDevTest\Block\Category;
use Saij\ThemeDevTest\Block\Hero\Hero;
use Saij\WpAppFramework\Block\Appender;
use Saij\WpAppFramework\Block\Block;
use Saij\WpAppFramework\Block\CoreBlock;
use Saij\WpAppFramework\Block\Example;
use Saij\WpAppFramework\Block\InnerBlocks;
use Saij\WpAppFramework\Block\Supports;
use Saij\WpAppFramework\Twig\TemplateRenderer;

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
