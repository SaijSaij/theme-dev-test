<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Hero;

use Saij\WpAppFramework\Block\Labeled;

enum Gradient: string implements Labeled
{
    case Black = 'black';
    case Blue = 'blue';

    public function label(): string
    {
        return match ($this) {
            self::Black => 'Black',
            self::Blue => 'Blue',
        };
    }
}
