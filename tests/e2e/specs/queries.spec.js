/**
 * Step 17: queries of post objects – conditions on meta fields and terms,
 * groups, missing meta values as their default, sorting by meta fields,
 * pages, cached results and the block event-list (src/Post/QueryController.php,
 * src/Block/EventList/).
 */
const { test, expect } = require( '../fixtures' );

const {
	block,
	cleanUp,
	createPost,
	openPostWith,
	restResponse,
	trackPost,
} = require( '../helpers' );

const QUERIES = '/dev-test/v1/queries';

/**
 * Creates a post through the REST collection of its type; cleanUp() deletes it.
 *
 * @param {Object} requestUtils
 * @param {string} restBase
 * @param {Object} data
 * @return {Promise<Object>} The created post.
 */
async function create( requestUtils, restBase, data ) {
	const post = await requestUtils.rest( {
		method: 'POST',
		path: `/wp/v2/${ restBase }`,
		data: { status: 'publish', ...data },
	} );
	trackPost( post.id, restBase );
	return post;
}

/**
 * Creates a genre; the caller deletes it.
 *
 * @param {Object} requestUtils
 * @return {Promise<Object>} The term.
 */
function createGenre( requestUtils ) {
	return requestUtils.rest( {
		method: 'POST',
		path: '/wp/v2/dev_test_genre',
		data: { name: `E2E genre ${ Date.now() }` },
	} );
}

/**
 * @param {Object} requestUtils
 * @param {Object} genre
 */
function deleteGenre( requestUtils, genre ) {
	return requestUtils.rest( {
		method: 'DELETE',
		path: `/wp/v2/dev_test_genre/${ genre.id }`,
		params: { force: true },
	} );
}

/**
 * Runs a query of QueryController on the given posts.
 *
 * @param {Object}                requestUtils
 * @param {string}                name         Case of QueryCase.
 * @param {Object<string,number>} posts        Post IDs by name.
 * @return {Promise<Object>} The names of the found posts (`names`), `total` and `pages`.
 */
async function run( requestUtils, name, posts ) {
	const response = await restResponse( requestUtils, {
		path: `${ QUERIES }/run`,
		params: { case: name, ids: Object.values( posts ).join( ',' ) },
	} );
	expect( response.status ).toBe( 200 );
	const names = Object.fromEntries(
		Object.entries( posts ).map( ( [ key, id ] ) => [ id, key ] )
	);
	return {
		names: response.body.ids.map( ( id ) => names[ id ] ?? id ),
		total: response.body.total,
		pages: response.body.pages,
	};
}

