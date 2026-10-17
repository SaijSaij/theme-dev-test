<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\SupportUnwrapped;

use WebCodingCat\ThemeDevTest\Support\Framed;
use WebCodingCat\WpAppFramework\Block\Block;
use WebCodingCat\WpAppFramework\Block\BlockCategory;
use WebCodingCat\WpAppFramework\Block\Support\UseSupport;
use WebCodingCat\WpAppFramework\Block\Supports;

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
