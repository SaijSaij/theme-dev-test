/**
 * Step 3: Twig templates of the theme rendered through the injected renderer.
 * The lookup chain (child, `@theme`, `@framework`, overrides) is covered by the
 * framework's PHPUnit tests: the framework ships no templates of its own.
 */
const { test, expect } = require( '../fixtures' );

const { restResponse } = require( '../helpers' );

const TWIG = '/dev-test/v1/twig';

test.describe( 'Twig', () => {
	test( 'renders a template with a partial, a template function and an HTML filter, all escaped', async ( {
		requestUtils,
	} ) => {
		const response = await restResponse( requestUtils, {
			path: TWIG,
			params: { name: '<script>x</script>' },
			as: 'anonymous',
		} );
		expect( response.status ).toBe( 200 );
		const { html, helperInstances } = response.body;
		expect( html ).toContain(
			'<p class="partial">&lt;script&gt;x&lt;/script&gt;</p>'
		);
		expect( html ).toContain(
			'<p class="greeting">Hello &lt;script&gt;x&lt;/script&gt;</p>'
		);
		// An HTML filter receives its input escaped (pre_escape) …
		expect( html ).toContain(
			'<p class="filter"><em>&lt;script&gt;x&lt;/script&gt;</em></p>'
		);
		// … unless it is already safe.
		expect( html ).toContain(
			'<p class="raw-filter"><em><b>safe</b></em></p>'
		);
		expect( helperInstances ).toBe( 1 );
	} );

	test( 'creates the helper service only when a template calls it', async ( {
		requestUtils,
	} ) => {
		const response = await restResponse( requestUtils, {
			path: `${ TWIG }/plain`,
			as: 'anonymous',
		} );
		expect( response.body ).toEqual( {
			html: '<p class="partial">World</p>\n',
			helperInstances: 0,
		} );
	} );

	test( 'reports an undefined variable as error (strict_variables)', async ( {
		requestUtils,
	} ) => {
		const response = await restResponse( requestUtils, {
			path: `${ TWIG }/undefined`,
			as: 'anonymous',
		} );
		expect( response.status ).toBe( 500 );
		const { body } = response;
		expect( body.code ).toBe( 'wp_app_framework_internal_error' );
		expect( body.data.exception ).toMatchObject( {
			class: 'Twig\\Error\\RuntimeError',
			message:
				'Variable "missing" does not exist in "Twig/Undefined.twig" at line 1.',
		} );
	} );

	test( 'compiles templates into the cache directory of the instance', async ( {
		requestUtils,
	} ) => {
		const response = await restResponse( requestUtils, {
			path: `${ TWIG }/cache`,
			as: 'anonymous',
		} );
		expect( response.status ).toBe( 200 );
		expect( response.body.directory ).toBe(
			'wp-content/cache/theme-dev-test/twig'
		);
		expect( response.body.compiled ).toBeGreaterThan( 0 );
	} );
} );
