/**
 * Step 7: the theme as consumer of the test plugin
 * (https://github.com/saijsaij/plugin-dev-test) – its public API, its public
 * template functions and filters, and overrides of its templates. The
 * expectations depend on whether the plugin is active: in the pool tdt-full and
 * in the release test with both ZIPs it is, in the pool tdt-bare and the
 * release test of the theme alone it is not. An active child theme overrides plugin templates before the theme.
 */
const { test, expect } = require( '../fixtures' );

const { activeTheme, pluginActive, restResponse } = require( '../helpers' );

async function get( requestUtils, path ) {
	return restResponse( requestUtils, { path, as: 'anonymous' } );
}

test.describe( 'Test plugin', () => {
	test( 'provides its public API, or null without the plugin', async ( {
		requestUtils,
	} ) => {
		const response = await get( requestUtils, '/dev-test/v1/plugin/api' );

		expect( response.status ).toBe( 200 );
		expect( response.body ).toEqual(
			( await pluginActive( requestUtils ) )
				? [
						{ title: 'First note', tone: 'info' },
						{ title: 'Second note', tone: 'warning' },
					]
				: null
		);
	} );

	test( 'offers its template functions and filters to the theme templates', async ( {
		requestUtils,
	} ) => {
		const response = await get(
			requestUtils,
			'/dev-test/v1/plugin/templates'
		);
		expect( response.status ).toBe( 200 );
		const html = response.body.replace( /\s*\n\s*/g, '' );

		if ( ! ( await pluginActive( requestUtils ) ) ) {
			expect( html ).toBe(
				'<p class="none">plugin-dev-test is not active</p>'
			);
			return;
		}
		// Twig/Partial.twig of the theme and of the plugin in the same request stay separate;
		// the HTML filter receives the escaped value.
		expect( html ).toBe(
			[
				'<p class="count">2</p>',
				'<p class="partial">theme</p>',
				'<p class="partial partial--plugin">plugin</p>',
				'<p class="highlight"><mark class="plugin-dev-test">Tom &amp; Jerry</mark></p>',
			].join( '' )
		);
	} );

	test( 'templates are overridden by overrides/plugin-dev-test/ of the theme', async ( {
		requestUtils,
	} ) => {
		const overridable = await get(
			requestUtils,
			'/plugin-dev-test/v1/twig/overridable'
		);
		const exact = await get(
			requestUtils,
			'/plugin-dev-test/v1/twig/overridable-exact'
		);

		if ( ! ( await pluginActive( requestUtils ) ) ) {
			expect( overridable.status ).toBe( 404 );
			return;
		}
		expect( overridable.status ).toBe( 200 );
		// An active child theme overrides the template before the theme; the child theme's tests check that.
		if ( ! ( await activeTheme( requestUtils ) ).isChild ) {
			expect( overridable.body ).toBe(
				'<p class="overridable italic">overridden by theme-dev-test</p>\n'
			);
		}
		// @plugin addresses the plugin's own template.
		expect( exact ).toEqual(
			expect.objectContaining( {
				status: 200,
				body: '<p class="overridable">from plugin-dev-test</p>\n',
			} )
		);
	} );
} );
