<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\References;

use Saij\WpAppFramework\Block\Block;
use Saij\WpAppFramework\Block\BlockCategory;
use Saij\WpAppFramework\Twig\TemplateRenderer;

/**
 * References to posts, terms and users, printed with the template functions of the framework.
 */
#[Block('dev-test/references', title: 'References', category: BlockCategory::Design, icon: 'admin-links', description: 'References to a page, posts, a category and a user.')]
final readonly class References
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(ReferencesAttributes $attrs): string
    {
        return $this->renderer->render('Block/References/References.twig', ['attrs' => $attrs]);
    }
}
