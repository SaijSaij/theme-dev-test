<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Unmarked;

use Saij\WpAppFramework\Value\PlainText;

final readonly class UnmarkedAttributes
{
    public function __construct(
        #[PlainText]
        public string $title = '',
    ) {}
}
