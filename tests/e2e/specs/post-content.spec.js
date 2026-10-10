const { test, expect } = require( '../fixtures' );

const {
	block,
	cleanUp,
	createUserWithPassword,
	openPostWith,
	restResponse,
	screenshot,
	storedContent,
	trackPost,
	trackRenderRequests,
} = require( '../helpers' );

/**
 * #[RichText(postContent: true)]: dev-test/paragraph stores its text as inline
 * HTML between the block comments; its root element is the field.
 */
test.describe( 'Text stored in the post content', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await cleanUp( requestUtils );
	} );

	test( 'edits the root element in the canvas and stores the text as inline HTML', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const renders = trackRenderRequests( page );
		const id = await openPostWith(
			{ admin, editor, requestUtils },
			block( 'dev-test/paragraph' )
		);

		const paragraph = editor.canvas.locator(
			'[data-type="dev-test/paragraph"]'
		);
		await expect( paragraph ).toHaveAttribute( 'contenteditable', 'true' );
		await expect( paragraph ).toHaveClass( /wp-app-framework-field/ );
		await expect.poll( () => renders.length ).toBe( 1 );

		await paragraph.click();
		await page.keyboard.type( 'Hello ' );
		await page.keyboard.press( 'ControlOrMeta+b' );
		await page.keyboard.type( 'world' );
		await page.keyboard.press( 'ControlOrMeta+b' );

		// Inline typing never re-renders.
		await page.waitForTimeout( 1000 );
		expect( renders ).toHaveLength( 1 );
		await screenshot( paragraph, 'paragraph-editor' );

		await editor.saveDraft();
		expect( await storedContent( requestUtils, id ) ).toBe(
			'<!-- wp:dev-test/paragraph -->\nHello <strong>world</strong>\n<!-- /wp:dev-test/paragraph -->'
		);

		// Parsed again from the stored HTML: valid, with the text.
		await page.reload();
		const reloaded = editor.canvas.locator(
			'[data-type="dev-test/paragraph"]'
		);
		await expect( reloaded.locator( 'strong' ) ).toHaveText( 'world' );
		await expect( reloaded ).toHaveText( 'Hello world' );
		await expect(
			editor.canvas.locator( '.block-editor-warning' )
		).toHaveCount( 0 );

		await page.goto( `/?p=${ id }&preview=true` );
		const front = page.locator( 'p.wp-block-dev-test-paragraph' );
		await expect( front ).toHaveCount( 1 );
		expect( await front.innerHTML() ).toBe(
			'Hello <strong>world</strong>'
		);
		await expect( page.locator( 'p p' ) ).toHaveCount( 0 );
		await expect( page.locator( '[data-field]' ) ).toHaveCount( 0 );
	} );

	test( 'keeps the text when other attributes change and stores an empty text as self-closing comment', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const renders = trackRenderRequests( page );
		const id = await openPostWith(
			{ admin, editor, requestUtils },
			block( 'dev-test/paragraph', { lead: true }, 'Keep <em>me</em>' )
		);
		const paragraph = editor.canvas.locator(
			'[data-type="dev-test/paragraph"]'
		);
		await expect( paragraph ).toHaveClass( /paragraph--lead/ );
		await expect( paragraph.locator( 'em' ) ).toHaveText( 'me' );

		await paragraph.click();
		// Without content controls, the inspector shows the settings without tabs.
		await editor.openDocumentSettingsSidebar();
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'checkbox', { name: 'Lead' } )
			.uncheck();
		await expect( paragraph ).not.toHaveClass( /paragraph--lead/ );
		await expect.poll( () => renders.length ).toBe( 2 );
		await expect( paragraph ).toHaveText( 'Keep me' );

		await editor.saveDraft();
		expect( await storedContent( requestUtils, id ) ).toBe(
			'<!-- wp:dev-test/paragraph -->\nKeep <em>me</em>\n<!-- /wp:dev-test/paragraph -->'
		);

		await paragraph.click();
		await page.keyboard.press( 'ControlOrMeta+a' );
		await page.keyboard.press( 'Delete' );
		await expect( paragraph ).toHaveText( '' );
		await editor.saveDraft();
		expect( await storedContent( requestUtils, id ) ).toBe(
			'<!-- wp:dev-test/paragraph /-->'
		);

		await page.goto( `/?p=${ id }&preview=true` );
		await expect(
			page.locator( 'p.wp-block-dev-test-paragraph' )
		).toHaveText( '' );
	} );

	test( 'filters the stored HTML for users without unfiltered_html', async ( {
		requestUtils,
	} ) => {
		const author = await createUserWithPassword( requestUtils, 'author' );
		const response = await restResponse( requestUtils, {
			path: '/wp/v2/posts',
			method: 'POST',
			as: author,
			data: {
				title: 'E2E',
				status: 'draft',
				content: block(
					'dev-test/paragraph',
					{},
					'<script>alert(1)</script>Safe <strong>text</strong>'
				),
			},
		} );
		expect( response.status ).toBe( 201 );
		const id = trackPost( response.body.id );

		const stored = await storedContent( requestUtils, id );
		expect( stored ).not.toContain( '<script' );
		expect( stored ).toContain( 'Safe <strong>text</strong>' );
	} );

	test( 'outlines the paragraph, whose root element is the field, while hovered', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await openPostWith(
			{ admin, editor, requestUtils },
			[
				block( 'dev-test/paragraph', {}, 'First' ),
				block( 'dev-test/paragraph', {}, 'Second' ),
			].join( '\n\n' )
		);
		const outline = ( locator ) =>
			locator.evaluate(
				( element ) => window.getComputedStyle( element ).outlineStyle
			);
		const paragraphs = editor.canvas.locator(
			'[data-type="dev-test/paragraph"]'
		);
		await expect( paragraphs.nth( 0 ) ).toHaveAttribute(
			'contenteditable',
			'true'
		);

		await page.mouse.move( 0, 0 );
		await expect
			.poll( () => outline( paragraphs.nth( 0 ) ) )
			.toBe( 'none' );

		await paragraphs.nth( 0 ).hover();
		await expect
			.poll( () => outline( paragraphs.nth( 0 ) ) )
			.toBe( 'dashed' );
		await expect
			.poll( () => outline( paragraphs.nth( 1 ) ) )
			.toBe( 'none' );
		await screenshot( paragraphs.nth( 0 ), 'paragraph-outline-hovered' );
	} );

	test( 'is editable in contentOnly mode', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await openPostWith(
			{ admin, editor, requestUtils },
			'<!-- wp:group {"templateLock":"contentOnly"} -->\n<div class="wp-block-group">' +
				block( 'dev-test/paragraph', {}, 'Locked' ) +
				'</div>\n<!-- /wp:group -->'
		);
		const paragraph = editor.canvas.locator(
			'[data-type="dev-test/paragraph"]'
		);
		await paragraph.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( '!' );
		await expect( paragraph ).toHaveText( 'Locked!' );
	} );
} );
