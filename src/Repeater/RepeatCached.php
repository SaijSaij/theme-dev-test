<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Repeater;

use Saij\ThemeDevTest\Cache\Counter;
use Saij\ThemeDevTest\Post\Event;
use Saij\WpAppFramework\Block\Block;
use Saij\WpAppFramework\Block\BlockCategory;
use Saij\WpAppFramework\Block\InnerBlocks;
use Saij\WpAppFramework\Block\Repeater;
use Saij\WpAppFramework\Cache\Cache;
use Saij\WpAppFramework\Cache\Tag\PostTypeTag;
use Saij\WpAppFramework\Twig\TemplateRenderer;

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
