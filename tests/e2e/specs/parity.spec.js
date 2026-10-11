const path = require( 'path' );

const { test, expect } = require( '../fixtures' );

const {
	activeTheme,
	block,
	cleanUp,
	createDraft,
	measureBlocks,
	openPostWith,
	screenshot,
	uploadImage,
} = require( '../helpers' );

const IMAGE = path.join( __dirname, '../assets/image.png' );

const TEXT =
	'Some <strong>bold</strong> and <em>italic</em> text that is long enough to wrap onto a second line in the card.';

/**
 * Attributes of a card with every field filled.
 *
 * @param {number} imageId
 * @param {string} title
 * @return {Object} Attributes.
 */
function card( imageId, title ) {
	return {
		imageId,
		title,
		text: TEXT,
		links: [
			{ label: 'Read more', url: 'https://example.com/a' },
			{ label: 'Contact', url: 'https://example.com/b' },
		],
	};
}

/**
 * Measures two cards on the front end of a draft.
 *
 * @param {Object} fixtures
 * @param {Object} fixtures.page
 * @param {Object} fixtures.requestUtils
 * @param {string} content
 * @return {Promise<Object>} Measurements.
 */
async function measureFrontEnd( { page, requestUtils }, content ) {
	const id = await createDraft( requestUtils, content );
	await page.goto( `/?p=${ id }&preview=true` );
	const cards = page.locator( '.wp-block-dev-test-card' );
	await expect( cards ).toHaveCount( 2 );
	await screenshot( cards.first(), 'parity-front-end' );
	return measureBlocks( cards );
}

/**
 * dev-test/card, styled with the theme's Tailwind utilities: content editors must
 * see the same sizes, spacing and type in the editor canvas as on the front end.
 * White space and the horizontal centering of a block are not compared (see
 * measureBlocks()).
 */
test.describe( 'Editor and front end', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await cleanUp( requestUtils );
	} );

	test( 'renders blocks alike in the post editor canvas and on the front end', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const imageId = await uploadImage( requestUtils, IMAGE );
		const content =
			block( 'dev-test/card', card( imageId, 'First card' ) ) +
			block( 'dev-test/card', card( imageId, 'Second <em>card</em>' ) );
		const front = await measureFrontEnd( { page, requestUtils }, content );
		// The theme's utility on the title wins over the editor's wrapping (canvas.scss).
		expect( front.blocks[ 0 ][ 3 ] ).toEqual(
			expect.objectContaining( {
				element: 'h3.card__title',
				'overflow-wrap': 'anywhere',
			} )
		);

		await openPostWith( { admin, editor, requestUtils }, content );
		const cards = editor.canvas.locator( '[data-type="dev-test/card"]' );
		await expect( cards.nth( 1 ).locator( '.card__title' ) ).toHaveText(
			'Second card'
		);
		await screenshot( cards.first(), 'parity-post-editor' );

		expect( await measureBlocks( cards ) ).toEqual( front );
	} );

	test( 'renders blocks alike in the site editor canvas and on the front end', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const imageId = await uploadImage( requestUtils, IMAGE );
		const front = await measureFrontEnd(
			{ page, requestUtils },
			block( 'dev-test/card', card( imageId, 'First card' ) ) +
				block( 'dev-test/card', card( imageId, 'Second card' ) )
		);

		// Template IDs name the active theme, a child theme if one is active.
		const { stylesheet } = await activeTheme( requestUtils );
		await admin.visitSiteEditor( {
			postId: `${ stylesheet }//index`,
			postType: 'wp_template',
			canvas: 'edit',
		} );
		await editor.insertBlock( {
			name: 'dev-test/card',
			attributes: card( imageId, 'First card' ),
		} );
		await editor.insertBlock( {
			name: 'dev-test/card',
			attributes: card( imageId, 'Second card' ),
		} );
		const cards = editor.canvas.locator( '[data-type="dev-test/card"]' );
		await expect( cards.nth( 1 ).locator( '.card__title' ) ).toHaveText(
			'Second card'
		);
		await expect( cards.nth( 1 ).locator( 'img' ) ).toBeVisible();

		expect( await measureBlocks( cards ) ).toEqual( front );
	} );
} );
