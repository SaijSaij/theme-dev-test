<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Block\EventInfo;

use WebCodingCat\WpAppFramework\Block\Block;
use WebCodingCat\WpAppFramework\Block\BlockCategory;
use WebCodingCat\WpAppFramework\Twig\TemplateRenderer;
use WP_Block;

/**
 * The details of the event of the block context, read in Twig with post(): used in
 * the template of single events.
 */
#[Block('event-info', title: 'Event info', category: BlockCategory::Theme, icon: 'calendar', usesContext: ['postId'])]
final readonly class EventInfo
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(WP_Block $block): string
    {
        $postId = $block->context['postId'] ?? null;

        return $this->renderer->render('Block/EventInfo/EventInfo.twig', ['postId' => is_int($postId) ? $postId : null]);
    }
}
