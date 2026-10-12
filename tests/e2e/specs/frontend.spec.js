/**
 * Step 14: view scripts (front-end scripts) of blocks and block supports –
 * loaded only with the blocks, one view per root element, the preview in the
 * editor with mount and cleanup, and toolbar buttons (src/Block/Faq/,
 * src/Support/Reveal.*, src/Block/RevealBox/).
 */
const { test, expect } = require( '../fixtures' );

const {
	activeTheme,
	block,
	cleanUp,
	createDraft,
	createPost,
	openPostWith,
} = require( '../helpers' );

const VIEW_RUNTIME = '#theme-dev-test-wp-app-framework-view-js';
const FAQ_SCRIPT = '#theme-dev-test-dev-test-faq-view-js';
const REVEAL_SCRIPT = '#theme-dev-test-support-reveal-view-js';

/**
 * The life cycle the view scripts recorded in the window of an element (the canvas iframe in the editor).
 *
 * @param {import('@playwright/test').Locator} locator
 * @return {Promise<string[]>} Log.
 */
function viewLog( locator ) {
	return locator.evaluate(
		( element ) => element.ownerDocument.defaultView.devTestViewLog ?? []
	);
}

/**
 * The button of the block toolbar with the given name.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string}                          name
 * @return {import('@playwright/test').Locator} Button.
 */
function toolbarButton( page, name ) {
	return page
		.getByRole( 'toolbar', { name: 'Block tools' } )
		.getByRole( 'button', { name, exact: true } );
}

