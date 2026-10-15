<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Tabs;

use Saij\WpAppFramework\Block\ProvidesContext;
use Saij\WpAppFramework\Value\Label;

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
