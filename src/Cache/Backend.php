<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Cache;

/**
 * The backends a test can force (values of the filter wp_app_framework/cache/backends/{slug}).
 */
enum Backend: string
{
    case Object = 'object';
    case File = 'file';
    case Transient = 'transient';
}
