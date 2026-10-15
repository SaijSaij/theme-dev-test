<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\RevealBox;

use Saij\WpAppFramework\Value\PlainText;

final readonly class RevealBoxAttributes
{
    public function __construct(
        #[PlainText]
        public string $text = '',
    ) {}
}
