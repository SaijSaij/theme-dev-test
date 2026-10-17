<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Hook;

/**
 * Service injected into the hooks of the test theme.
 */
final class Greeting
{
    public function getMessage(): string
    {
        return 'Hello from a service';
    }
}
