<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Inspector;

use Saij\WpAppFramework\Block\Image;
use Saij\WpAppFramework\Block\Label;
use Saij\WpAppFramework\Block\PlainText;

final readonly class Slide
{
    public function __construct(
        #[PlainText]
        #[Label('Caption')]
        public string $caption = '',
        #[Image(inspector: true)]
        #[Label('Picture')]
        public ?int $imageId = null,
    ) {}
}
