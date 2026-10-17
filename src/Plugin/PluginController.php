<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Plugin;

use WebCodingCat\PluginDevTest\Api\NoteApi;
use WebCodingCat\PluginDevTest\Api\NoteSummary;
use WebCodingCat\ThemeDevTest\Rest\Api;
use WebCodingCat\WpAppFramework\Api\PluginApi;
use WebCodingCat\WpAppFramework\Rest\HttpMethod;
use WebCodingCat\WpAppFramework\Rest\Permission\PublicAccess;
use WebCodingCat\WpAppFramework\Rest\RestController;
use WebCodingCat\WpAppFramework\Rest\RestRoute;
use WebCodingCat\WpAppFramework\Twig\TemplateRenderer;

/**
 * Uses the test plugin (https://github.com/webcodingcat/plugin-dev-test) if it is
 * active: its public API and its public template functions and filters.
 */
#[RestController(Api::VERSION, base: '/plugin')]
final readonly class PluginController
{
    public function __construct(
        private TemplateRenderer $renderer,
        #[PluginApi('plugin-dev-test')]
        private ?NoteApi $notes = null,
    ) {}

    /**
     * The notes of the plugin's public API, or null without the plugin.
     *
     * @return list<array{title: string, tone: string}>|null
     */
    #[RestRoute('/api', HttpMethod::Get, new PublicAccess())]
    public function api(): ?array
    {
        return $this->notes === null ? null : array_map(
            static fn(NoteSummary $note): array => ['title' => $note->getTitle(), 'tone' => $note->getTone()],
            $this->notes->getNotes(),
        );
    }

    /**
     * A theme template that calls the plugin's public template functions and filters.
     */
    #[RestRoute('/templates', HttpMethod::Get, new PublicAccess())]
    public function templates(string $title = 'Tom & Jerry'): string
    {
        return $this->renderer->render('Plugin/PluginCalls.twig', ['title' => $title]);
    }
}
