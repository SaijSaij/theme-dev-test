<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\EventList;

use Saij\ThemeDevTest\Post\Event;
use Saij\ThemeDevTest\Post\EventDetailsFields;
use Saij\ThemeDevTest\Post\Genre;
use Saij\WpAppFramework\Block\Block;
use Saij\WpAppFramework\Block\BlockCategory;
use Saij\WpAppFramework\Query\PostOrder;
use Saij\WpAppFramework\Query\Terms;
use Saij\WpAppFramework\Twig\TemplateRenderer;

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
