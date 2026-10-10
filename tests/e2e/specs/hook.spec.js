/**
 * Step 1: #[Hook] with injected services and WordPress arguments.
 */
const { test, expect } = require( '../fixtures' );

const { restResponse } = require( '../helpers' );

test.describe( 'Hooks', () => {
	test( 'runs an action with a constructor-injected service', async ( {
		page,
	} ) => {
		const response = await page.request.get( '/' );
		expect( response.status() ).toBe( 200 );
		expect( await response.text() ).toContain(
			'<meta name="dev-test-hook" content="Hello from a service">'
		);
	} );

	test( 'runs a filter with an injected service between WordPress arguments', async ( {
		requestUtils,
	} ) => {
		const response = await restResponse( requestUtils, {
			path: '/dev-test/v1/hook/filter',
			params: { value: 'x' },
			as: 'anonymous',
		} );
		// Marker is #[NoService] and arrives as WordPress argument; the missing third argument uses its default.
		expect( response ).toEqual(
			expect.objectContaining( {
				status: 200,
				body: 'Hello from a service: x (marker, 1)',
			} )
		);
	} );

	test( 'fires the init hook of the framework once per request', async ( {
		requestUtils,
	} ) => {
		const response = await restResponse( requestUtils, {
			path: '/dev-test/v1/hook/init',
			as: 'anonymous',
		} );
		expect( response ).toEqual(
			expect.objectContaining( { status: 200, body: 1 } )
		);
	} );
} );
