<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Cache;

use WebCodingCat\WpAppFramework\Cache\CacheTag;

/**
 * A tag of the theme, invalidated through CacheController::invalidate().
 */
enum Feed: string implements CacheTag
{
    case Stats = 'stats';
}
