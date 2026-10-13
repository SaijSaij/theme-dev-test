<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Post;

use Saij\WpAppFramework\Post\AbstractPost;
use Saij\WpAppFramework\Post\PostType;
use Saij\WpAppFramework\Post\PostTypeLabels;
use Saij\WpAppFramework\Post\PostTypeSupport;

/**
 * A data type: not public, without the block editor (classic edit screen with a meta box).
 */
#[PostType('venue', label: 'Venues', singularLabel: 'Venue', public: false, supports: [PostTypeSupport::Title], labels: new PostTypeLabels(addNewItem: 'Add a venue'))]
final class Venue extends AbstractPost {}
