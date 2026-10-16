<?php

/**
 * Render and escaping tests of the theme's blocks with fixed attribute sets,
 * run by tests/render/run with `wp eval-file` in an instance of wp-test-env.
 *
 * Every case renders block markup with do_blocks(), as the front end does:
 * WordPress validates the attributes against the schema first (an invalid value
 * falls back to the default), the framework sanitizes them and Twig escapes the
 * output. Outputs are compared line by line with surrounding whitespace and
 * empty lines removed. With WP_DEBUG the script runs all cases; without it only
 * the error path of rendering.
 */

declare(strict_types=1);

$failures = 0;
$passed = 0;

$normalize = static fn(string $html): string => implode("\n", array_values(array_filter(array_map(trim(...), explode("\n", $html)), static fn(string $line): bool => $line !== '')));

$report = static function (string $name, bool $ok, string $details = '') use (&$failures, &$passed): void {
    if ($ok) {
        $passed++;
        WP_CLI::line('ok: ' . $name);

        return;
    }
    $failures++;
    WP_CLI::line('FAIL: ' . $name);
    WP_CLI::line($details);
};

/** Compares the whole output. */
$expect = static function (string $name, string $markup, string $expected) use ($normalize, $report): void {
    $actual = $normalize(do_blocks($markup));
    $expected = $normalize($expected);
    $report($name, $actual === $expected, "--- expected\n{$expected}\n--- actual\n{$actual}");
};

/** Looks for lines of the output. */
$expectLines = static function (string $name, string $markup, string ...$lines) use ($normalize, $report): void {
    $actual = $normalize(do_blocks($markup));
    $missing = array_values(array_filter($lines, static fn(string $line): bool => !in_array($line, explode("\n", $actual), true)));
    $report($name, $missing === [], "--- missing lines\n" . implode("\n", $missing) . "\n--- actual\n{$actual}");
};

/** Block comment with attributes, serialized as the block editor stores them. */
$block = static fn(string $name, array $attributes = [], string $inner = ''): string => serialize_block([
    'blockName' => $name,
    'attrs' => $attributes,
    'innerBlocks' => [],
    'innerHTML' => $inner,
    'innerContent' => $inner === '' ? [] : [$inner],
]);

