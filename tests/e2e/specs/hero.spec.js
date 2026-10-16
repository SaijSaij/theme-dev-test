/**
 * The hero (src/Block/Hero/): limits of lists (#[ListOf] with max) in the
 * inspector, a stored list beyond the limit in the canvas, the inspector and
 * on the front end, and colors (#[Color]) with the theme's palette and
 * transparency.
 */
const { test, expect } = require( '../fixtures' );

const {
	block,
	cleanUp,
	createDraft,
	openBlockSettings,
	openPostWith,
	screenshot,
	storedContent,
} = require( '../helpers' );

/** Background of the hero without color (surface-light: contrast of theme.json) and with the palette's "Primary". */
const CONTRAST = 'rgb(250, 250, 250)';
const PRIMARY = 'rgb(30, 77, 140)';

/** Four badges and buttons: one more than #[ListOf(max: 3)] allows. */
const OVERFULL = {
	headline: 'Overfull',
	backgroundColor: '#1e4d8c80',
	badges: [
		{ text: 'One', icon: 'star' },
		{ text: 'Two', icon: 'check' },
		{ text: 'Three', icon: 'clock' },
		{ text: 'Four', icon: 'star' },
	],
	buttons: [
		{ label: 'A', url: '' },
		{ label: 'B', url: '' },
		{ label: 'C', url: '' },
		{ label: 'D', url: '' },
	],
};

/**
 * The list control of the inspector with the given label.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string}                          label "Badges" or "Buttons".
 */
function listControl( page, label ) {
	return page.locator( '.wp-app-framework-list' ).filter( {
		has: page.getByRole( 'button', { name: `Add item to ${ label }` } ),
	} );
}

/**
 * The attributes of the only block of a post.
 *
 * @param {Object} requestUtils
 * @param {number} id
 */
async function storedHero( requestUtils, id ) {
	const content = await storedContent( requestUtils, id );
	return JSON.parse(
		content.match( /^<!-- wp:dev-test\/hero (\{.*\}) \/-->$/ )[ 1 ]
	);
}

