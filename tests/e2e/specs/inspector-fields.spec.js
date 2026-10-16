/**
 * Step 5: fields edited in the inspector (inspector: true).
 */
const { test, expect } = require( '../fixtures' );

const path = require( 'path' );

const {
	block,
	cleanUp,
	openPostWith,
	screenshot,
	storedContent,
	trackRenderRequests,
	uploadImage,
} = require( '../helpers' );

const IMAGE = path.join( __dirname, '../assets/image.png' );

test.describe( 'Inspector fields', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await cleanUp( requestUtils );
	} );

	test( 'edits rich text in the inspector and re-renders once', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const renders = trackRenderRequests( page );
		const id = await openPostWith(
			{ admin, editor, requestUtils },
			block( 'dev-test/inspector' )
		);
		const check = editor.canvas.locator(
			'[data-type="dev-test/inspector"]'
		);
		await expect.poll( () => renders.length ).toBe( 1 );
		// Not editable in the canvas.
		await expect( check.locator( '[contenteditable="true"]' ) ).toHaveCount(
			0
		);

		await editor.selectBlocks( check );
		await editor.openDocumentSettingsSidebar();
		const summary = page.getByRole( 'textbox', { name: 'Summary' } );
		await summary.click();
		await page.keyboard.type( 'Hi ' );
		await page.keyboard.press( 'ControlOrMeta+b' );
		await page.keyboard.type( 'bold' );
		await page.keyboard.press( 'ControlOrMeta+b' );

		await expect(
			check.locator( '.inspector-check__summary strong' )
		).toHaveText( 'bold' );
		await page.waitForTimeout( 1000 );
		expect( renders ).toHaveLength( 2 );
		await screenshot(
			page.getByRole( 'region', { name: 'Editor settings' } ),
			'inspector-rich-text'
		);

		await editor.saveDraft();
		const attributes = JSON.parse(
			( await storedContent( requestUtils, id ) ).match(
				/^<!-- wp:dev-test\/inspector (\{.*\}) \/-->$/
			)[ 1 ]
		);
		expect( attributes.summary ).toBe( 'Hi <strong>bold</strong>' );
	} );

	test( 'edits multiline plain text in a text area and re-renders once', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const renders = trackRenderRequests( page );
		const id = await openPostWith(
			{ admin, editor, requestUtils },
			block( 'dev-test/inspector' )
		);
		const check = editor.canvas.locator(
			'[data-type="dev-test/inspector"]'
		);
		await expect.poll( () => renders.length ).toBe( 1 );

		await editor.selectBlocks( check );
		await editor.openDocumentSettingsSidebar();
		const note = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'textbox', { name: 'Note' } );
		// #[PlainText(inspector: true, multiline: true)]: a text area.
		await expect( note ).toHaveJSProperty( 'tagName', 'TEXTAREA' );
		await note.click();
		await page.keyboard.type( 'First line' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Second <line>' );

		await expect(
			check.locator( '.inspector-check__note br' )
		).toHaveCount( 1 );
		// nl2br() writes "<br />\n".
		await expect( check.locator( '.inspector-check__note' ) ).toHaveText(
			'First line\nSecond <line>'
		);
		await page.waitForTimeout( 1000 );
		expect( renders ).toHaveLength( 2 );

		await editor.saveDraft();
		const attributes = JSON.parse(
			( await storedContent( requestUtils, id ) ).match(
				/^<!-- wp:dev-test\/inspector (\{.*\}) \/-->$/
			)[ 1 ]
		);
		expect( attributes.note ).toBe( 'First line\nSecond <line>' );

		await page.goto( `/?p=${ id }&preview=true` );
		const front = page.locator( '.inspector-check__note' );
		await expect( front.locator( 'br' ) ).toHaveCount( 1 );
		expect( await front.innerHTML() ).toBe(
			'First line<br>\nSecond &lt;line&gt;'
		);

		await admin.visitAdminPage( 'post.php', `post=${ id }&action=edit` );
		await editor.selectBlocks(
			editor.canvas.locator( '[data-type="dev-test/inspector"]' )
		);
		await editor.openDocumentSettingsSidebar();
		await expect(
			page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'textbox', { name: 'Note' } )
		).toHaveValue( 'First line\nSecond <line>' );
	} );

	test( 'selects and removes the image of a list item in the inspector', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const imageId = await uploadImage( requestUtils, IMAGE );
		await openPostWith(
			{ admin, editor, requestUtils },
			block( 'dev-test/inspector', { slides: [ { caption: 'One' } ] } )
		);
		const check = editor.canvas.locator(
			'[data-type="dev-test/inspector"]'
		);
		// The caption of the item stays in the canvas.
		await expect( check.locator( 'figcaption' ) ).toHaveAttribute(
			'contenteditable',
			'true'
		);

		await check.locator( 'figcaption' ).click();
		await editor.openDocumentSettingsSidebar();
		// List items are collapsed: expand the slide.
		await page.getByRole( 'button', { name: 'One', exact: true } ).click();
		await page.getByRole( 'button', { name: 'Select Picture' } ).click();
		const library = page.getByRole( 'dialog' );
		await library.getByRole( 'tab', { name: 'Media Library' } ).click();
		await library
			.locator( `li.attachment[data-id="${ imageId }"]` )
			.click();
		await library
			.getByRole( 'button', { name: 'Select', exact: true } )
			.click();

		await expect(
			check.locator( '.inspector-check__slide img.attachment-thumbnail' )
		).toBeVisible();
		const slides = () =>
			page.evaluate(
				() =>
					window.wp.data
						.select( 'core/block-editor' )
						.getBlocks()[ 0 ].attributes.slides
			);
		expect( await slides() ).toEqual( [ { caption: 'One', imageId } ] );
		await screenshot(
			page.getByRole( 'region', { name: 'Editor settings' } ),
			'inspector-list-image'
		);

		await page.getByRole( 'button', { name: 'Remove Picture' } ).click();
		await expect( check.locator( 'img' ) ).toHaveCount( 0 );
		expect( await slides() ).toEqual( [
			{ caption: 'One', imageId: null },
		] );
	} );

	test( 'reports field() on a field edited in the inspector at the block', async ( {
		admin,
		editor,
		requestUtils,
	} ) => {
		// Inserted in the editor only: rendering it on the front end throws (WP_DEBUG).
		await openPostWith( { admin, editor, requestUtils }, '' );
		await editor.insertBlock( { name: 'dev-test/wrong-field' } );
		await expect(
			editor.canvas.locator( '[data-type="dev-test/wrong-field"]' )
		).toContainText(
			'field() in block dev-test/wrong-field: "note" is edited in the inspector (inspector: true); do not mark it with field().'
		);
	} );
} );
