/**
 * Browser tests of the theme. Run them with wp-test-env
 * (https://github.com/saijsaij/wp-test-env), which starts the WordPress
 * instances and runs Playwright with the credentials and a writable results
 * directory, e.g. on two instances:
 *
 *     bin/e2e --instances a,b --project theme-dev-test --results theme-dev-test
 *
 * Every worker has its own WordPress instance (one URL of WP_BASE_URLS per
 * worker), so tests of different workers never share state.
 */
const path = require( 'path' );
const { defineConfig } = require( '@playwright/test' );

function required( name ) {
	const value = process.env[ name ];
	if ( ! value ) {
		throw new Error(
			`${ name } is not set; run the browser tests with bin/e2e of wp-test-env.`
		);
	}
	return value;
}

const output = required( 'E2E_OUTPUT_DIR' );
// dev: the theme checkout; release: the release ZIP.
if ( ! [ 'dev', 'release' ].includes( required( 'E2E_TARGET' ) ) ) {
	throw new Error(
		`E2E_TARGET must be dev or release, found ${ process.env.E2E_TARGET }.`
	);
}
const playwrightVersion = require( '@playwright/test/package.json' ).version;
if ( playwrightVersion !== required( 'PLAYWRIGHT_VERSION' ) ) {
	throw new Error(
		`@playwright/test ${ playwrightVersion } does not match the browsers of the Playwright image (PLAYWRIGHT_VERSION ${ process.env.PLAYWRIGHT_VERSION }).`
	);
}
const urls = required( 'WP_BASE_URLS' ).split( ',' );

/*
 * Playwright evaluates this file again in every worker process, after setting
 * TEST_PARALLEL_INDEX (0 … workers - 1; a worker restarted after a failure keeps
 * its index). Each worker picks its instance here, before any test file loads
 * @wordpress/e2e-test-utils-playwright, which reads WP_BASE_URL and
 * STORAGE_STATE_PATH once when it is loaded. The main process has no index and
 * needs no URL.
 */
let baseURL;
const parallelIndex = process.env.TEST_PARALLEL_INDEX;
if ( parallelIndex !== undefined ) {
	baseURL = urls[ Number( parallelIndex ) ];
	if ( ! baseURL ) {
		throw new Error(
			`No WordPress instance for worker ${ parallelIndex }: WP_BASE_URLS has ${ urls.length }.`
		);
	}
	process.env.WP_BASE_URL = baseURL;
	// The worker logs in to its instance (fixtures.js); the workspace is read-only.
	process.env.STORAGE_STATE_PATH = path.join(
		output,
		`storage-state-${ parallelIndex }.json`
	);
}
process.env.E2E_SCREENSHOT_DIR = path.join( output, 'screenshots' );

module.exports = defineConfig( {
	testDir: './specs',
	outputDir: path.join( output, 'test-results' ),
	workers: urls.length,
	// Test files are distributed over the workers; the tests of a file run in order.
	fullyParallel: false,
	reporter: [ [ 'list' ] ],
	timeout: 30_000,
	use: {
		baseURL,
		storageState: process.env.STORAGE_STATE_PATH,
		viewport: { width: 1440, height: 900 },
		screenshot: 'only-on-failure',
		trace: 'retain-on-failure',
	},
	projects: [ { name: 'chromium', use: { browserName: 'chromium' } } ],
} );
