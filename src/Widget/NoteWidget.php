<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Widget;

use WP_Widget;

/**
 * A classic widget: builds on WordPress, so the build does not load it and it is no service. Widgets creates it.
 */
final class NoteWidget extends WP_Widget
{
    public const string ID_BASE = 'theme-dev-test-note';

    public function __construct()
    {
        parent::__construct(self::ID_BASE, 'Dev test note');
    }

    #[\Override]
    public function widget($args, $instance): void
    {
        echo $args['before_widget'] . esc_html('Note from the test theme') . $args['after_widget'];
    }
}
