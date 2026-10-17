<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\Check;

use WebCodingCat\WpAppFramework\Value\Labeled;

enum Variant: string implements Labeled
{
    case Light = 'light';
    case Dark = 'dark';

    public function label(): string
    {
        return match ($this) {
            self::Light => 'Light theme',
            self::Dark => 'Dark theme',
        };
    }
}
