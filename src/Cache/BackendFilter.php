<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Cache;

use WebCodingCat\WpAppFramework\Hook\Hook;

/**
 * Lets the tests force the cache backends (CacheController::setBackends()).
 */
final class BackendFilter
{
    public const string OPTION = 'theme_dev_test_cache_backends';

    /**
     * @param list<string> $backends
     * @return list<string>
     */
    #[Hook('wp_app_framework/cache/backends/theme-dev-test')]
    public function backends(array $backends): array
    {
        $forced = get_option(self::OPTION);

        return is_array($forced) ? array_values(array_filter($forced, is_string(...))) : $backends;
    }
}
