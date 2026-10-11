/**
 * References to posts, terms and users (#[PostReference], #[TermReference],
 * #[UserReference]) in the block dev-test/references: resolution on the front
 * end, drafts in the editor, the search controls in the inspector.
 */
const { test, expect } = require( '../fixtures' );

const {
	block,
	cleanUp,
	createPost,
	openPostWith,
	restResponse,
	screenshot,
} = require( '../helpers' );

const BLOCK = 'dev-test/references';

test.describe( 'References', () => {
	const pages = [];
	const terms = [];

	/**
	 * Creates a page; deleted after the test.
	 *
	 * @param {Object} requestUtils
	 * @param {string} title
	 * @param {string} status
	 * @return {Promise<number>} Page ID.
	 */
	async function createPage( requestUtils, title, status = 'publish' ) {
		const page = await requestUtils.createPage( { title, status } );
		pages.push( page.id );
		return page.id;
	}

	/**
	 * Creates a category; deleted after the test.
	 *
	 * @param {Object} requestUtils
	 * @param {string} name
	 * @return {Promise<number>} Term ID.
	 */
	async function createCategory( requestUtils, name ) {
		const term = await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/categories',
			data: { name },
		} );
		terms.push( term.id );
		return term.id;
	}

	/**
	 * Selects the first block: without values the block renders empty elements only.
	 *
	 * @param {import('@playwright/test').Page} page
	 */
	async function selectFirstBlock( page ) {
		await page.evaluate( () => {
			const { getBlocks } = window.wp.data.select( 'core/block-editor' );
			window.wp.data
				.dispatch( 'core/block-editor' )
				.selectBlock( getBlocks()[ 0 ].clientId );
		} );
	}

	test.afterEach( async ( { requestUtils } ) => {
		await cleanUp( requestUtils );
		while ( pages.length > 0 ) {
			await requestUtils.rest( {
				method: 'DELETE',
				path: `/wp/v2/pages/${ pages.pop() }`,
				params: { force: true },
			} );
		}
		while ( terms.length > 0 ) {
			await requestUtils.rest( {
				method: 'DELETE',
				path: `/wp/v2/categories/${ terms.pop() }`,
				params: { force: true },
			} );
		}
	} );

	test( 'resolve existing, allowed and public objects on the front end', async ( {
		page,
		requestUtils,
	} ) => {
		const target = await createPage( requestUtils, 'Target & page' );
		const draft = await createPage( requestUtils, 'Draft page', 'draft' );
		const listed = await createPost( requestUtils, {
			title: 'Listed post',
			status: 'publish',
		} );
		const topic = await createCategory( requestUtils, 'Food & drink' );
		const id = await createPost( requestUtils, {
			title: 'References',
			status: 'publish',
			content: [
				block( BLOCK, {
					page: target,
					posts: [ listed, 999999, draft, target ],
					topic,
					author: 1,
				} ),
				// A post where a page is expected, a draft, a missing user.
				block( BLOCK, { page: listed, posts: [], author: 999999 } ),
				block( BLOCK, { page: draft } ),
			].join( '\n' ),
		} );

		await page.goto( `/?p=${ id }` );
		const [ first, second, third ] = await page
			.locator( '.references' )
			.all();
		await expect( first.locator( '.references__page a' ) ).toHaveText(
			'Target & page'
		);
		await expect( first.locator( '.references__page a' ) ).toHaveAttribute(
			'href',
			new RegExp( `(page_id=${ target }|/target-page/)` )
		);
		// The missing post and the draft are left out of the list.
		await expect( first.locator( '.references__posts li' ) ).toHaveText( [
			'Listed post',
			'Target & page',
		] );
		await expect( first.locator( '.references__topic a' ) ).toHaveText(
			'Food & drink'
		);
		await expect( first.locator( '.references__author' ) ).toHaveText(
			'admin'
		);
		await expect( second.locator( '.references__page' ) ).toHaveText( '' );
		await expect( second.locator( '.references__author' ) ).toHaveText(
			''
		);
		await expect( third.locator( '.references__page' ) ).toHaveText( '' );

		// Only the IDs are stored.
		const stored = await requestUtils.rest( {
			path: `/wp/v2/posts/${ id }`,
			params: { context: 'edit' },
		} );
		expect( stored.content.raw ).toContain(
			`<!-- wp:${ BLOCK } {"page":${ target },`
		);
	} );

	test( 'show drafts in the editor', async ( {
		admin,
		editor,
		requestUtils,
	} ) => {
		const draft = await createPage( requestUtils, 'Draft page', 'draft' );
		await openPostWith(
			{ admin, editor, requestUtils },
			block( BLOCK, { page: draft } )
		);
		await expect(
			editor.canvas.locator(
				`[data-type="${ BLOCK }"] .references__page`
			)
		).toHaveText( 'Draft page' );
	} );

	test( 'choose posts, a term and a user with the search in the inspector', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const target = await createPage( requestUtils, 'Target page' );
		const second = await createPage( requestUtils, 'Second page' );
		const listed = await createPost( requestUtils, {
			title: 'Listed post',
			status: 'publish',
		} );
		const topic = await createCategory( requestUtils, 'Searchable topic' );
		await openPostWith( { admin, editor, requestUtils }, block( BLOCK ) );
		await selectFirstBlock( page );
		await editor.openDocumentSettingsSidebar();
		const sidebar = page.getByRole( 'region', { name: 'Editor settings' } );

		await sidebar
			.getByRole( 'combobox', { name: 'Page' } )
			.fill( 'Target' );
		await page.getByRole( 'option', { name: 'Target page' } ).click();

		const add = sidebar.getByRole( 'combobox', { name: 'Add to Posts' } );
		await add.fill( 'Listed' );
		await page.getByRole( 'option', { name: 'Listed post' } ).click();
		await add.fill( 'Second' );
		await page.getByRole( 'option', { name: 'Second page' } ).click();

		await sidebar
			.getByRole( 'combobox', { name: 'Topic' } )
			.fill( 'Searchable' );
		await page.getByRole( 'option', { name: 'Searchable topic' } ).click();
		await sidebar.getByRole( 'combobox', { name: 'Author' } ).fill( 'adm' );
		await page.getByRole( 'option', { name: 'admin' } ).click();

		const attributes = () =>
			page.evaluate(
				() =>
					window.wp.data
						.select( 'core/block-editor' )
						.getBlocks()[ 0 ].attributes
			);
		await expect.poll( attributes ).toEqual(
			expect.objectContaining( {
				page: target,
				posts: [ listed, second ],
				topic,
				author: 1,
			} )
		);
		// Re-rendered on the server with the chosen objects.
		await expect(
			editor.canvas.locator(
				`[data-type="${ BLOCK }"] .references__posts li`
			)
		).toHaveText( [ 'Listed post', 'Second page' ] );

		await screenshot( sidebar, 'references-inspector' );

		// Reorder and remove in the list.
		await sidebar
			.getByRole( 'button', { name: 'Actions for Second page' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Move up' } ).click();
		await expect
			.poll( async () => ( await attributes() ).posts )
			.toEqual( [ second, listed ] );
		await sidebar
			.getByRole( 'button', { name: 'Actions for Listed post' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Remove' } ).click();
		await expect
			.poll( async () => ( await attributes() ).posts )
			.toEqual( [ second ] );

		// The stored ID shows its title after reloading.
		await editor.saveDraft();
		await page.reload();
		await expect(
			editor.canvas.locator( `[data-type="${ BLOCK }"]` )
		).toHaveCount( 1 );
		await selectFirstBlock( page );
		await editor.openDocumentSettingsSidebar();
		await expect(
			page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'combobox', { name: 'Page' } )
		).toHaveValue( 'Target page' );
	} );

	test( 'are content in the block schema', async ( { requestUtils } ) => {
		const response = await restResponse( requestUtils, {
			path: '/wp/v2/block-types/dev-test/references',
		} );
		expect( response.body.attributes.page ).toEqual( {
			type: [ 'integer', 'null' ],
			role: 'content',
		} );
		expect( response.body.attributes.posts ).toEqual( {
			type: 'array',
			items: { type: 'integer' },
			default: [],
			role: 'content',
		} );
	} );
} );
