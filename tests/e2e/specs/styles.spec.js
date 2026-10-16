const { test, expect } = require( '../fixtures' );

const {
	activeTheme,
	block,
	cleanUp,
	createDraft,
	openPostWith,
	screenshot,
} = require( '../helpers' );

const STYLESHEET = '#theme-dev-test-styles-css';

// Values of theme.json, through the tokens of assets/styles.css.
const HIGHLIGHTED = {
	'background-color': 'rgb(30, 77, 140)',
	color: 'rgb(250, 250, 250)',
	'padding-top': '40px',
	'max-width': '640px',
};

/**
 * Expects the computed styles of the highlighted dev-test/styled block.
 *
 * @param {import('@playwright/test').Locator} styled
 */
async function expectHighlighted( styled ) {
	for ( const [ property, value ] of Object.entries( HIGHLIGHTED ) ) {
		await expect( styled ).toHaveCSS( property, value );
	}
}

/**
 * Content of the minified `@layer utilities{…}` block.
 *
 * @param {string} css
 * @return {string} Rules of the layer.
 */
function utilitiesLayer( css ) {
	const start =
		css.indexOf( '@layer utilities{' ) + '@layer utilities{'.length;
	let depth = 1;
	let end = start;
	while ( depth > 0 && end < css.length ) {
		depth += { '{': 1, '}': -1 }[ css[ end ] ] ?? 0;
		end++;
	}
	return css.slice( start, end - 1 );
}

/**
 * The theme's stylesheet assets/styles.css, compiled with Tailwind by the framework's
 * webpack helper and loaded on the front end and in the editor canvas.
 */
test.describe( 'Stylesheet', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await cleanUp( requestUtils );
	} );

	test( 'contains exactly the utilities of the templates and overrides', async ( {
		request,
	} ) => {
		const response = await request.get(
			'/wp-content/themes/theme-dev-test/build/styles.css'
		);
		expect( response.status() ).toBe( 200 );
		const css = await response.text();

		const classes = [
			...utilitiesLayer( css ).matchAll( /\.([a-z][\w-]*)\{/g ),
		].map( ( match ) => match[ 1 ] );
		expect( classes.sort() ).toEqual( [
			'absolute',
			'bg-primary',
			'border',
			'border-2',
			'border-current',
			'border-primary',
			'border-solid',
			'border-t',
			'border-t-4',
			'flex',
			'flex-col',
			'flex-wrap',
			'font-bold',
			'gap-2',
			'gap-3',
			'gap-4',
			'gap-6',
			'inline-block',
			'inline-flex',
			'inset-0',
			'isolate',
			// Only used in overrides/plugin-dev-test/.
			'italic',
			'items-center',
			'justify-center',
			'leading-relaxed',
			'leading-snug',
			'list-none',
			'm-0',
			'max-w-content',
			'me-2',
			'mx-auto',
			'no-underline',
			'object-cover',
			'overflow-hidden',
			'p-0',
			'p-section',
			'px-3',
			'px-4',
			'px-5',
			'px-6',
			'py-1',
			'py-2',
			'py-20',
			'py-3',
			'relative',
			'rounded',
			'rounded-full',
			'rounded-lg',
			'size-4',
			'size-full',
			'text-5xl',
			'text-base',
			'text-center',
			'text-contrast',
			'text-lead',
			'text-sm',
			'wrap-anywhere',
		] );
		expect( css ).toContain(
			'.bg-primary{background-color:var(--wp--preset--color--primary)}'
		);
	} );

	test( 'styles blocks on the front end with the values of theme.json', async ( {
		page,
		requestUtils,
	} ) => {
		const id = await createDraft(
			requestUtils,
			block( 'dev-test/styled', { text: 'Plain' } ) +
				block( 'dev-test/styled', {
					text: 'Bright',
					highlighted: true,
				} )
		);
		await page.goto( `/?p=${ id }&preview=true` );

		await expect( page.locator( STYLESHEET ) ).toHaveCount( 1 );
		const [ plain, highlighted ] = [
			page.locator( '.wp-block-dev-test-styled' ).nth( 0 ),
			page.locator( '.wp-block-dev-test-styled' ).nth( 1 ),
		];
		await expectHighlighted( highlighted );
		await expect( plain ).toHaveCSS( 'padding-top', '40px' );
		await expect( plain ).toHaveCSS(
			'background-color',
			'rgba(0, 0, 0, 0)'
		);
		await screenshot( page, 'styles-front-end' );
	} );

	test( 'styles blocks in the canvas of the post editor, not the editor itself', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await openPostWith(
			{ admin, editor, requestUtils },
			block( 'dev-test/styled', { text: 'Bright', highlighted: true } )
		);

		const styled = editor.canvas.locator( '[data-type="dev-test/styled"]' );
		await expect( styled ).toHaveText( 'Bright' );
		await expect( editor.canvas.locator( STYLESHEET ) ).toHaveCount( 1 );
		await expect( page.locator( STYLESHEET ) ).toHaveCount( 0 );
		await expectHighlighted( styled );

		// A changed attribute switches to the other complete class names.
		await editor.selectBlocks( styled );
		// Without content controls, the inspector shows the settings without tabs.
		await editor.openDocumentSettingsSidebar();
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'checkbox', { name: 'Highlighted' } )
			.uncheck();
		await expect( styled ).toHaveCSS(
			'background-color',
			'rgba(0, 0, 0, 0)'
		);
		await screenshot( styled, 'styles-post-editor' );
	} );

	test( 'styles blocks in the canvas of the site editor', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		// Template IDs name the active theme, a child theme if one is active.
		const { stylesheet } = await activeTheme( requestUtils );
		await admin.visitSiteEditor( {
			postId: `${ stylesheet }//index`,
			postType: 'wp_template',
			canvas: 'edit',
		} );
		await editor.insertBlock( {
			name: 'dev-test/styled',
			attributes: { text: 'Template', highlighted: true },
		} );

		const styled = editor.canvas.locator( '[data-type="dev-test/styled"]' );
		await expect( styled ).toHaveText( 'Template' );
		await expect( editor.canvas.locator( STYLESHEET ) ).toHaveCount( 1 );
		await expect( page.locator( STYLESHEET ) ).toHaveCount( 0 );
		await expectHighlighted( styled );
	} );
} );
