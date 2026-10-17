<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Setting;

use WebCodingCat\WpAppFramework\Value\Labeled;

enum Density: string implements Labeled
{
    case Compact = 'compact';
    case Normal = 'normal';
    case Relaxed = 'relaxed';

    public function label(): string
    {
        return match ($this) {
            self::Compact => 'Compact',
            self::Normal => 'Normal',
            self::Relaxed => 'Relaxed',
        };
    }
}
