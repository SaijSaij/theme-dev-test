<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\Tabs;

use WebCodingCat\WpAppFramework\Value\Labeled;

enum TabTone: string implements Labeled
{
    case Light = 'light';
    case Dark = 'dark';

    public function label(): string
    {
        return match ($this) {
            self::Light => 'Light',
            self::Dark => 'Dark',
        };
    }
}
