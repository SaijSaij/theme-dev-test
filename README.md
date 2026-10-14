# theme-dev-test

Test theme of [wp-app-framework](https://github.com/saijsaij/wp-app-framework). It is not a product theme: its blocks, hooks, routes and templates exist to exercise the framework, and the build and browser tests of the framework run against it.

- Theme slug (directory name): `theme-dev-test`
- Block namespace: `dev-test/`, REST namespace: `dev-test/v1`
- Requires WordPress 7.1 and PHP 8.5

Unit tests and every build error (with fixtures that would break a theme's build) live in the framework itself. Everything that needs WordPress, a browser or a complete theme build is tested here. Code written to check a framework feature stays here as a permanent test.

## Development

The framework is required from its GitHub repository as `dev-main`: the test theme always follows the current framework, and the lock file pins the commit. For development, [wp-dev-env](https://github.com/saijsaij/wp-dev-env) replaces `vendor/saij/wp-app-framework` by a relative symlink to a checkout of [wp-app-framework](https://github.com/saijsaij/wp-app-framework) in the same parent directory (`.env`: `WP_PACKAGE_LINKS=saij/wp-app-framework=wp-app-framework`). After a framework change is pushed, `composer update saij/wp-app-framework` moves the lock file to it. Clone both repositories side by side:

```sh
git clone https://github.com/saijsaij/wp-app-framework.git
git clone https://github.com/saijsaij/theme-dev-test.git
```

For a local WordPress, use [wp-dev-env](https://github.com/saijsaij/wp-dev-env) in the same parent directory with `WP_THEMES=theme-dev-test` and `WP_ACTIVE_THEME=theme-dev-test`; its setup also runs `composer install`, `npm ci` and `npm run build` for this theme.

The theme is also the consumer of the test plugin [plugin-dev-test](https://github.com/saijsaij/plugin-dev-test): it injects the plugin's public API, calls its public template functions (`extra.wp-app-framework.template-plugins`) and overrides one of its templates (`overrides/plugin-dev-test/`). The plugin is a development dependency (`require-dev`, for static analysis); the release ZIP does not contain it. Check it out next to the theme and activate it in wp-dev-env (`WP_PLUGINS=plugin-dev-test`, `WP_PACKAGE_LINKS=saij/wp-app-framework=wp-app-framework,saij/plugin-dev-test=plugin-dev-test`). The tests of `plugin.spec.js` expect the plugin's behavior if it is active and the theme's fallback otherwise.

The theme is also the parent of the test child theme [theme-dev-test-child](https://github.com/saijsaij/theme-dev-test-child), which uses its public API (`Saij\ThemeDevTest\Api\DevTestApi`, `#[PublicApi]`), its public template functions `theme_dev_test_badge(label)` and `theme_dev_test_partial(name)` and overrides `Twig/ChildOverridable.twig`. In wp-dev-env the child theme may be the active theme (`WP_ACTIVE_THEME=theme-dev-test-child`); the theme's tests pass with and without it and leave what the child theme does to the child theme's tests.

Scripts (the framework's editor runtime and the editor scripts in `src/`) and the stylesheet `src/styles.css` (Tailwind CSS, tokens on the values of `theme.json`) are built with `@wordpress/scripts` and the framework's webpack helper into `build/`; `npm install` needs `vendor/` from `composer install` first. In wp-dev-env:

```sh
docker compose run --rm tools npm --prefix /workspace/theme-dev-test run build
docker compose run --rm tools npm --prefix /workspace/theme-dev-test run start   # watch, also picks up framework changes
```

## Release

`composer release` builds `dist/theme-dev-test-<version>.zip` with the release pipeline of the framework (see [Release](https://saijsaij.github.io/wp-app-framework/next/build-and-release/release.html) in its documentation); the framework comes from the lock file. To build with the local framework checkout instead:

```sh
docker compose run --rm tools composer --working-dir=/workspace/theme-dev-test release -- --package-source=saij/wp-app-framework=../wp-app-framework
```

`.gitattributes` marks the development files (`export-ignore`) the ZIP leaves out. A tag `v<version>` (= `Version` in `style.css`) runs `.github/workflows/release.yml`: build, release test with all browser tests, then the ZIP is attached to the GitHub release of the tag.

## Tests

All checks run in wp-dev-env and must pass without errors or warnings.

Build: `composer build-manifest` builds and checks the manifest (writes nothing) and must report

```
Manifest OK (theme theme-dev-test): 87 service candidates, 56 services, 3 hooks, 49 routes, 35 template functions, 1 template filters, 22 blocks. Nothing written (no --output).
Block markup OK: 9 templates, template parts and patterns checked.
Public: 1 APIs, 2 template functions and filters.
Templates use the public template callables of: plugin-dev-test.
```

Lint: PHP with PHPStan (level max, WordPress stubs) and PHP-CS-Fixer (PER Coding Style), JavaScript with ESLint (configuration of `@wordpress/scripts`):

```sh
docker compose run --rm tools composer --working-dir=/workspace/theme-dev-test build-manifest
docker compose run --rm tools composer --working-dir=/workspace/theme-dev-test lint   # fix: composer fix
docker compose run --rm tools npm --prefix /workspace/theme-dev-test run lint          # fix: npm run format
```

Browser tests (Playwright, `tests/e2e/`) run in the `e2e` service of wp-dev-env, which provides WordPress, the credentials and a writable results directory (`data/e2e/` there, with screenshots for review). Each test deletes exactly the posts, media and users it created.

```sh
docker compose run --rm e2e npm --prefix /workspace/theme-dev-test run test:e2e
```

The same suite runs against the release ZIP: install it with `scripts/release-test` of wp-dev-env, then run the tests with `E2E_TARGET=release` (only mode-specific expectations differ, e.g. prefixed class names, the versioned Twig cache, no development warnings):

```sh
scripts/release-test --theme ../theme-dev-test/dist/theme-dev-test-<version>.zip [--plugin ../plugin-dev-test/dist/plugin-dev-test-0.1.0.zip]
set -a; . ./.env; set +a
docker compose run --rm --no-deps -e WP_BASE_URL="$WP_RELEASE_URL" -e E2E_BROWSER_HOST_RULES="MAP $WP_RELEASE_HOST traefik" \
    -e E2E_TARGET=release -e E2E_OUTPUT_DIR=/results/release e2e npm --prefix /workspace/theme-dev-test run test:e2e
```

The fixtures in `tests/e2e/fixtures.js` fail every test that causes a console warning, console error or uncaught page error. A test that checks a warning declares it with `expectConsole`; it must then appear. The only general exception is a warning WordPress causes itself with every theme (documented in `ALLOWED`); if it stops appearing while the editor was opened, the run fails so the entry gets removed.

| Spec | Covers | Code under test |
|---|---|---|
| `hook.spec.js` | `#[Hook]` action and filter, injected services, WordPress arguments, `#[NoService]`, init hook of the framework | `src/Hook/` |
| `rest.spec.js` | REST arguments (`int`, `float`, `bool`, enum, `#[Param]` keywords), `WP_REST_Request` parameter, enum path parameters, 400/401/403/404/500, 201/204, `OPTIONS`, `Capability`/`Callback` and the `Allow` header, `#[ListOf]` | `src/Rest/` |
| `twig.spec.js` | Theme templates with partial, `#[TemplateFunction]`, `#[TemplateFilter]` (`pre_escape`), lazy services, `strict_variables`, cache directory, `@theme` of a template a child theme may override | `src/Twig/` |
| `blocks.spec.js` | Escaping and sanitizing of every value type on the front end (scalars, nullable, enum, nested value class, URL, image, inner blocks), supports, render arguments, stored content, block types in the editor, `usesContext` in a query loop | `src/Block/Check/`, `src/Block/PostInfo/`, `src/Block/Container/` |
| `editor-runtime.spec.js` | Editor runtime: inline editing, refetch rule, batch rendering and cache, layout stability, images, containers, contentOnly, errors per block, site editor, list cards, canvas outlines, `registerPanel`, multiline plain text in the canvas (Enter, Shift+Enter, pasted lines) | `src/Block/Hero/`, `src/Block/Section/` |
| `inspector-controls.spec.js` | Generated inspector controls per value type, `#[Label]`, `#[Hidden]`, `Labeled`, `registerControl`, warnings of the extension points and of unmarked inline fields, inserting in contentOnly mode (`contentRole`), links with LinkControl (page, term and media file by ID, new tab, current URL after a new slug, drafts and deleted pages, unsync to a free URL, remove, contentOnly, schema) | `src/Block/Check/`, `src/Block/Unmarked/`, `src/Block/Container/` |
| `post-content.spec.js` | `#[RichText(postContent: true)]`: text stored as inline HTML, root element as field, reload without validation errors, front end, empty text, kses for authors, contentOnly, outline | `src/Block/Paragraph/` |
| `post-types.spec.js` | Post types, meta and post objects: `dev_test_event`, `dev_test_venue` and `dev_test_genre` with their meta in the REST API (schema, 400 for an invalid value), URLs `/event/…` and the archive without saving the permalinks, template with a `core/post-meta` binding and the block `event-info` (`post()` in Twig), the panel in the block editor (all values saved with the post in one request, rich text in the classic editor), the meta box of the data type on the classic edit screen (no "Custom Fields" box, rejected value with its path), links in the panel (LinkControl) and in the meta box (search form), stored by ID and resolved, loading, changing and creating posts in PHP (references as objects, terms, nothing written for an unsaved reference), fallback of an invalid stored value, meta of posts through `Post` | `src/Post/`, `src/Block/EventInfo/`, `templates/single-dev_test_event.html`, `templates/archive-dev_test_event.html` |
| `queries.spec.js` | Queries of post objects: conditions on meta fields (including posts without stored values, which count as the default), terms and an OR group, sorting by meta fields (missing values like their default) and title, a page with the total, drafts, search, a cached result that survives a change past the hooks and is invalidated by a change through WordPress, a query of `post` by a hand-written field class, the block `event-list` (query in `render()`, post objects in Twig) on the front end and in the editor, and posts and pages of WordPress by `Category`, `Tag` and their standard fields (slug, exact title, modification date, parent, template `page-wide`, format, sticky, password, menu order, comments, search columns and phrase) | `src/Post/QueryController.php`, `src/Post/EventDetailsFields.php` (generated by `wp-app-framework meta-fields`), `src/Post/ExtrasFields.php` (by hand), `src/Block/EventList/`, `templates/page-wide.html` |
| `containers.spec.js` | Block API for containers: custom block categories (order, label, icon), inserter previews (`#[Example]`, the automatic one, `#[Example(false)]`), variations (inserter items, inner blocks, `isActive` in the block card), `#[InnerBlocks]` (template, `templateLock` insert without appender, horizontal orientation, prioritized blocks in the quick inserter, button appender), `parent`, typed context (`#[ProvidesContext]`, `#[Context]`) in the canvas, in render requests and on the front end, `CoreBlock` against the registered core blocks | `src/Block/Tabs/`, `src/Block/Stack/`, `src/Block/Category.php`, `src/Block/CoreBlockController.php`, `patterns/tabs.php` |
| `excerpt.spec.js` | Automatic excerpts from fields with `excerpt: true` (REST, archive with `core/post-excerpt`, feed), `excerptWrapper`, manual excerpts, posts without framework blocks | `src/Block/Hero/`, `src/Block/Paragraph/`, `src/Block/Section/` |
| `inspector-fields.spec.js` | Fields edited in the inspector (`inspector: true`), also in list items and multiline plain text in a text area; `field()` on such a field | `src/Block/Inspector/` |
| `mode.spec.js` | Development mode in the checkout, release mode with the ZIP: built manifest, no development cache, prefixed framework and Twig classes in the theme code | `src/Mode/` |
| `styles.spec.js` | Stylesheet built with Tailwind: exactly the utilities of the templates and overrides, tokens on `theme.json` values on the front end and in the canvas of the post and site editor, not in the editor's main document | `src/styles.css`, `src/Block/Styled/`, `overrides/plugin-dev-test/` |
| `parity.spec.js` | The same sizes, spacing and type of every element of a block in the canvas of the post and site editor as on the front end, and the same space between two blocks (`measureBlocks()` in `helpers.js`) | `src/Block/Card/`, `theme.json` (`blockGap`) |
| `supports.spec.js` | Block supports of the theme: attributes with defaults (also per block), classes on the root element on the front end and in the canvas of the post and site editor, controls in the Styles tab and the Settings panel, none in contentOnly mode and pattern sections, `registerSupportControl`, a service with an injected dependency, the error without `block_wrapper_attributes()` | `src/Support/`, `src/Block/Card/`, `src/Block/Hero/`, `src/Block/SupportUnwrapped/`, `src/styles.css` |
| `frontend.spec.js` | View scripts of a block and a block support: loaded deferred only on pages that render their blocks, the support's script once, nothing for automatic excerpts; one view per root element with the support's value; in the editor only in the preview of a block (toolbar button on blocks with view scripts), front-end markup without inline editing, a new view after a changed attribute and cleanup when leaving the preview or removing the block; `registerToolbarButton`; the preview in the site editor | `src/Block/Faq/`, `src/Support/Reveal.*`, `src/Block/RevealBox/` |
| `settings.spec.js` | Settings groups: options with schema and defaults in `/wp/v2/settings`, injection into a service and the template global `settings` (defaults, saved values, every value type), image, text, rich text (classic editor), references, a link (search form, ID, unlink, sanitized free URL) and multiline text on the settings page, invalid values rejected by the REST API, fallback of an invalid stored value, the settings page under Appearance with a tab per group (order by `position`), saving all groups in one request, the error message of a rejected save, no access without `manage_options` | `src/Setting/` |
| `references.spec.js` | `#[PostReference]` (one and a list, limited to post types), `#[TermReference]`, `#[UserReference]`: resolution on the front end (missing, other type, drafts left out), drafts shown in the editor, search controls in the inspector (choose, reorder, remove, title of a stored ID), `role: content` | `src/Block/References/` |
| `wordpress-functions.spec.js` | The WordPress template functions of the framework (`wp_…`) against the REST API: attachments (image, URLs, caption as HTML, alternative text), posts (URL, title, manual and automatic excerpt as plain text, date, thumbnail), users (name, author archive, avatar), site values decoded and escaped once, login and logout URL, login status with and without a session, formatting; `''` for a draft and missing objects | `src/Block/WordPressFunctions/` |
| `plugin.spec.js` | The theme as consumer of plugin-dev-test: `#[PluginApi]` (data with the plugin, `null` without), public template functions and filters with `has_plugin()`, templates with the same path in theme and plugin in one request, override of a plugin template, `@plugin` | `src/Plugin/`, `overrides/plugin-dev-test/` |
| `patterns.spec.js` | Block template, template part and pattern of the theme, which the build checks against its blocks: front end of `single-post-e2e-patterns.html` with the header part, the pattern (PHP output in a block of the theme and a core block) and a plugin block (rendered only with the plugin), a link to a free URL; the pattern inserted as a contentOnly section, editable, with `contentRole` for inserting | `templates/`, `parts/`, `patterns/` |
| `cache.spec.js` | The cache with each backend (files, transients, the object cache only if the site has one): a cached block renders once per input, context and variant (`QueryParamVary`), its view script runs also from the cache, invalidation by a saved post (`PostTypeTag`), saved settings (`SettingsTag`) and a tag of the theme; fresh renders in the editor and its preview; cached REST routes (arguments, `UserVary`, the permission check on every request, a `WP_REST_Response` with status and headers, not stored with status 404) and `CacheStore::remember()` | `src/Cache/` |
| `cron.spec.js` | Cron events and tasks: an event with an interval in seconds and its schedule, daily and weekly events at their local start time (03:00, Monday 08:00), an event moved off its phase back to its start time on the next request, a due event run by `wp-cron.php` and scheduled an interval later, a task of the `CronScheduler` with an ID and an enum (duplicate, `isScheduled()`, run with its values) and an unscheduled task | `src/Cron/` |

Expected log entries of a test run (WP_DEBUG): the failures of `dev-test/v1/items/fail` and `dev-test/v1/twig/undefined` and of the editor renders of `dev-test/wrong-field` and `dev-test/support-unwrapped`, which fail on purpose, the invalid stored value of `dev_test_general[density]` (`settings.spec.js`) and the invalid stored value of `dev_test_kind` (`post-types.spec.js`). Never store `dev-test/wrong-field`, `dev-test/unmarked` or `dev-test/support-unwrapped` in a post: they exist to show errors.

## Structure

- `functions.php` loads the autoloader (`vendor-prefixed/` in release builds, `vendor/` in source checkouts) and boots the framework.
- `src/` contains the theme's PHP classes (PSR-4 `Saij\ThemeDevTest\`), discovered by the framework, with their Twig templates and editor scripts next to them, organized by the feature they test.
- `templates/` holds the block templates (`index.html` with titles and excerpts, `single.html`).
- `overrides/plugin-dev-test/` overrides templates of the test plugin.
- `theme.json` defines the colors, font size, spacing, layout sizes and block gap the stylesheet maps to Tailwind tokens. `settings.spacing.blockGap` is set on purpose: without it, WordPress 7.1 puts space between blocks in the editor but not on the front end.
- `build/` (not versioned) is the output of the script and stylesheet build.

In a source checkout the framework runs in development mode and caches the manifest in `wp-content/cache/theme-dev-test/manifest/`. The release ZIP contains `generated/manifest.php` (release mode) and caches compiled templates in `wp-content/cache/theme-dev-test/twig/<template version>/`.
