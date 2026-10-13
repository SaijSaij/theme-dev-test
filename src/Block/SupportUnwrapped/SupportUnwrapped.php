<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\SupportUnwrapped;

use Saij\ThemeDevTest\Support\Framed;
use Saij\WpAppFramework\Block\Block;
use Saij\WpAppFramework\Block\BlockCategory;
use Saij\WpAppFramework\Block\Support\UseSupport;
use Saij\WpAppFramework\Block\Supports;

/**
 * Intentionally broken: uses a block support, but its root element has no
 * block_wrapper_attributes(), so rendering fails. Only rendered through the
 * render route by the browser tests; never stored in a post.
 */
#[Block('support-unwrapped', title: 'Unwrapped support check', category: BlockCategory::Widgets, icon: 'warning')]
#[Supports(inserter: false)]
#[UseSupport(Framed::class)]
final readonly class SupportUnwrapped
{
    public function render(): string
    {
        return '<div class="support-unwrapped">no wrapper attributes</div>';
    }
}
