<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Tabs;

use Saij\ThemeDevTest\Block\Category;
use Saij\WpAppFramework\Block\Block;
use Saij\WpAppFramework\Block\Context;
use Saij\WpAppFramework\Block\CoreBlock;
use Saij\WpAppFramework\Block\InnerBlocks;
use Saij\WpAppFramework\Twig\TemplateRenderer;

/**
 * A tab: only inside tabs (parent), with the tone and the active tab of its tabs as typed values of render()
 * (#[Context]); without tabs around it, the defaults. Its inserter preview is the automatic one.
 */
#[Block('tab', title: 'Test tab', category: Category::Components, icon: 'index-card', parent: [Tabs::class])]
#[InnerBlocks(allowed: [CoreBlock::Paragraph, CoreBlock::Heading])]
final readonly class Tab
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(
        TabAttributes $attrs,
        string $content,
        #[Context(Tabs::class, 'tone')]
        ?TabTone $tone = null,
        #[Context(Tabs::class, 'active')]
        int $active = 0,
    ): string {
        return $this->renderer->render('Block/Tabs/Tab.twig', ['attrs' => $attrs, 'content' => $content, 'tone' => $tone, 'active' => $active]);
    }
}
