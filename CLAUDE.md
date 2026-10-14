# CLAUDE.md – theme-dev-test

Test theme of [wp-app-framework](https://github.com/saijsaij/wp-app-framework) (slug `theme-dev-test`, namespace `dev-test`: blocks `dev-test/…`, REST `dev-test/v1`, options `dev_test_…`, PHP `Saij\ThemeDevTest\`). Not a product theme: everything here exists to exercise the framework, and the framework's build and browser tests run against it. Framework principles and rules: the framework's CLAUDE.md and its [documentation](https://saijsaij.github.io/wp-app-framework/); this file covers the theme.

<!-- Maintainers: keep this file under 200 lines; the README holds commands in full and the spec table. -->

## Rules

- Code written to check a framework feature stays here as a **permanent test**: PHP under `src/<Feature>/` (with its Twig templates and editor scripts next to it), specs in `tests/e2e/specs/`, WP-CLI checks in `tests/cli/run`. Add every new spec to the spec table in the README.
- Build errors are not tested here (a broken class would break the theme's build); they belong to the framework's PHPUnit fixtures.
- Each test deletes exactly the posts, media and users it created – never "delete all". Never store `dev-test/wrong-field`, `dev-test/unmarked` or `dev-test/support-unwrapped` in a post; they fail on purpose.
- The console guard (`tests/e2e/fixtures.js`) fails a test on every console warning, console error or page error. Declare expected messages with `expectConsole`; add to `ALLOWED` only a warning WordPress causes with every theme, with the reason.
- The suite must pass with and without the test plugin [plugin-dev-test](https://github.com/saijsaij/plugin-dev-test) (`plugin.spec.js` branches explicitly on the plugin status from `/wp/v2/plugins`) and with the test child theme [theme-dev-test-child](https://github.com/saijsaij/theme-dev-test-child) active or not (what the child theme does is tested in its own suite).
- The same suite runs against the release ZIP (`E2E_TARGET=release`); only mode-specific expectations may branch.
- Class properties are never `public` (exceptions: block attribute and value classes); everything in this repository is English; other repositories are linked by GitHub URL.

## Commands

Run from a [wp-dev-env](https://github.com/saijsaij/wp-dev-env) checkout next to this repository. Every check must pass without errors or warnings.

```sh
docker compose run --rm tools composer --working-dir=/workspace/theme-dev-test build-manifest   # output must match the README
docker compose run --rm tools composer --working-dir=/workspace/theme-dev-test lint             # fix: composer fix
docker compose run --rm tools npm --prefix /workspace/theme-dev-test run lint                    # fix: npm run format
docker compose run --rm tools npm --prefix /workspace/theme-dev-test run build                   # or run start (watch)
docker compose run --rm e2e npm --prefix /workspace/theme-dev-test run test:e2e
../theme-dev-test/tests/cli/run wordpress                                                       # WP-CLI tests (src/Cli/)
../theme-dev-test/tests/lifecycle/run wordpress                                                 # lifecycle tests (src/Lifecycle/ of theme and child theme); run last, switches themes
```

Release build with the local framework checkout, and the browser tests against it: see "Release" and "Tests" in the README (`composer release -- --package-source=saij/wp-app-framework=../wp-app-framework`, `scripts/release-test --theme …`, `E2E_TARGET=release`).

## Keep in sync

- `composer build-manifest` prints counts of services, hooks, routes, template callables and blocks; when they change, update the expected output in the README.
- The framework is required as `dev-main` from GitHub; after a framework change is pushed, `composer update saij/wp-app-framework` moves the lock file to it (locally, `WP_PACKAGE_LINKS` of wp-dev-env links the checkout instead).
- A release tag `v<version>` must equal `Version:` in `style.css`; the release workflow fails otherwise.
- Every GitHub release gets short release notes instead of the generated compare link alone: what the theme tests anew, the framework version it is built with, and the compare link last. The release workflow creates the release with `--generate-notes`; once it has passed, replace the text with `gh release edit <tag> --notes-file <file>` (a rerun only uploads the ZIP and keeps the text).
- New development files that must not ship go to `.gitattributes` as `export-ignore` (directories as `dir/**`).
