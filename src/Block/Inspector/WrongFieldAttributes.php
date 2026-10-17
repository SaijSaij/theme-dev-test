<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\Inspector;

use WebCodingCat\WpAppFramework\Value\PlainText;

final readonly class WrongFieldAttributes
{
    public function __construct(
        #[PlainText(inspector: true)]
        public string $note = '',
    ) {}
}
