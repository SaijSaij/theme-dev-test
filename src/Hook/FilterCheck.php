<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Hook;

use Saij\WpAppFramework\Hook\Hook;

/**
 * Filter with an injected service between WordPress arguments; the optional
 * third argument is never passed, so its default applies.
 */
final class FilterCheck
{
    #[Hook('dev_test/filter')]
    public function filter(string $value, Greeting $greeting, Marker $marker, int $count = 1): string
    {
        return sprintf('%s: %s (%s, %d)', $greeting->getMessage(), $value, $marker->getName(), $count);
    }
}
