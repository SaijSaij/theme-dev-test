<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\Hero;

use WebCodingCat\WpAppFramework\Value\Label;
use WebCodingCat\WpAppFramework\Value\PlainText;
use WebCodingCat\WpAppFramework\Value\Url;

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
