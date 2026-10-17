<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\References;

use WebCodingCat\WpAppFramework\Value\PostReference;
use WebCodingCat\WpAppFramework\Value\TermReference;
use WebCodingCat\WpAppFramework\Value\UserReference;

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
