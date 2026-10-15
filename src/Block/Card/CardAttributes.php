<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Card;

use Saij\WpAppFramework\Value\Image;
use Saij\WpAppFramework\Value\Label;
use Saij\WpAppFramework\Value\ListOf;
use Saij\WpAppFramework\Value\RichText;

final readonly class CardAttributes
{
    /**
     * @param list<CardLink> $links
     */
    public function __construct(
        #[Image]
        #[Label('Image')]
        public ?int $imageId = null,
        #[RichText(allowedFormats: ['core/bold', 'core/italic'])]
        public string $title = '',
        #[RichText(allowedFormats: ['core/bold', 'core/italic', 'core/link'])]
        public string $text = '',
        #[ListOf(CardLink::class)]
        public array $links = [],
    ) {}
}
