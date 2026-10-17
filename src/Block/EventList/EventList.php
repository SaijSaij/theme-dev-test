<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\EventList;

use WebCodingCat\ThemeDevTest\Post\Event;
use WebCodingCat\ThemeDevTest\Post\EventDetailsFields;
use WebCodingCat\ThemeDevTest\Post\Genre;
use WebCodingCat\WpAppFramework\Block\Block;
use WebCodingCat\WpAppFramework\Block\BlockCategory;
use WebCodingCat\WpAppFramework\Query\PostOrder;
use WebCodingCat\WpAppFramework\Query\Terms;
use WebCodingCat\WpAppFramework\Twig\TemplateRenderer;

/**
 * The next events, optionally of a genre: a cached query in render(), the post objects in Twig.
 */
#[Block('event-list', title: 'Event list', category: BlockCategory::Theme, icon: 'list-view')]
final readonly class EventList
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(EventListAttributes $attrs): string
    {
        $query = Event::query()->orderBy(EventDetailsFields::start())->orderBy(PostOrder::Title)->limit(max(1, $attrs->limit));
        if ($attrs->genre !== null) {
            $query = $query->where(Terms::in(Genre::class, [$attrs->genre]));
        }

        return $this->renderer->render('Block/EventList/EventList.twig', ['events' => $query->cache(600)->get()]);
    }
}
