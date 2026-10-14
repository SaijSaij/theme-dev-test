/**
 * Step 22: tables of the theme – columns and indexes as the database reports
 * them, rows loaded, saved and deleted, queries with groups and null, and the
 * schema sync of an older schema (src/Table/).
 *
 * The tests run one after the other: the upgrade test makes the next request
 * sync the tables.
 */
const { test, expect } = require( '../fixtures' );

const { restResponse } = require( '../helpers' );

const TABLES = '/dev-test/v1/tables';

test.describe.configure( { mode: 'serial' } );

/**
 * Calls a route of TableController and expects a status.
 *
 * @param {Object} requestUtils
 * @param {Object} request      Path relative to the controller, method, params and data.
 * @param {number} [status]
 * @return {Promise<Object|null>} The body of the response.
 */
async function call( requestUtils, request, status = 200 ) {
	const response = await restResponse( requestUtils, {
		...request,
		path: `${ TABLES }${ request.path }`,
	} );
	expect( response.status, JSON.stringify( response.body ) ).toBe( status );
	return response.body;
}

/**
 * Creates a log entry; the test deletes it.
 *
 * @param {Object} requestUtils
 * @param {Object} data
 * @return {Promise<Object>} The entry as stored.
 */
function createEntry( requestUtils, data ) {
	return call( requestUtils, { method: 'POST', path: '/entries', data } );
}

/**
 * Deletes the log entries of a test with one query.
 *
 * @param {Object}   requestUtils
 * @param {number[]} ids
 */
async function deleteEntries( requestUtils, ids ) {
	await call( requestUtils, {
		method: 'POST',
		path: '/purge',
		data: { ids: ids.join( ',' ), before: '2100-01-01 00:00:00' },
	} );
}

