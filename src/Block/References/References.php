<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\References;

use WebCodingCat\WpAppFramework\Block\Block;
use WebCodingCat\WpAppFramework\Block\BlockCategory;
use WebCodingCat\WpAppFramework\Twig\TemplateRenderer;

/**
 * References to posts, terms and users, printed with the template functions of the framework.
 */
#[Block('references', title: 'References', category: BlockCategory::Design, icon: 'admin-links', description: 'References to a page, posts, a category and a user.')]
final readonly class References
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(ReferencesAttributes $attrs): string
    {
        return $this->renderer->render('Block/References/References.twig', ['attrs' => $attrs]);
    }
}
