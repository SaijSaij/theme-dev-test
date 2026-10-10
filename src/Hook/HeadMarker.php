<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Hook;

use Saij\WpAppFramework\Hook\Hook;

/**
 * Action with a constructor-injected service: prints a meta tag the browser tests look for.
 */
final readonly class HeadMarker
{
    public function __construct(private Greeting $greeting) {}

    #[Hook('wp_head')]
    public function print(): void
    {
        printf('<meta name="dev-test-hook" content="%s">' . "\n", esc_attr($this->greeting->getMessage()));
    }
}
