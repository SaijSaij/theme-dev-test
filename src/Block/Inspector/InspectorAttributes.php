<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\Inspector;

use WebCodingCat\WpAppFramework\Value\Label;
use WebCodingCat\WpAppFramework\Value\ListOf;
use WebCodingCat\WpAppFramework\Value\PlainText;
use WebCodingCat\WpAppFramework\Value\RichText;

final readonly class InspectorAttributes
{
    /**
     * @param list<Slide> $slides
     */
    public function __construct(
        #[RichText(allowedFormats: ['core/bold'], inspector: true)]
        #[Label('Summary')]
        public string $summary = '',
        #[ListOf(Slide::class)]
        public array $slides = [],
        #[PlainText(inspector: true, multiline: true)]
        #[Label('Note')]
        public string $note = '',
    ) {}
}
