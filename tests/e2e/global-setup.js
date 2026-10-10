const { request } = require( '@playwright/test' );
const { RequestUtils } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Logs in once and stores the session (STORAGE_STATE_PATH) for all tests.
 *
 * @param {import('@playwright/test').FullConfig} config
 */
module.exports = async function globalSetup( config ) {
	const { baseURL, storageState } = config.projects[ 0 ].use;
	const requestContext = await request.newContext( { baseURL } );
	const requestUtils = new RequestUtils( requestContext, {
		storageStatePath: storageState,
		baseURL,
	} );
	await requestUtils.setupRest();
	await requestContext.dispose();
};
