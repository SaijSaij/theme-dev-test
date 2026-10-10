<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Paragraph;

use Saij\WpAppFramework\Block\RichText;

final readonly class ParagraphAttributes
{
    public function __construct(
        #[RichText(allowedFormats: ['core/bold', 'core/italic', 'core/link'], postContent: true, excerpt: true)]
        public string $text = '',
        public bool $lead = false,
    ) {}
}
