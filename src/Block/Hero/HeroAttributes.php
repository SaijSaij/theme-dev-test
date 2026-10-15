<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Hero;

use Saij\WpAppFramework\Value\Image;
use Saij\WpAppFramework\Value\Label;
use Saij\WpAppFramework\Value\ListOf;
use Saij\WpAppFramework\Value\PlainText;
use Saij\WpAppFramework\Value\RichText;

final readonly class HeroAttributes
{
    /**
     * @param list<Button> $buttons
     */
    public function __construct(
        #[PlainText(excerpt: true)]
        public string $topline = '',
        #[RichText(allowedFormats: ['core/bold', 'core/italic'], excerpt: true)]
        public string $headline = '',
        #[Image]
        #[Label('Image')]
        public ?int $imageId = null,
        public Gradient $gradient = Gradient::Black,
        #[ListOf(Button::class)]
        public array $buttons = [],
    ) {}
}
