<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\RevealBox;

use Saij\ThemeDevTest\Support\Reveal;
use Saij\WpAppFramework\Block\Block;
use Saij\WpAppFramework\Block\BlockCategory;
use Saij\WpAppFramework\Block\Support\UseSupport;
use Saij\WpAppFramework\Twig\TemplateRenderer;

/**
 * No view script of its own, only the one of the Reveal support (frontend.spec.js).
 */
#[Block('dev-test/reveal-box', title: 'Reveal box', category: BlockCategory::Design)]
#[UseSupport(Reveal::class, default: true)]
final readonly class RevealBox
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(RevealBoxAttributes $attrs): string
    {
        return $this->renderer->render('Block/RevealBox/RevealBox.twig', ['attrs' => $attrs]);
    }
}
