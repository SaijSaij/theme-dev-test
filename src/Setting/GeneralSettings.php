<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Setting;

use Saij\WpAppFramework\Block\Hidden;
use Saij\WpAppFramework\Block\Image;
use Saij\WpAppFramework\Block\Label;
use Saij\WpAppFramework\Block\PlainText;
use Saij\WpAppFramework\Block\RichText;
use Saij\WpAppFramework\Setting\SettingsGroup;
use Saij\WpAppFramework\Value\ListOf;
use Saij\WpAppFramework\Value\PostReference;
use Saij\WpAppFramework\Value\Url;

/**
 * A settings group with every kind of value: option dev_test_general.
 */
#[SettingsGroup('general', title: 'General', description: 'Settings of the test theme.', position: 20)]
final readonly class GeneralSettings
{
    /**
     * @param list<SocialLink> $links
     * @param list<int>        $featured
     */
    public function __construct(
        #[Label('Tagline')]
        public string $tagline = 'Just a test',
        public Density $density = Density::Normal,
        #[Url]
        public string $contactUrl = '',
        public int $count = 3,
        public ?float $ratio = null,
        #[ListOf(SocialLink::class)]
        public array $links = [],
        public ?Contact $contact = null,
        #[Hidden]
        public string $internalKey = 'dev-test',
        #[Image]
        public ?int $logo = null,
        #[PlainText]
        public string $footer = '',
        #[RichText(allowedFormats: ['core/bold', 'core/link'])]
        public string $notice = '',
        #[PostReference(postTypes: ['page'])]
        public ?int $privacyPage = null,
        #[PostReference]
        public array $featured = [],
    ) {}
}
