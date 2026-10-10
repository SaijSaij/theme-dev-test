<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Check;

use Saij\WpAppFramework\Block\Label;
use Saij\WpAppFramework\Block\PlainText;
use Saij\WpAppFramework\Value\Url;

/**
 * A nested value class (not a list) with an inline field.
 */
final readonly class Meta
{
    public function __construct(
        #[PlainText]
        #[Label('Caption')]
        public string $caption = '',
        #[Url]
        public string $source = '',
    ) {}
}
