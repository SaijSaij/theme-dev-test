const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const path = require( 'path' );

const { block, blockCount, deletePostsOfTests, openBlockSettings, openPostWith, RENDER_ROUTE, screenshot, storedContent, trackRenderRequests } = require( '../helpers' );

const IMAGE = path.join( __dirname, '../assets/image.png' );

test.describe( 'Editor runtime', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await deletePostsOfTests( requestUtils );
	} );

	test( 'edits inline fields in the canvas and stores only block comments', async ( { admin, editor, page, requestUtils } ) => {
		const renders = trackRenderRequests( page );
		const id = await openPostWith( { admin, editor, requestUtils }, block( 'sections/hero', { buttons: [ { label: 'Go', url: 'https://example.test/' } ] } ) );

		const hero = editor.canvas.locator( '[data-type="sections/hero"]' );
		const topline = hero.locator( '.hero__topline' );
		await expect( topline ).toHaveAttribute( 'contenteditable', 'true' );
		await expect.poll( () => renders.length ).toBe( 1 );

		await topline.click();
		await page.keyboard.type( 'Tom & <b>Jerry</b>' );

		const headline = hero.locator( '.hero__headline' );
		await headline.click();
		await page.keyboard.type( 'Hello ' );
		await page.keyboard.press( 'ControlOrMeta+b' );
		await page.keyboard.type( 'bold' );
		await page.keyboard.press( 'ControlOrMeta+b' );
		// #[RichText(allowedFormats: bold, italic)]: no link in the toolbar.
		await editor.showBlockToolbar();
		await expect( page.getByRole( 'toolbar', { name: 'Block tools' } ).getByRole( 'button', { name: 'Bold' } ) ).toBeVisible();
		await expect( page.getByRole( 'toolbar', { name: 'Block tools' } ).getByRole( 'button', { name: 'Link' } ) ).toHaveCount( 0 );

		const button = hero.locator( '.hero__button' );
		await button.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' now' );

		// Inline typing never re-renders.
		await page.waitForTimeout( 1000 );
		expect( renders ).toHaveLength( 1 );
		await screenshot( hero, 'hero-editor' );

		await editor.saveDraft();
		const content = await storedContent( requestUtils, id );
		expect( content ).toMatch( /^<!-- wp:sections\/hero \{.*\} \/-->$/ );
		const attributes = JSON.parse( content.match( /^<!-- wp:sections\/hero (\{.*\}) \/-->$/ )[ 1 ] );
		expect( attributes.topline ).toBe( 'Tom & <b>Jerry</b>' );
		expect( attributes.headline ).toBe( 'Hello <strong>bold</strong>' );
		expect( attributes.buttons ).toEqual( [ { label: 'Go now', url: 'https://example.test/' } ] );

		await page.goto( `/?p=${ id }&preview=true` );
		const front = page.locator( '.wp-block-sections-hero' );
		await expect( front.locator( '.hero__topline' ) ).toHaveText( 'Tom & <b>Jerry</b>' );
		await expect( front.locator( '.hero__headline strong' ) ).toHaveText( 'bold' );
		await expect( front.locator( '[data-field], [data-inner-blocks]' ) ).toHaveCount( 0 );
		await screenshot( front, 'hero-front' );
	} );

	test( 'refetches on non-inline changes only and reuses cached markup', async ( { admin, editor, page, pageUtils, requestUtils } ) => {
		const renders = trackRenderRequests( page );
		await openPostWith( { admin, editor, requestUtils }, block( 'sections/hero', { topline: 'Cached' } ) );
		const hero = editor.canvas.locator( '[data-type="sections/hero"]' );
		await expect( hero ).toHaveClass( /hero--black/ );
		await expect.poll( () => renders.length ).toBe( 1 );

		await hero.locator( '.hero__topline' ).click();
		await openBlockSettings( page, editor );
		await page.getByRole( 'combobox', { name: 'Gradient' } ).selectOption( 'blue' );
		await expect( hero ).toHaveClass( /hero--blue/ );
		await expect.poll( () => renders.length ).toBe( 2 );

		await pageUtils.pressKeys( 'primary+z' );
		await expect( hero ).toHaveClass( /hero--black/ );
		await pageUtils.pressKeys( 'primaryShift+z' );
		await expect( hero ).toHaveClass( /hero--blue/ );

		await hero.locator( '.hero__topline' ).click();
		await pageUtils.pressKeys( 'primaryShift+d' );
		await expect( editor.canvas.locator( '[data-type="sections/hero"]' ) ).toHaveCount( 2 );
		await expect( editor.canvas.locator( '[data-type="sections/hero"]' ).nth( 1 ) ).toHaveClass( /hero--blue/ );

		// Undo, redo and the duplicate came from the cache.
		await page.waitForTimeout( 1000 );
		expect( renders ).toHaveLength( 2 );
	} );

	test( 'renders all blocks of the post in one request when the editor loads', async ( { admin, editor, page, requestUtils } ) => {
		const renders = trackRenderRequests( page );
		await openPostWith(
			{ admin, editor, requestUtils },
			[
				block( 'sections/hero', { topline: 'One' } ),
				block( 'sections/hero', { gradient: 'blue' } ),
				block( 'sections/hero', { buttons: [ { label: 'A', url: '' } ] } ),
				block( 'sections/section', {}, block( 'sections/hero', { topline: 'Inner', gradient: 'blue', buttons: [ { label: 'B', url: 'https://example.test/' } ] } ) ),
			].join( '\n\n' )
		);
		await expect( editor.canvas.locator( '[data-type="sections/hero"] .hero__topline[contenteditable="true"]' ) ).toHaveCount( 4 );

		await page.waitForTimeout( 1000 );
		expect( renders ).toHaveLength( 1 );
		// The section and its inner hero (prefetched) are in the same request.
		expect( blockCount( renders[ 0 ] ) ).toBe( 5 );
	} );

	test( 'keeps the old markup without layout shift while new markup loads', async ( { admin, editor, page, requestUtils } ) => {
		await openPostWith( { admin, editor, requestUtils }, block( 'sections/hero', { topline: 'Steady' } ) );
		const hero = editor.canvas.locator( '[data-type="sections/hero"]' );
		await expect( hero.locator( '.hero__topline' ) ).toHaveAttribute( 'contenteditable', 'true' );
		const before = await hero.boundingBox();

		let release;
		const released = new Promise( ( resolve ) => ( release = resolve ) );
		await page.route( '**/*', async ( route ) => {
			if ( decodeURIComponent( route.request().url() ).includes( RENDER_ROUTE ) ) {
				await released;
			}
			await route.continue();
		} );

		await hero.locator( '.hero__topline' ).click();
		await openBlockSettings( page, editor );
		await page.getByRole( 'combobox', { name: 'Gradient' } ).selectOption( 'blue' );

		await expect( hero ).toHaveAttribute( 'aria-busy', 'true' );
		await expect( hero ).toHaveClass( /hero--black/ );
		await expect( hero.locator( '.hero__topline' ) ).toHaveText( 'Steady' );
		expect( await hero.boundingBox() ).toEqual( before );
		await screenshot( hero, 'hero-loading' );

		release();
		await expect( hero ).toHaveClass( /hero--blue/ );
		await expect( hero ).not.toHaveAttribute( 'aria-busy', 'true' );
		await page.unroute( '**/*' );
	} );

	test( 'selects, replaces and resets the image in the canvas', async ( { admin, editor, page, requestUtils } ) => {
		const renders = trackRenderRequests( page );
		await openPostWith( { admin, editor, requestUtils }, block( 'sections/hero' ) );
		const hero = editor.canvas.locator( '[data-type="sections/hero"]' );
		const figure = hero.locator( '.hero__image' );
		await expect( figure.getByRole( 'button', { name: 'Upload' } ) ).toBeVisible();

		await figure.locator( 'input[type="file"]' ).setInputFiles( IMAGE );
		await expect( figure.locator( 'img' ) ).toBeVisible();
		await expect.poll( () => renders.length ).toBe( 2 );
		const id = await page.evaluate( () => window.wp.data.select( 'core/block-editor' ).getBlocks()[ 0 ].attributes.imageId );
		expect( Number.isInteger( id ) ).toBe( true );
		await screenshot( hero, 'hero-image' );

		await editor.selectBlocks( hero );
		await editor.showBlockToolbar();
		await page.getByRole( 'toolbar', { name: 'Block tools' } ).getByRole( 'button', { name: 'Image' } ).click();
		await page.getByRole( 'menuitem', { name: 'Reset' } ).click();
		await expect( figure.getByRole( 'button', { name: 'Upload' } ) ).toBeVisible();

		await requestUtils.deleteMedia( id );
	} );

	test( 'section accepts only the allowed blocks and stores no HTML', async ( { admin, editor, page, requestUtils } ) => {
		const id = await openPostWith( { admin, editor, requestUtils }, block( 'sections/section', {}, block( 'sections/hero', { topline: 'Inside' } ) ) );
		const section = editor.canvas.locator( '[data-type="sections/section"]' );
		await expect( section.locator( '[data-type="sections/hero"] .hero__topline' ) ).toHaveText( 'Inside' );

		const allowed = await page.evaluate( () => {
			const editorStore = window.wp.data.select( 'core/block-editor' );
			const [ sectionBlock ] = editorStore.getBlocks();
			return {
				hero: editorStore.canInsertBlockType( 'sections/hero', sectionBlock.clientId ),
				paragraph: editorStore.canInsertBlockType( 'core/paragraph', sectionBlock.clientId ),
			};
		} );
		expect( allowed ).toEqual( { hero: true, paragraph: false } );

		await section.locator( '.hero__topline' ).click();
		await page.keyboard.type( ' too' );
		await editor.saveDraft();
		expect( await storedContent( requestUtils, id ) ).toBe(
			'<!-- wp:sections/section -->\n<!-- wp:sections/hero {"topline":"Inside too"} /-->\n<!-- /wp:sections/section -->'
		);
	} );

	test( 'shows the panel registered by the theme', async ( { admin, editor, page, requestUtils } ) => {
		await openPostWith( { admin, editor, requestUtils }, block( 'sections/hero', { buttons: [ { label: 'A', url: '' }, { label: 'B', url: '' } ] } ) );
		await editor.canvas.locator( '[data-type="sections/hero"] .hero__topline' ).click();
		await openBlockSettings( page, editor );
		await page.getByRole( 'button', { name: 'Hero summary' } ).click();
		await expect( page.locator( '.sections-hero-summary' ) ).toHaveText( '2 button(s)' );
	} );

	test( 'shows only content controls in contentOnly mode', async ( { admin, editor, page, requestUtils } ) => {
		await openPostWith(
			{ admin, editor, requestUtils },
			'<!-- wp:group {"templateLock":"contentOnly"} -->\n<div class="wp-block-group">' +
				block( 'sections/hero', { topline: 'Locked', buttons: [ { label: 'A', url: '' } ] } ) +
				'</div>\n<!-- /wp:group -->'
		);
		const hero = editor.canvas.locator( '[data-type="sections/hero"]' );
		await hero.locator( '.hero__topline' ).click();
		await page.keyboard.type( '!' );
		await expect( hero.locator( '.hero__topline' ) ).toHaveText( 'Locked!' );

		await editor.openDocumentSettingsSidebar();
		await expect( page.getByRole( 'button', { name: 'Add item to Buttons' } ) ).toBeVisible();
		await expect( page.getByRole( 'combobox', { name: 'Gradient' } ) ).toHaveCount( 0 );
		await screenshot( page, 'content-only-inspector' );
	} );

	test( 'shows an error per block and renders the others', async ( { admin, editor, requestUtils } ) => {
		// The editor checks only the type of an attribute; the server also checks the required label of each button.
		await openPostWith( { admin, editor, requestUtils }, [ block( 'sections/hero', { buttons: [ { url: '' } ] } ), block( 'sections/hero', { topline: 'Fine' } ) ].join( '\n\n' ) );
		const heroes = editor.canvas.locator( '[data-type="sections/hero"]' );
		await expect( heroes.nth( 0 ).getByText( 'label is a required property of attributes[buttons][0].' ) ).toBeVisible();
		await expect( heroes.nth( 1 ).locator( '.hero__topline' ) ).toHaveText( 'Fine' );
	} );

	test( 'edits the hero in a template of the site editor', async ( { admin, editor, page } ) => {
		const renders = trackRenderRequests( page );
		await admin.visitSiteEditor( { postId: 'theme-sections//index', postType: 'wp_template', canvas: 'edit' } );
		await editor.insertBlock( { name: 'sections/hero', attributes: { topline: 'Template' } } );
		const topline = editor.canvas.locator( '[data-type="sections/hero"] .hero__topline' );
		await expect( topline ).toHaveAttribute( 'contenteditable', 'true' );
		await expect( topline ).toHaveText( 'Template' );
		// Templates have no numeric post ID; the request must not send one.
		expect( JSON.parse( renders[ 0 ].postData() ).blocks[ 0 ] ).not.toHaveProperty( 'postId' );
		await screenshot( page, 'site-editor' );
	} );

	test( 'edits the button list as cards in the inspector', async ( { admin, editor, page, requestUtils } ) => {
		const id = await openPostWith(
			{ admin, editor, requestUtils },
			block( 'sections/hero', { buttons: [ { label: 'First', url: '' }, { label: 'Second', url: '' } ] } )
		);
		const hero = editor.canvas.locator( '[data-type="sections/hero"]' );
		await hero.locator( '.hero__topline' ).click();
		await editor.openDocumentSettingsSidebar();

		const list = page.locator( '.wp-app-framework-list' );
		const titles = list.locator( '.wp-app-framework-list__title' );
		await expect( titles ).toHaveText( [ 'First', 'Second' ] );

		await page.getByRole( 'button', { name: 'Add item to Buttons' } ).click();
		await expect( titles ).toHaveText( [ 'First', 'Second', 'Item 3' ] );
		const third = hero.locator( '.hero__button' ).nth( 2 );
		await expect( third ).toHaveAttribute( 'contenteditable', 'true' );
		await third.click();
		await page.keyboard.type( 'Third' );
		await expect( titles ).toHaveText( [ 'First', 'Second', 'Third' ] );
		await screenshot( page.getByRole( 'region', { name: 'Editor settings' } ), 'inspector-hero-buttons' );

		await page.getByRole( 'button', { name: 'Actions for item 1' } ).click();
		await page.getByRole( 'menuitem', { name: 'Move down' } ).click();
		await expect( hero.locator( '.hero__button' ) ).toHaveText( [ 'Second', 'First', 'Third' ] );

		await page.getByRole( 'button', { name: 'Actions for item 3' } ).click();
		await page.getByRole( 'menuitem', { name: 'Remove' } ).click();
		await expect( hero.locator( '.hero__button' ) ).toHaveText( [ 'Second', 'First' ] );

		await editor.saveDraft();
		const attributes = JSON.parse( ( await storedContent( requestUtils, id ) ).match( /^<!-- wp:sections\/hero (\{.*\}) \/-->$/ )[ 1 ] );
		expect( attributes.buttons.map( ( button ) => button.label ) ).toEqual( [ 'Second', 'First' ] );
	} );
} );
