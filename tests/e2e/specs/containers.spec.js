const { test, expect } = require( '../fixtures' );

const {
	block,
	cleanUp,
	createPost,
	openPostWith,
	trackRenderRequests,
} = require( '../helpers' );

/**
 * The block API for containers: custom categories, inserter previews,
 * variations, #[InnerBlocks] (template, lock, orientation, prioritized
 * blocks, appender), parent and typed block context (#[ProvidesContext],
 * #[Context]) in the editor and on the front end, and the CoreBlock enum.
 */
test.describe( 'Container blocks', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await cleanUp( requestUtils );
	} );

	test( 'custom categories, previews and variations in the inserter', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await openPostWith( { admin, editor, requestUtils }, '' );

		// Registered before the categories of WordPress, slug from the namespace, label and icon from the enum.
		const categories = await page.evaluate( () =>
			window.wp.blocks
				.getCategories()
				.slice( 0, 3 )
				.map( ( { slug, title, icon } ) => ( {
					slug,
					title,
					icon: icon ?? null,
				} ) )
		);
		expect( categories ).toEqual( [
			{
				slug: 'dev-test-sections',
				title: 'Dev test sections',
				icon: 'layout',
			},
			{
				slug: 'dev-test-components',
				title: 'Dev test components',
				icon: null,
			},
			{ slug: 'text', title: 'Text', icon: null },
		] );

		await page
			.getByRole( 'button', { name: 'Block Inserter', exact: true } )
			.click();
		const inserter = page.locator( '.block-editor-inserter__block-list' );
		const firstPanel = inserter
			.locator( '.block-editor-inserter__panel-header' )
			.first();
		await expect( firstPanel ).toHaveText( 'Dev test sections' );
		await expect( firstPanel.locator( '.dashicons-layout' ) ).toBeVisible();

		// Items by their class: the accessible name of an item with a dashicon includes more than its title.
		const item = ( name ) =>
			inserter.locator( `.editor-block-list-item-${ name }` );
		// A tab can only be inserted into tabs (parent), so the inserter does not offer it here.
		await expect( item( 'dev-test-tabs' ) ).toBeVisible();
		await expect( item( 'dev-test-tab' ) ).toHaveCount( 0 );
		// Variations with an inserter scope are items of their own.
		await expect(
			inserter.getByRole( 'option', { name: 'Three tabs' } )
		).toBeVisible();
		await expect(
			inserter.getByRole( 'option', { name: 'Dark tabs' } )
		).toBeVisible();

		const preview = page.locator( '.block-editor-inserter__preview' );
		// #[Example]: rendered through the render route with its tab.
		await item( 'dev-test-tabs' ).hover();
		await expect(
			preview.locator( 'iframe' ).contentFrame().locator( '.tab__title' )
		).toHaveText( 'Example tab' );
		// Automatic example: the default attributes.
		await item( 'dev-test-section' ).hover();
		await expect(
			preview.locator( '.block-editor-inserter__preview-content' )
		).toBeVisible();
		// #[Example(false)]
		await item( 'dev-test-stack' ).hover();
		await expect( preview ).toContainText( 'No preview available.' );
	} );

	test( 'tabs start with their template, keep it and pass their values to the tabs', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await openPostWith( { admin, editor, requestUtils }, '' );
		const renders = trackRenderRequests( page );
		await editor.insertBlock( { name: 'dev-test/tabs' } );

		// The template of #[InnerBlocks], applied once the inner blocks of the tabs mount.
		await expect
			.poll( async () =>
				( await editor.getBlocks() )[ 0 ].innerBlocks.map(
					( inner ) => [ inner.name, inner.attributes.title ]
				)
			)
			.toEqual( [
				[ 'dev-test/tab', 'Tab 1' ],
				[ 'dev-test/tab', 'Tab 2' ],
			] );

		const tabs = editor.canvas.locator( '[data-type="dev-test/tabs"]' );
		const tab = editor.canvas.locator( '[data-type="dev-test/tab"]' );
		// Default values of the tabs, passed as context.
		await expect( tab.locator( '.tab__context' ) ).toHaveText( [
			'Light / 1',
			'Light / 1',
		] );
		const request = renders
			.map( ( item ) => JSON.parse( item.postData() ).blocks )
			.flat()
			.find( ( entry ) => entry.name === 'dev-test/tab' );
		expect( request.context ).toEqual( {
			'dev-test/tabs/tone': 'light',
			'dev-test/tabs/active': 1,
		} );

		// templateLock insert: no appender.
		await expect( tabs.locator( '.block-list-appender' ) ).toHaveCount( 0 );

		// Horizontal orientation: the movers point left and right.
		await editor.selectBlocks( tab.first() );
		const toolbar = page.getByRole( 'toolbar', { name: 'Block tools' } );
		await expect(
			toolbar.getByRole( 'button', { name: 'Move right' } )
		).toBeVisible();

		// Changing the tabs renders the tabs inside again with the new values.
		await editor.selectBlocks( tabs );
		// The tabs have no style controls, so the inspector shows its settings without tabs.
		await editor.openDocumentSettingsSidebar();
		const sidebar = page.getByRole( 'region', { name: 'Editor settings' } );
		await sidebar
			.getByRole( 'combobox', { name: 'Tone' } )
			.selectOption( { label: 'Dark' } );
		await sidebar
			.getByRole( 'spinbutton', { name: 'Active tab' } )
			.fill( '2' );
		await expect( tab.locator( '.tab__context' ) ).toHaveText( [
			'Dark / 2',
			'Dark / 2',
		] );

		// isActive of the variation "Dark tabs": the block card shows its title.
		await expect(
			page.locator( '.block-editor-block-card__title' )
		).toContainText( 'Dark tabs' );
	} );

	test( 'a variation inserts its inner blocks', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await openPostWith( { admin, editor, requestUtils }, '' );
		await page
			.getByRole( 'button', { name: 'Block Inserter', exact: true } )
			.click();
		await page
			.locator( '.block-editor-inserter__block-list' )
			.getByRole( 'option', { name: 'Three tabs' } )
			.click();

		await expect(
			editor.canvas.locator( '[data-type="dev-test/tab"] .tab__title' )
		).toHaveText( [ 'First', 'Second', 'Third' ] );
	} );

	test( 'a container offers prioritized blocks first and appends with a button', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await openPostWith( { admin, editor, requestUtils }, '' );
		await editor.insertBlock( { name: 'dev-test/stack' } );

		const appender = editor.canvas.locator(
			'[data-type="dev-test/stack"] .block-editor-button-block-appender'
		);
		await expect( appender ).toBeVisible();
		await appender.click();
		const items = page
			.locator( '.block-editor-inserter__quick-inserter' )
			.locator( '.block-editor-block-types-list__item-title' );
		await expect( items.nth( 0 ) ).toHaveText( 'Heading' );
		await expect( items.nth( 1 ) ).toHaveText( 'Hero' );
	} );

	test( 'tabs pass their values on the front end; without tabs the defaults apply', async ( {
		page,
		requestUtils,
	} ) => {
		const id = await createPost( requestUtils, {
			title: 'E2E tabs',
			status: 'publish',
			content: [
				block(
					'dev-test/tabs',
					{ tone: 'dark', active: 2 },
					block( 'dev-test/tab', { title: 'Inside' } )
				),
				block( 'dev-test/tab', { title: 'Outside' } ),
			].join( '\n\n' ),
		} );
		await page.goto( `/?p=${ id }` );

		await expect(
			page.locator( '.tabs .tab' ).locator( '.tab__context' )
		).toHaveText( 'Dark / 2' );
		await expect( page.locator( '.tabs .tab' ) ).toHaveAttribute(
			'data-tone',
			'dark'
		);
		const outside = page.locator( '.tab' ).filter( { hasText: 'Outside' } );
		await expect( outside.locator( '.tab__context' ) ).toHaveText(
			'No tabs / 0'
		);
	} );

	test( 'CoreBlock lists exactly the core blocks of this WordPress version', async ( {
		requestUtils,
	} ) => {
		const { enum: cases, registered } = await requestUtils.rest( {
			path: '/dev-test/v1/core-blocks',
		} );

		expect( cases ).toEqual( registered );
	} );
} );
