<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Faq;

use Saij\WpAppFramework\Block\Label;
use Saij\WpAppFramework\Block\PlainText;
use Saij\WpAppFramework\Block\RichText;

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
