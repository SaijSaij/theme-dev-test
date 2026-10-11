/**
 * Step 12: custom block supports (src/Support/) – attribute with default,
 * inspector controls, classes on the root element on the front end and in the
 * canvas, the replaced control and errors.
 */
const { test, expect } = require( '../fixtures' );

const {
	activeTheme,
	block,
	cleanUp,
	createDraft,
	openBlockSettings,
	openPostWith,
	RENDER_ROUTE,
	restResponse,
	screenshot,
	storedContent,
} = require( '../helpers' );

/**
 * Opens the given tab of the block inspector.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string}                          name "Styles" or "Settings".
 */
async function openInspectorTab( page, name ) {
	await page
		.getByRole( 'region', { name: 'Editor settings' } )
		.getByRole( 'tab', { name } )
		.click();
}

test.describe( 'Block supports', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await cleanUp( requestUtils );
	} );

	test( 'add attributes with defaults to the blocks that use them', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await openPostWith( { admin, editor, requestUtils }, '' );
		const attributes = await page.evaluate( () =>
			Object.fromEntries(
				[ 'dev-test/card', 'dev-test/hero', 'dev-test/styled' ].map(
					( name ) => [
						name,
						window.wp.blocks.getBlockType( name ).attributes,
					]
				)
			)
		);

		expect( attributes[ 'dev-test/card' ].surface ).toEqual( {
			type: 'string',
			enum: [ 'light', 'dark' ],
			default: 'dark',
		} );
		expect( attributes[ 'dev-test/card' ].framed ).toEqual( {
			type: 'boolean',
			default: false,
		} );
		expect( attributes[ 'dev-test/card' ] ).not.toHaveProperty( 'accent' );
		expect( attributes[ 'dev-test/hero' ].surface.default ).toBe( 'light' );
		expect( attributes[ 'dev-test/hero' ].accent ).toEqual( {
			type: [ 'string', 'null' ],
		} );
		expect( attributes[ 'dev-test/styled' ] ).not.toHaveProperty(
			'surface'
		);
	} );

	test( 'put their classes on the root element on the front end', async ( {
		page,
		requestUtils,
	} ) => {
		const id = await createDraft(
			requestUtils,
			[
				block( 'dev-test/card', { title: 'Default' } ),
				block( 'dev-test/card', {
					title: 'Set',
					surface: 'light',
					framed: true,
				} ),
				// An invalid value falls back to the default (WordPress validates before rendering).
				block( 'dev-test/card', {
					title: 'Invalid',
					surface: 'purple',
				} ),
				block( 'dev-test/hero', { topline: 'Teal', accent: 'teal' } ),
				block( 'dev-test/hero', {
					topline: 'Unknown',
					accent: 'lime',
				} ),
			].join( '\n\n' )
		);

		// The values are stored as block attributes only.
		const stored = await storedContent( requestUtils, id );
		expect(
			stored
				.replace( /<!-- \/?wp:[a-z-]+\/[a-z-]+( \{.*?\})? \/?-->/g, '' )
				.trim()
		).toBe( '' );

		await page.goto( `/?p=${ id }&preview=true` );
		const cards = page.locator( '.wp-block-dev-test-card' );
		await expect( cards ).toHaveCount( 3 );
		const classes = async ( locator ) =>
			( await locator.getAttribute( 'class' ) ).split( /\s+/ );

		expect( await classes( cards.nth( 0 ) ) ).toContain( 'surface-dark' );
		expect( await classes( cards.nth( 0 ) ) ).not.toContain( 'is-framed' );
		expect( await classes( cards.nth( 1 ) ) ).toEqual(
			expect.arrayContaining( [
				'surface-light',
				'is-framed',
				'has-frame',
			] )
		);
		expect( await classes( cards.nth( 2 ) ) ).toContain( 'surface-dark' );
		await expect( cards.nth( 0 ) ).toHaveCSS(
			'background-color',
			'rgb(30, 30, 30)'
		);
		await expect( cards.nth( 1 ) ).toHaveCSS( 'outline-style', 'solid' );

		const heroes = page.locator( '.wp-block-dev-test-hero' );
		expect( await classes( heroes.nth( 0 ) ) ).toEqual(
			expect.arrayContaining( [ 'surface-light', 'accent-teal' ] )
		);
		// The injected palette knows no "lime": no class.
		expect(
			( await classes( heroes.nth( 1 ) ) ).filter( ( name ) =>
				name.startsWith( 'accent-' )
			)
		).toEqual( [] );
		await screenshot( cards.nth( 1 ), 'supports-front' );
	} );

	test( 'are edited in the inspector and update the canvas', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const id = await openPostWith(
			{ admin, editor, requestUtils },
			[
				block( 'dev-test/card', { title: 'Card' } ),
				block( 'dev-test/hero', { topline: 'Hero' } ),
			].join( '\n\n' )
		);
		const card = editor.canvas.locator( '[data-type="dev-test/card"]' );
		await expect( card ).toHaveClass( /surface-dark/ );

		// Enum support in the Styles tab.
		await card.locator( '.card__title' ).click();
		await editor.openDocumentSettingsSidebar();
		await openInspectorTab( page, 'Styles' );
		const surface = page.getByRole( 'combobox', { name: 'Surface' } );
		await expect( surface.locator( 'option' ) ).toHaveText( [
			'Light surface',
			'Dark surface',
		] );
		await surface.selectOption( 'light' );
		await expect( card ).toHaveClass( /surface-light/ );
		await expect( card ).not.toHaveClass( /surface-dark/ );

		// Boolean support in the Settings panel.
		await openBlockSettings( page, editor );
		await page.getByRole( 'checkbox', { name: 'Framed' } ).check();
		await expect( card ).toHaveClass( /is-framed/ );
		await screenshot( card, 'supports-canvas' );

		// The control replaced by Accent.editor.js (registerSupportControl).
		const hero = editor.canvas.locator( '[data-type="dev-test/hero"]' );
		await hero.locator( '.hero__topline' ).click();
		await openInspectorTab( page, 'Styles' );
		await expect(
			page.locator( '.dev-test-accent-control' )
		).toBeVisible();
		await expect(
			page.getByRole( 'textbox', { name: 'Accent' } )
		).toHaveCount( 0 );
		await page.getByRole( 'radio', { name: 'Coral' } ).check();
		await expect( hero ).toHaveClass( /accent-coral/ );

		await editor.saveDraft();
		const stored = await storedContent( requestUtils, id );
		expect( stored ).toContain(
			'<!-- wp:dev-test/card {"title":"Card","surface":"light","framed":true} /-->'
		);
		expect( stored ).toContain(
			'<!-- wp:dev-test/hero {"topline":"Hero","accent":"coral"} /-->'
		);
	} );

	for ( const [ where, group ] of [
		[ 'in contentOnly mode', '{"templateLock":"contentOnly"}' ],
		// A block with metadata.patternName is a section in WordPress 7.
		[
			'in a pattern section',
			'{"metadata":{"patternName":"dev-test/e2e"}}',
		],
	] ) {
		test( `offer no controls ${ where }`, async ( {
			admin,
			editor,
			page,
			requestUtils,
		} ) => {
			await openPostWith(
				{ admin, editor, requestUtils },
				`<!-- wp:group ${ group } -->\n<div class="wp-block-group">` +
					block( 'dev-test/card', {
						title: 'Locked',
						framed: true,
					} ) +
					'</div>\n<!-- /wp:group -->'
			);
			const card = editor.canvas.locator( '[data-type="dev-test/card"]' );
			await expect( card ).toHaveClass( /is-framed/ );
			await card.locator( '.card__title' ).click();
			await editor.openDocumentSettingsSidebar();

			await expect(
				page.locator( '.wp-app-framework-controls' )
			).toHaveCount( 1 );
			await expect(
				page.getByRole( 'combobox', { name: 'Surface' } )
			).toHaveCount( 0 );
			await expect(
				page.getByRole( 'checkbox', { name: 'Framed' } )
			).toHaveCount( 0 );
		} );
	}

	test( 'put their classes on the root element in the site editor', async ( {
		admin,
		editor,
		requestUtils,
	} ) => {
		const { stylesheet } = await activeTheme( requestUtils );
		await admin.visitSiteEditor( {
			postId: `${ stylesheet }//index`,
			postType: 'wp_template',
			canvas: 'edit',
		} );
		await editor.insertBlock( {
			name: 'dev-test/card',
			attributes: { title: 'Template', surface: 'light', framed: true },
		} );

		const card = editor.canvas.locator( '[data-type="dev-test/card"]' );
		await expect( card ).toHaveClass( /surface-light/ );
		await expect( card ).toHaveClass( /is-framed/ );
		await expect( card ).toHaveCSS(
			'background-color',
			'rgb(250, 250, 250)'
		);
	} );

	test( 'fail for a block without block_wrapper_attributes()', async ( {
		requestUtils,
	} ) => {
		const response = await restResponse( requestUtils, {
			path: RENDER_ROUTE,
			method: 'POST',
			data: {
				blocks: [
					{
						name: 'dev-test/support-unwrapped',
						attributes: { framed: true },
					},
					{ name: 'dev-test/card', attributes: { framed: true } },
				],
			},
		} );

		expect( response.status ).toBe( 200 );
		const [ unwrapped, card ] = response.body.results;
		expect( unwrapped.error ).toMatchObject( {
			code: 'wp_app_framework_render_failed',
			message:
				'Block dev-test/support-unwrapped uses block supports (#[UseSupport]), but did not print its root element with block_wrapper_attributes(), so the class names of the supports are missing.',
		} );
		expect( card.html ).toMatch( /class="[^"]*\bis-framed\b/ );
	} );
} );
