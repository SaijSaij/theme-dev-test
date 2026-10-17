<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\Faq;

use WebCodingCat\ThemeDevTest\Support\Reveal;
use WebCodingCat\WpAppFramework\Block\Block;
use WebCodingCat\WpAppFramework\Block\BlockCategory;
use WebCodingCat\WpAppFramework\Block\Support\UseSupport;
use WebCodingCat\WpAppFramework\Twig\TemplateRenderer;

/**
 * A question that opens and closes its answer: front-end behavior from the
 * view script Faq.view.js, previewed in the editor; a toolbar button from
 * Faq.editor.js. Uses the block support Reveal, which has a view script too
 * (frontend.spec.js).
 */
#[Block('faq', title: 'FAQ', category: BlockCategory::Text, icon: 'editor-help', description: 'Question with an answer that opens and closes.')]
#[UseSupport(Reveal::class)]
final readonly class Faq
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(FaqAttributes $attrs): string
    {
        return $this->renderer->render('Block/Faq/Faq.twig', ['attrs' => $attrs]);
    }
}
