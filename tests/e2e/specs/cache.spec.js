/**
 * Step 19: the cache with each backend – a cached block on the front end
 * (inputs, variant, view script from the cache), its invalidation by posts,
 * settings and a tag of the theme, fresh renders in the editor and its preview,
 * cached REST routes and CacheStore::remember() (src/Cache/).
 *
 * The object cache is tested only if the site has one (wp-dev-env with
 * WP_OBJECT_CACHE=valkey); entries of earlier runs are no problem, because
 * every test compares counts before and after.
 */
const { test, expect } = require( '../fixtures' );

const {
	RENDER_ROUTE,
	block,
	cleanUp,
	createPost,
	restResponse,
} = require( '../helpers' );

const CACHE = '/dev-test/v1/cache';
const PREVIEW_ROUTE = RENDER_ROUTE.replace( /\/render$/, '/preview' );

/**
 * How often the cached block on the page rendered, as the block shows it.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string}                          url
 * @return {Promise<string>} Render count of the block.
 */
async function renderCount( page, url ) {
	await page.goto( url );
	const cached = page.locator( '.cached' );
	// The view script runs whether the block was rendered or read from the cache.
	await expect( cached ).toHaveAttribute( 'data-mounted', 'true' );
	return cached.getAttribute( 'data-render' );
}

/**
 * @param {Object} requestUtils
 * @param {string} path         Route below the cache controller.
 * @param {Object} [options]    Further options of restResponse().
 * @return {Promise<Object>} Response.
 */
function cacheRoute( requestUtils, path, options = {} ) {
	return restResponse( requestUtils, { path: CACHE + path, ...options } );
}

