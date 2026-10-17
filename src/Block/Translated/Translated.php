<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Translated;

use Saij\WpAppFramework\Block\Block;
use Saij\WpAppFramework\Block\BlockCategory;
use Saij\WpAppFramework\Twig\TemplateRenderer;

/**
 * Texts translated in the template with __(), _x() and _n() (languages/theme-dev-test-de_DE.po).
 */
#[Block('translated', title: 'Translated', category: BlockCategory::Text, icon: 'translation')]
final readonly class Translated
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(): string
    {
        return $this->renderer->render('Block/Translated/Translated.twig');
    }
}