test.describe( 'Hero', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await cleanUp( requestUtils );
	} );

	test( 'renders full width with badges, buttons and a transparent background color', async ( {
		page,
		requestUtils,
	} ) => {
		const id = await createDraft(
			requestUtils,
			block( 'dev-test/hero', OVERFULL )
		);

		await page.goto( `/?p=${ id }&preview=true` );
		const hero = page.locator( '.wp-block-dev-test-hero' );
		await expect( hero ).toHaveClass( /alignfull/ );
		await expect( hero ).toHaveCSS(
			'background-color',
			/^rgba\(30, 77, 140, 0\.50?2?\)$/
		);
		// Only the first three items of each list reach the template.
		await expect( hero.locator( '.hero__badge' ) ).toHaveText( [
			'One',
			'Two',
			'Three',
		] );
		await expect( hero.locator( '.hero__badge--check svg' ) ).toHaveCount(
			1
		);
		await expect( hero.locator( '.hero__button' ) ).toHaveText( [
			'A',
			'B',
			'C',
		] );
		await screenshot( hero, 'hero-front-badges' );
	} );

	test( 'keeps a stored list beyond its limit and marks the unused items', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const id = await openPostWith(
			{ admin, editor, requestUtils },
			block( 'dev-test/hero', OVERFULL )
		);
		const hero = editor.canvas.locator( '[data-type="dev-test/hero"]' );
		await expect( hero.locator( '.hero__badge' ) ).toHaveCount( 3 );
		await expect( hero.locator( '.hero__button' ) ).toHaveCount( 3 );

		await hero.locator( '.hero__headline' ).click();
		await editor.openDocumentSettingsSidebar();
		const badges = listControl( page, 'Badges' );
		await expect(
			badges.locator( '.wp-app-framework-list__title' )
		).toHaveText( [ 'One', 'Two', 'Three', 'Four (unused)' ] );
		await expect( badges.locator( '.is-unused' ) ).toHaveCount( 1 );
		await expect(
			badges.locator( '.wp-app-framework-list__notice' )
			// The notice starts with "Warning notice" for screen readers.
		).toContainText(
			'4 items, but at most 3 allowed: only the first 3 are used. Remove 1.'
		);
		await expect(
			page.getByRole( 'button', { name: 'Add item to Badges' } )
		).toBeDisabled();
		await screenshot( badges, 'hero-unused-badge' );

		// Nothing changes until an editor removes items: the post is not edited.
		expect(
			await page.evaluate( () => ( {
				dirty: window.wp.data
					.select( 'core/editor' )
					.isEditedPostDirty(),
				badges: window.wp.data
					.select( 'core/block-editor' )
					.getBlocks()[ 0 ].attributes.badges.length,
			} ) )
		).toEqual( { dirty: false, badges: 4 } );

		await badges
			.getByRole( 'button', { name: 'Actions for item 4' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Remove' } ).click();
		await expect(
			badges.locator( '.wp-app-framework-list__notice' )
		).toHaveCount( 0 );
		await expect( badges.locator( '.is-unused' ) ).toHaveCount( 0 );
		await expect( hero.locator( '.hero__badge' ) ).toHaveText( [
			'One',
			'Two',
			'Three',
		] );

		await editor.saveDraft();
		const attributes = await storedHero( requestUtils, id );
		expect( attributes.badges.map( ( badge ) => badge.text ) ).toEqual( [
			'One',
			'Two',
			'Three',
		] );
		expect( attributes.buttons ).toHaveLength( 4 );
	} );

	test( 'adds badges up to the limit, edits them in the canvas and chooses icon and color', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const id = await openPostWith(
			{ admin, editor, requestUtils },
			block( 'dev-test/hero', { headline: 'Badges' } )
		);
		const hero = editor.canvas.locator( '[data-type="dev-test/hero"]' );
		await hero.locator( '.hero__headline' ).click();
		await editor.openDocumentSettingsSidebar();

		const add = page.getByRole( 'button', { name: 'Add item to Badges' } );
		await add.click();
		const text = hero.locator( '.hero__badge-text' );
		await expect( text ).toHaveAttribute( 'contenteditable', 'true' );
		await text.click();
		await page.keyboard.type( 'Fast' );
		await expect(
			listControl( page, 'Badges' ).locator(
				'.wp-app-framework-list__title'
			)
		).toHaveText( [ 'Fast' ] );

		await page
			.getByRole( 'combobox', { name: 'Icon' } )
			.selectOption( 'clock' );
		await expect( hero.locator( '.hero__badge--clock' ) ).toHaveText(
			'Fast'
		);

		await add.click();
		await add.click();
		await expect( hero.locator( '.hero__badge' ) ).toHaveCount( 3 );
		await expect( add ).toBeDisabled();

		// The palette of theme.json; a click on the chosen color clears it.
		await openBlockSettings( page, editor );
		const primary = page.getByRole( 'option', { name: 'Primary' } );
		await primary.click();
		await expect( hero ).toHaveCSS( 'background-color', PRIMARY );
		await screenshot(
			page.getByRole( 'region', { name: 'Editor settings' } ),
			'inspector-hero-color'
		);
		await editor.saveDraft();
		let attributes = await storedHero( requestUtils, id );
		expect( attributes.backgroundColor ).toBe( '#1e4d8c' );
		expect( attributes.badges ).toEqual( [
			{ text: 'Fast', icon: 'clock' },
			{ text: '', icon: 'star' },
			{ text: '', icon: 'star' },
		] );

		await primary.click();
		await expect( hero ).toHaveCSS( 'background-color', CONTRAST );
		await editor.saveDraft();
		attributes = await storedHero( requestUtils, id );
		expect( attributes ).not.toHaveProperty( 'backgroundColor' );
	} );
} );
