<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Setting;

use WebCodingCat\ThemeDevTest\Rest\Api;
use WebCodingCat\WpAppFramework\Rest\HttpMethod;
use WebCodingCat\WpAppFramework\Rest\Permission\Capability;
use WebCodingCat\WpAppFramework\Rest\Permission\PublicAccess;
use WebCodingCat\WpAppFramework\Rest\RestController;
use WebCodingCat\WpAppFramework\Rest\RestRoute;
use WebCodingCat\WpAppFramework\Twig\TemplateRenderer;
use WP_REST_Request;

/**
 * Shows the injected settings groups and the template global, and reads and
 * writes the raw options (to store invalid values and to restore the options
 * after a test).
 */
#[RestController(Api::VERSION, base: '/settings')]
final readonly class SettingsController
{
    private const array OPTIONS = ['general' => 'dev_test_general', 'layout' => 'dev_test_layout', 'regions' => 'dev_test_regions'];

    public function __construct(
        private GeneralSettings $general,
        private LayoutSettings $layout,
        private TemplateRenderer $renderer,
    ) {}

    /**
     * The injected groups with the PHP types of their values.
     *
     * @return array<string, mixed>
     */
    #[RestRoute('', HttpMethod::Get, new PublicAccess())]
    public function values(): array
    {
        return [
            'general' => [
                'tagline' => $this->general->tagline,
                'density' => $this->general->density->value,
                'densityType' => get_debug_type($this->general->density),
                'contactUrl' => $this->general->contactUrl,
                'count' => $this->general->count,
                'ratio' => $this->general->ratio,
                'links' => array_map(static fn(SocialLink $link): array => [
                    'label' => $link->label,
                    'url' => $link->url,
                    'external' => $link->style->external,
                ], $this->general->links),
                'contact' => $this->general->contact === null ? null : [
                    'name' => $this->general->contact->name,
                    'email' => $this->general->contact->email,
                ],
                'internalKey' => $this->general->internalKey,
                'logo' => $this->general->logo,
                'footer' => $this->general->footer,
                'notice' => $this->general->notice,
                'privacyPage' => $this->general->privacyPage,
                'featured' => $this->general->featured,
                'imprint' => [
                    'url' => $this->general->imprint->url,
                    'opensInNewTab' => $this->general->imprint->opensInNewTab,
                    'kind' => $this->general->imprint->kind->value,
                    'id' => $this->general->imprint->id,
                ],
                'address' => $this->general->address,
            ],
            'layout' => [
                'wide' => $this->layout->wide,
                'columns' => $this->layout->columns,
            ],
        ];
    }

    /**
     * @return array{html: string}
     */
    #[RestRoute('/twig', HttpMethod::Get, new PublicAccess())]
    public function twig(): array
    {
        return ['html' => $this->renderer->render('Setting/Settings.twig')];
    }

    /**
     * The stored options as they are, null if missing.
     *
     * @return array<string, mixed>
     */
    #[RestRoute('/raw', HttpMethod::Get, new Capability('manage_options'))]
    public function raw(): array
    {
        return array_map(static fn(string $option): mixed => get_option($option, null), self::OPTIONS);
    }

    /**
     * Stores the given values as they are (null deletes the option), without the schema validation of /wp/v2/settings.
     */
    #[RestRoute('/raw', HttpMethod::Post, new Capability('manage_options'))]
    public function store(WP_REST_Request $request): void
    {
        $values = $request->get_json_params();
        foreach (self::OPTIONS as $key => $option) {
            if (!array_key_exists($key, $values)) {
                continue;
            }
            if ($values[$key] === null) {
                delete_option($option);
            } else {
                update_option($option, $values[$key]);
            }
        }
    }
}
