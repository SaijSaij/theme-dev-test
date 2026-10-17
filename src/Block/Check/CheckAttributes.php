<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\Check;

use WebCodingCat\WpAppFramework\Value\Content;
use WebCodingCat\WpAppFramework\Value\Hidden;
use WebCodingCat\WpAppFramework\Value\Image;
use WebCodingCat\WpAppFramework\Value\Label;
use WebCodingCat\WpAppFramework\Value\Link;
use WebCodingCat\WpAppFramework\Value\PlainText;
use WebCodingCat\WpAppFramework\Value\RichText;
use WebCodingCat\WpAppFramework\Value\Url;

/**
 * One attribute per supported value type and editor marker.
 */
final readonly class CheckAttributes
{
    public function __construct(
        #[PlainText]
        public string $text = '',
        #[RichText]
        public string $rich = '',
        #[Label('Amount')]
        public int $count = 0,
        #[Content]
        #[Url]
        public string $link = '',
        public Variant $variant = Variant::Light,
        #[Image]
        public ?int $imageId = null,
        public bool $flag = false,
        public float $ratio = 0.5,
        public ?string $note = null,
        public Meta $meta = new Meta(),
        #[Hidden]
        public string $secret = 'hidden',
        #[Label('Call to action')]
        public Link $cta = new Link(),
        #[PlainText(multiline: true)]
        public string $address = '',
    ) {}
}
