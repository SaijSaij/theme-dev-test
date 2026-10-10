<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Inspector;

use Saij\WpAppFramework\Block\Label;
use Saij\WpAppFramework\Block\RichText;
use Saij\WpAppFramework\Value\ListOf;

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
    ) {}
}
