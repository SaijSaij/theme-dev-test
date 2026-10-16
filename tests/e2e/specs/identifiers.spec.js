/**
 * Identifiers of list items (#[Identifier], src/Identifier/): generated when
 * an item is added on the settings page, in the inspector and in the canvas,
 * never shown, filled in by the server when a settings group is saved.
 */
const { test, expect } = require( '../fixtures' );

const {
	block,
	cleanUp,
	openPostWith,
	restResponse,
	storedContent,
} = require( '../helpers' );

const PAGE = '/wp-admin/themes.php?page=theme-dev-test-settings';
const REGIONS = 'dev_test_regions';
const IDENTIFIER = /^[0-9a-f]{8}$/;

/**
 * Stores the regions option as it is (null deletes it), bypassing the schema.
 *
 * @param {Object}      requestUtils
 * @param {Object|null} value
 */
async function storeRegions( requestUtils, value ) {
	const response = await restResponse( requestUtils, {
		path: '/dev-test/v1/settings/raw',
		method: 'POST',
		data: { regions: value },
	} );
	expect( response.status ).toBe( 204 );
}

/**
 * The stored regions option.
 *
 * @param {Object} requestUtils
 * @return {Promise<Object|null>} Option value.
 */
async function storedRegions( requestUtils ) {
	const response = await restResponse( requestUtils, {
		path: '/dev-test/v1/settings/raw',
	} );
	expect( response.status ).toBe( 200 );
	return response.body.regions;
}

/**
 * Checks that a list of items has valid, distinct identifiers.
 *
 * @param {Array<{id: string}>} items
 */
function expectDistinctIdentifiers( items ) {
	const ids = items.map( ( item ) => item.id );
	for ( const id of ids ) {
		expect( id ).toMatch( IDENTIFIER );
	}
	expect( new Set( ids ).size ).toBe( ids.length );
}

test.describe( 'Identifiers', () => {
	let stored;

	test.beforeEach( async ( { requestUtils } ) => {
		stored = await storedRegions( requestUtils );
		await storeRegions( requestUtils, null );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await storeRegions( requestUtils, stored );
		await cleanUp( requestUtils );
	} );

	test( 'fill in missing and duplicate identifiers when a settings group is saved', async ( {
		requestUtils,
	} ) => {
		// Unsaved, the default has only the identifier the theme gave it.
		const settings = await restResponse( requestUtils, {
			path: '/wp/v2/settings',
		} );
		expect( settings.body[ REGIONS ].regions ).toEqual( [
			{ id: '0a1b2c3d', name: 'Main' },
			{ id: '', name: 'Side' },
		] );

		const saved = await restResponse( requestUtils, {
			path: '/wp/v2/settings',
			method: 'POST',
			data: {
				[ REGIONS ]: {
					regions: [
						{ id: '0a1b2c3d', name: 'A' },
						{ id: '0a1b2c3d', name: 'B' },
						{ name: 'C' },
					],
				},
			},
		} );
		expect( saved.status ).toBe( 200 );
		const regions = ( await storedRegions( requestUtils ) ).regions;
		expect( regions.map( ( region ) => region.name ) ).toEqual( [
			'A',
			'B',
			'C',
		] );
		expect( regions[ 0 ].id ).toBe( '0a1b2c3d' );
		expectDistinctIdentifiers( regions );
		expect( saved.body[ REGIONS ].regions ).toEqual( regions );

		// The schema rejects anything else.
		const invalid = await restResponse( requestUtils, {
			path: '/wp/v2/settings',
			method: 'POST',
			data: { [ REGIONS ]: { regions: [ { id: 'Main', name: 'A' } ] } },
		} );
		expect( invalid.status ).toBe( 400 );

		// update_option() without the REST API fills them in as well.
		await storeRegions( requestUtils, {
			regions: [ { name: 'X' }, { id: '', name: 'Y' } ],
		} );
		expectDistinctIdentifiers(
			( await storedRegions( requestUtils ) ).regions
		);
	} );

	test( 'generate the identifier of an item added on the settings page without showing it', async ( {
		page,
		requestUtils,
	} ) => {
		await page.goto( PAGE );
		await page.getByRole( 'tab', { name: 'Regions' } ).click();
		await page
			.getByRole( 'button', { name: 'Add item to Regions' } )
			.click();
		// The new item is expanded; it has a name, but no control for the identifier.
		const name = page.getByLabel( 'Name', { exact: true } );
		await expect( name ).toHaveCount( 1 );
		await expect( page.getByLabel( 'Id', { exact: true } ) ).toHaveCount(
			0
		);
		await name.fill( 'Footer' );
		await page.getByRole( 'button', { name: 'Save' } ).click();
		await expect(
			page.getByRole( 'button', { name: 'Save' } )
		).toHaveAttribute( 'aria-disabled', 'true' );

		const regions = ( await storedRegions( requestUtils ) ).regions;
		expect( regions.map( ( region ) => region.name ) ).toEqual( [
			'Main',
			'Side',
			'Footer',
		] );
		expect( regions[ 0 ].id ).toBe( '0a1b2c3d' );
		expectDistinctIdentifiers( regions );
	} );

	test( 'generate identifiers for items added in the inspector and in the canvas', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const id = await openPostWith(
			{ admin, editor, requestUtils },
			block( 'dev-test/chips', {
				chips: [ { id: '0a1b2c3d', label: 'A' } ],
			} )
		);
		const chips = editor.canvas.locator( '[data-type="dev-test/chips"]' );
		const ghost = chips.getByRole( 'button', {
			name: 'Add item to Chips',
		} );
		// The new item in the canvas has no identifier before the click, so its render stays the same.
		await expect( ghost ).toHaveAttribute( 'data-chip', '' );

		await editor.selectBlocks( chips );
		await editor.openDocumentSettingsSidebar();
		await page.getByRole( 'button', { name: 'Add item to Chips' } ).click();
		await ghost.click();
		const items = chips.locator(
			'.chips__chip:not(.wp-app-framework-ghost)'
		);
		await expect( items ).toHaveCount( 3 );
		await expect( items.nth( 2 ) ).toBeFocused();
		await page.keyboard.type( 'C' );
		await expect( items.nth( 2 ) ).toHaveText( 'C' );

		const attributes = () =>
			page.evaluate(
				() =>
					window.wp.data
						.select( 'core/block-editor' )
						.getBlocks()[ 0 ].attributes.chips
			);
		await expect
			.poll( async () =>
				( await attributes() ).map( ( chip ) => chip.label )
			)
			.toEqual( [ 'A', '', 'C' ] );
		const added = await attributes();
		expect( added[ 0 ].id ).toBe( '0a1b2c3d' );
		expectDistinctIdentifiers( added );

		await editor.saveDraft();
		const content = await storedContent( requestUtils, id );
		const saved = JSON.parse(
			content.match( /^<!-- wp:dev-test\/chips (\{.*\}) \/-->$/ )[ 1 ]
		).chips;
		expect( saved ).toEqual( added );

		await page.goto( `/?p=${ id }&preview=true` );
		await expect( page.locator( '.chips__chip' ) ).toHaveCount( 3 );
		expect(
			await page
				.locator( '.chips__chip' )
				.evaluateAll( ( elements ) =>
					elements.map( ( element ) => element.dataset.chip )
				)
		).toEqual( added.map( ( chip ) => chip.id ) );
	} );
} );
