<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\AssetShowcase;

use WebCodingCat\WpAppFramework\Block\Block;
use WebCodingCat\WpAppFramework\Block\BlockCategory;
use WebCodingCat\WpAppFramework\Twig\TemplateRenderer;

/**
 * Static assets of the theme in Twig: asset_url(), asset_image() (also with variants) and asset_svg(), a preloaded
 * font and a background image
 * referenced in assets/styles.css, and a template the child theme overrides to show its own assets (assets.spec.js).
 */
#[Block('asset-showcase', title: 'Asset showcase', category: BlockCategory::Media, icon: 'format-image', description: 'Shows static assets of the theme.')]
final readonly class AssetShowcase
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(): string
    {
        return $this->renderer->render('Block/AssetShowcase/AssetShowcase.twig');
    }
}
