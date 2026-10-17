<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Support;

/**
 * The accents the theme offers; injected into the Accent support.
 */
final class AccentPalette
{
    /** @var list<string> */
    private const array ACCENTS = ['coral', 'teal'];

    public function className(string $accent): ?string
    {
        return in_array($accent, self::ACCENTS, true) ? 'accent-' . $accent : null;
    }
}
