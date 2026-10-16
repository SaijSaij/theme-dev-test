<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Hero;

use Saij\WpAppFramework\Value\PlainText;

final readonly class Badge
{
    public function __construct(
        #[PlainText]
        public string $text = '',
        public BadgeIcon $icon = BadgeIcon::Star,
    ) {}
}
