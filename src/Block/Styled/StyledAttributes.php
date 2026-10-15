<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Styled;

use Saij\WpAppFramework\Value\PlainText;

final readonly class StyledAttributes
{
    public function __construct(
        #[PlainText]
        public string $text = '',
        public bool $highlighted = false,
    ) {}
}