test.describe( 'Tables', () => {
	test( 'creates the columns and indexes of the row class', async ( {
		requestUtils,
	} ) => {
		const schema = await call( requestUtils, { path: '/schema/log' } );

		expect( schema.name ).toMatch( /dev_test_log$/ );
		const columns = Object.fromEntries(
			Object.entries( schema.columns ).map( ( [ name, column ] ) => [
				name,
				`${ column.type } ${ column.null } ${ column.default }`,
			] )
		);
		expect( columns ).toEqual( {
			id: 'bigint(20) unsigned NO null',
			level: 'varchar(191) NO info',
			message: 'varchar(500) NO ',
			context: 'longtext NO null',
			reference: 'varchar(191) YES null',
			attempts: 'bigint(20) NO 0',
			ratio: 'double NO 0',
			flagged: 'tinyint(1) NO 0',
			post_id: 'bigint(20) YES null',
			priority: 'bigint(20) YES null',
			handled: 'datetime YES null',
			created: 'datetime NO null',
		} );
		expect( schema.indexes ).toEqual( {
			PRIMARY: { columns: [ 'id' ], unique: true },
			reference: { columns: [ 'reference' ], unique: true },
			post_id: { columns: [ 'post_id' ], unique: false },
			level_created: { columns: [ 'level', 'created' ], unique: false },
		} );
	} );

	test( 'saves, loads, changes and deletes rows of every type', async ( {
		requestUtils,
	} ) => {
		const created = await createEntry( requestUtils, {
			level: 'error',
			message: 'Import failed',
			context: 'x'.repeat( 70000 ),
			reference: `e2e-${ Date.now() }`,
			attempts: -3,
			ratio: 0.1234567890123456,
			flagged: true,
			postId: 42,
			priority: 9,
			handled: '2026-03-01T12:00:00+02:00',
			created: '2026-03-01 08:00:00 UTC',
		} );
		try {
			const loaded = await call( requestUtils, {
				path: `/entries/${ created.id }`,
			} );
			expect( loaded ).toEqual( {
				...created,
				context: 'x'.repeat( 70000 ),
				// Floats keep every digit, times are stored in UTC.
				ratio: 0.1234567890123456,
				handled: '2026-03-01T10:00:00+00:00',
				created: '2026-03-01T08:00:00+00:00',
			} );
			expect( loaded ).toMatchObject( {
				level: 'error',
				attempts: -3,
				flagged: true,
				postId: 42,
				priority: 9,
			} );

			const changed = await call( requestUtils, {
				method: 'POST',
				path: `/entries/${ created.id }`,
				data: { level: 'warning', message: 'Retried' },
			} );
			expect( changed ).toEqual( {
				...loaded,
				level: 'warning',
				message: 'Retried',
			} );

			const empty = await createEntry( requestUtils, {} );
			expect( empty ).toMatchObject( {
				level: 'info',
				reference: null,
				postId: null,
				priority: null,
				handled: null,
			} );
			await call( requestUtils, {
				method: 'DELETE',
				path: `/entries/${ empty.id }`,
			} );
			await call( requestUtils, { path: `/entries/${ empty.id }` }, 404 );
		} finally {
			await deleteEntries( requestUtils, [ created.id ] );
		}
	} );

	test( 'inserts a new row object with the ID of a missing row', async ( {
		requestUtils,
	} ) => {
		// A free ID: the row of this test, deleted again.
		const { id } = await createEntry( requestUtils, { message: 'Gone' } );
		await call( requestUtils, {
			method: 'DELETE',
			path: `/entries/${ id }`,
		} );
		const restore = ( message ) =>
			call( requestUtils, {
				method: 'PUT',
				path: `/entries/${ id }`,
				data: {
					level: 'warning',
					message,
					created: '2026-04-01 00:00:00 UTC',
				},
			} );
		try {
			expect( await restore( 'Restored' ) ).toMatchObject( {
				id,
				level: 'warning',
				message: 'Restored',
				created: '2026-04-01T00:00:00+00:00',
			} );
			// The same values again: MariaDB reports no changed row, the row exists, nothing is inserted twice.
			expect( await restore( 'Restored' ) ).toMatchObject( {
				id,
				message: 'Restored',
			} );
			expect( await restore( 'Changed' ) ).toMatchObject( {
				id,
				message: 'Changed',
			} );
		} finally {
			await deleteEntries( requestUtils, [ id ] );
		}
	} );

	test( 'queries rows with groups, null, order and limits', async ( {
		requestUtils,
	} ) => {
		const reference = `e2e-a-${ Date.now() }`;
		const rows = {
			a: await createEntry( requestUtils, {
				level: 'error',
				message: 'Sale 50% off',
				reference,
				attempts: 1,
				ratio: 0.5,
				flagged: true,
				created: '2026-02-01 00:00:00 UTC',
			} ),
			b: await createEntry( requestUtils, {
				message: 'Sale 50_ off',
				attempts: 5,
				postId: 7,
				priority: 9,
				created: '2026-08-01 00:00:00 UTC',
			} ),
			c: await createEntry( requestUtils, {
				level: 'warning',
				reference: `e2e-c-${ Date.now() }`,
				attempts: 9,
				ratio: 0.1,
				flagged: true,
				priority: 1,
				created: '2026-05-01 00:00:00 UTC',
			} ),
			d: await createEntry( requestUtils, {
				attempts: 4,
				created: '2027-01-01 00:00:00 UTC',
			} ),
		};
		const names = Object.fromEntries(
			Object.entries( rows ).map( ( [ name, row ] ) => [ row.id, name ] )
		);
		const ids = Object.values( rows ).map( ( row ) => row.id );
		const query = async ( name ) => {
			const result = await call( requestUtils, {
				path: '/query',
				params: { case: name, ids: ids.join( ',' ), reference },
			} );
			return {
				names: result.ids.map( ( id ) => names[ id ] ),
				count: result.count,
				first: names[ result.first ] ?? null,
			};
		};

		try {
			expect( ( await query( 'errors' ) ).names ).toEqual( [ 'a' ] );
			expect( ( await query( 'error-or-retried' ) ).names ).toEqual( [
				'a',
				'b',
			] );
			// Rows without reference are not equal to the reference of a either.
			expect( ( await query( 'not-reference' ) ).names ).toEqual( [
				'b',
				'c',
				'd',
			] );
			expect( ( await query( 'without-post' ) ).names ).toEqual( [
				'a',
				'c',
				'd',
			] );
			expect( await query( 'recent' ) ).toEqual( {
				names: [ 'd', 'b', 'c', 'a' ],
				count: 4,
				first: 'd',
			} );
			// limit() and offset() do not count.
			expect( await query( 'page' ) ).toEqual( {
				names: [ 'b', 'c' ],
				count: 4,
				first: 'b',
			} );
			// % matches literally.
			expect( ( await query( 'contains' ) ).names ).toEqual( [ 'a' ] );
			expect( ( await query( 'high-priority' ) ).names ).toEqual( [
				'b',
			] );
			expect( ( await query( 'first-half' ) ).names ).toEqual( [
				'a',
				'c',
			] );
			expect( ( await query( 'flagged-ratio' ) ).names ).toEqual( [
				'a',
			] );

			const removed = await call( requestUtils, {
				method: 'POST',
				path: '/purge',
				data: { ids: ids.join( ',' ), before: '2026-06-01 00:00:00' },
			} );
			expect( removed ).toEqual( { removed: 2 } );
			expect( ( await query( 'recent' ) ).names ).toEqual( [ 'd', 'b' ] );
		} finally {
			await deleteEntries( requestUtils, ids );
		}
	} );

	test( 'fails on a stored value the row class does not know', async ( {
		requestUtils,
	} ) => {
		const { id } = await call( requestUtils, {
			method: 'POST',
			path: '/invalid',
		} );
		try {
			const body = await call(
				requestUtils,
				{ path: `/entries/${ id }` },
				500
			);
			if ( body.data.exception ) {
				expect( body.data.exception.message ).toContain(
					'cannot be loaded as'
				);
			}
		} finally {
			await deleteEntries( requestUtils, [ id ] );
		}
	} );

	test( 'brings an older schema up to date once', async ( {
		requestUtils,
	} ) => {
		// The older schema: title under its earlier name label, a wider code, no index on rank, another column.
		const { id } = await call( requestUtils, {
			method: 'POST',
			path: '/probe/simulate',
			data: { title: 'Kept title' },
		} );
		try {
			// This request syncs the tables on init.
			const schema = await call( requestUtils, {
				path: '/schema/upgrade-probe',
			} );
			expect( Object.keys( schema.columns ) ).toEqual( [
				'id',
				'title',
				'code',
				'rank',
			] );
			expect( schema.columns.code.type ).toBe( 'varchar(100)' );
			expect( schema.indexes.rank ).toEqual( {
				columns: [ 'rank' ],
				unique: false,
			} );
			expect(
				await call( requestUtils, { path: `/probe/${ id }` } )
			).toEqual( { title: 'Kept title', code: 'c1', rank: 1 } );

			// The schema is current: a later request does not compare the tables again. Routes without a
			// return value answer 204.
			await call(
				requestUtils,
				{ method: 'POST', path: '/probe/stray' },
				204
			);
			const unchanged = await call( requestUtils, {
				path: '/schema/upgrade-probe',
			} );
			expect( Object.keys( unchanged.columns ) ).toContain( 'stray' );
		} finally {
			// The next sync drops the stray column.
			await call(
				requestUtils,
				{ method: 'POST', path: '/resync' },
				204
			);
			await call( requestUtils, {
				method: 'DELETE',
				path: `/probe/${ id }`,
			} );
		}
		const cleaned = await call( requestUtils, {
			path: '/schema/upgrade-probe',
		} );
		expect( Object.keys( cleaned.columns ) ).toEqual( [
			'id',
			'title',
			'code',
			'rank',
		] );
	} );
} );
