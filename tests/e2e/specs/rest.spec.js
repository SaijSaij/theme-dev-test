/**
 * Step 2: REST routes – arguments, status codes, permissions and #[ListOf].
 */
const { test, expect } = require( '../fixtures' );

const {
	cleanUp,
	createUserWithPassword,
	restResponse,
} = require( '../helpers' );

const ITEMS = '/dev-test/v1/items';
const LISTS = '/dev-test/v1/lists';

test.describe( 'REST routes', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await cleanUp( requestUtils );
	} );

	test( 'sanitizes arguments and applies defaults', async ( {
		requestUtils,
	} ) => {
		const sanitized = await restResponse( requestUtils, {
			path: ITEMS,
			params: {
				count: '5',
				flag: 'true',
				variant: 'long',
				email: 'a@b.test',
				code: 'abc',
				ratio: '1.25',
				slug: 'abc',
			},
		} );
		expect( sanitized ).toMatchObject( {
			status: 200,
			body: {
				count: 5,
				flag: true,
				variant: 'long',
				email: 'a@b.test',
				code: 'abc',
				ratio: 1.25,
				slug: 'abc',
			},
		} );

		const defaults = await restResponse( requestUtils, { path: ITEMS } );
		expect( defaults ).toMatchObject( {
			status: 200,
			body: {
				count: 1,
				flag: false,
				variant: 'short',
				email: null,
				code: '',
				ratio: 0.5,
				slug: 'ab',
			},
		} );
	} );

	test( 'passes the request and converts enum path parameters', async ( {
		requestUtils,
	} ) => {
		expect(
			await restResponse( requestUtils, { path: `${ ITEMS }/request` } )
		).toMatchObject( {
			status: 200,
			body: {
				class: 'WP_REST_Request',
				route: '/dev-test/v1/items/request',
			},
		} );
		expect(
			await restResponse( requestUtils, {
				path: `${ ITEMS }/variant/long`,
			} )
		).toMatchObject( { status: 200, body: 'long' } );
		// The route only matches the values of the enum.
		expect(
			await restResponse( requestUtils, {
				path: `${ ITEMS }/variant/other`,
			} )
		).toMatchObject( { status: 404, body: { code: 'rest_no_route' } } );
	} );

	test( 'answers invalid arguments with 400', async ( { requestUtils } ) => {
		const invalid = [
			[ { count: '50' }, 'rest_out_of_bounds' ],
			[ { count: 'abc' }, 'rest_invalid_type' ],
			[ { ratio: 'x' }, 'rest_invalid_type' ],
			[ { slug: 'a' }, 'rest_too_short' ],
			[ { slug: 'AB' }, 'rest_invalid_pattern' ],
			[ { variant: 'purple' }, 'rest_not_in_enum' ],
			[ { email: 'nope' }, 'rest_invalid_email' ],
			[ { code: 'toolong' }, 'rest_too_long' ],
		];
		for ( const [ params, detail ] of invalid ) {
			const { status, body } = await restResponse( requestUtils, {
				path: ITEMS,
				params,
			} );
			const name = Object.keys( params )[ 0 ];
			expect( status, name ).toBe( 400 );
			expect( body.code, name ).toBe( 'rest_invalid_param' );
			expect( body.data.details[ name ].code, name ).toBe( detail );
		}

		const missing = await restResponse( requestUtils, {
			path: ITEMS,
			method: 'POST',
		} );
		expect( missing ).toMatchObject( {
			status: 400,
			body: {
				code: 'rest_missing_callback_param',
				data: { params: [ 'title' ] },
			},
		} );
	} );

	test( 'takes path parameters from the URL and maps responses to status codes', async ( {
		requestUtils,
	} ) => {
		expect(
			await restResponse( requestUtils, {
				path: `${ ITEMS }/5`,
				params: { id: '7' },
			} )
		).toMatchObject( { status: 200, body: { id: 5 } } );
		expect(
			await restResponse( requestUtils, { path: `${ ITEMS }/abc` } )
		).toMatchObject( { status: 404, body: { code: 'rest_no_route' } } );
		expect(
			await restResponse( requestUtils, {
				path: `${ ITEMS }/missing/foo`,
			} )
		).toMatchObject( {
			status: 404,
			body: {
				code: 'dev_test_not_found',
				message: 'No item "foo".',
				data: { status: 404, slug: 'foo' },
			},
		} );
		expect(
			await restResponse( requestUtils, {
				path: ITEMS,
				method: 'POST',
				data: { title: 'New' },
			} )
		).toMatchObject( { status: 201, body: { title: 'New' } } );
		expect(
			await restResponse( requestUtils, {
				path: `${ ITEMS }/5`,
				method: 'DELETE',
			} )
		).toMatchObject( { status: 204, body: null } );

		// WP_DEBUG is on in every instance of wp-test-env, so the details are included.
		const failure = await restResponse( requestUtils, {
			path: `${ ITEMS }/fail`,
		} );
		expect( failure ).toMatchObject( {
			status: 500,
			body: {
				code: 'wp_app_framework_internal_error',
				data: {
					exception: {
						class: 'RuntimeException',
						message: 'Intended failure of the test theme.',
					},
				},
			},
		} );
		expect( failure.body.data.exception.trace.length ).toBeGreaterThan( 0 );
	} );

	test( 'shows the argument schema on OPTIONS', async ( {
		requestUtils,
	} ) => {
		const { status, body } = await restResponse( requestUtils, {
			path: ITEMS,
			method: 'OPTIONS',
		} );
		expect( status ).toBe( 200 );
		const get = body.endpoints.find( ( endpoint ) =>
			endpoint.methods.includes( 'GET' )
		);
		expect( get.args.count ).toMatchObject( {
			type: 'integer',
			minimum: 1,
			maximum: 10,
			default: 1,
		} );
		expect( get.args.variant ).toMatchObject( {
			type: 'string',
			enum: [ 'short', 'long' ],
			default: 'short',
		} );
		expect( get.args.email ).toMatchObject( { format: 'email' } );
	} );

	test( 'checks permissions', async ( { requestUtils } ) => {
		const subscriber = await createUserWithPassword(
			requestUtils,
			'subscriber'
		);

		// Capability('edit_posts')
		expect(
			(
				await restResponse( requestUtils, {
					path: `${ ITEMS }/5`,
					method: 'DELETE',
					as: 'anonymous',
				} )
			).status
		).toBe( 401 );
		expect(
			(
				await restResponse( requestUtils, {
					path: `${ ITEMS }/5`,
					method: 'DELETE',
					as: subscriber,
				} )
			).status
		).toBe( 403 );

		// Callback: refuses the locked ID 13.
		expect(
			await restResponse( requestUtils, {
				path: `${ ITEMS }/5`,
				method: 'PUT',
			} )
		).toMatchObject( { status: 200, body: { id: 5 } } );
		expect(
			(
				await restResponse( requestUtils, {
					path: `${ ITEMS }/13`,
					method: 'PUT',
				} )
			).status
		).toBe( 403 );

		// The Allow header lists only the methods whose permission check passes.
		const allowed = async ( id ) =>
			(
				await restResponse( requestUtils, {
					path: `${ ITEMS }/${ id }`,
				} )
			).headers.allow
				.split( ', ' )
				.sort();
		expect( await allowed( 5 ) ).toEqual( [ 'DELETE', 'GET', 'PUT' ] );
		expect( await allowed( 13 ) ).toEqual( [ 'DELETE', 'GET' ] );
	} );

	test( 'converts lists of value objects and enums', async ( {
		requestUtils,
	} ) => {
		const json = await restResponse( requestUtils, {
			path: LISTS,
			method: 'POST',
			data: {
				links: [
					{ label: 'A', url: 'javascript:alert(1)' },
					{ label: 'B', url: 'https://example.test/?a=1&b=2' },
				],
				variants: [ 'short', 'long' ],
			},
		} );
		expect( json ).toMatchObject( {
			status: 200,
			body: {
				links: [
					{
						class: 'WebCodingCat\\ThemeDevTest\\Rest\\Link',
						label: 'A',
						url: '',
					},
					{
						class: 'WebCodingCat\\ThemeDevTest\\Rest\\Link',
						label: 'B',
						url: 'https://example.test/?a=1&b=2',
					},
				],
				variants: [ 'short', 'long' ],
			},
		} );

		const query = await restResponse( requestUtils, {
			path: LISTS,
			params: {
				'links[0][label]': 'Q',
				'links[0][url]': 'https://example.test/',
			},
		} );
		expect( query ).toMatchObject( {
			status: 200,
			body: {
				links: [ { label: 'Q', url: 'https://example.test/' } ],
				variants: [ 'long' ],
			},
		} );

		const badEnum = await restResponse( requestUtils, {
			path: LISTS,
			method: 'POST',
			data: { variants: [ 'purple' ] },
		} );
		expect( badEnum.status ).toBe( 400 );
		expect( badEnum.body.data.details.variants.code ).toBe(
			'rest_not_in_enum'
		);

		const noLabel = await restResponse( requestUtils, {
			path: LISTS,
			method: 'POST',
			data: { links: [ { url: '' } ] },
		} );
		expect( noLabel.status ).toBe( 400 );
		expect( noLabel.body.data.details.links.code ).toBe(
			'rest_property_required'
		);
	} );
} );
