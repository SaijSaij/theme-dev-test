<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Card;

use Saij\WpAppFramework\Block\Label;
use Saij\WpAppFramework\Block\PlainText;
use Saij\WpAppFramework\Value\Url;

final readonly class CardLink
{
    public function __construct(
        #[PlainText]
        public string $label,
        #[Url]
        #[Label('URL')]
        public string $url = '',
    ) {}
}
