<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Setting;

/**
 * A value class nested in a list item.
 */
final readonly class LinkStyle
{
    public function __construct(
        public bool $external = false,
    ) {}
}
