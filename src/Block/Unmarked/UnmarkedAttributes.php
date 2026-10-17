<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\Unmarked;

use WebCodingCat\WpAppFramework\Value\PlainText;

final readonly class UnmarkedAttributes
{
    public function __construct(
        #[PlainText]
        public string $title = '',
    ) {}
}
