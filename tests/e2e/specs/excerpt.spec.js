const { test, expect } = require( '../fixtures' );

const { block, cleanUp, createPost, restResponse } = require( '../helpers' );

/**
 * Automatic excerpts: text fields with excerpt: true (dev-test/hero topline and
 * headline, dev-test/paragraph), dev-test/section as excerpt wrapper.
 */
test.describe( 'Excerpts', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await cleanUp( requestUtils );
	} );

	const content = [
		block( 'dev-test/hero', {
			topline: 'Top & line',
			headline: 'Big <strong>news</strong>',
			buttons: [ { label: 'Not in excerpt', url: '' } ],
		} ),
		block( 'dev-test/paragraph', {}, 'Hello <em>world</em>' ),
		'<!-- wp:paragraph -->\n<p>Core text</p>\n<!-- /wp:paragraph -->',
		block(
			'dev-test/section',
			{},
			block( 'dev-test/hero', { topline: 'Inside the section' } )
		),
		block( 'dev-test/check', { text: 'Check has no excerpt fields' } ),
	].join( '\n\n' );

	const EXCERPT =
		'<p>Top &amp; line Big news Hello world Core text Inside the section</p>';

	async function excerptOf( requestUtils, id ) {
		const response = await restResponse( requestUtils, {
			path: `/wp/v2/posts/${ id }`,
		} );
		return response.body.excerpt.rendered.trim();
	}

	test( 'builds automatic excerpts from the marked fields in document order', async ( {
		page,
		requestUtils,
	} ) => {
		const id = await createPost( requestUtils, {
			title: 'E2E excerpt',
			content,
			status: 'publish',
		} );

		expect( await excerptOf( requestUtils, id ) ).toBe( EXCERPT );

		// The archive renders core/post-excerpt (templates/index.html).
		await page.goto( '/' );
		const excerpt = page
			.locator( '.wp-block-post-template > li' )
			.filter( { hasText: 'E2E excerpt' } )
			.locator( '.wp-block-post-excerpt__excerpt' );
		await expect( excerpt ).toHaveText(
			'Top & line Big news Hello world Core text Inside the section'
		);

		// The feed uses the same excerpt (WordPress writes entities as numeric references there).
		const feed = await ( await page.request.get( '/?feed=rss2' ) ).text();
		expect( feed ).toContain(
			'<description><![CDATA[Top &#38; line Big news Hello world Core text Inside the section]]></description>'
		);
	} );

	test( 'keeps manual excerpts and the excerpts of posts without framework blocks', async ( {
		requestUtils,
	} ) => {
		const manual = await createPost( requestUtils, {
			title: 'E2E',
			content,
			excerpt: 'Manual excerpt',
			status: 'draft',
		} );
		const core = await createPost( requestUtils, {
			title: 'E2E',
			content:
				'<!-- wp:paragraph -->\n<p>Only core</p>\n<!-- /wp:paragraph -->',
			status: 'draft',
		} );

		expect( await excerptOf( requestUtils, manual ) ).toBe(
			'<p>Manual excerpt</p>'
		);
		expect( await excerptOf( requestUtils, core ) ).toBe(
			'<p>Only core</p>'
		);
	} );
} );
