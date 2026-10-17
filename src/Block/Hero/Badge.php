<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\Hero;

use WebCodingCat\WpAppFramework\Value\PlainText;

final readonly class Badge
{
    public function __construct(
        #[PlainText]
        public string $text = '',
        public BadgeIcon $icon = BadgeIcon::Star,
    ) {}
}
