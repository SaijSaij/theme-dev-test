<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\Tabs;

use WebCodingCat\WpAppFramework\Block\ProvidesContext;
use WebCodingCat\WpAppFramework\Value\Label;

final readonly class TabsAttributes
{
    public function __construct(
        #[ProvidesContext]
        public TabTone $tone = TabTone::Light,
        #[ProvidesContext]
        #[Label('Active tab')]
        public int $active = 1,
    ) {}
}
