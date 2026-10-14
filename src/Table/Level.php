<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Table;

/**
 * The level of a log entry: a string enum, stored as varchar.
 */
enum Level: string
{
    case Info = 'info';
    case Warning = 'warning';
    case Error = 'error';
}
