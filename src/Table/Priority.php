<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Table;

/**
 * The priority of a log entry: an int enum, stored as bigint.
 */
enum Priority: int
{
    case Low = 1;
    case High = 9;
}
