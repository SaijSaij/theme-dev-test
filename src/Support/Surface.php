<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Support;

use Saij\WpAppFramework\Block\Support\BlockSupport;

/**
 * Block support with an enum value, in the Styles tab: the class surface-light or
 * surface-dark (styled in assets/styles.css).
 */
#[BlockSupport('surface', label: 'Surface')]
final class Surface
{
    public function className(SurfaceTone $value = SurfaceTone::Light): string
    {
        return 'surface-' . $value->value;
    }
}
