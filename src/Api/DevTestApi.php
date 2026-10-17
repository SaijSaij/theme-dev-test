<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Api;

use WebCodingCat\WpAppFramework\Api\PublicApi;

/**
 * Public API of the theme; the test child theme injects it with #[ThemeApi].
 * Its signatures use only PHP (checked by the build).
 */
#[PublicApi]
final class DevTestApi
{
    /**
     * The names of the blocks the theme provides.
     *
     * @return list<string>
     */
    public function getBlockNames(): array
    {
        return ['dev-test/hero', 'dev-test/section', 'dev-test/paragraph'];
    }
}
