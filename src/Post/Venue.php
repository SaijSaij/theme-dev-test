<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Post;

use WebCodingCat\WpAppFramework\Post\AbstractPost;
use WebCodingCat\WpAppFramework\Post\PostType;
use WebCodingCat\WpAppFramework\Post\PostTypeLabels;
use WebCodingCat\WpAppFramework\Post\PostTypeSupport;

/**
 * A data type: not public, without the block editor (classic edit screen with a meta box).
 */
#[PostType('venue', label: 'Venues', singularLabel: 'Venue', public: false, supports: [PostTypeSupport::Title], labels: new PostTypeLabels(addNewItem: 'Add a venue'))]
final class Venue extends AbstractPost {}
