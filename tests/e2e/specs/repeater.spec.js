/**
 * Blocks that repeat their inner blocks per item (Repeater, src/Repeater/):
 * events, genres, comments, users and log entries on the front end with the
 * current item of #[Item] and core/post-title in its context; in the editor
 * the first item edited, the others as live previews, switching the edited
 * item, previews of published posts of others for an author; #[Cache] that
 * renders anew when the inner blocks change.
 */
const { test, expect } = require( '../fixtures' );

const {
	block,
	cleanUp,
	createDraft,
	createPost,
	createUserWithPassword,
	openPostWith,
	restResponse,
	trackPost,
} = require( '../helpers' );

/**
 * Creates a published event; cleanUp() deletes it.
 *
 * @param {Object} requestUtils
 * @param {string} title
 * @return {Promise<number>} Post ID.
 */
async function createEvent( requestUtils, title ) {
	const event = await requestUtils.rest( {
		method: 'POST',
		path: '/wp/v2/dev_test_event',
		data: { title, status: 'publish' },
	} );
	return trackPost( event.id, 'dev_test_event' );
}

/**
 * A repeat list with an item card and, if asked, the title of the post as inner blocks.
 *
 * @param {string}  ids              IDs of the items.
 * @param {string}  source           Kind of the items.
 * @param {string}  name             Block name.
 * @param {boolean} [withTitle=true] With core/post-title.
 * @return {string} Serialized block.
 */
function repeatList(
	ids,
	source = 'events',
	name = 'dev-test/repeat-list',
	withTitle = true
) {
	return block(
		name,
		{ source, ids },
		[
			block( 'dev-test/item-card', { label: 'Card' } ),
			...( withTitle && name === 'dev-test/repeat-list'
				? [ block( 'core/post-title' ) ]
				: [] ),
		].join( '\n' )
	);
}

