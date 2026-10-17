<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Plugin;

use Saij\PluginDevTest\Api\NoteApi;
use Saij\PluginDevTest\Api\NoteSummary;
use Saij\ThemeDevTest\Rest\Api;
use Saij\WpAppFramework\Api\PluginApi;
use Saij\WpAppFramework\Rest\HttpMethod;
use Saij\WpAppFramework\Rest\Permission\PublicAccess;
use Saij\WpAppFramework\Rest\RestController;
use Saij\WpAppFramework\Rest\RestRoute;
use Saij\WpAppFramework\Twig\TemplateRenderer;

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
