const { test, expect } = require( '../fixtures' );

const {
	cleanUp,
	createPost,
	openPostWith,
	pluginActive,
} = require( '../helpers' );

/**
 * Block templates, template parts and patterns of the theme, which the build
 * checks against its blocks (templates/single-post-e2e-patterns.html,
 * parts/header.html, patterns/hero-section.php). The template also holds a
 * block of the test plugin, which the build of the theme does not check.
 */
test.describe( 'Templates, parts and patterns', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await cleanUp( requestUtils );
	} );

	test( 'render on the front end', async ( { page, requestUtils } ) => {
		// WordPress picks single-post-{slug}.html for the post with this slug.
		const id = await createPost( requestUtils, {
			title: 'E2E patterns',
			slug: 'e2e-patterns',
			content:
				'<!-- wp:paragraph -->\n<p>Post content</p>\n<!-- /wp:paragraph -->',
			status: 'publish',
		} );
		await page.goto( `/?p=${ id }` );

		// Template part with a block of the theme.
		await expect( page.locator( 'header .paragraph--lead' ) ).toHaveText(
			'Framework test theme'
		);
		// Pattern: blocks of the theme, PHP output in a paragraph and in a core block.
		await expect( page.locator( '.section .hero__topline' ) ).toHaveText(
			'Pattern topline'
		);
		await expect(
			page.getByText( 'Paragraph from a pattern' )
		).toBeVisible();
		await expect( page.locator( 'h2.is-pattern-heading' ) ).toHaveText(
			'Core heading from a pattern'
		);
		await expect( page.getByText( 'Post content' ) ).toBeVisible();

		// Without the plugin, WordPress renders nothing for its block.
		await expect( page.getByText( 'Note from the plugin' ) ).toHaveCount(
			( await pluginActive( requestUtils ) ) ? 1 : 0
		);
	} );

	test( 'a pattern is editable in contentOnly mode', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await openPostWith(
			{ admin, editor, requestUtils },
			'<!-- wp:pattern {"slug":"dev-test/hero-section"} /-->'
		);
		const hero = editor.canvas.locator( '[data-type="dev-test/hero"]' );
		await expect( hero.locator( '.hero__topline' ) ).toHaveText(
			'Pattern topline'
		);

		const state = await page.evaluate( () => {
			const store = window.wp.data.select( 'core/block-editor' );
			const [ group ] = store.getBlocks();
			const [ section ] = group.innerBlocks;
			const [ inner ] = section.innerBlocks;
			return {
				pattern: group.attributes.metadata?.patternName,
				section: store.getBlockEditingMode( section.clientId ),
				hero: store.getBlockEditingMode( inner.clientId ),
				insert: store.canInsertBlockType(
					'dev-test/hero',
					section.clientId
				),
			};
		} );
		// A pattern with a single top-level block becomes a contentOnly section when it is inserted (parsePattern() in
		// the block editor); dev-test/section has contentRole, so heroes can be added to it.
		expect( state ).toEqual( {
			pattern: 'dev-test/hero-section',
			section: 'contentOnly',
			hero: 'contentOnly',
			insert: true,
		} );

		await hero.locator( '.hero__topline' ).click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' edited' );
		await expect( hero.locator( '.hero__topline' ) ).toHaveText(
			'Pattern topline edited'
		);
	} );
} );