test.describe( 'Queries', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await cleanUp( requestUtils );
	} );

	test( 'filters, groups, sorts and pages posts by meta fields and terms', async ( {
		requestUtils,
	} ) => {
		const venue = await create( requestUtils, 'dev_test_venue', {
			title: 'Hall',
		} );
		const genre = await createGenre( requestUtils );
		try {
			const a = await create( requestUtils, 'dev_test_event', {
				title: 'A Moonlight',
				dev_test_genre: [ genre.id ],
				meta: {
					dev_test_capacity: 20,
					dev_test_start: '2026-12-01',
				},
			} );
			const b = await create( requestUtils, 'dev_test_event', {
				title: 'B',
				meta: { dev_test_capacity: 3, dev_test_kind: 'talk' },
			} );
			const c = await create( requestUtils, 'dev_test_event', {
				title: 'C',
				meta: {
					dev_test_capacity: 50,
					dev_test_venue: venue.id,
					dev_test_start: '2026-11-01',
				},
			} );
			// No meta stored: every field has its default.
			const d = await create( requestUtils, 'dev_test_event', {
				title: 'D',
			} );
			const draft = await create( requestUtils, 'dev_test_event', {
				title: 'E',
				status: 'draft',
			} );
			const posts = { A: a.id, B: b.id, C: c.id, D: d.id, E: draft.id };

			const expected = {
				'capacity-over-10': [ 'A', 'C' ],
				// D has no stored capacity: its default 0 is less than 5.
				'capacity-under-5': [ 'B', 'D' ],
				'talk-or-venue': [ 'B', 'C' ],
				'with-genre': [ 'A' ],
				'without-genre': [ 'B', 'C', 'D' ],
				'by-capacity': [ 'C', 'A', 'B', 'D' ],
				// B and D start with the default '', sorted by title.
				'by-start': [ 'B', 'D', 'C', 'A' ],
				drafts: [ 'E' ],
				search: [ 'A' ],
			};
			for ( const [ name, names ] of Object.entries( expected ) ) {
				const result = await run( requestUtils, name, posts );
				expect( result.names, name ).toEqual( names );
				expect( result.total, name ).toBe( names.length );
			}

			// Second page of two by title, of the four published events.
			expect( await run( requestUtils, 'page', posts ) ).toEqual( {
				names: [ 'C', 'D' ],
				total: 4,
				pages: 2,
			} );
		} finally {
			await deleteGenre( requestUtils, genre );
		}
	} );

	test( 'caches a result until a post of the type changes', async ( {
		requestUtils,
	} ) => {
		const a = await create( requestUtils, 'dev_test_event', {
			title: 'A',
			meta: { dev_test_capacity: 20 },
		} );
		const b = await create( requestUtils, 'dev_test_event', {
			title: 'B',
			meta: { dev_test_capacity: 30 },
		} );
		const posts = { A: a.id, B: b.id };
		expect( ( await run( requestUtils, 'cached', posts ) ).names ).toEqual(
			[ 'A', 'B' ]
		);

		// A change past WordPress' hooks: the cached result stays.
		const unnoticed = await restResponse( requestUtils, {
			method: 'POST',
			path: `${ QUERIES }/unnoticed/${ a.id }`,
			data: { capacity: 1 },
		} );
		expect( unnoticed.status ).toBe( 204 );
		expect( ( await run( requestUtils, 'cached', posts ) ).names ).toEqual(
			[ 'A', 'B' ]
		);

		// A change through WordPress invalidates the result.
		await requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/dev_test_event/${ b.id }`,
			data: { title: 'B changed' },
		} );
		expect( ( await run( requestUtils, 'cached', posts ) ).names ).toEqual(
			[ 'B' ]
		);
	} );

	test( 'queries posts of WordPress by meta fields of a hand-written field class', async ( {
		requestUtils,
	} ) => {
		const featured = await create( requestUtils, 'posts', {
			title: 'Featured',
			meta: { dev_test_featured: true },
		} );
		const plain = await create( requestUtils, 'posts', {
			title: 'Plain',
		} );

		const result = await run( requestUtils, 'featured', {
			featured: featured.id,
			plain: plain.id,
		} );
		expect( result.names ).toEqual( [ 'featured' ] );
	} );

	test( 'lists the events of a genre in a block, on the front end and in the editor', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const genre = await createGenre( requestUtils );
		try {
			for ( const [ title, start ] of [
				[ 'Late', '2026-12-24' ],
				[ 'Early', '2026-10-01' ],
				[ 'Later', '2027-01-01' ],
			] ) {
				await create( requestUtils, 'dev_test_event', {
					title,
					dev_test_genre: [ genre.id ],
					meta: { dev_test_start: start },
				} );
			}
			await create( requestUtils, 'dev_test_event', {
				title: 'Other genre',
				meta: { dev_test_start: '2026-01-01' },
			} );
			const content = block( 'dev-test/event-list', {
				genre: genre.id,
				limit: 2,
			} );

			const id = await createPost( requestUtils, {
				title: 'Events',
				content,
				status: 'publish',
			} );
			await page.goto( `/?p=${ id }` );
			const events = page.locator( '.event-list__event a' );
			await expect( events ).toHaveText( [ 'Early', 'Late' ] );
			await expect( page.locator( '.event-list__start' ) ).toHaveText( [
				'2026-10-01',
				'2026-12-24',
			] );

			await openPostWith( { admin, editor, requestUtils }, content );
			await expect(
				editor.canvas.locator( '.event-list__event a' )
			).toHaveText( [ 'Early', 'Late' ] );
		} finally {
			await deleteGenre( requestUtils, genre );
		}
	} );
} );
