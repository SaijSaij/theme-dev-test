<?php

declare(strict_types=1);

namespace Saij\ThemeSections\Block\Hero;

use Saij\WpAppFramework\Block\Label;
use Saij\WpAppFramework\Block\PlainText;
use Saij\WpAppFramework\Value\Url;

final readonly class Button
{
    public function __construct(
        #[PlainText] public string $label,
        #[Url] #[Label('URL')] public string $url = '',
    ) {
    }
}
