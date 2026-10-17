<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\RevealBox;

use WebCodingCat\ThemeDevTest\Support\Reveal;
use WebCodingCat\WpAppFramework\Block\Block;
use WebCodingCat\WpAppFramework\Block\BlockCategory;
use WebCodingCat\WpAppFramework\Block\Support\UseSupport;
use WebCodingCat\WpAppFramework\Twig\TemplateRenderer;

/**
 * No view script of its own, only the one of the Reveal support (frontend.spec.js).
 */
#[Block('reveal-box', title: 'Reveal box', category: BlockCategory::Design)]
#[UseSupport(Reveal::class, default: true)]
final readonly class RevealBox
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(RevealBoxAttributes $attrs): string
    {
        return $this->renderer->render('Block/RevealBox/RevealBox.twig', ['attrs' => $attrs]);
    }
}
