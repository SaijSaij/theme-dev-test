/**
 * The hero (src/Block/Hero/): limits of lists (#[ListOf] with max) in the
 * inspector, a stored list beyond the limit in the canvas, the inspector and
 * on the front end, colors (#[Color]) with the theme's palette and
 * transparency, and the background image chosen in the inspector.
 */
const { test, expect } = require( '../fixtures' );

const path = require( 'path' );

const {
	block,
	cleanUp,
	createDraft,
	openBlockSettings,
	openPostWith,
	screenshot,
	storedContent,
	uploadImage,
} = require( '../helpers' );

const IMAGE = path.join( __dirname, '../assets/image.png' );

/** Background of the hero without color (surface-light: contrast of theme.json) and with the palette's "Primary". */
const CONTRAST = 'rgb(250, 250, 250)';
const PRIMARY = 'rgb(30, 77, 140)';

/** Stored badges and buttons, in the canvas without the new item of the appender. */
const BADGES = '.hero__badge:not(.wp-app-framework-ghost)';
const BADGE_TEXTS = `${ BADGES } .hero__badge-text`;
const BUTTONS = '.hero__button:not(.wp-app-framework-ghost)';
const GHOST = '.wp-app-framework-ghost';

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
		await expect( hero.locator( BADGES ) ).toHaveText( [
			'One',
			'Two',
			'Three',
		] );
		await expect( hero.locator( '.hero__badge--check svg' ) ).toHaveCount(
			1
		);
		await expect( hero.locator( BUTTONS ) ).toHaveText( [ 'A', 'B', 'C' ] );
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
		await expect( hero.locator( BADGES ) ).toHaveCount( 3 );
		await expect( hero.locator( BUTTONS ) ).toHaveCount( 3 );

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
		await expect( hero.locator( BADGES ) ).toHaveText( [
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
		const text = hero.locator( BADGE_TEXTS );
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
		await expect( hero.locator( BADGES ) ).toHaveCount( 3 );
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

	test( 'chooses the background image in the inspector and shows the block as it looks', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const imageId = await uploadImage( requestUtils, IMAGE );
		await openPostWith(
			{ admin, editor, requestUtils },
			block( 'dev-test/hero', { headline: 'Image' } )
		);
		const hero = editor.canvas.locator( '[data-type="dev-test/hero"]' );
		await expect( hero.locator( '.hero__headline' ) ).toHaveAttribute(
			'contenteditable',
			'true'
		);
		// #[Image(inspector: true)]: no media placeholder covers the block.
		await expect( hero.locator( '.hero__image' ) ).toHaveCount( 0 );
		await expect(
			hero.getByRole( 'button', { name: 'Upload' } )
		).toHaveCount( 0 );

		await hero.locator( '.hero__headline' ).click();
		await editor.openDocumentSettingsSidebar();
		await page
			.getByRole( 'button', { name: 'Select Background image' } )
			.click();
		const library = page.getByRole( 'dialog' );
		await library.getByRole( 'tab', { name: 'Media Library' } ).click();
		await library
			.locator( `li.attachment[data-id="${ imageId }"]` )
			.click();
		await library
			.getByRole( 'button', { name: 'Select', exact: true } )
			.click();

		await expect( hero.locator( '.hero__image img' ) ).toBeVisible();
		await expect( hero.locator( '.hero__headline' ) ).toBeVisible();
		await screenshot( hero, 'hero-background-image' );

		await page
			.getByRole( 'button', { name: 'Remove Background image' } )
			.click();
		await expect( hero.locator( '.hero__image' ) ).toHaveCount( 0 );
	} );

	test( 'adds badges and buttons in the canvas through their new item', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const id = await openPostWith(
			{ admin, editor, requestUtils },
			block( 'dev-test/hero', {
				headline: 'Appender',
				buttons: [
					{ label: 'A', url: '' },
					{ label: 'B', url: '' },
				],
			} )
		);
		const hero = editor.canvas.locator( '[data-type="dev-test/hero"]' );
		const badgeGhost = hero.getByRole( 'button', {
			name: 'Add item to Badges',
		} );
		const buttonGhost = hero.getByRole( 'button', {
			name: 'Add item to Buttons',
		} );
		// Each list shows one new item, faded, with the labels of its fields as placeholders.
		await expect( badgeGhost ).toHaveClass( /hero__badge/ );
		await expect( badgeGhost ).toHaveText( 'Text' );
		await expect( buttonGhost ).toHaveClass( /hero__button/ );
		await expect( buttonGhost ).toHaveText( 'Label' );
		await expect( buttonGhost ).toHaveCSS( 'opacity', '0.45' );
		await screenshot( hero, 'hero-appender' );

		// Nothing is stored until the new item is clicked.
		const stored = () =>
			page.evaluate(
				() =>
					window.wp.data
						.select( 'core/block-editor' )
						.getBlocks()[ 0 ].attributes
			);
		expect( ( await stored() ).badges ).toEqual( [] );
		expect( ( await stored() ).buttons ).toHaveLength( 2 );

		// A click adds the item and focuses its first field.
		await badgeGhost.click();
		const text = hero.locator( BADGE_TEXTS );
		await expect( text ).toHaveCount( 1 );
		await expect( text ).toBeFocused();
		await page.keyboard.type( 'Fast' );
		await expect( text ).toHaveText( 'Fast' );
		// The inspector expands the added item.
		await editor.openDocumentSettingsSidebar();
		await expect(
			page.getByRole( 'button', { name: 'Fast', exact: true } )
		).toHaveAttribute( 'aria-expanded', 'true' );

		// Enter adds the third button; at max the new item is gone.
		await buttonGhost.focus();
		await page.keyboard.press( 'Enter' );
		await expect( hero.locator( BUTTONS ) ).toHaveCount( 3 );
		await expect( hero.locator( BUTTONS ).nth( 2 ) ).toBeFocused();
		await page.keyboard.type( 'C' );
		await expect( buttonGhost ).toHaveCount( 0 );
		await expect( hero.locator( `.hero__button${ GHOST }` ) ).toHaveCount(
			0
		);

		await editor.saveDraft();
		const attributes = await storedHero( requestUtils, id );
		expect( attributes.badges ).toEqual( [
			{ text: 'Fast', icon: 'star' },
		] );
		expect( attributes.buttons.map( ( button ) => button.label ) ).toEqual(
			[ 'A', 'B', 'C' ]
		);
	} );

	test( 'fills the whole block with the background image on the front end and in the canvas', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const imageId = await uploadImage( requestUtils, IMAGE );
		const content = block( 'dev-test/hero', {
			headline: 'Cover',
			backgroundColor: '#edce5e',
			backgroundImageId: imageId,
			badges: [ { text: 'One', icon: 'star' } ],
			buttons: [ { label: 'Go', url: '' } ],
		} );
		const covers = ( hero ) =>
			hero.evaluate( ( root ) => {
				const box = root.getBoundingClientRect();
				const image = root
					.querySelector( '.hero__image img' )
					.getBoundingClientRect();
				return [ 'top', 'right', 'bottom', 'left' ].every(
					( side ) => Math.abs( box[ side ] - image[ side ] ) < 1
				);
			} );

		const id = await createDraft( requestUtils, content );
		await page.goto( `/?p=${ id }&preview=true` );
		const front = page.locator( '.wp-block-dev-test-hero' );
		await expect( front.locator( '.hero__image img' ) ).toBeVisible();
		expect( await covers( front ) ).toBe( true );

		await openPostWith( { admin, editor, requestUtils }, content );
		const hero = editor.canvas.locator( '[data-type="dev-test/hero"]' );
		await expect( hero.locator( '.hero__image img' ) ).toBeVisible();
		expect( await covers( hero ) ).toBe( true );
		await screenshot( hero, 'hero-cover' );
	} );
} );
