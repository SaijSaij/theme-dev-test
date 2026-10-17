<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Mode;

use Twig\Environment;
use WebCodingCat\ThemeDevTest\Rest\Api;
use WebCodingCat\WpAppFramework\Rest\HttpMethod;
use WebCodingCat\WpAppFramework\Rest\Permission\PublicAccess;
use WebCodingCat\WpAppFramework\Rest\RestController;
use WebCodingCat\WpAppFramework\Rest\RestRoute;
use WebCodingCat\WpAppFramework\Theme;

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
     * @return array{release: bool, devCache: bool, slug: string, frameworkClass: string, twigClass: string}
     */
    #[RestRoute('/mode', HttpMethod::Get, new PublicAccess())]
    public function mode(): array
    {
        return [
            'release' => is_file($this->theme->getTemplateDirectory() . '/' . Theme::RELEASE_MANIFEST),
            'devCache' => is_dir(WP_CONTENT_DIR . '/cache/' . get_template() . '/manifest'),
            'slug' => $this->theme->getSlug(),
            'frameworkClass' => Theme::class,
            'twigClass' => Environment::class,
        ];
    }
}
