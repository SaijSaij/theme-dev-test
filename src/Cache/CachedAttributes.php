<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Cache;

use Saij\WpAppFramework\Value\PlainText;

final readonly class CachedAttributes
{
    public function __construct(
        #[PlainText]
        public string $label = '',
    ) {}
}
