<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Repeater;

use Saij\ThemeDevTest\Post\Event;
use Saij\ThemeDevTest\Table\LogEntry;
use Saij\WpAppFramework\Block\Block;
use Saij\WpAppFramework\Block\BlockCategory;
use Saij\WpAppFramework\Block\Item;
use Saij\WpAppFramework\Twig\TemplateRenderer;
use WP_Comment;
use WP_Term;
use WP_User;

/**
 * Shows the current item of a repeater (#[Item]) of every kind, with a label edited in the canvas.
 */
#[Block('item-card', title: 'Item card', category: BlockCategory::Design, icon: 'id')]
final readonly class ItemCard
{
    public function __construct(private TemplateRenderer $renderer) {}

    public function render(
        ItemCardAttributes $attrs,
        #[Item]
        ?Event $event,
        #[Item]
        ?WP_Term $term,
        #[Item]
        ?WP_Comment $comment,
        #[Item]
        ?WP_User $user,
        #[Item]
        ?LogEntry $entry,
    ): string {
        $item = match (true) {
            $event !== null => 'event:' . $event->getTitle(),
            $term !== null => 'term:' . $term->name,
            $comment !== null => 'comment:' . $comment->comment_content,
            $user !== null => 'user:' . $user->display_name,
            $entry !== null => 'log:' . $entry->getMessage(),
            default => 'none',
        };

        return $this->renderer->render('Repeater/ItemCard.twig', ['attrs' => $attrs, 'item' => $item]);
    }
}
