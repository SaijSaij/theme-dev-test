<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Cache;

/**
 * Counts how often something was computed, in the option theme_dev_test_cache_counts: a cache hit does not count.
 */
final class Counter
{
    public const string OPTION = 'theme_dev_test_cache_counts';

    public function next(string $name): int
    {
        $counts = get_option(self::OPTION, []);
        $counts = is_array($counts) ? $counts : [];
        $count = is_int($counts[$name] ?? null) ? $counts[$name] + 1 : 1;
        $counts[$name] = $count;
        update_option(self::OPTION, $counts, false);

        return $count;
    }
}
