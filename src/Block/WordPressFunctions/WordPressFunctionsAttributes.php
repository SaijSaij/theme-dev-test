<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\WordPressFunctions;

use WebCodingCat\WpAppFramework\Value\PostReference;
use WebCodingCat\WpAppFramework\Value\UserReference;

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
