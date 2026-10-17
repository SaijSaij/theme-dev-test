<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Support;

use WebCodingCat\WpAppFramework\Block\Support\BlockSupport;
use WebCodingCat\WpAppFramework\Block\Support\SupportGroup;

/**
 * Block support with a boolean value, in the Settings panel: two classes when on, none when off.
 */
#[BlockSupport('framed', label: 'Framed', group: SupportGroup::Settings)]
final class Framed
{
    public function className(bool $value = false): ?string
    {
        return $value ? 'is-framed has-frame' : null;
    }
}
