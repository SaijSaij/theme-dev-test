<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Block\Card;

use Saij\ThemeDevTest\Support\Framed;
use Saij\ThemeDevTest\Support\Surface;
use Saij\ThemeDevTest\Support\SurfaceTone;
use Saij\WpAppFramework\Block\Block;
use Saij\WpAppFramework\Block\BlockCategory;
use Saij\WpAppFramework\Block\Support\UseSupport;
use Saij\WpAppFramework\Twig\TemplateRenderer;

/**
 * Styled with the utilities of the theme's stylesheet; must look the same in the
 * editor canvas and on the front end (parity.spec.js). Uses the block supports
 * Surface (with its own default) and Framed (supports.spec.js).
 */
#[Block('dev-test/card', title: 'Card', category: BlockCategory::Design, icon: 'id', description: 'Card with image, title, text and links.')]
#[UseSupport(Surface::class, default: SurfaceTone::Dark)]
#[UseSupport(Framed::class)]
final readonly class Card
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(CardAttributes $attrs): string
    {
        return $this->renderer->render('Block/Card/Card.twig', ['attrs' => $attrs]);
    }
}
