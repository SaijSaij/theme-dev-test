<?php

declare(strict_types=1);

namespace Saij\ThemeDevTest\Post;

use Saij\WpAppFramework\Post\AbstractPost;
use Saij\WpAppFramework\Post\PostType;
use Saij\WpAppFramework\Post\PostTypeSupport;

/**
 * A post type with the block editor, revisions and an archive: dev_test_event, URLs /event/….
 */
#[PostType(
    'event',
    label: 'Events',
    singularLabel: 'Event',
    supports: [PostTypeSupport::Title, PostTypeSupport::Editor, PostTypeSupport::Revisions],
    archive: true,
    menuIcon: 'dashicons-calendar',
)]
final class Event extends AbstractPost
{
    /**
     * A method of the post class: reads its meta.
     */
    public function isSoldOut(int $sold): bool
    {
        return $sold >= $this->meta(EventDetails::class)->getCapacity();
    }
}
