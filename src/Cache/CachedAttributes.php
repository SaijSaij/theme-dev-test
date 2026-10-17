<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Cache;

use WebCodingCat\WpAppFramework\Value\PlainText;

final readonly class CachedAttributes
{
    public function __construct(
        #[PlainText]
        public string $label = '',
    ) {}
}
