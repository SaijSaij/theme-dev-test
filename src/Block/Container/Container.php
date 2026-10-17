<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\Container;

use WebCodingCat\WpAppFramework\Block\Block;
use WebCodingCat\WpAppFramework\Block\BlockCategory;
use WebCodingCat\WpAppFramework\Block\Supports;
use WebCodingCat\WpAppFramework\Twig\TemplateRenderer;

/**
 * A container without content attributes and without contentRole: in
 * contentOnly mode nothing can be inserted into it (unlike dev-test/section).
 * Its supports differ from WordPress' defaults (only inserted through markup).
 */
#[Block('container', title: 'Container', category: BlockCategory::Design, icon: 'columns')]
#[Supports(customClassName: false, multiple: false, reusable: false, inserter: false, lock: false, renaming: false)]
final readonly class Container
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(string $content): string
    {
        return $this->renderer->render('Block/Container/Container.twig', ['content' => $content]);
    }
}
