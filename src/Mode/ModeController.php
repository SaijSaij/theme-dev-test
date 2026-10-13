<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Mode;

use Saij\ThemeDevTest\Rest\Api;
use Saij\WpAppFramework\Rest\HttpMethod;
use Saij\WpAppFramework\Rest\Permission\PublicAccess;
use Saij\WpAppFramework\Rest\RestController;
use Saij\WpAppFramework\Rest\RestRoute;
use Saij\WpAppFramework\Theme;
use Twig\Environment;

/**
 * Reports the mode of the framework instance (step 6): source checkout or release build.
 */
#[RestController(Api::VERSION)]
final readonly class ModeController
{
    public function __construct(private Theme $theme) {}

    /**
     * Class names as the theme code sees them: prefixed in a release (Strauss rewrites the call sites).
     *
     * @return array{release: bool, devCache: bool, frameworkClass: string, twigClass: string}
     */
    #[RestRoute('/mode', HttpMethod::Get, new PublicAccess())]
    public function mode(): array
    {
        return [
            'release' => is_file($this->theme->getTemplateDirectory() . '/' . Theme::RELEASE_MANIFEST),
            'devCache' => is_dir(WP_CONTENT_DIR . '/cache/' . get_template() . '/manifest'),
            'frameworkClass' => Theme::class,
            'twigClass' => Environment::class,
        ];
    }
}
