<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\RevealBox;

use WebCodingCat\WpAppFramework\Value\PlainText;

final readonly class RevealBoxAttributes
{
    public function __construct(
        #[PlainText]
        public string $text = '',
    ) {}
}
