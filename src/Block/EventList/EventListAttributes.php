<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\EventList;

use Saij\ThemeDevTest\Post\Genre;
use Saij\WpAppFramework\Value\TermReference;

final readonly class EventListAttributes
{
    public function __construct(
        public int $limit = 3,
        #[TermReference(taxonomies: [Genre::class])]
        public ?int $genre = null,
    ) {}
}
