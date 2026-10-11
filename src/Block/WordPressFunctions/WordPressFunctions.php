<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\WordPressFunctions;

use Saij\WpAppFramework\Block\Block;
use Saij\WpAppFramework\Block\BlockCategory;
use Saij\WpAppFramework\Twig\TemplateRenderer;

/**
 * Prints the result of every WordPress template function of the framework (wp_…).
 */
#[Block('dev-test/wordpress-functions', title: 'WordPress functions', category: BlockCategory::Design, icon: 'wordpress', description: 'The WordPress template functions of the framework.')]
final readonly class WordPressFunctions
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(WordPressFunctionsAttributes $attrs): string
    {
        return $this->renderer->render('Block/WordPressFunctions/WordPressFunctions.twig', ['attrs' => $attrs]);
    }
}
