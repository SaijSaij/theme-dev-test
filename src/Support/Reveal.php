<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Support;

use Saij\WpAppFramework\Block\Support\BlockSupport;
use Saij\WpAppFramework\Block\Support\SupportGroup;

/**
 * Block support with a view script (Reveal.view.js): marks the blocks that use it on the front end.
 */
#[BlockSupport('reveal', label: 'Reveal', group: SupportGroup::Settings)]
final class Reveal
{
    public function className(bool $value = false): ?string
    {
        return $value ? 'reveal' : null;
    }
}
