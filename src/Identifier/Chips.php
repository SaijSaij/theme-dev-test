<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Identifier;

use WebCodingCat\WpAppFramework\Block\Block;
use WebCodingCat\WpAppFramework\Block\BlockCategory;
use WebCodingCat\WpAppFramework\Twig\TemplateRenderer;

/**
 * A list of chips whose items have an identifier (#[Identifier]), added in the inspector and in the canvas
 * (#[ListOf(appender: true)]); each chip shows its identifier.
 */
#[Block('chips', title: 'Chips', category: BlockCategory::Design, icon: 'tag')]
final readonly class Chips
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(ChipsAttributes $attrs): string
    {
        return $this->renderer->render('Identifier/Chips.twig', ['attrs' => $attrs]);
    }
}
