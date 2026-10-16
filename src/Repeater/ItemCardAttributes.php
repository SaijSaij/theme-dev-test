<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Repeater;

use Saij\WpAppFramework\Value\PlainText;

final readonly class ItemCardAttributes
{
    public function __construct(
        #[PlainText]
        public string $label = '',
    ) {}
}
