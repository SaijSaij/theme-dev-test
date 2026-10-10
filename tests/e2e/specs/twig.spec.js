/**
 * Step 3: Twig templates of the theme rendered through the injected renderer.
 * The lookup chain (child, `@theme`, `@framework`, overrides) is covered by the
 * framework's PHPUnit tests: the framework ships no templates of its own.
 */
const { test, expect } = require( '../fixtures' );

const {
	activeTheme,
	IS_RELEASE,
	restResponse,
	VENDOR_PREFIX,
} = require( '../helpers' );

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
			class: `${ VENDOR_PREFIX }Twig\\Error\\RuntimeError`,
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
		// Development mode: Twig's hash directories (auto reload). Release mode: one directory
		// named after the template version of the release, as templates are never recompiled.
		expect( response.body.subdirectories ).toEqual(
			IS_RELEASE
				? [ expect.stringMatching( /^[0-9a-f]{16}$/ ) ]
				: expect.arrayContaining( [
						expect.stringMatching( /^[0-9a-f]{2}$/ ),
					] )
		);
	} );

	test( 'renders the theme template unless a child theme overrides it', async ( {
		requestUtils,
	} ) => {
		const template = await restResponse( requestUtils, {
			path: `${ TWIG }/child-overridable`,
			as: 'anonymous',
		} );
		const exact = await restResponse( requestUtils, {
			path: `${ TWIG }/child-overridable-exact`,
			as: 'anonymous',
		} );

		// @theme addresses the theme's own template, also with a child theme.
		expect( exact.status ).toBe( 200 );
		expect( exact.body ).toBe(
			'<p class="overridable">from theme-dev-test</p>\n'
		);
		expect( template.status ).toBe( 200 );
		// A child theme may override it in overrides/theme-dev-test/; the child theme's tests check that.
		if ( ! ( await activeTheme( requestUtils ) ).isChild ) {
			expect( template.body ).toBe(
				'<p class="overridable">from theme-dev-test</p>\n'
			);
		}
	} );
} );
