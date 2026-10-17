<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Repeater;

use WebCodingCat\WpAppFramework\Block\Block;
use WebCodingCat\WpAppFramework\Block\BlockCategory;
use WebCodingCat\WpAppFramework\Block\CoreBlock;
use WebCodingCat\WpAppFramework\Block\InnerBlocks;
use WebCodingCat\WpAppFramework\Block\Repeater;
use WebCodingCat\WpAppFramework\Block\TemplateBlock;
use WebCodingCat\WpAppFramework\Twig\TemplateRenderer;

/**
 * Repeats its inner blocks for events, genres, comments, users or log entries (Repeater): the IDs are an attribute,
 * so a test lists exactly its own items.
 */
#[Block('repeat-list', title: 'Repeat list', category: BlockCategory::Design, icon: 'list-view')]
#[InnerBlocks(allowed: [ItemCard::class, CoreBlock::PostTitle], template: [new TemplateBlock(ItemCard::class, ['label' => 'Card'])])]
final readonly class RepeatList
{
    public function __construct(
        private TemplateRenderer $renderer,
        private RepeatItems $items,
    ) {}

    public function render(RepeatListAttributes $attrs, Repeater $repeater): string
    {
        return $this->renderer->render('Repeater/RepeatList.twig', ['items' => $this->items->items($attrs, $repeater)]);
    }
}
