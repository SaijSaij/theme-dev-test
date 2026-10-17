<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\WordPressFunctions;

use WebCodingCat\WpAppFramework\Block\Block;
use WebCodingCat\WpAppFramework\Block\BlockCategory;
use WebCodingCat\WpAppFramework\Twig\TemplateRenderer;

/**
 * Prints the result of every WordPress template function of the framework (wp_…).
 */
#[Block('wordpress-functions', title: 'WordPress functions', category: BlockCategory::Design, icon: 'wordpress', description: 'The WordPress template functions of the framework.')]
final readonly class WordPressFunctions
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(WordPressFunctionsAttributes $attrs): string
    {
        return $this->renderer->render('Block/WordPressFunctions/WordPressFunctions.twig', ['attrs' => $attrs]);
    }
}
