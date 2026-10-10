<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Rest;

use Saij\WpAppFramework\Value\Url;

final readonly class Link
{
    public function __construct(
        public string $label,
        #[Url]
        public string $url = '',
    ) {}
}
