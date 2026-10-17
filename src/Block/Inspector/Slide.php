<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\Inspector;

use WebCodingCat\WpAppFramework\Value\Image;
use WebCodingCat\WpAppFramework\Value\Label;
use WebCodingCat\WpAppFramework\Value\PlainText;

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
