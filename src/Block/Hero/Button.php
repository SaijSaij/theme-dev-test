<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Hero;

use Saij\WpAppFramework\Value\Label;
use Saij\WpAppFramework\Value\PlainText;
use Saij\WpAppFramework\Value\Url;

final readonly class Button
{
    public function __construct(
        #[PlainText]
        public string $label,
        #[Url]
        #[Label('URL')]
        public string $url = '',
    ) {}
}
