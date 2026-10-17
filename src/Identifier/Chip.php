<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Identifier;

use WebCodingCat\WpAppFramework\Value\Identifier;
use WebCodingCat\WpAppFramework\Value\PlainText;

final readonly class Chip
{
    public function __construct(
        #[Identifier]
        public string $id = '',
        #[PlainText]
        public string $label = '',
    ) {}
}
