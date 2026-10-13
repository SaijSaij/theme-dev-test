<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Cache;

use Saij\WpAppFramework\Cache\CacheTag;

/**
 * A tag of the theme, invalidated through CacheController::invalidate().
 */
enum Feed: string implements CacheTag
{
    case Stats = 'stats';
}