test.describe( 'View scripts', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await cleanUp( requestUtils );
	} );

	test( 'load only on pages that render their blocks', async ( {
		page,
		requestUtils,
	} ) => {
		const withViews = await createDraft(
			requestUtils,
			[
				block( 'dev-test/faq', { question: 'One', reveal: true } ),
				block( 'dev-test/reveal-box', { text: 'Box' } ),
				block( 'dev-test/faq', { question: 'Two' } ),
			].join( '\n\n' )
		);
		const withoutViews = await createDraft(
			requestUtils,
			block( 'dev-test/card', { title: 'No views' } )
		);

		await page.goto( `/?p=${ withViews }&preview=true` );
		await expect( page.locator( VIEW_RUNTIME ) ).toHaveCount( 1 );
		await expect( page.locator( FAQ_SCRIPT ) ).toHaveCount( 1 );
		// The support's script once, although three blocks use the support.
		await expect( page.locator( REVEAL_SCRIPT ) ).toHaveCount( 1 );
		for ( const script of [ VIEW_RUNTIME, FAQ_SCRIPT, REVEAL_SCRIPT ] ) {
			await expect( page.locator( script ) ).toHaveAttribute(
				'defer',
				''
			);
		}

		await page.goto( `/?p=${ withoutViews }&preview=true` );
		await expect( page.locator( '.wp-block-dev-test-card' ) ).toHaveCount(
			1
		);
		await expect(
			page.locator(
				`${ VIEW_RUNTIME }, ${ FAQ_SCRIPT }, ${ REVEAL_SCRIPT }`
			)
		).toHaveCount( 0 );
	} );

	test( 'load nothing for automatic excerpts', async ( {
		page,
		requestUtils,
	} ) => {
		await createPost( requestUtils, {
			title: 'E2E excerpt',
			content: block( 'dev-test/faq', {
				question: 'Excerpt question',
				reveal: true,
			} ),
			status: 'publish',
		} );

		// The archive (templates/index.html) shows automatic excerpts (core/post-excerpt).
		await page.goto( '/' );
		await expect(
			page.getByText( 'Excerpt question' ).first()
		).toBeVisible();
		await expect(
			page.locator(
				`${ VIEW_RUNTIME }, ${ FAQ_SCRIPT }, ${ REVEAL_SCRIPT }`
			)
		).toHaveCount( 0 );
	} );

	test( 'mount one view per block on the front end', async ( {
		page,
		requestUtils,
	} ) => {
		const id = await createDraft(
			requestUtils,
			[
				block( 'dev-test/faq', {
					question: 'One',
					answer: 'First answer',
					reveal: true,
				} ),
				block( 'dev-test/faq', {
					question: 'Two',
					answer: 'Second answer',
					open: true,
				} ),
				block( 'dev-test/reveal-box', { text: 'Box' } ),
			].join( '\n\n' )
		);

		await page.goto( `/?p=${ id }&preview=true` );
		const faqs = page.locator( '.wp-block-dev-test-faq' );
		const box = page.locator( '.wp-block-dev-test-reveal-box' );
		await expect( faqs.nth( 0 ) ).toHaveAttribute(
			'data-revealed',
			'true'
		);
		await expect( faqs.nth( 1 ) ).toHaveAttribute(
			'data-revealed',
			'false'
		);
		await expect( box ).toHaveAttribute( 'data-revealed', 'true' );

		// Server-rendered state, then each block on its own.
		await expect( faqs.nth( 0 ).locator( '.faq__answer' ) ).toBeHidden();
		await expect( faqs.nth( 1 ).locator( '.faq__answer' ) ).toBeVisible();
		await faqs.nth( 0 ).getByRole( 'button', { name: 'One' } ).click();
		await expect( faqs.nth( 0 ).locator( '.faq__answer' ) ).toBeVisible();
		await expect(
			faqs.nth( 0 ).getByRole( 'button', { name: 'One' } )
		).toHaveAttribute( 'aria-expanded', 'true' );
		await expect( faqs.nth( 1 ).locator( '.faq__answer' ) ).toBeVisible();
		await faqs.nth( 1 ).getByRole( 'button', { name: 'Two' } ).click();
		await expect( faqs.nth( 1 ).locator( '.faq__answer' ) ).toBeHidden();

		expect( await viewLog( box ) ).toEqual( [
			'faq mount',
			'reveal true',
			'faq mount',
			'reveal false',
			'reveal true',
			'faq open',
			'faq close',
		] );
	} );

	test( 'run in the editor only in the preview of a block', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await openPostWith(
			{ admin, editor, requestUtils },
			[
				block( 'dev-test/faq', {
					question: 'Why?',
					answer: 'Because.',
				} ),
				block( 'dev-test/card', { title: 'No views' } ),
			].join( '\n\n' )
		);
		const faq = editor.canvas.locator( '[data-type="dev-test/faq"]' );
		const question = faq.locator( '.faq__question' );

		// Without the preview, the view does not run and the fields are edited inline.
		await expect( question ).toHaveAttribute( 'contenteditable', 'true' );
		await expect( faq.locator( '.faq__answer' ) ).toBeVisible();
		expect( await viewLog( faq ) ).toEqual( [] );

		// Only blocks with view scripts offer the preview.
		await editor.canvas
			.locator( '[data-type="dev-test/card"] .card__title' )
			.click();
		await expect( toolbarButton( page, 'Preview' ) ).toHaveCount( 0 );

		await question.click();
		await toolbarButton( page, 'Preview' ).click();
		await expect( toolbarButton( page, 'Preview' ) ).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		// The front-end markup: the answer is closed, nothing is editable.
		await expect( faq.locator( '.faq__answer' ) ).toBeHidden();
		await expect( question ).not.toHaveAttribute( 'contenteditable' );
		await question.click();
		await expect( faq.locator( '.faq__answer' ) ).toBeVisible();
		await expect( question ).toHaveAttribute( 'aria-expanded', 'true' );
		expect( await viewLog( faq ) ).toEqual( [
			'faq mount (preview)',
			'reveal false',
			'faq open (preview)',
		] );

		// A changed attribute renders the preview again and mounts a new view; the old one is gone.
		await toolbarButton( page, 'Open by default' ).click();
		await expect
			.poll( () => viewLog( faq ) )
			.toEqual( [
				'faq mount (preview)',
				'reveal false',
				'faq open (preview)',
				'faq unmount (preview)',
				'faq mount (preview)',
				'reveal false',
			] );
		await expect( faq.locator( '.faq__answer' ) ).toBeVisible();
		await question.click();
		await expect( faq.locator( '.faq__answer' ) ).toBeHidden();
		expect( ( await viewLog( faq ) ).slice( -1 ) ).toEqual( [
			'faq close (preview)',
		] );

		// Leaving the preview unmounts the view and restores inline editing.
		await toolbarButton( page, 'Preview' ).click();
		await expect( question ).toHaveAttribute( 'contenteditable', 'true' );
		expect( ( await viewLog( faq ) ).slice( -1 ) ).toEqual( [
			'faq unmount (preview)',
		] );

		// Removing a block in preview unmounts its view.
		await question.click();
		await toolbarButton( page, 'Preview' ).click();
		await expect( question ).not.toHaveAttribute( 'contenteditable' );
		const before = ( await viewLog( faq ) ).length;
		const log = editor.canvas.locator( 'body' );
		await page.evaluate( () => {
			const store = window.wp.data.select( 'core/block-editor' );
			const [ faqBlock ] = store
				.getBlocks()
				.filter( ( { name } ) => name === 'dev-test/faq' );
			window.wp.data
				.dispatch( 'core/block-editor' )
				.removeBlocks( [ faqBlock.clientId ] );
		} );
		await expect( faq ).toHaveCount( 0 );
		expect( ( await viewLog( log ) ).slice( before ) ).toEqual( [
			'faq unmount (preview)',
		] );
	} );

	test( 'add toolbar buttons with registerToolbarButton', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await openPostWith(
			{ admin, editor, requestUtils },
			block( 'dev-test/faq', { question: 'Why?', answer: 'Because.' } )
		);
		await editor.canvas
			.locator( '[data-type="dev-test/faq"] .faq__question' )
			.click();

		await toolbarButton( page, 'Open by default' ).click();
		await expect(
			toolbarButton( page, 'Closed by default' )
		).toHaveAttribute( 'aria-pressed', 'true' );
		const [ attributes ] = await page.evaluate( () =>
			window.wp.data
				.select( 'core/block-editor' )
				.getBlocks()
				.map( ( { attributes: values } ) => values )
		);
		expect( attributes.open ).toBe( true );
	} );

	test( 'preview blocks in the site editor', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const { stylesheet } = await activeTheme( requestUtils );
		await admin.visitSiteEditor( {
			postId: `${ stylesheet }//index`,
			postType: 'wp_template',
			canvas: 'edit',
		} );
		await editor.insertBlock( {
			name: 'dev-test/faq',
			attributes: { question: 'Template?', answer: 'Yes.' },
		} );

		const faq = editor.canvas.locator( '[data-type="dev-test/faq"]' );
		await faq.locator( '.faq__question' ).click();
		await toolbarButton( page, 'Preview' ).click();
		await expect( faq.locator( '.faq__answer' ) ).toBeHidden();
		await faq.locator( '.faq__question' ).click();
		await expect( faq.locator( '.faq__answer' ) ).toBeVisible();
	} );
} );
