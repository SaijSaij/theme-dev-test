# theme-sections

Full site editing theme focused on sections, built on [wp-app-framework](https://github.com/saijsaij/wp-app-framework).

- Theme slug (directory name): `theme-sections`
- Block namespace: `sections/`
- Requires WordPress 7.1 and PHP 8.5

## Development

The framework is included through a Composer `path` repository that symlinks `vendor/saij/wp-app-framework` to a checkout of [wp-app-framework](https://github.com/saijsaij/wp-app-framework) in the same parent directory (relative symlink). Clone both repositories side by side:

```sh
git clone https://github.com/saijsaij/wp-app-framework.git
git clone https://github.com/saijsaij/theme-sections.git
```

For a local WordPress, use [wp-dev-env](https://github.com/saijsaij/wp-dev-env) in the same parent directory with `WP_THEMES=theme-sections` and `WP_ACTIVE_THEME=theme-sections`; its setup also runs `composer install`, `npm ci` and `npm run build` for this theme.

Scripts (the framework's editor runtime and the editor scripts in `src/`) are built with `@wordpress/scripts` into `build/`; `npm install` needs `vendor/` from `composer install` first. In wp-dev-env:

```sh
docker compose run --rm tools npm --prefix /workspace/theme-sections run build
docker compose run --rm tools npm --prefix /workspace/theme-sections run start   # watch, also picks up framework changes
```

Browser tests (Playwright, `tests/e2e/`) run in the `e2e` service of wp-dev-env, which provides WordPress, the credentials and a writable results directory (`data/e2e/` there, with screenshots for review). Each test creates its own drafts and deletes exactly these.

```sh
docker compose run --rm e2e npm --prefix /workspace/theme-sections run test:e2e
```

## Structure

- `functions.php` loads the autoloader (`vendor-prefixed/` in release builds, `vendor/` in source checkouts) and boots the framework.
- `src/` contains the theme's PHP classes (PSR-4 `Saij\ThemeSections\`), discovered by the framework (see [wp-app-framework](https://github.com/saijsaij/wp-app-framework)), with their Twig templates and editor scripts next to them, e.g. `src/Block/Hero/` (`Hero.php`, `HeroAttributes.php`, `Hero.twig`, `Hero.editor.js`).
- `templates/` holds the block templates (`index.html`, `single.html`).
- `build/` (not versioned) is the output of the script build.

Blocks: `sections/hero` (topline, headline, image, gradient, buttons) and `sections/section` (container for heroes).

Check the manifest build with `composer build-manifest` (writes nothing). In a source checkout the framework runs in development mode and caches the manifest in `wp-content/cache/theme-sections/manifest/`.
