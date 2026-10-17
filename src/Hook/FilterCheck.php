<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Hook;

use WebCodingCat\WpAppFramework\Hook\Hook;

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
