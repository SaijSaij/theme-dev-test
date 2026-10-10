/**
 * Step 5: the generated inspector controls, the JS extension points and the
 * development warnings of the editor runtime.
 */
const { test, expect } = require( '../fixtures' );

const {
	block,
	cleanUp,
	openBlockSettings,
	openPostWith,
	storedContent,
	trackRenderRequests,
} = require( '../helpers' );

test.describe( 'Inspector controls', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await cleanUp( requestUtils );
	} );

	test( 'generates a control per value type', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const renders = trackRenderRequests( page );
		const id = await openPostWith(
			{ admin, editor, requestUtils },
			block( 'dev-test/check', { text: 'Check' } )
		);
		const check = editor.canvas.locator( '[data-type="dev-test/check"]' );
		await check.locator( '.check__text' ).click();

		// Content group: the URL of the link and of the nested value class; inline fields have no control.
		await editor.openDocumentSettingsSidebar();
		const sidebar = page.getByRole( 'region', { name: 'Editor settings' } );
		await expect(
			sidebar.getByRole( 'textbox', { name: 'Link' } )
		).toHaveAttribute( 'type', 'url' );
		await expect(
			sidebar.getByRole( 'textbox', { name: 'Source' } )
		).toHaveAttribute( 'type', 'url' );
		await expect(
			sidebar.getByRole( 'textbox', { name: 'Caption' } )
		).toHaveCount( 0 );

		// Settings group.
		await openBlockSettings( page, editor );
		await expect(
			sidebar.getByRole( 'spinbutton', { name: 'Amount' } )
		).toBeVisible();
		await expect(
			sidebar.getByRole( 'textbox', { name: 'Note' } )
		).toBeVisible();
		await expect(
			sidebar
				.getByRole( 'combobox', { name: 'Variant' } )
				.locator( 'option' )
		).toHaveText( [ 'Light theme', 'Dark theme' ] );
		// #[Hidden]
		await expect( sidebar.getByText( 'Secret' ) ).toHaveCount( 0 );
		// registerControl() of Check.editor.js replaces the generated number control.
		await expect(
			sidebar.getByRole( 'spinbutton', {
				name: 'Ratio (custom control)',
			} )
		).toBeVisible();
		await expect(
			sidebar.getByRole( 'spinbutton', { name: 'Ratio', exact: true } )
		).toHaveCount( 0 );

		const rendered = renders.length;
		await sidebar.getByRole( 'checkbox', { name: 'Flag' } ).check();
		await sidebar
			.getByRole( 'combobox', { name: 'Variant' } )
			.selectOption( { label: 'Dark theme' } );
		await sidebar
			.getByRole( 'spinbutton', { name: 'Ratio (custom control)' } )
			.fill( '1.5' );
		await sidebar.getByRole( 'textbox', { name: 'Note' } ).fill( 'Hi' );
		await expect( check.locator( '.check__values' ) ).toHaveText(
			'on 1.5 Hi hidden'
		);
		await expect( check ).toContainClass( 'check--dark' );
		// Inspector changes re-render the block.
		expect( renders.length ).toBeGreaterThan( rendered );

		await editor.saveDraft();
		const attributes = JSON.parse(
			( await storedContent( requestUtils, id ) ).match(
				/^<!-- wp:dev-test\/check (\{.*\}) \/-->$/
			)[ 1 ]
		);
		expect( attributes ).toMatchObject( {
			flag: true,
			variant: 'dark',
			ratio: 1.5,
			note: 'Hi',
		} );
	} );

	test( 'warns about unknown names in the extension points', async ( {
		admin,
		editor,
		expectConsole,
		page,
		requestUtils,
	} ) => {
		expectConsole.push(
			{
				type: 'warning',
				text: 'wp-app-framework: registerPanel( "dev-test/unknown" ): no block of this theme has that name.',
			},
			{
				type: 'warning',
				text: 'wp-app-framework: registerControl( "dev-test/check", "unknown" ): the block has no attribute with that name.',
			}
		);
		await openPostWith( { admin, editor, requestUtils }, '' );
		await page.evaluate( () => {
			const instance = window.wpAppFramework[ 'theme-dev-test' ];
			instance.registerPanel( 'dev-test/unknown', () => null );
			instance.registerControl( 'dev-test/check', 'unknown', () => null );
		} );
	} );

	test( 'warns in development mode about inline fields without field()', async ( {
		admin,
		editor,
		expectConsole,
		requestUtils,
	} ) => {
		expectConsole.push( {
			type: 'warning',
			text: 'wp-app-framework: dev-test/unmarked renders no element with field( "title" ) in the editor, so it cannot be edited inline.',
		} );
		await openPostWith( { admin, editor, requestUtils }, '' );
		await editor.insertBlock( {
			name: 'dev-test/unmarked',
			attributes: { title: 'Plain' },
		} );
		// The render request blanks inline values and nothing puts the value back without field().
		await expect(
			editor.canvas.locator( '[data-type="dev-test/unmarked"]' )
		).toHaveText( '' );
	} );

	test( 'allows inserting into containers with contentRole in contentOnly mode', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await openPostWith(
			{ admin, editor, requestUtils },
			'<!-- wp:group {"templateLock":"contentOnly"} -->\n<div class="wp-block-group">' +
				block( 'dev-test/section', {}, block( 'dev-test/hero' ) ) +
				block( 'dev-test/container', {}, block( 'dev-test/hero' ) ) +
				'</div>\n<!-- /wp:group -->'
		);
		await expect(
			editor.canvas.locator( '[data-type="dev-test/hero"]' )
		).toHaveCount( 2 );

		const allowed = await page.evaluate( () => {
			const store = window.wp.data.select( 'core/block-editor' );
			const [ group ] = store.getBlocks();
			const [ section, container ] = group.innerBlocks;
			return {
				section: store.canInsertBlockType(
					'dev-test/hero',
					section.clientId
				),
				container: store.canInsertBlockType(
					'dev-test/hero',
					container.clientId
				),
			};
		} );
		// Both containers lack content attributes; only dev-test/section has #[Supports(contentRole: true)].
		// (A block with content attributes is a content block anyway, see isContentBlock() of @wordpress/blocks.)
		expect( allowed ).toEqual( { section: true, container: false } );
	} );
} );
