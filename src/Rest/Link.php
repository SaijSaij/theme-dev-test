<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Rest;

use WebCodingCat\WpAppFramework\Value\Url;

final readonly class Link
{
    public function __construct(
        public string $label,
        #[Url]
        public string $url = '',
    ) {}
}
