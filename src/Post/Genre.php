<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Post;

use WebCodingCat\WpAppFramework\Post\Post;
use WebCodingCat\WpAppFramework\Post\Taxonomy;

#[Taxonomy('genre', label: 'Genres', singularLabel: 'Genre', postTypes: [Event::class, Post::class], hierarchical: true)]
final class Genre {}
