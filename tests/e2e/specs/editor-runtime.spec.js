const { test, expect } = require( '../fixtures' );

const path = require( 'path' );

const {
	activeTheme,
	block,
	blockCount,
	cleanUp,
	openBlockSettings,
	openPostWith,
	RENDER_ROUTE,
	screenshot,
	storedContent,
	trackMedia,
	trackRenderRequests,
} = require( '../helpers' );

const IMAGE = path.join( __dirname, '../assets/image.png' );

test.describe( 'Editor runtime', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await cleanUp( requestUtils );
	} );

	test( 'edits inline fields in the canvas and stores only block comments', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const renders = trackRenderRequests( page );
		const id = await openPostWith(
			{ admin, editor, requestUtils },
			block( 'dev-test/hero', {
				buttons: [ { label: 'Go', url: 'https://example.test/' } ],
			} )
		);

		const hero = editor.canvas.locator( '[data-type="dev-test/hero"]' );
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
		await expect(
			page
				.getByRole( 'toolbar', { name: 'Block tools' } )
				.getByRole( 'button', { name: 'Bold' } )
		).toBeVisible();
		await expect(
			page
				.getByRole( 'toolbar', { name: 'Block tools' } )
				.getByRole( 'button', { name: 'Link' } )
		).toHaveCount( 0 );

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
		expect( content ).toMatch( /^<!-- wp:dev-test\/hero \{.*\} \/-->$/ );
		const attributes = JSON.parse(
			content.match( /^<!-- wp:dev-test\/hero (\{.*\}) \/-->$/ )[ 1 ]
		);
		expect( attributes.topline ).toBe( 'Tom & <b>Jerry</b>' );
		expect( attributes.headline ).toBe( 'Hello <strong>bold</strong>' );
		expect( attributes.buttons ).toEqual( [
			{ label: 'Go now', url: 'https://example.test/' },
		] );

		await page.goto( `/?p=${ id }&preview=true` );
		const front = page.locator( '.wp-block-dev-test-hero' );
		await expect( front.locator( '.hero__topline' ) ).toHaveText(
			'Tom & <b>Jerry</b>'
		);
		await expect( front.locator( '.hero__headline strong' ) ).toHaveText(
			'bold'
		);
		await expect(
			front.locator( '[data-field], [data-inner-blocks]' )
		).toHaveCount( 0 );
		await screenshot( front, 'hero-front' );
	} );

	test( 'edits multiline plain text in the canvas', async ( {
		admin,
		editor,
		page,
		pageUtils,
		requestUtils,
	} ) => {
		const renders = trackRenderRequests( page );
		const id = await openPostWith(
			{ admin, editor, requestUtils },
			block( 'dev-test/check', { text: 'Check' } )
		);
		const check = editor.canvas.locator( '[data-type="dev-test/check"]' );
		const address = check.locator( '.check__address' );
		await expect( address ).toHaveAttribute( 'contenteditable', 'true' );
		await expect.poll( () => renders.length ).toBe( 1 );

		// Enter and Shift+Enter insert line breaks (#[PlainText(multiline: true)]).
		await address.click();
		await page.keyboard.type( 'Main street 1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '12345 Town' );
		await page.keyboard.press( 'Shift+Enter' );
		await page.keyboard.type( 'Tom & <b>Jerry</b>' );
		await expect( address.locator( 'br' ) ).toHaveCount( 2 );
		// One block, no split.
		await expect( check ).toHaveCount( 1 );

		// Pasted plain text with line breaks.
		await page.keyboard.press( 'Enter' );
		await pageUtils.setClipboardData( {
			plainText: 'Pasted one\nPasted two',
		} );
		await pageUtils.pressKeys( 'primary+v' );
		const expected =
			'Main street 1\n12345 Town\nTom & <b>Jerry</b>\nPasted one\nPasted two';
		await expect
			.poll( () =>
				page.evaluate(
					() =>
						window.wp.data
							.select( 'core/block-editor' )
							.getBlocks()[ 0 ].attributes.address
				)
			)
			.toBe( expected );
		// Inline typing never re-renders.
		expect( renders ).toHaveLength( 1 );

		await editor.saveDraft();
		const attributes = JSON.parse(
			( await storedContent( requestUtils, id ) ).match(
				/^<!-- wp:dev-test\/check (\{.*\}) \/-->$/
			)[ 1 ]
		);
		expect( attributes.address ).toBe( expected );

		// The same lines in the canvas after reloading and on the front end.
		await page.reload();
		await expect(
			editor.canvas.locator(
				'[data-type="dev-test/check"] .check__address br'
			)
		).toHaveCount( 4 );
		await page.goto( `/?p=${ id }&preview=true` );
		const front = page.locator(
			'.wp-block-dev-test-check .check__address'
		);
		await expect( front.locator( 'br' ) ).toHaveCount( 4 );
		expect( await front.innerHTML() ).toBe(
			'Main street 1<br>\n12345 Town<br>\nTom &amp; &lt;b&gt;Jerry&lt;/b&gt;<br>\nPasted one<br>\nPasted two'
		);
	} );

	test( 'refetches on non-inline changes only and reuses cached markup', async ( {
		admin,
		editor,
		page,
		pageUtils,
		requestUtils,
	} ) => {
		const renders = trackRenderRequests( page );
		await openPostWith(
			{ admin, editor, requestUtils },
			block( 'dev-test/hero', { topline: 'Cached' } )
		);
		const hero = editor.canvas.locator( '[data-type="dev-test/hero"]' );
		await expect( hero ).toHaveClass( /hero--black/ );
		await expect.poll( () => renders.length ).toBe( 1 );

		await hero.locator( '.hero__topline' ).click();
		await openBlockSettings( page, editor );
		await page
			.getByRole( 'combobox', { name: 'Gradient' } )
			.selectOption( 'blue' );
		await expect( hero ).toHaveClass( /hero--blue/ );
		await expect.poll( () => renders.length ).toBe( 2 );

		await pageUtils.pressKeys( 'primary+z' );
		await expect( hero ).toHaveClass( /hero--black/ );
		await pageUtils.pressKeys( 'primaryShift+z' );
		await expect( hero ).toHaveClass( /hero--blue/ );

		await hero.locator( '.hero__topline' ).click();
		await pageUtils.pressKeys( 'primaryShift+d' );
		await expect(
			editor.canvas.locator( '[data-type="dev-test/hero"]' )
		).toHaveCount( 2 );
		await expect(
			editor.canvas.locator( '[data-type="dev-test/hero"]' ).nth( 1 )
		).toHaveClass( /hero--blue/ );

		// Undo, redo and the duplicate came from the cache.
		await page.waitForTimeout( 1000 );
		expect( renders ).toHaveLength( 2 );
	} );

	test( 'renders all blocks of the post in one request when the editor loads', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const renders = trackRenderRequests( page );
		await openPostWith(
			{ admin, editor, requestUtils },
			[
				block( 'dev-test/hero', { topline: 'One' } ),
				block( 'dev-test/hero', { gradient: 'blue' } ),
				block( 'dev-test/hero', {
					buttons: [ { label: 'A', url: '' } ],
				} ),
				block(
					'dev-test/section',
					{},
					block( 'dev-test/hero', {
						topline: 'Inner',
						gradient: 'blue',
						buttons: [
							{ label: 'B', url: 'https://example.test/' },
						],
					} )
				),
			].join( '\n\n' )
		);
		await expect(
			editor.canvas.locator(
				'[data-type="dev-test/hero"] .hero__topline[contenteditable="true"]'
			)
		).toHaveCount( 4 );

		await page.waitForTimeout( 1000 );
		expect( renders ).toHaveLength( 1 );
		// The section and its inner hero (prefetched) are in the same request.
		expect( blockCount( renders[ 0 ] ) ).toBe( 5 );
	} );

	test( 'keeps the old markup without layout shift while new markup loads', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await openPostWith(
			{ admin, editor, requestUtils },
			block( 'dev-test/hero', { topline: 'Steady' } )
		);
		const hero = editor.canvas.locator( '[data-type="dev-test/hero"]' );
		await expect( hero.locator( '.hero__topline' ) ).toHaveAttribute(
			'contenteditable',
			'true'
		);
		const before = await hero.boundingBox();

		let release;
		const released = new Promise( ( resolve ) => ( release = resolve ) );
		await page.route( '**/*', async ( route ) => {
			if (
				decodeURIComponent( route.request().url() ).includes(
					RENDER_ROUTE
				)
			) {
				await released;
			}
			await route.continue();
		} );

		await hero.locator( '.hero__topline' ).click();
		await openBlockSettings( page, editor );
		await page
			.getByRole( 'combobox', { name: 'Gradient' } )
			.selectOption( 'blue' );

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

	test( 'selects, replaces and resets the image in the canvas', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const renders = trackRenderRequests( page );
		await openPostWith(
			{ admin, editor, requestUtils },
			block( 'dev-test/hero' )
		);
		const hero = editor.canvas.locator( '[data-type="dev-test/hero"]' );
		const figure = hero.locator( '.hero__image' );
		await expect(
			figure.getByRole( 'button', { name: 'Upload' } )
		).toBeVisible();

		await figure.locator( 'input[type="file"]' ).setInputFiles( IMAGE );
		await expect( figure.locator( 'img' ) ).toBeVisible();
		await expect.poll( () => renders.length ).toBe( 2 );
		const id = await page.evaluate(
			() =>
				window.wp.data.select( 'core/block-editor' ).getBlocks()[ 0 ]
					.attributes.imageId
		);
		expect( Number.isInteger( id ) ).toBe( true );
		trackMedia( id );
		await screenshot( hero, 'hero-image' );

		await editor.selectBlocks( hero );
		await editor.showBlockToolbar();
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Image' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Reset' } ).click();
		await expect(
			figure.getByRole( 'button', { name: 'Upload' } )
		).toBeVisible();
	} );

	test( 'section accepts only the allowed blocks and stores no HTML', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const id = await openPostWith(
			{ admin, editor, requestUtils },
			block(
				'dev-test/section',
				{},
				block( 'dev-test/hero', { topline: 'Inside' } )
			)
		);
		const section = editor.canvas.locator(
			'[data-type="dev-test/section"]'
		);
		await expect(
			section.locator( '[data-type="dev-test/hero"] .hero__topline' )
		).toHaveText( 'Inside' );

		const allowed = await page.evaluate( () => {
			const editorStore = window.wp.data.select( 'core/block-editor' );
			const [ sectionBlock ] = editorStore.getBlocks();
			return {
				hero: editorStore.canInsertBlockType(
					'dev-test/hero',
					sectionBlock.clientId
				),
				paragraph: editorStore.canInsertBlockType(
					'core/paragraph',
					sectionBlock.clientId
				),
			};
		} );
		expect( allowed ).toEqual( { hero: true, paragraph: false } );

		await section.locator( '.hero__topline' ).click();
		await page.keyboard.type( ' too' );
		await editor.saveDraft();
		expect( await storedContent( requestUtils, id ) ).toBe(
			'<!-- wp:dev-test/section -->\n<!-- wp:dev-test/hero {"topline":"Inside too"} /-->\n<!-- /wp:dev-test/section -->'
		);
	} );

	test( 'shows the panel registered by the theme', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await openPostWith(
			{ admin, editor, requestUtils },
			block( 'dev-test/hero', {
				buttons: [
					{ label: 'A', url: '' },
					{ label: 'B', url: '' },
				],
			} )
		);
		await editor.canvas
			.locator( '[data-type="dev-test/hero"] .hero__topline' )
			.click();
		await openBlockSettings( page, editor );
		await page.getByRole( 'button', { name: 'Hero summary' } ).click();
		await expect( page.locator( '.dev-test-hero-summary' ) ).toHaveText(
			'2 button(s)'
		);
		// Panels receive the same props as toolbar buttons.
		const clientId = await editor.canvas
			.locator( '[data-type="dev-test/hero"]' )
			.getAttribute( 'data-block' );
		await expect( page.locator( '.dev-test-hero-props' ) ).toHaveAttribute(
			'data-client-id',
			clientId
		);
		await expect( page.locator( '.dev-test-hero-props' ) ).toHaveText(
			'editing'
		);
	} );

	test( 'shows only content controls in contentOnly mode', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await openPostWith(
			{ admin, editor, requestUtils },
			'<!-- wp:group {"templateLock":"contentOnly"} -->\n<div class="wp-block-group">' +
				block( 'dev-test/hero', {
					topline: 'Locked',
					buttons: [ { label: 'A', url: '' } ],
				} ) +
				'</div>\n<!-- /wp:group -->'
		);
		const hero = editor.canvas.locator( '[data-type="dev-test/hero"]' );
		await hero.locator( '.hero__topline' ).click();
		await page.keyboard.type( '!' );
		await expect( hero.locator( '.hero__topline' ) ).toHaveText(
			'Locked!'
		);

		await editor.openDocumentSettingsSidebar();
		await expect(
			page.getByRole( 'button', { name: 'Add item to Buttons' } )
		).toBeVisible();
		await expect(
			page.getByRole( 'combobox', { name: 'Gradient' } )
		).toHaveCount( 0 );
		await screenshot( page, 'content-only-inspector' );
	} );

	test( 'shows an error per block and renders the others', async ( {
		admin,
		editor,
		requestUtils,
	} ) => {
		// The editor checks only the type of an attribute; the server also checks the required label of each button.
		await openPostWith(
			{ admin, editor, requestUtils },
			[
				block( 'dev-test/hero', { buttons: [ { url: '' } ] } ),
				block( 'dev-test/hero', { topline: 'Fine' } ),
			].join( '\n\n' )
		);
		const heroes = editor.canvas.locator( '[data-type="dev-test/hero"]' );
		await expect(
			heroes
				.nth( 0 )
				.getByText(
					'label is a required property of attributes[buttons][0].'
				)
		).toBeVisible();
		await expect( heroes.nth( 1 ).locator( '.hero__topline' ) ).toHaveText(
			'Fine'
		);
	} );

	test( 'edits the hero in a template of the site editor', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		// Template IDs name the active theme, a child theme if one is active.
		const { stylesheet } = await activeTheme( requestUtils );
		const renders = trackRenderRequests( page );
		await admin.visitSiteEditor( {
			postId: `${ stylesheet }//index`,
			postType: 'wp_template',
			canvas: 'edit',
		} );
		await editor.insertBlock( {
			name: 'dev-test/hero',
			attributes: { topline: 'Template' },
		} );
		const topline = editor.canvas.locator(
			'[data-type="dev-test/hero"] .hero__topline'
		);
		await expect( topline ).toHaveAttribute( 'contenteditable', 'true' );
		await expect( topline ).toHaveText( 'Template' );
		// Templates have no numeric post ID; the request must not send one.
		expect(
			JSON.parse( renders[ 0 ].postData() ).blocks[ 0 ]
		).not.toHaveProperty( 'postId' );
		await screenshot( page, 'site-editor' );
	} );

	test( 'edits the button list as cards in the inspector', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const id = await openPostWith(
			{ admin, editor, requestUtils },
			block( 'dev-test/hero', {
				buttons: [
					{ label: 'First', url: '' },
					{ label: 'Second', url: '' },
				],
			} )
		);
		const hero = editor.canvas.locator( '[data-type="dev-test/hero"]' );
		await hero.locator( '.hero__topline' ).click();
		await editor.openDocumentSettingsSidebar();

		const list = page.locator( '.wp-app-framework-list' );
		const titles = list.locator( '.wp-app-framework-list__title' );
		await expect( titles ).toHaveText( [ 'First', 'Second' ] );

		await page
			.getByRole( 'button', { name: 'Add item to Buttons' } )
			.click();
		await expect( titles ).toHaveText( [ 'First', 'Second', 'Item 3' ] );
		const third = hero.locator( '.hero__button' ).nth( 2 );
		await expect( third ).toHaveAttribute( 'contenteditable', 'true' );
		await third.click();
		await page.keyboard.type( 'Third' );
		await expect( titles ).toHaveText( [ 'First', 'Second', 'Third' ] );
		await screenshot(
			page.getByRole( 'region', { name: 'Editor settings' } ),
			'inspector-hero-buttons'
		);

		await page
			.getByRole( 'button', { name: 'Actions for item 1' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Move down' } ).click();
		await expect( hero.locator( '.hero__button' ) ).toHaveText( [
			'Second',
			'First',
			'Third',
		] );

		await page
			.getByRole( 'button', { name: 'Actions for item 3' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Remove' } ).click();
		await expect( hero.locator( '.hero__button' ) ).toHaveText( [
			'Second',
			'First',
		] );

		await editor.saveDraft();
		const attributes = JSON.parse(
			( await storedContent( requestUtils, id ) ).match(
				/^<!-- wp:dev-test\/hero (\{.*\}) \/-->$/
			)[ 1 ]
		);
		expect( attributes.buttons.map( ( button ) => button.label ) ).toEqual(
			[ 'Second', 'First' ]
		);
	} );

	test( 'outlines the fields edited in the canvas on hovered and selected blocks', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const id = await openPostWith(
			{ admin, editor, requestUtils },
			[
				block( 'dev-test/hero', {
					topline: 'Outer',
					headline: 'Head',
				} ),
				block(
					'dev-test/section',
					{},
					block( 'dev-test/hero', { topline: 'Inner' } )
				),
			].join( '\n\n' )
		);
		const outline = ( locator ) =>
			locator.evaluate(
				( element ) => window.getComputedStyle( element ).outlineStyle
			);
		const heroes = editor.canvas.locator( '[data-type="dev-test/hero"]' );
		const outer = heroes.nth( 0 );
		const inner = heroes.nth( 1 );
		await expect( outer.locator( '.hero__topline' ) ).toHaveAttribute(
			'contenteditable',
			'true'
		);
		await expect(
			editor.canvas.locator(
				'#theme-dev-test-wp-app-framework-canvas-css'
			)
		).toBeAttached();
		// canvas.scss uses the admin color scheme, which the editor also defines in the canvas.
		expect(
			await editor.canvas
				.locator( 'body' )
				.evaluate( ( body ) =>
					window
						.getComputedStyle( body )
						.getPropertyValue( '--wp-admin-theme-color' )
				)
		).not.toBe( '' );

		await page.mouse.move( 0, 0 );
		await expect
			.poll( () => outline( outer.locator( '.hero__topline' ) ) )
			.toBe( 'none' );

		await outer.locator( '.hero__content' ).hover();
		await expect
			.poll( () => outline( outer.locator( '.hero__topline' ) ) )
			.toBe( 'dashed' );
		await expect
			.poll( () => outline( outer.locator( '.hero__image' ) ) )
			.toBe( 'dashed' );
		await screenshot( outer, 'canvas-outline-hovered' );

		await outer.locator( '.hero__headline' ).click();
		await page.mouse.move( 0, 0 );
		await expect
			.poll( () => outline( outer.locator( '.hero__headline' ) ) )
			.toBe( 'solid' );
		await expect
			.poll( () => outline( outer.locator( '.hero__topline' ) ) )
			.toBe( 'dashed' );
		await screenshot( outer, 'canvas-outline-selected' );

		// A selected container does not outline the fields of its inner blocks.
		await editor.selectBlocks(
			editor.canvas.locator( '[data-type="dev-test/section"]' )
		);
		await page.mouse.move( 0, 0 );
		await expect
			.poll( () => outline( inner.locator( '.hero__topline' ) ) )
			.toBe( 'none' );
		await expect
			.poll( () => outline( outer.locator( '.hero__topline' ) ) )
			.toBe( 'none' );

		await page.goto( `/?p=${ id }&preview=true` );
		await expect(
			page.locator( '.wp-block-dev-test-hero' ).first()
		).toBeVisible();
		await expect(
			page.locator( '#theme-dev-test-wp-app-framework-canvas-css' )
		).toHaveCount( 0 );
	} );
} );
