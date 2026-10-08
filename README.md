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

For a local WordPress, use [wp-dev-env](https://github.com/saijsaij/wp-dev-env) in the same parent directory with `WP_THEMES=theme-sections` and `WP_ACTIVE_THEME=theme-sections`; its setup also runs `composer install` for this theme.
