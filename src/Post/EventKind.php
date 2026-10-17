<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Post;

use WebCodingCat\WpAppFramework\Value\Labeled;

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
