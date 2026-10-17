<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Hook;

use WebCodingCat\ThemeDevTest\Rest\Api;
use WebCodingCat\WpAppFramework\Rest\HttpMethod;
use WebCodingCat\WpAppFramework\Rest\Permission\PublicAccess;
use WebCodingCat\WpAppFramework\Rest\RestController;
use WebCodingCat\WpAppFramework\Rest\RestRoute;

/**
 * Applies the filter of FilterCheck, so the browser tests can observe it.
 */
#[RestController(Api::VERSION, base: '/hook')]
final class HookController
{
    /**
     * How often the framework's init hook has fired in this request.
     */
    #[RestRoute('/init', HttpMethod::Get, new PublicAccess())]
    public function init(): int
    {
        return did_action('wp_app_framework/init/theme-dev-test');
    }

    #[RestRoute('/filter', HttpMethod::Get, new PublicAccess())]
    public function filter(string $value = 'value'): string
    {
        /**
         * Filters a value; FilterCheck hooks into it.
         *
         * @param string $value
         * @param Marker $marker
         */
        return apply_filters('dev_test/filter', $value, new Marker('marker'));
    }
}