for ( const backend of [ 'file', 'transient', 'object' ] ) {
	test.describe( `Cache in the ${ backend } backend`, () => {
		test.beforeEach( async ( { requestUtils } ) => {
			const state = await cacheRoute( requestUtils, '/state' );
			test.skip(
				backend === 'object' && ! state.body.objectCache,
				'The site has no persistent object cache (wp-dev-env: WP_OBJECT_CACHE=valkey).'
			);
			const forced = await cacheRoute( requestUtils, '/backends', {
				method: 'PUT',
				data: { backends: [ backend ] },
			} );
			expect( forced.status ).toBe( 204 );
			expect(
				( await cacheRoute( requestUtils, '/state' ) ).body.backend
			).toBe( backend );
		} );

		test.afterEach( async ( { requestUtils } ) => {
			await cacheRoute( requestUtils, '/backends', {
				method: 'DELETE',
			} );
			await cleanUp( requestUtils );
		} );

		test( 'renders a block once per input and variant', async ( {
			page,
			requestUtils,
		} ) => {
			const content = block( 'dev-test/cached', { label: 'Cached' } );
			const first = await createPost( requestUtils, {
				title: 'E2E cache',
				content,
				status: 'publish',
			} );
			const second = await createPost( requestUtils, {
				title: 'E2E cache',
				content,
				status: 'publish',
			} );

			const rendered = await renderCount( page, `/?p=${ first }` );
			await expect( page.locator( '.cached' ) ).toHaveAttribute(
				'data-post',
				String( first )
			);
			expect( await renderCount( page, `/?p=${ first }` ) ).toBe(
				rendered
			);

			// The post is context of the block, the URL parameter a variant.
			const other = await renderCount( page, `/?p=${ second }` );
			expect( other ).not.toBe( rendered );
			const variant = await renderCount(
				page,
				`/?p=${ first }&variant=a`
			);
			expect( variant ).not.toBe( rendered );
			await expect( page.locator( '.cached' ) ).toHaveAttribute(
				'data-variant',
				'a'
			);
			expect(
				await renderCount( page, `/?p=${ first }&variant=a` )
			).toBe( variant );
			expect( await renderCount( page, `/?p=${ first }` ) ).toBe(
				rendered
			);
		} );

		test( 'invalidates a block by post, settings and tag', async ( {
			page,
			requestUtils,
		} ) => {
			const id = await createPost( requestUtils, {
				title: 'E2E cache',
				content: block( 'dev-test/cached', { label: 'Cached' } ),
				status: 'publish',
			} );
			const url = `/?p=${ id }`;
			let rendered = await renderCount( page, url );
			expect( await renderCount( page, url ) ).toBe( rendered );

			const changes = {
				'a saved post': () =>
					requestUtils.rest( {
						method: 'POST',
						path: `/wp/v2/posts/${ id }`,
						data: { title: 'E2E cache changed' },
					} ),
				'saved settings': async () => {
					const settings = await restResponse( requestUtils, {
						path: '/wp/v2/settings',
					} );
					const layout = settings.body.theme_dev_test_layout;
					await requestUtils.rest( {
						method: 'POST',
						path: '/wp/v2/settings',
						data: {
							theme_dev_test_layout: {
								...layout,
								columns: layout.columns + 1,
							},
						},
					} );
					// Restores the setting; the next render counts again.
					await requestUtils.rest( {
						method: 'POST',
						path: '/wp/v2/settings',
						data: { theme_dev_test_layout: layout },
					} );
				},
				'an invalidated tag': () =>
					cacheRoute( requestUtils, '/invalidate', {
						method: 'POST',
					} ),
			};
			for ( const [ change, apply ] of Object.entries( changes ) ) {
				await apply();
				const next = await renderCount( page, url );
				expect( next, change ).not.toBe( rendered );
				expect( await renderCount( page, url ), change ).toBe( next );
				rendered = next;
			}
		} );

		test( 'renders the editor view and the preview fresh', async ( {
			requestUtils,
		} ) => {
			const counts = [];
			for ( let i = 0; i < 2; i++ ) {
				const render = await restResponse( requestUtils, {
					path: RENDER_ROUTE,
					method: 'POST',
					data: {
						blocks: [
							{
								name: 'dev-test/cached',
								attributes: { label: 'Editor' },
							},
						],
					},
				} );
				counts.push(
					render.body.results[ 0 ].html.match(
						/data-render="(\d+)"/
					)[ 1 ]
				);
				const preview = await restResponse( requestUtils, {
					path: PREVIEW_ROUTE,
					method: 'POST',
					data: {
						content: block( 'dev-test/cached', {
							label: 'Preview',
						} ),
					},
				} );
				expect( preview.status ).toBe( 200 );
				counts.push(
					preview.body.html.match( /data-render="(\d+)"/ )[ 1 ]
				);
			}

			expect( new Set( counts ).size ).toBe( 4 );
		} );

		test( 'answers REST routes from the cache', async ( {
			requestUtils,
		} ) => {
			await cacheRoute( requestUtils, '/invalidate', { method: 'POST' } );

			const admin = await cacheRoute( requestUtils, '/counted' );
			expect( admin.status ).toBe( 200 );
			expect( admin.body.user ).toBeGreaterThan( 0 );
			expect(
				( await cacheRoute( requestUtils, '/counted' ) ).body
			).toEqual( admin.body );

			// The user is a variant, the argument an input.
			const anonymous = await cacheRoute( requestUtils, '/counted', {
				as: 'anonymous',
			} );
			expect( anonymous.body.user ).toBe( 0 );
			expect( anonymous.body.count ).not.toBe( admin.body.count );
			const labeled = await cacheRoute( requestUtils, '/counted', {
				params: { label: 'x' },
			} );
			expect( labeled.body ).toMatchObject( { label: 'x', user: 1 } );
			expect( labeled.body.count ).not.toBe( admin.body.count );

			// One entry for everybody, but the permission check runs for every request.
			const allowed = await cacheRoute( requestUtils, '/protected' );
			expect( allowed.status ).toBe( 200 );
			expect(
				( await cacheRoute( requestUtils, '/protected' ) ).body
			).toEqual( allowed.body );
			expect(
				(
					await cacheRoute( requestUtils, '/protected', {
						as: 'anonymous',
					} )
				).status
			).toBe( 401 );

			const remembered = await cacheRoute( requestUtils, '/remembered' );
			expect(
				( await cacheRoute( requestUtils, '/remembered' ) ).body
			).toEqual( remembered.body );
			await cacheRoute( requestUtils, '/invalidate', { method: 'POST' } );
			expect(
				( await cacheRoute( requestUtils, '/remembered' ) ).body.count
			).not.toBe( remembered.body.count );
			expect(
				( await cacheRoute( requestUtils, '/counted' ) ).body.count
			).not.toBe( admin.body.count );
		} );
	} );
}
