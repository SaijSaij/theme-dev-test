<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Twig;

use FilesystemIterator;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use Saij\ThemeDevTest\Rest\Api;
use Saij\WpAppFramework\Rest\HttpMethod;
use Saij\WpAppFramework\Rest\Permission\PublicAccess;
use Saij\WpAppFramework\Rest\RestController;
use Saij\WpAppFramework\Rest\RestRoute;
use Saij\WpAppFramework\Twig\TemplateRenderer;

/**
 * Renders the templates of this directory through the injected renderer.
 */
#[RestController(Api::NAMESPACE, base: '/twig')]
final readonly class TwigController
{
    public function __construct(private TemplateRenderer $renderer) {}

    /**
     * @return array<string, mixed>
     */
    #[RestRoute('', HttpMethod::Get, new PublicAccess())]
    public function check(string $name = 'World'): array
    {
        return $this->render('Twig/Check.twig', ['name' => $name]);
    }

    /**
     * @return array<string, mixed>
     */
    #[RestRoute('/plain', HttpMethod::Get, new PublicAccess())]
    public function plain(string $name = 'World'): array
    {
        return $this->render('Twig/Partial.twig', ['name' => $name]);
    }

    /**
     * Renders a template and reports the compiled templates in the cache directory of the instance.
     *
     * @return array{directory: string, compiled: int, subdirectories: list<string>}
     */
    #[RestRoute('/cache', HttpMethod::Get, new PublicAccess())]
    public function cache(): array
    {
        $this->renderer->render('Twig/Partial.twig', ['name' => 'cache']);
        $directory = WP_CONTENT_DIR . '/cache/' . get_template() . '/twig';
        $compiled = 0;
        $subdirectories = [];
        if (is_dir($directory)) {
            // Twig's own hash directories in development mode, the template version of the release in release mode.
            foreach (new FilesystemIterator($directory) as $entry) {
                if ($entry instanceof \SplFileInfo && $entry->isDir()) {
                    $subdirectories[] = $entry->getFilename();
                }
            }
            sort($subdirectories);
            /** @var \SplFileInfo $file */
            foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($directory, FilesystemIterator::SKIP_DOTS)) as $file) {
                $compiled += $file->getExtension() === 'php' ? 1 : 0;
            }
        }

        return ['directory' => substr($directory, strlen(ABSPATH)), 'compiled' => $compiled, 'subdirectories' => $subdirectories];
    }

    /**
     * A template the test child theme overrides in overrides/theme-dev-test/.
     */
    #[RestRoute('/child-overridable', HttpMethod::Get, new PublicAccess())]
    public function childOverridable(): string
    {
        return $this->renderer->render('Twig/ChildOverridable.twig');
    }

    /**
     * The same template by its exact name, which no child theme overrides.
     */
    #[RestRoute('/child-overridable-exact', HttpMethod::Get, new PublicAccess())]
    public function childOverridableExact(): string
    {
        return $this->renderer->render('@theme/Twig/ChildOverridable.twig');
    }

    /**
     * @return array<string, mixed>
     */
    #[RestRoute('/undefined', HttpMethod::Get, new PublicAccess())]
    public function undefined(): array
    {
        return $this->render('Twig/Undefined.twig', []);
    }

    /**
     * @param array<string, mixed> $context
     * @return array<string, mixed>
     */
    private function render(string $name, array $context): array
    {
        $html = $this->renderer->render($name, $context);

        return ['html' => $html, 'helperInstances' => TextHelpers::getInstances()];
    }
}