if (!WP_DEBUG) {
    // Render errors without WP_DEBUG: logged, the block renders nothing. dev-test/support-unwrapped fails on purpose.
    $log = wp_tempnam('render-log');
    $previous = ini_set('error_log', $log);
    $output = do_blocks($block('dev-test/support-unwrapped'));
    ini_set('error_log', $previous === false ? '' : $previous);
    $logged = (string) file_get_contents($log);
    unlink($log);
    $report(
        'a render error without WP_DEBUG is logged and renders nothing',
        $output === '' && str_contains($logged, 'wp-app-framework: ') && str_contains($logged, 'dev-test/support-unwrapped') && str_contains($logged, 'block_wrapper_attributes()'),
        "--- output\n{$output}\n--- log\n{$logged}",
    );
} else {
    $defaults = <<<'HTML'
        <div class="check check--light wp-block-dev-test-check">
        <p class="check__text"></p>
        <div class="check__rich"></div>
        <p class="check__count">0</p>
        <a class="check__link" href="">Link</a>
        <figure class="check__image"></figure>
        <p class="check__values">off 0.5 none hidden</p>
        <figure class="check__meta">
        <figcaption></figcaption>
        <a class="check__source" href="">Source</a>
        </figure>
        <p class="check__address"></p>
        <p class="check__name">dev-test/check</p>
        <div class="check__inner"></div>
        </div>
        HTML;

    $expect('check: no attributes render the defaults', $block('dev-test/check'), $defaults);

    $expect('check: every value type with valid values', $block('dev-test/check', [
        'text' => 'Plain text',
        'rich' => 'Rich <strong>text</strong>',
        'count' => 7,
        'link' => 'https://example.test/page?a=1&b=2',
        'variant' => 'dark',
        'flag' => true,
        'ratio' => 1.25,
        'note' => 'A note',
        'meta' => ['caption' => 'Caption', 'source' => 'https://example.test/source'],
        'cta' => ['url' => 'https://example.test/cta', 'opensInNewTab' => true],
        'address' => "Line one\nLine two",
        'anchor' => 'check-anchor',
        'align' => 'wide',
        'className' => 'extra',
    ], '<p>Inner <em>content</em></p>'), <<<'HTML'
        <div class="check check--dark alignwide extra wp-block-dev-test-check" id="check-anchor">
        <p class="check__text">Plain text</p>
        <div class="check__rich">Rich <strong>text</strong></div>
        <p class="check__count">7</p>
        <a class="check__link" href="https://example.test/page?a=1&amp;b=2">Link</a>
        <figure class="check__image"></figure>
        <p class="check__values">on 1.25 A note hidden</p>
        <figure class="check__meta">
        <figcaption>Caption</figcaption>
        <a class="check__source" href="https://example.test/source">Source</a>
        </figure>
        <p class="check__address">Line one<br />
        Line two</p>
        <a class="check__cta" href="https://example.test/cta" target="_blank" rel="noopener">Call to action</a>
        <p class="check__name">dev-test/check</p>
        <div class="check__inner"><p>Inner <em>content</em></p></div>
        </div>
        HTML);

    $expect('check: hostile values are escaped or sanitized', $block('dev-test/check', [
        'text' => 'Tom & <script>x</script> "quoted" \'single\'',
        'rich' => 'Hello <em>world</em> &amp; more',
        'link' => 'javascript:alert(1)',
        'meta' => ['caption' => 'Cap & <b>', 'source' => 'javascript:x'],
        'address' => "First\nSecond <line>",
        'cta' => ['url' => 'javascript:alert(1)'],
        'note' => '<i>note</i>',
        'imageId' => 999999,
    ]), <<<'HTML'
        <div class="check check--light wp-block-dev-test-check">
        <p class="check__text">Tom &amp; &lt;script&gt;x&lt;/script&gt; &quot;quoted&quot; &#039;single&#039;</p>
        <div class="check__rich">Hello <em>world</em> &amp; more</div>
        <p class="check__count">0</p>
        <a class="check__link" href="">Link</a>
        <figure class="check__image"></figure>
        <p class="check__values">off 0.5 &lt;i&gt;note&lt;/i&gt; hidden</p>
        <figure class="check__meta">
        <figcaption>Cap &amp; &lt;b&gt;</figcaption>
        <a class="check__source" href="">Source</a>
        </figure>
        <p class="check__address">First<br />
        Second &lt;line&gt;</p>
        <p class="check__name">dev-test/check</p>
        <div class="check__inner"></div>
        </div>
        HTML);

    $expectLines(
        'check: quotes cannot break out of URL attributes',
        $block('dev-test/check', [
            'link' => 'https://example.test/" onmouseover="x',
            'meta' => ['source' => "https://example.test/?a='1'&b=<2>"],
            'cta' => ['url' => 'https://example.test/?q="x"&r=\'y\''],
        ]),
        '<a class="check__link" href="https://example.test/%20onmouseover=x">Link</a>',
        '<a class="check__source" href="https://example.test/?a=&#039;1&#039;&amp;b=2">Source</a>',
        '<a class="check__cta" href="https://example.test/?q=x&#038;r=&#039;y&#039;">Call to action</a>',
    );

    // WordPress drops an attribute that does not match its schema; the block renders its default.
    $invalid = [
        'a string for an int' => ['count' => 'abc'],
        'a fraction for an int' => ['count' => 5.5],
        'a string for a float' => ['ratio' => 'x'],
        'a string for a bool' => ['flag' => 'yes'],
        'an int for a nullable string' => ['note' => 5],
        'null for a string' => ['text' => null],
        'an array for a string' => ['text' => ['a']],
        'an unknown enum value' => ['variant' => 'purple'],
        'a wrong type in a value class' => ['meta' => ['caption' => 7, 'source' => 'https://example.test/']],
        'an unknown link kind' => ['cta' => ['url' => 'https://example.test/', 'kind' => 'bogus']],
        'an unknown attribute' => ['unknown' => 'value'],
    ];
    foreach ($invalid as $case => $attributes) {
        $expect('check: ' . $case . ' renders the default', $block('dev-test/check', $attributes), $defaults);
    }

    $expectLines(
        'check: numeric values of the other number type are accepted',
        $block('dev-test/check', ['count' => '5', 'ratio' => 2]),
        '<p class="check__count">5</p>',
        '<p class="check__values">off 2 none hidden</p>',
    );
    $expectLines(
        'check: extra keys in value classes are ignored',
        $block('dev-test/check', ['meta' => ['caption' => 'Kept', 'other' => 1], 'cta' => ['url' => 'https://example.test/', 'other' => true]]),
        '<figcaption>Kept</figcaption>',
        '<a class="check__cta" href="https://example.test/">Call to action</a>',
    );

    // Links to content: the URL is resolved when rendering; the stored URL does not count.
    $public = wp_insert_post(['post_title' => 'Linked page', 'post_name' => 'render-linked-page', 'post_status' => 'publish', 'post_type' => 'page'], true, false);
    $draft = wp_insert_post(['post_title' => 'Draft page', 'post_status' => 'draft', 'post_type' => 'page'], true, false);
    if ($public instanceof WP_Error || $draft instanceof WP_Error) {
        WP_CLI::error('Cannot create the linked pages.');
    }
    $linked = static fn(int $id): string => $block('dev-test/check', ['cta' => ['url' => 'https://stale.example.test/', 'kind' => 'post', 'id' => $id]]);
    $expectLines('check: a link to a published page uses its current URL', $linked($public), sprintf('<a class="check__cta" href="%s">Call to action</a>', esc_url((string) get_permalink($public))));
    $expect('check: a link to a draft renders no link', $linked($draft), $defaults);
    $expect('check: a link to a missing post renders no link', $linked(999999), $defaults);
    wp_delete_post($public, true);
    wp_delete_post($draft, true);

    $expect('hero: list items are escaped and sanitized', $block('dev-test/hero', [
        'headline' => '<em>Head</em>',
        'subline' => 'Sub & <x>',
        'badges' => [['text' => 'Fast & <b>', 'icon' => 'clock']],
        'buttons' => [['label' => 'A & <b>', 'url' => 'https://example.test/?a=1&b=2'], ['label' => 'B', 'url' => 'javascript:alert(1)']],
    ]), <<<'HTML'
        <section class="hero alignfull relative isolate overflow-hidden px-6 py-20 surface-light wp-block-dev-test-hero">
        <div class="hero__content mx-auto flex max-w-content flex-col items-center gap-6 text-center">
        <h1 class="hero__headline m-0 text-5xl font-bold"><em>Head</em></h1>
        <p class="hero__subline m-0 text-lead">Sub &amp; &lt;x&gt;</p>
        <ul class="hero__badges m-0 flex list-none flex-wrap justify-center gap-3 p-0">
        <li class="hero__badge hero__badge--clock inline-flex items-center gap-2 rounded-full border border-current px-3 py-1 text-sm">
        <svg class="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm.5-13H11v6l5.2 3.1.8-1.2-4.5-2.7z"/></svg>
        <span class="hero__badge-text">Fast &amp; &lt;b&gt;</span>
        </li>
        </ul>
        <div class="hero__buttons flex flex-wrap justify-center gap-4">
        <a class="hero__button rounded bg-primary px-5 py-3 text-contrast no-underline" href="https://example.test/?a=1&amp;b=2">A &amp; &lt;b&gt;</a>
        <a class="hero__button rounded bg-primary px-5 py-3 text-contrast no-underline" href="">B</a>
        </div>
        </div>
        </section>
        HTML);

    $expect('hero: a list with one invalid item renders the default list', $block('dev-test/hero', [
        'buttons' => [['label' => 'Valid', 'url' => 'https://example.test/'], ['url' => 'https://example.test/without-label']],
    ]), <<<'HTML'
        <section class="hero alignfull relative isolate overflow-hidden px-6 py-20 surface-light wp-block-dev-test-hero">
        <div class="hero__content mx-auto flex max-w-content flex-col items-center gap-6 text-center">
        </div>
        </section>
        HTML);

    // #[ListOf(max: 3)] is no schema keyword: WordPress keeps the stored list, the template gets the first three items.
    $expectLines('hero: a color with transparency and only the first three of four buttons', $block('dev-test/hero', [
        'backgroundColor' => '#1e4d8c80',
        'buttons' => [['label' => 'A'], ['label' => 'B'], ['label' => 'C'], ['label' => 'D']],
    ]), '<section style="background-color: #1e4d8c80" class="hero alignfull relative isolate overflow-hidden px-6 py-20 surface-light wp-block-dev-test-hero">', '<a class="hero__button rounded bg-primary px-5 py-3 text-contrast no-underline" href="">C</a>');
    $output = do_blocks($block('dev-test/hero', ['buttons' => [['label' => 'A'], ['label' => 'B'], ['label' => 'C'], ['label' => 'D']]]));
    $report('hero: the fourth button is not rendered', substr_count($output, 'class="hero__button ') === 3, "--- actual\n{$output}");

    // A value outside the pattern of #[Color] fails WordPress' validation: the attribute falls back to its default.
    $expectLines('hero: a color that breaks out of the style attribute is dropped', $block('dev-test/hero', [
        'backgroundColor' => 'red;background-image:url(https://example.test/x.png)',
    ]), '<section class="hero alignfull relative isolate overflow-hidden px-6 py-20 surface-light wp-block-dev-test-hero">');

    $expect('inspector: inspector fields and list items without an image', $block('dev-test/inspector', [
        'summary' => '<b>Summary</b>',
        'note' => "A\nB & <c>",
        'slides' => [['caption' => '<i>Caption</i>', 'imageId' => 999999]],
    ]), <<<'HTML'
        <div class="inspector-check wp-block-dev-test-inspector">
        <div class="inspector-check__summary"><b>Summary</b></div>
        <p class="inspector-check__note">A<br />
        B &amp; &lt;c&gt;</p>
        <figure class="inspector-check__slide">
        <figcaption>&lt;i&gt;Caption&lt;/i&gt;</figcaption>
        </figure>
        </div>
        HTML);

    // Render errors with WP_DEBUG reach the caller.
    try {
        $output = do_blocks($block('dev-test/support-unwrapped'));
        $report('a render error with WP_DEBUG is thrown', false, "--- output\n{$output}");
    } catch (Throwable $exception) {
        $report('a render error with WP_DEBUG is thrown', str_contains($exception->getMessage(), 'Block dev-test/support-unwrapped uses block supports'), '--- exception' . "\n" . $exception::class . ': ' . $exception->getMessage());
    }

    // Automatic excerpts contain only the fields marked with excerpt: true.
    $post = wp_insert_post(wp_slash([
        'post_title' => 'Excerpt',
        'post_status' => 'publish',
        'post_content' => $block('dev-test/hero', ['headline' => '<em>Head</em>', 'subline' => 'Sub & <x>'])
            . $block('dev-test/faq', ['question' => 'Question?', 'answer' => 'Not in the excerpt'])
            . $block('dev-test/check', ['text' => 'Not in the excerpt']),
    ]), true, false);
    if ($post instanceof WP_Error) {
        WP_CLI::error('Cannot create the post of the excerpt test.');
    }
    $excerpt = get_the_excerpt($post);
    $report('excerpt: only excerpt fields, plain text escaped', $excerpt === 'Head Sub &amp; &lt;x&gt; Question?', "--- actual\n{$excerpt}");
    wp_delete_post($post, true);
}

WP_CLI::line(sprintf('%d passed, %d failed (%s).', $passed, $failures, WP_DEBUG ? 'with WP_DEBUG' : 'without WP_DEBUG'));
if ($failures > 0) {
    WP_CLI::halt(1);
}
