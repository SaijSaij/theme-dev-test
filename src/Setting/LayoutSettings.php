<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Setting;

use WebCodingCat\WpAppFramework\Setting\SettingsGroup;

/**
 * A second group, shown before "General" (position): option dev_test_layout.
 */
#[SettingsGroup('layout', title: 'Layout', position: 5)]
final readonly class LayoutSettings
{
    public function __construct(
        public bool $wide = false,
        public int $columns = 2,
    ) {}
}
