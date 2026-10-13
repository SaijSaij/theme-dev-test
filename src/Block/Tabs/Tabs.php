<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Tabs;

use Saij\ThemeDevTest\Block\Category;
use Saij\WpAppFramework\Block\Block;
use Saij\WpAppFramework\Block\Example;
use Saij\WpAppFramework\Block\InnerBlocks;
use Saij\WpAppFramework\Block\Orientation;
use Saij\WpAppFramework\Block\Supports;
use Saij\WpAppFramework\Block\TemplateBlock;
use Saij\WpAppFramework\Block\TemplateLock;
use Saij\WpAppFramework\Block\Variation;
use Saij\WpAppFramework\Block\VariationScope;
use Saij\WpAppFramework\Twig\TemplateRenderer;

/**
 * A container with a template of two tabs, which editors may reorder but not add to or remove from (templateLock
 * insert), laid out side by side. It passes its tone and active tab to the tabs inside (containers.spec.js).
 */
#[Block('tabs', title: 'Test tabs', category: Category::Sections, icon: 'index-card', description: 'Tabs side by side.')]
#[Supports(contentRole: true)]
#[InnerBlocks(
    allowed: [Tab::class],
    template: [new TemplateBlock(Tab::class, ['title' => 'Tab 1']), new TemplateBlock(Tab::class, ['title' => 'Tab 2'])],
    templateLock: TemplateLock::Insert,
    orientation: Orientation::Horizontal,
)]
#[Example(attributes: ['tone' => TabTone::Dark], innerBlocks: [new TemplateBlock(Tab::class, ['title' => 'Example tab'])])]
#[Variation('three', 'Three tabs', description: 'Tabs with three tabs.', innerBlocks: [
    new TemplateBlock(Tab::class, ['title' => 'First']),
    new TemplateBlock(Tab::class, ['title' => 'Second']),
    new TemplateBlock(Tab::class, ['title' => 'Third']),
], scope: [VariationScope::Inserter])]
#[Variation('dark', 'Dark tabs', icon: 'admin-appearance', attributes: ['tone' => TabTone::Dark], scope: [VariationScope::Inserter, VariationScope::Transform], isActive: ['tone'])]
final readonly class Tabs
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(TabsAttributes $attrs, string $content): string
    {
        return $this->renderer->render('Block/Tabs/Tabs.twig', ['attrs' => $attrs, 'content' => $content]);
    }
}
