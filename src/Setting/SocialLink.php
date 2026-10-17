<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Setting;

use WebCodingCat\WpAppFramework\Value\Url;

final readonly class SocialLink
{
    public function __construct(
        public string $label,
        #[Url]
        public string $url = '',
        public LinkStyle $style = new LinkStyle(),
    ) {}
}
