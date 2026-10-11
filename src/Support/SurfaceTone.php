<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Support;

use Saij\WpAppFramework\Block\Labeled;

enum SurfaceTone: string implements Labeled
{
    case Light = 'light';
    case Dark = 'dark';

    public function label(): string
    {
        return match ($this) {
            self::Light => 'Light surface',
            self::Dark => 'Dark surface',
        };
    }
}
