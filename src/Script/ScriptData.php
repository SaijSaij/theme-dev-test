<?php

declare(strict_types=1);

namespace WebCodingCat\ThemeDevTest\Script;

use WebCodingCat\WpAppFramework\Hook\Hook;
use WebCodingCat\WpAppFramework\View\ViewData;

/**
 * View data for the scripts in assets/: the document view reads "document" on the front end, the editor script
 * reads "editor" in the block editor (document-views.spec.js, editor-scripts.spec.js).
 */
final readonly class ScriptData
{
    /** The "external" script the document view loads with loadScript(), protocol-relative like a CDN URL. */
    private const string EXTERNAL = 'assets/external/fake-library.js';

    #[Hook('wp')]
    public function document(ViewData $viewData): void
    {
        $viewData->set('document', [
            'greeting' => 'Hello from PHP',
            'external' => (string) preg_replace('#^https?:#', '', get_theme_file_uri(self::EXTERNAL)),
        ]);
    }

    #[Hook('enqueue_block_editor_assets')]
    public function editor(ViewData $viewData): void
    {
        $viewData->set('editor', ['highlightTitle' => 'Dev test highlight']);
    }
}
