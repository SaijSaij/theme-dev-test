<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\Card;

use WebCodingCat\WpAppFramework\Value\Image;
use WebCodingCat\WpAppFramework\Value\Label;
use WebCodingCat\WpAppFramework\Value\ListOf;
use WebCodingCat\WpAppFramework\Value\RichText;

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
