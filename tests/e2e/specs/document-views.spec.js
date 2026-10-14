/**
 * Step 26: document views (assets/*.view.js) on every page of the front end,
 * view data set in PHP (also by a cached block, set again by a cache hit), a
 * shared module with one instance for all views of the page, loadScript() and
 * the mount order (document views before the views of blocks).
 */
const { test, expect } = require( '../fixtures' );

const { block, cleanUp, createPost } = require( '../helpers' );

const DOCUMENT_VIEW = '#theme-dev-test-document-document-view-js';

test.describe( 'Document views', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await cleanUp( requestUtils );
	} );

	test( 'run on every page with view data from PHP and an external script', async ( {
		page,
	} ) => {
		await page.goto( '/' );

		const html = page.locator( 'html' );
		await expect( html ).toHaveAttribute(
			'data-dev-test-document',
			'Hello from PHP'
		);
		await expect( html ).toHaveAttribute( 'data-dev-test-order', '1' );
		await expect( html ).toHaveAttribute(
			'data-dev-test-external',
			'loaded'
		);
		await expect(
			page.locator( 'script[data-dev-test="external"]' )
		).toHaveCount( 1 );
		await expect( page.locator( DOCUMENT_VIEW ) ).toHaveAttribute(
			'defer',
			''
		);
	} );

	test( 'mount before the views of blocks, which share the module and read view data of a cached render', async ( {
		page,
		requestUtils,
	} ) => {
		const id = await createPost( requestUtils, {
			title: 'E2E document views',
			content: block( 'dev-test/cached', { label: 'Document views' } ),
			status: 'publish',
		} );

		for ( const visit of [ 'rendered', 'from the cache' ] ) {
			await page.goto( `/?p=${ id }` );
			const cached = page.locator( '.cached' );
			await expect( cached, visit ).toHaveAttribute( 'data-order', '2' );
			const render = await cached.getAttribute( 'data-render' );
			await expect( cached, visit ).toHaveAttribute(
				'data-view-data',
				render
			);
			await expect( page.locator( 'html' ), visit ).toHaveAttribute(
				'data-dev-test-order',
				'1'
			);
		}
	} );

	test( 'do not load in the editor', async ( { admin, page } ) => {
		await admin.createNewPost();

		await expect( page.locator( DOCUMENT_VIEW ) ).toHaveCount( 0 );
		await expect( page.locator( 'html' ) ).not.toHaveAttribute(
			'data-dev-test-document'
		);
	} );
} );
