<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Container;

use Saij\WpAppFramework\Block\Block;
use Saij\WpAppFramework\Block\BlockCategory;
use Saij\WpAppFramework\Block\Supports;
use Saij\WpAppFramework\Twig\TemplateRenderer;

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
