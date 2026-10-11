<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\References;

use Saij\WpAppFramework\Value\PostReference;
use Saij\WpAppFramework\Value\TermReference;
use Saij\WpAppFramework\Value\UserReference;

final readonly class ReferencesAttributes
{
    /**
     * @param list<int> $posts
     */
    public function __construct(
        #[PostReference(postTypes: ['page'])]
        public ?int $page = null,
        #[PostReference(postTypes: ['post', 'page'])]
        public array $posts = [],
        #[TermReference(taxonomies: ['category'])]
        public ?int $topic = null,
        #[UserReference]
        public ?int $author = null,
    ) {}
}
