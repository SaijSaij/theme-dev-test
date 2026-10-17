<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\I18n;

use WebCodingCat\ThemeDevTest\Rest\Api;
use WebCodingCat\WpAppFramework\Hook\Hook;
use WebCodingCat\WpAppFramework\Rest\HttpMethod;
use WebCodingCat\WpAppFramework\Rest\Permission\Capability;
use WebCodingCat\WpAppFramework\Rest\RestController;
use WebCodingCat\WpAppFramework\Rest\RestRoute;

/**
 * Sets the language of the site and of the current user for the tests of translations. The instances of the tests
 * have no language packs, and WordPress keeps only installed languages in the option WPLANG (sanitize_option()), so
 * the language of the site comes from an option of the theme through the filter `locale`; the language of the user
 * is the user meta `locale`, which determine_locale() reads as it is.
 */
#[RestController(Api::VERSION, base: '/locale')]
final readonly class LocaleController
{
    private const string OPTION = 'dev_test_locale';

    /**
     * @return array{locale: string}
     */
    #[RestRoute('', HttpMethod::Post, new Capability('manage_options'))]
    public function set(string $locale): array
    {
        $locale === 'en_US' ? delete_option(self::OPTION) : update_option(self::OPTION, $locale);
        update_user_meta(get_current_user_id(), 'locale', $locale === 'en_US' ? '' : $locale);

        return ['locale' => $locale];
    }

    #[Hook('locale')]
    public function siteLocale(string $locale): string
    {
        $test = get_option(self::OPTION);

        return is_string($test) && $test !== '' ? $test : $locale;
    }
}
