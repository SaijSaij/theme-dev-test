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

Scripts (the framework's editor runtime and the editor scripts in `src/`) are built with `@wordpress/scripts` into `build/`; `npm install` needs `vendor/` from `composer install` first. In wp-dev-env:

```sh
docker compose run --rm tools npm --prefix /workspace/theme-dev-test run build
docker compose run --rm tools npm --prefix /workspace/theme-dev-test run start   # watch, also picks up framework changes
```

## Release

`composer release` builds `dist/theme-dev-test-<version>.zip` with the release pipeline of the framework (see its README); the framework comes from the lock file. To build with the local framework checkout instead:

```sh
docker compose run --rm tools composer --working-dir=/workspace/theme-dev-test release -- --package-source=saij/wp-app-framework=../wp-app-framework
```

`.gitattributes` marks the development files (`export-ignore`) the ZIP leaves out. A tag `v<version>` (= `Version` in `style.css`) runs `.github/workflows/release.yml`: build, release test with all browser tests, then the ZIP is attached to the GitHub release of the tag.

## Tests

All checks run in wp-dev-env and must pass without errors or warnings.

Build: `composer build-manifest` builds and checks the manifest (writes nothing) and must report

```
Manifest OK (theme theme-dev-test): 35 service candidates, 22 services, 2 hooks, 19 routes, 7 template functions, 1 template filters, 9 blocks. Nothing written (no --output).
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
| `twig.spec.js` | Theme templates with partial, `#[TemplateFunction]`, `#[TemplateFilter]` (`pre_escape`), lazy services, `strict_variables`, cache directory | `src/Twig/` |
| `blocks.spec.js` | Escaping and sanitizing of every value type on the front end (scalars, nullable, enum, nested value class, URL, image, inner blocks), supports, render arguments, stored content, block types in the editor, `usesContext` in a query loop | `src/Block/Check/`, `src/Block/PostInfo/`, `src/Block/Container/` |
| `editor-runtime.spec.js` | Editor runtime: inline editing, refetch rule, batch rendering and cache, layout stability, images, containers, contentOnly, errors per block, site editor, list cards, canvas outlines, `registerPanel` | `src/Block/Hero/`, `src/Block/Section/` |
| `inspector-controls.spec.js` | Generated inspector controls per value type, `#[Label]`, `#[Hidden]`, `Labeled`, `registerControl`, warnings of the extension points and of unmarked inline fields, inserting in contentOnly mode (`contentRole`) | `src/Block/Check/`, `src/Block/Unmarked/`, `src/Block/Container/` |
| `post-content.spec.js` | `#[RichText(postContent: true)]`: text stored as inline HTML, root element as field, reload without validation errors, front end, empty text, kses for authors, contentOnly, outline | `src/Block/Paragraph/` |
| `excerpt.spec.js` | Automatic excerpts from fields with `excerpt: true` (REST, archive with `core/post-excerpt`, feed), `excerptWrapper`, manual excerpts, posts without framework blocks | `src/Block/Hero/`, `src/Block/Paragraph/`, `src/Block/Section/` |
| `inspector-fields.spec.js` | Fields edited in the inspector (`inspector: true`), also in list items; `field()` on such a field | `src/Block/Inspector/` |
| `mode.spec.js` | Development mode in the checkout, release mode with the ZIP: built manifest, no development cache, prefixed framework and Twig classes in the theme code | `src/Mode/` |
| `plugin.spec.js` | The theme as consumer of plugin-dev-test: `#[PluginApi]` (data with the plugin, `null` without), public template functions and filters with `has_plugin()`, templates with the same path in theme and plugin in one request, override of a plugin template, `@plugin` | `src/Plugin/`, `overrides/plugin-dev-test/` |

Expected log entries of a test run (WP_DEBUG): the failures of `dev-test/v1/items/fail` and `dev-test/v1/twig/undefined` and of the editor render of `dev-test/wrong-field`, which fails on purpose. Never store `dev-test/wrong-field` or `dev-test/unmarked` in a post: they exist to show errors.

## Structure

- `functions.php` loads the autoloader (`vendor-prefixed/` in release builds, `vendor/` in source checkouts) and boots the framework.
- `src/` contains the theme's PHP classes (PSR-4 `Saij\ThemeDevTest\`), discovered by the framework, with their Twig templates and editor scripts next to them, organized by the feature they test.
- `templates/` holds the block templates (`index.html` with titles and excerpts, `single.html`).
- `overrides/plugin-dev-test/` overrides templates of the test plugin.
- `build/` (not versioned) is the output of the script build.

In a source checkout the framework runs in development mode and caches the manifest in `wp-content/cache/theme-dev-test/manifest/`. The release ZIP contains `generated/manifest.php` (release mode) and caches compiled templates in `wp-content/cache/theme-dev-test/twig/<template version>/`.
