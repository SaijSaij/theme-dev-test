<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Identifier;

use Saij\WpAppFramework\Value\Identifier;
use Saij\WpAppFramework\Value\PlainText;

final readonly class Region
{
    public function __construct(
        #[Identifier]
        public string $id = '',
        #[PlainText]
        public string $name = '',
    ) {}
}
