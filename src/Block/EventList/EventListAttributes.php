<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\EventList;

use WebCodingCat\ThemeDevTest\Post\Genre;
use WebCodingCat\WpAppFramework\Value\TermReference;

final readonly class EventListAttributes
{
    public function __construct(
        public int $limit = 3,
        #[TermReference(taxonomies: [Genre::class])]
        public ?int $genre = null,
    ) {}
}
