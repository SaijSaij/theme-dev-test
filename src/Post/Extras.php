<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Post;

use WebCodingCat\WpAppFramework\Post\Page;
use WebCodingCat\WpAppFramework\Post\Post;
use WebCodingCat\WpAppFramework\Post\PostMeta;
use WebCodingCat\WpAppFramework\Value\PlainText;

/**
 * Meta of WordPress' own post types.
 */
#[PostMeta('extras', title: 'Extras', postTypes: [Post::class, Page::class])]
final class Extras
{
    public function __construct(
        #[PlainText]
        private string $subtitle = '',
        private bool $featured = false,
    ) {}

    public function getSubtitle(): string
    {
        return $this->subtitle;
    }

    public function isFeatured(): bool
    {
        return $this->featured;
    }
}
