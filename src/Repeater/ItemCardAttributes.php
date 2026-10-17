<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Repeater;

use WebCodingCat\WpAppFramework\Value\PlainText;

final readonly class ItemCardAttributes
{
    public function __construct(
        #[PlainText]
        public string $label = '',
    ) {}
}
