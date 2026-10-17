<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Repeater;

use WebCodingCat\ThemeDevTest\Cache\Counter;
use WebCodingCat\ThemeDevTest\Post\Event;
use WebCodingCat\WpAppFramework\Block\Block;
use WebCodingCat\WpAppFramework\Block\BlockCategory;
use WebCodingCat\WpAppFramework\Block\InnerBlocks;
use WebCodingCat\WpAppFramework\Block\Repeater;
use WebCodingCat\WpAppFramework\Cache\Cache;
use WebCodingCat\WpAppFramework\Cache\Tag\PostTypeTag;
use WebCodingCat\WpAppFramework\Twig\TemplateRenderer;

/**
 * A cached repeat list of events (#[Cache] on a block with Repeater) that shows how often it rendered: a changed
 * inner block renders anew, a cache hit does not.
 */
#[Block('repeat-cached', title: 'Cached repeat list', category: BlockCategory::Design, icon: 'database')]
#[InnerBlocks(allowed: [ItemCard::class])]
#[Cache(ttl: 300, tags: [new PostTypeTag(Event::class)])]
final readonly class RepeatCached
{
    public function __construct(
        private TemplateRenderer $renderer,
        private RepeatItems $items,
        private Counter $counter,
    ) {}

    public function render(RepeatListAttributes $attrs, Repeater $repeater): string
    {
        return $this->renderer->render('Repeater/RepeatList.twig', [
            'items' => $this->items->items($attrs, $repeater),
            'render' => $this->counter->next('repeat-cached'),
        ]);
    }
}
