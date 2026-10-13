<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Post;

use Saij\WpAppFramework\Post\Post;
use Saij\WpAppFramework\Post\Taxonomy;

#[Taxonomy('genre', label: 'Genres', singularLabel: 'Genre', postTypes: [Event::class, Post::class], hierarchical: true)]
final class Genre {}
