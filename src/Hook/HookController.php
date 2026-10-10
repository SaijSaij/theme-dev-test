<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Hook;

use Saij\ThemeDevTest\Rest\Api;
use Saij\WpAppFramework\Rest\HttpMethod;
use Saij\WpAppFramework\Rest\Permission\PublicAccess;
use Saij\WpAppFramework\Rest\RestController;
use Saij\WpAppFramework\Rest\RestRoute;

/**
 * Applies the filter of FilterCheck, so the browser tests can observe it.
 */
#[RestController(Api::NAMESPACE, base: '/hook')]
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
