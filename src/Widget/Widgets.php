<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Widget;

use WebCodingCat\WpAppFramework\Hook\Hook;

/**
 * Registers the widget, which the consumer creates itself.
 */
final class Widgets
{
    #[Hook('widgets_init')]
    public function register(): void
    {
        register_widget(new NoteWidget());
    }
}
