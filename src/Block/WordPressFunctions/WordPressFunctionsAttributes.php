<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\WordPressFunctions;

use Saij\WpAppFramework\Value\PostReference;
use Saij\WpAppFramework\Value\UserReference;

final readonly class WordPressFunctionsAttributes
{
    public function __construct(
        #[PostReference(postTypes: ['post'])]
        public ?int $post = null,
        public ?int $attachment = null,
        #[UserReference]
        public ?int $user = null,
        public int $timestamp = 0,
        public float $number = 0.0,
        public int $bytes = 0,
    ) {}
}
