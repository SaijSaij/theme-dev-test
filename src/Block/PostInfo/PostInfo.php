<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\PostInfo;

use WebCodingCat\WpAppFramework\Block\Block;
use WebCodingCat\WpAppFramework\Block\BlockCategory;
use WebCodingCat\WpAppFramework\Twig\TemplateRenderer;
use WP_Block;

/**
 * Reads the post of a query loop from the block context (usesContext).
 */
#[Block('post-info', title: 'Post info', category: BlockCategory::Theme, icon: 'info', usesContext: ['postId'])]
final readonly class PostInfo
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(WP_Block $block): string
    {
        $postId = $block->context['postId'] ?? null;

        return $this->renderer->render('Block/PostInfo/PostInfo.twig', [
            'title' => is_int($postId) ? get_the_title($postId) : '',
        ]);
    }
}
