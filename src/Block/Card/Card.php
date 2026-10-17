<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\Card;

use WebCodingCat\ThemeDevTest\Support\Framed;
use WebCodingCat\ThemeDevTest\Support\Surface;
use WebCodingCat\ThemeDevTest\Support\SurfaceTone;
use WebCodingCat\WpAppFramework\Block\Block;
use WebCodingCat\WpAppFramework\Block\BlockCategory;
use WebCodingCat\WpAppFramework\Block\Support\UseSupport;
use WebCodingCat\WpAppFramework\Twig\TemplateRenderer;

/**
 * Styled with the utilities of the theme's stylesheet; must look the same in the
 * editor canvas and on the front end (parity.spec.js). Uses the block supports
 * Surface (with its own default) and Framed (supports.spec.js).
 */
#[Block('card', title: 'Card', category: BlockCategory::Design, icon: 'id', description: 'Card with image, title, text and links.')]
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
