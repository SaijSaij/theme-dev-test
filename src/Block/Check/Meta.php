<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\Check;

use WebCodingCat\WpAppFramework\Value\Label;
use WebCodingCat\WpAppFramework\Value\PlainText;
use WebCodingCat\WpAppFramework\Value\Url;

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
