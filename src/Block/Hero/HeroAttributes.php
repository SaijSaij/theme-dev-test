<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Hero;

use Saij\WpAppFramework\Block\Image;
use Saij\WpAppFramework\Block\Label;
use Saij\WpAppFramework\Block\PlainText;
use Saij\WpAppFramework\Block\RichText;
use Saij\WpAppFramework\Value\ListOf;

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
