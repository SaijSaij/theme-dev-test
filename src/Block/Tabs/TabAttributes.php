<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Tabs;

use Saij\WpAppFramework\Block\PlainText;

final readonly class TabAttributes
{
    public function __construct(
        #[PlainText]
        public string $title = '',
    ) {}
}
