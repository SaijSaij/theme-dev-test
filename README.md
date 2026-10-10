# theme-dev-test

Test theme of [wp-app-framework](https://github.com/saijsaij/wp-app-framework). It is not a product theme: its blocks, hooks, routes and templates exist to exercise the framework, and the build and browser tests of the framework run against it.

- Theme slug (directory name): `theme-dev-test`
- Block namespace: `dev-test/`, REST namespace: `dev-test/v1`
- Requires WordPress 7.1 and PHP 8.5

Unit tests and every build error (with fixtures that would break a theme's build) live in the framework itself. Everything that needs WordPress, a browser or a complete theme build is tested here. Code written to check a framework feature stays here as a permanent test.

## Development

The framework is included through a Composer `path` repository that symlinks `vendor/saij/wp-app-framework` to a checkout of [wp-app-framework](https://github.com/saijsaij/wp-app-framework) in the same parent directory (relative symlink). Clone both repositories side by side:

```sh
git clone https://github.com/saijsaij/wp-app-framework.git
git clone https://github.com/saijsaij/theme-dev-test.git
```

For a local WordPress, use [wp-dev-env](https://github.com/saijsaij/wp-dev-env) in the same parent directory with `WP_THEMES=theme-dev-test` and `WP_ACTIVE_THEME=theme-dev-test`; its setup also runs `composer install`, `npm ci` and `npm run build` for this theme.

Scripts (the framework's editor runtime and the editor scripts in `src/`) are built with `@wordpress/scripts` into `build/`; `npm install` needs `vendor/` from `composer install` first. In wp-dev-env:

```sh
docker compose run --rm tools npm --prefix /workspace/theme-dev-test run build
docker compose run --rm tools npm --prefix /workspace/theme-dev-test run start   # watch, also picks up framework changes
```

## Tests

All checks run in wp-dev-env and must pass without errors or warnings.

Build: `composer build-manifest` builds and checks the manifest (writes nothing) and must report

```
Manifest OK: 30 service candidates, 18 services, 2 hooks, 16 routes, 6 template functions, 1 template filters, 8 blocks.
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

The fixtures in `tests/e2e/fixtures.js` fail every test that causes a console warning, console error or uncaught page error. A test that checks a warning declares it with `expectConsole`; it must then appear. The only general exception is a warning WordPress causes itself with every theme (documented in `ALLOWED`); if it stops appearing while the editor was opened, the run fails so the entry gets removed.

| Spec | Covers | Code under test |
|---|---|---|
| `hook.spec.js` | `#[Hook]` action and filter, injected services, WordPress arguments, `#[NoService]`, init hook of the framework | `src/Hook/` |
| `rest.spec.js` | REST arguments (`int`, `float`, `bool`, enum, `#[Param]` keywords), `WP_REST_Request` parameter, enum path parameters, 400/401/403/404/500, 201/204, `OPTIONS`, `Capability`/`Callback` and the `Allow` header, `#[ListOf]` | `src/Rest/` |
| `twig.spec.js` | Theme templates with partial, `#[TemplateFunction]`, `#[TemplateFilter]` (`pre_escape`), lazy services, `strict_variables`, cache directory | `src/Twig/` |
| `blocks.spec.js` | Escaping and sanitizing of every value type on the front end (scalars, nullable, enum, nested value class, URL, image, inner blocks), supports, render arguments, stored content, block types in the editor, `usesContext` in a query loop | `src/Block/Check/`, `src/Block/PostInfo/`, `src/Block/Container/` |
| `editor-runtime.spec.js` | Editor runtime: inline editing, refetch rule, batch rendering and cache, layout stability, images, containers, contentOnly, errors per block, site editor, list cards, canvas outlines, `registerPanel` | `src/Block/Hero/`, `src/Block/Section/` |
| `inspector-controls.spec.js` | Generated inspector controls per value type, `#[Label]`, `#[Hidden]`, `Labeled`, `registerControl`, warnings of the extension points and of unmarked inline fields, inserting in contentOnly mode (`contentRole`) | `src/Block/Check/`, `src/Block/Unmarked/`, `src/Block/Container/` |
| `inspector-fields.spec.js` | Fields edited in the inspector (`inspector: true`), also in list items; `field()` on such a field | `src/Block/Inspector/` |

Expected log entries of a test run (WP_DEBUG): the failures of `dev-test/v1/items/fail` and `dev-test/v1/twig/undefined` and of the editor render of `dev-test/wrong-field`, which fails on purpose. Never store `dev-test/wrong-field` or `dev-test/unmarked` in a post: they exist to show errors.

## Structure

- `functions.php` loads the autoloader (`vendor-prefixed/` in release builds, `vendor/` in source checkouts) and boots the framework.
- `src/` contains the theme's PHP classes (PSR-4 `Saij\ThemeDevTest\`), discovered by the framework, with their Twig templates and editor scripts next to them, organized by the feature they test.
- `templates/` holds the block templates (`index.html`, `single.html`).
- `build/` (not versioned) is the output of the script build.

In a source checkout the framework runs in development mode and caches the manifest in `wp-content/cache/theme-dev-test/manifest/`.
