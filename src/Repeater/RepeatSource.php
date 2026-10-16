<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Repeater;

use Saij\WpAppFramework\Value\Labeled;

/**
 * What a repeat list repeats its inner blocks for: one kind of item of Repeater each.
 */
enum RepeatSource: string implements Labeled
{
    case Events = 'events';
    case Genres = 'genres';
    case Comments = 'comments';
    case Users = 'users';
    case Log = 'log';
    case Mixed = 'mixed';

    public function label(): string
    {
        return ucfirst($this->value);
    }
}
