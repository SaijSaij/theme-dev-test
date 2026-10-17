<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Support;

use WebCodingCat\WpAppFramework\Block\Support\BlockSupport;

/**
 * Block support with a string value and an injected service; its control is
 * replaced by Accent.editor.js. Unknown accents add no class.
 */
#[BlockSupport('accent', label: 'Accent')]
final readonly class Accent
{
    public function __construct(private AccentPalette $palette) {}

    public function className(?string $value = null): ?string
    {
        return $value === null ? null : $this->palette->className($value);
    }
}