test.describe( 'Repeater', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await cleanUp( requestUtils );
	} );

	test( 'repeat the inner blocks for posts, terms, comments, users and rows on the front end', async ( {
		page,
		requestUtils,
	} ) => {
		const first = await createEvent( requestUtils, 'First event' );
		const second = await createEvent( requestUtils, 'Second event' );
		const genre = await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/dev_test_genre',
			data: { name: `E2E genre ${ Date.now() }` },
		} );
		const commented = await createPost( requestUtils, {
			title: 'Commented',
			content: '',
			status: 'publish',
		} );
		const comment = await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/comments',
			data: {
				post: commented,
				content: 'A comment',
				status: 'approved',
			},
		} );
		const user = await createUserWithPassword( requestUtils, 'author' );
		const entry = await restResponse( requestUtils, {
			method: 'POST',
			path: '/dev-test/v1/tables/entries',
			data: { message: 'A log entry' },
		} );
		expect( entry.status ).toBe( 200 );

		try {
			const id = await createDraft(
				requestUtils,
				repeatList(
					[
						`events:${ first }`,
						`events:${ second }`,
						`genres:${ genre.id }`,
						`comments:${ comment.id }`,
						`users:${ user.id }`,
						`log:${ entry.body.id }`,
					].join( ',' ),
					'mixed'
				)
			);
			await page.goto( `/?p=${ id }&preview=true` );

			const items = page.locator( '.repeat-list__item' );
			await expect( items.locator( '.item-card__item' ) ).toHaveText( [
				'event:First event',
				'event:Second event',
				`term:${ genre.name }`,
				'comment:A comment',
				`user:${ user.username }`,
				'log:A log entry',
			] );
			await expect( items.locator( '.item-card__label' ) ).toHaveText(
				Array( 6 ).fill( 'Card' )
			);
			// A core block in the context of the post of its item.
			await expect(
				items.nth( 0 ).locator( '.wp-block-post-title' )
			).toHaveText( 'First event' );
			await expect(
				items.nth( 1 ).locator( '.wp-block-post-title' )
			).toHaveText( 'Second event' );
		} finally {
			// The posts first: deleting a post renders its content, which lists the items; the comment goes with
			// its post.
			await cleanUp( requestUtils );
			await requestUtils.rest( {
				method: 'DELETE',
				path: `/wp/v2/dev_test_genre/${ genre.id }`,
				params: { force: true },
			} );
			await restResponse( requestUtils, {
				method: 'DELETE',
				path: `/dev-test/v1/tables/entries/${ entry.body.id }`,
			} );
		}
	} );

	test( 'edit the inner blocks in the first item and show the others as live previews', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const ids = [
			await createEvent( requestUtils, 'Alpha' ),
			await createEvent( requestUtils, 'Beta' ),
			await createEvent( requestUtils, 'Gamma' ),
		];
		await openPostWith(
			{ admin, editor, requestUtils },
			repeatList( ids.join( ',' ) )
		);
		const list = editor.canvas.locator(
			'[data-type="dev-test/repeat-list"]'
		);
		const items = list.locator( '.repeat-list__item' );
		await expect( items ).toHaveCount( 3 );
		await expect( items.locator( '.item-card__item' ) ).toHaveText( [
			'event:Alpha',
			'event:Beta',
			'event:Gamma',
		] );

		// The first item holds the inner blocks to edit; the others are previews to click.
		const previews = list.getByRole( 'button', { name: 'Edit this item' } );
		await expect( previews ).toHaveCount( 2 );
		const label = items.nth( 0 ).locator( '.item-card__label' );
		await expect( label ).toHaveAttribute( 'contenteditable', 'true' );

		// Typing in the edited item changes the previews at once.
		await label.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' live' );
		await expect( items.locator( '.item-card__label' ) ).toHaveText(
			Array( 3 ).fill( 'Card live' )
		);

		// A click on a preview edits that item instead.
		await items.nth( 2 ).click();
		await expect(
			items.nth( 2 ).locator( '.item-card__label' )
		).toHaveAttribute( 'contenteditable', 'true' );
		await expect(
			items.nth( 0 ).getByRole( 'button', { name: 'Edit this item' } )
		).toHaveCount( 0 );
		await expect( previews ).toHaveCount( 2 );
		await expect( items.nth( 0 ) ).toHaveAttribute( 'role', 'button' );
	} );

	test( 'show the previews of published posts of others to an author', async ( {
		browser,
		requestUtils,
	} ) => {
		const ids = [
			await createEvent( requestUtils, 'Public one' ),
			await createEvent( requestUtils, 'Public two' ),
		];
		const author = await createUserWithPassword( requestUtils, 'author' );
		const post = await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/posts',
			data: {
				title: 'E2E',
				status: 'draft',
				author: author.id,
				// Without core/post-title: its editor loads the post with context=edit, which WordPress
				// refuses an author for posts of others, as in core/post-template.
				content: repeatList(
					ids.join( ',' ),
					'events',
					'dev-test/repeat-list',
					false
				),
			},
		} );
		trackPost( post.id );

		const context = await browser.newContext( {
			baseURL: test.info().project.use.baseURL,
			storageState: { cookies: [], origins: [] },
		} );
		try {
			const page = await context.newPage();
			const problems = [];
			page.on( 'console', ( message ) => {
				if ( message.type() === 'error' ) {
					problems.push( message.text() );
				}
			} );
			page.on( 'pageerror', ( error ) => problems.push( error.message ) );
			await page.goto( '/wp-login.php' );
			// wp-login.php focuses #user_login 200 ms after loading; wait for it (see settings.spec.js).
			await expect( page.locator( '#user_login' ) ).toBeFocused();
			await page.locator( '#user_login' ).fill( author.username );
			await page.locator( '#user_pass' ).fill( 'e2e-password' );
			await page.locator( '#wp-submit' ).click();
			await expect( page.locator( '#wpadminbar' ) ).toBeVisible();

			await page.goto(
				`/wp-admin/post.php?post=${ post.id }&action=edit`
			);
			const canvas = page.frameLocator( 'iframe[name="editor-canvas"]' );
			await expect(
				canvas.locator( '.repeat-list__item .item-card__item' )
			).toHaveText( [ 'event:Public one', 'event:Public two' ] );
			expect( problems ).toEqual( [] );
		} finally {
			await context.close();
		}
	} );

	test( 'render a cached repeater anew when its inner blocks change', async ( {
		page,
		requestUtils,
	} ) => {
		const event = await createEvent( requestUtils, 'Cached event' );
		const id = await createDraft(
			requestUtils,
			repeatList( String( event ), 'events', 'dev-test/repeat-cached' )
		);
		const list = page.locator( '.repeat-list' );

		await page.goto( `/?p=${ id }&preview=true` );
		const render = await list.getAttribute( 'data-render' );
		await expect( list.locator( '.item-card__label' ) ).toHaveText(
			'Card'
		);
		await page.reload();
		await expect( list ).toHaveAttribute( 'data-render', render );

		await requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/posts/${ id }`,
			data: {
				content: repeatList(
					String( event ),
					'events',
					'dev-test/repeat-cached'
				).replace( '"Card"', '"Changed"' ),
			},
		} );
		await page.reload();
		await expect( list.locator( '.item-card__label' ) ).toHaveText(
			'Changed'
		);
		await expect( list ).not.toHaveAttribute( 'data-render', render );
	} );
} );
