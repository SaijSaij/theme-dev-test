/**
 * Browser tests of the theme. Run them in the e2e service of wp-dev-env
 * (https://github.com/saijsaij/wp-dev-env), which provides WordPress, the
 * credentials and a writable results directory:
 *
 *     docker compose run --rm e2e npm --prefix /workspace/theme-sections run test:e2e
 */
const path = require( 'path' );
const { defineConfig } = require( '@playwright/test' );

function required( name ) {
	const value = process.env[ name ];
	if ( ! value ) {
		throw new Error( `${ name } is not set; run the browser tests in the e2e service of wp-dev-env.` );
	}
	return value;
}

const output = required( 'E2E_OUTPUT_DIR' );
const playwrightVersion = require( '@playwright/test/package.json' ).version;
if ( playwrightVersion !== required( 'PLAYWRIGHT_VERSION' ) ) {
	throw new Error(
		`@playwright/test ${ playwrightVersion } does not match the browsers of the e2e image (PLAYWRIGHT_VERSION ${ process.env.PLAYWRIGHT_VERSION }).`
	);
}

// Read by @wordpress/e2e-test-utils-playwright; the workspace is read-only.
process.env.STORAGE_STATE_PATH = path.join( output, 'storage-state.json' );
process.env.E2E_SCREENSHOT_DIR = path.join( output, 'screenshots' );

module.exports = defineConfig( {
	testDir: './specs',
	outputDir: path.join( output, 'test-results' ),
	globalSetup: require.resolve( './global-setup.js' ),
	// All tests share one WordPress installation.
	workers: 1,
	fullyParallel: false,
	reporter: [ [ 'list' ] ],
	timeout: 60_000,
	use: {
		baseURL: required( 'WP_BASE_URL' ),
		storageState: process.env.STORAGE_STATE_PATH,
		viewport: { width: 1440, height: 900 },
		screenshot: 'only-on-failure',
		trace: 'retain-on-failure',
		launchOptions: {
			args: [ `--host-resolver-rules=${ required( 'E2E_BROWSER_HOST_RULES' ) }` ],
		},
	},
	projects: [ { name: 'chromium', use: { browserName: 'chromium' } } ],
} );
