<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Twig;

use Saij\WpAppFramework\Twig\TemplateFunction;
use Saij\WpAppFramework\Twig\TemplateRenderer;

/**
 * Public template functions of the theme; the test child theme calls them by name.
 */
final readonly class PublicTemplates
{
    public function __construct(private TemplateRenderer $renderer) {}

    #[TemplateFunction('theme_dev_test_badge', html: true, public: true)]
    public function badge(string $label): string
    {
        return '<span class="badge badge--theme">' . esc_html($label) . '</span>';
    }

    /**
     * Renders Twig/Partial.twig of the theme; the child theme has a template with the same name.
     */
    #[TemplateFunction('theme_dev_test_partial', html: true, public: true)]
    public function partial(string $name): string
    {
        return $this->renderer->render('Twig/Partial.twig', ['name' => $name]);
    }
}
