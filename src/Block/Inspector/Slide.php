<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Inspector;

use Saij\WpAppFramework\Value\Image;
use Saij\WpAppFramework\Value\Label;
use Saij\WpAppFramework\Value\PlainText;

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
