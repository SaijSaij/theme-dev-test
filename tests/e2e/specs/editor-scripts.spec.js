/**
 * Step 26: editor scripts without a block (assets/*.editor.js), loaded in the
 * block editor after the runtime, with view data set in PHP; not on the front end.
 */
const { test, expect } = require( '../fixtures' );

const EDITOR_SCRIPT = '#theme-dev-test-document-editor-highlight-editor-js';

test.describe( 'Editor scripts without a block', () => {
	test( 'register a RichText format titled with view data', async ( {
		admin,
		page,
	} ) => {
		await admin.createNewPost();

		await expect( page.locator( EDITOR_SCRIPT ) ).toHaveCount( 1 );
		expect(
			await page.evaluate(
				() =>
					window.wp.data
						.select( 'core/rich-text' )
						.getFormatType( 'dev-test/highlight' )?.title
			)
		).toBe( 'Dev test highlight' );
	} );

	test( 'do not load on the front end', async ( { page } ) => {
		await page.goto( '/' );

		await expect( page.locator( EDITOR_SCRIPT ) ).toHaveCount( 0 );
	} );
} );
