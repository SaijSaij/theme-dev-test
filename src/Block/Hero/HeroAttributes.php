<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Hero;

use Saij\WpAppFramework\Value\Color;
use Saij\WpAppFramework\Value\Image;
use Saij\WpAppFramework\Value\Label;
use Saij\WpAppFramework\Value\ListOf;
use Saij\WpAppFramework\Value\PlainText;
use Saij\WpAppFramework\Value\RichText;

final readonly class HeroAttributes
{
    /**
     * @param list<Badge>  $badges
     * @param list<Button> $buttons
     */
    public function __construct(
        #[RichText(allowedFormats: ['core/bold', 'core/italic'], excerpt: true)]
        public string $headline = '',
        #[PlainText(excerpt: true)]
        public string $subline = '',
        #[Color]
        #[Label('Background color')]
        public string $backgroundColor = '',
        // In the inspector: a placeholder in the canvas would cover the block it is the background of.
        #[Image(inspector: true)]
        #[Label('Background image')]
        public ?int $backgroundImageId = null,
        #[ListOf(Badge::class, max: 3)]
        public array $badges = [],
        #[ListOf(Button::class, max: 3)]
        public array $buttons = [],
    ) {}
}
