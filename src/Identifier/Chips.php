<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Identifier;

use Saij\WpAppFramework\Block\Block;
use Saij\WpAppFramework\Block\BlockCategory;
use Saij\WpAppFramework\Twig\TemplateRenderer;

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
