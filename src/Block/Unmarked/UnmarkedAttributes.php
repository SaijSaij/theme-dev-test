<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Unmarked;

use Saij\WpAppFramework\Block\PlainText;

final readonly class UnmarkedAttributes
{
    public function __construct(
        #[PlainText]
        public string $title = '',
    ) {}
}
