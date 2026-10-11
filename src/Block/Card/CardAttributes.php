<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Card;

use Saij\WpAppFramework\Block\Image;
use Saij\WpAppFramework\Block\Label;
use Saij\WpAppFramework\Block\RichText;
use Saij\WpAppFramework\Value\ListOf;

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
