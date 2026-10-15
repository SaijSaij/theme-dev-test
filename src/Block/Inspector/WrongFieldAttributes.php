<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Inspector;

use Saij\WpAppFramework\Value\PlainText;

final readonly class WrongFieldAttributes
{
    public function __construct(
        #[PlainText(inspector: true)]
        public string $note = '',
    ) {}
}
