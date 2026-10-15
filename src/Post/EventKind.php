<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Post;

use Saij\WpAppFramework\Value\Labeled;

enum EventKind: string implements Labeled
{
    case Concert = 'concert';
    case Talk = 'talk';

    public function label(): string
    {
        return match ($this) {
            self::Concert => 'Concert',
            self::Talk => 'Talk',
        };
    }
}
