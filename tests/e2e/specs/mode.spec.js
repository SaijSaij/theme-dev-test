/**
 * Step 6: development mode with the checkout, release mode with the release ZIP
 * (E2E_TARGET=release, an instance of wp-test-env in release mode).
 */
const { test, expect } = require( '../fixtures' );

const { IS_RELEASE, restResponse, VENDOR_PREFIX } = require( '../helpers' );

test.describe( 'Mode', () => {
	test(
		IS_RELEASE
			? 'runs from the built manifest with prefixed dependencies'
			: 'runs from the source checkout in development mode',
		async ( { requestUtils } ) => {
			const response = await restResponse( requestUtils, {
				path: '/dev-test/v1/mode',
				as: 'anonymous',
			} );
			expect( response.status ).toBe( 200 );
			// A release loads generated/manifest.php and never builds the development cache;
			// the theme's references to the framework and Twig point to the prefixed classes.
			expect( response.body ).toEqual( {
				release: IS_RELEASE,
				devCache: ! IS_RELEASE,
				slug: 'theme-dev-test',
				frameworkClass: `${ VENDOR_PREFIX }Saij\\WpAppFramework\\Theme`,
				twigClass: `${ VENDOR_PREFIX }Twig\\Environment`,
			} );
		}
	);
} );
