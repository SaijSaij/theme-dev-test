<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\Styled;

use WebCodingCat\WpAppFramework\Value\PlainText;

final readonly class StyledAttributes
{
    public function __construct(
        #[PlainText]
        public string $text = '',
        public bool $highlighted = false,
    ) {}
}
