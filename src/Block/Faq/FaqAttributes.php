<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\Faq;

use WebCodingCat\WpAppFramework\Value\Label;
use WebCodingCat\WpAppFramework\Value\PlainText;
use WebCodingCat\WpAppFramework\Value\RichText;

final readonly class FaqAttributes
{
    public function __construct(
        #[PlainText(excerpt: true)]
        public string $question = '',
        #[RichText(allowedFormats: ['core/bold', 'core/link'])]
        public string $answer = '',
        #[Label('Open by default')]
        public bool $open = false,
    ) {}
}
