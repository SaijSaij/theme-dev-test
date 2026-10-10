<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Paragraph;

use Saij\WpAppFramework\Block\Block;
use Saij\WpAppFramework\Block\BlockCategory;
use Saij\WpAppFramework\Twig\TemplateRenderer;

/**
 * Text stored as inline HTML in the post content; the root element is the field.
 */
#[Block('dev-test/paragraph', title: 'Paragraph', category: BlockCategory::Text, icon: 'editor-paragraph', description: 'Text stored in the post content.')]
final readonly class Paragraph
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(ParagraphAttributes $attrs): string
    {
        return $this->renderer->render('Block/Paragraph/Paragraph.twig', ['attrs' => $attrs]);
    }
}
