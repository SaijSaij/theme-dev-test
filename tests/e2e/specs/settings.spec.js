/**
 * Step 13: settings groups (src/Setting/) – options in the REST API, the
 * settings page, injection into services and the template global, invalid
 * values.
 */
const path = require( 'path' );

const { test, expect } = require( '../fixtures' );

const {
	cleanUp,
	createUserWithPassword,
	restResponse,
	screenshot,
	uploadImage,
} = require( '../helpers' );

const IMAGE = path.join( __dirname, '../assets/image.png' );

const PAGE = '/wp-admin/themes.php?page=theme-dev-test-settings';
const GENERAL = 'theme_dev_test_general';
const LAYOUT = 'theme_dev_test_layout';
const DEFAULTS = {
	[ GENERAL ]: {
		tagline: 'Just a test',
		density: 'normal',
		contactUrl: '',
		count: 3,
		ratio: null,
		links: [],
		contact: null,
		internalKey: 'dev-test',
		logo: null,
		footer: '',
		notice: '',
		privacyPage: null,
		featured: [],
	},
	[ LAYOUT ]: { wide: false, columns: 2 },
};
const BAD_REQUEST = {
	type: 'error',
	text: 'Failed to load resource: the server responded with a status of 400',
};

/**
 * The groups as the theme's services receive them.
 *
 * @param {Object} requestUtils
 * @return {Promise<Object>} Values of the groups "general" and "layout".
 */
async function injectedValues( requestUtils ) {
	const response = await restResponse( requestUtils, {
		path: '/dev-test/v1/settings',
		as: 'anonymous',
	} );
	expect( response.status ).toBe( 200 );
	return response.body;
}

/**
 * The options as /wp/v2/settings returns them.
 *
 * @param {Object} requestUtils
 * @return {Promise<Object>} Settings by REST name.
 */
async function restSettings( requestUtils ) {
	const response = await restResponse( requestUtils, {
		path: '/wp/v2/settings',
	} );
	expect( response.status ).toBe( 200 );
	return response.body;
}

/**
 * Stores the options as they are (null deletes them), bypassing the schema.
 *
 * @param {Object} requestUtils
 * @param {Object} values       Values by group name ("general", "layout").
 */
async function storeRaw( requestUtils, values ) {
	const response = await restResponse( requestUtils, {
		path: '/dev-test/v1/settings/raw',
		method: 'POST',
		data: values,
	} );
	expect( response.status ).toBe( 204 );
}

test.describe( 'Settings', () => {
	let stored;

	// The options of the theme are restored after each test, as they were before.
	test.beforeEach( async ( { requestUtils } ) => {
		const response = await restResponse( requestUtils, {
			path: '/dev-test/v1/settings/raw',
		} );
		expect( response.status ).toBe( 200 );
		stored = response.body;
		await storeRaw( requestUtils, { general: null, layout: null } );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await storeRaw( requestUtils, stored );
		await cleanUp( requestUtils );
	} );

	test( 'register each group as an option with its schema in the REST API', async ( {
		requestUtils,
	} ) => {
		const settings = await restSettings( requestUtils );
		expect( settings[ GENERAL ] ).toEqual( DEFAULTS[ GENERAL ] );
		expect( settings[ LAYOUT ] ).toEqual( DEFAULTS[ LAYOUT ] );

		const schema = await restResponse( requestUtils, {
			path: '/wp/v2/settings',
			method: 'OPTIONS',
		} );
		const properties = schema.body.schema.properties;
		expect( properties[ GENERAL ].type ).toBe( 'object' );
		expect( properties[ GENERAL ].properties.density.enum ).toEqual( [
			'compact',
			'normal',
			'relaxed',
		] );
		expect(
			properties[ GENERAL ].properties.links.items.properties.label
		).toEqual( expect.objectContaining( { required: true } ) );
	} );

	test( 'inject the defaults into services and templates until saved', async ( {
		requestUtils,
	} ) => {
		const values = await injectedValues( requestUtils );
		expect( values.general ).toEqual( {
			...DEFAULTS[ GENERAL ],
			densityType: 'Saij\\ThemeDevTest\\Setting\\Density',
		} );
		expect( values.layout ).toEqual( DEFAULTS[ LAYOUT ] );
	} );

	test( 'inject the saved values into services and templates', async ( {
		requestUtils,
	} ) => {
		const saved = await restResponse( requestUtils, {
			path: '/wp/v2/settings',
			method: 'POST',
			data: {
				[ GENERAL ]: {
					tagline: 'Hello & <b>',
					density: 'compact',
					links: [
						{ label: 'Docs', url: 'javascript:alert(1)' },
						{
							label: 'Home',
							url: 'https://example.com',
							style: { external: true },
						},
					],
					contact: { name: 'Ann', email: 'ann@example.com' },
				},
				[ LAYOUT ]: { wide: true },
			},
		} );
		expect( saved.status ).toBe( 200 );
		// Settings missing in the saved object get their default.
		expect( saved.body[ LAYOUT ] ).toEqual( { wide: true, columns: 2 } );

		const values = await injectedValues( requestUtils );
		expect( values.general ).toEqual( {
			...DEFAULTS[ GENERAL ],
			tagline: 'Hello & <b>',
			density: 'compact',
			densityType: 'Saij\\ThemeDevTest\\Setting\\Density',
			links: [
				{ label: 'Docs', url: '', external: false },
				{ label: 'Home', url: 'https://example.com', external: true },
			],
			contact: { name: 'Ann', email: 'ann@example.com' },
		} );
		expect( values.layout ).toEqual( { wide: true, columns: 2 } );

		const twig = await restResponse( requestUtils, {
			path: '/dev-test/v1/settings/twig',
			as: 'anonymous',
		} );
		expect( twig.body.html ).toBe(
			'<p class="settings">Hello &amp; &lt;b&gt;|compact|wide|Docs,Home||||</p>\n'
		);
	} );

	test( 'reject invalid values in the REST API', async ( {
		requestUtils,
	} ) => {
		const response = await restResponse( requestUtils, {
			path: '/wp/v2/settings',
			method: 'POST',
			data: {
				[ GENERAL ]: { tagline: 'Changed', density: 'bogus' },
				[ LAYOUT ]: { wide: true },
			},
		} );
		expect( response.status ).toBe( 400 );
		expect( response.body.code ).toBe( 'rest_invalid_param' );
		expect( response.body.data.params[ GENERAL ] ).toContain(
			`${ GENERAL }[density] is not one of`
		);

		// The whole request is rejected.
		const values = await injectedValues( requestUtils );
		expect( values.general.tagline ).toBe( 'Just a test' );
		expect( values.layout.wide ).toBe( false );
	} );

	test( 'fall back to the default of an invalid stored value', async ( {
		requestUtils,
	} ) => {
		await storeRaw( requestUtils, {
			general: { tagline: 'Kept', density: 'removed' },
		} );

		const values = await injectedValues( requestUtils );
		expect( values.general.tagline ).toBe( 'Kept' );
		expect( values.general.density ).toBe( 'normal' );
		// WordPress returns null for a stored value that does not match the schema.
		expect( ( await restSettings( requestUtils ) )[ GENERAL ] ).toBeNull();
	} );

	test( 'show one page under Appearance with a tab per group', async ( {
		page,
	} ) => {
		await page.goto( '/wp-admin/' );
		await expect(
			page.locator(
				'#menu-appearance a[href$="page=theme-dev-test-settings"]'
			)
		).toHaveText( 'Dev Test' );

		await page.goto( PAGE );
		await expect(
			page.getByRole( 'heading', { level: 1, name: 'Dev Test' } )
		).toBeVisible();
		const tabs = page.getByRole( 'tab' );
		await expect( tabs ).toHaveText( [ 'Layout', 'General' ] );

		await expect( page.getByLabel( 'Wide' ) ).not.toBeChecked();
		await expect( page.getByLabel( 'Columns' ) ).toHaveValue( '2' );

		await page.getByRole( 'tab', { name: 'General' } ).click();
		await expect(
			page.getByText( 'Settings of the test theme.' )
		).toBeVisible();
		await expect( page.getByLabel( 'Tagline' ) ).toHaveValue(
			'Just a test'
		);
		await expect( page.getByLabel( 'Density' ) ).toHaveValue( 'normal' );
		await expect( page.getByLabel( 'Contact url' ) ).toHaveAttribute(
			'type',
			'url'
		);
		await screenshot( page, 'settings-page' );
		// #[Hidden] settings have no control.
		await expect( page.getByLabel( 'Internal key' ) ).toHaveCount( 0 );
		await expect(
			page.getByRole( 'button', { name: 'Save' } )
		).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	test( 'save the changes of all groups in one request', async ( {
		page,
		requestUtils,
	} ) => {
		await page.goto( PAGE );
		await page.getByLabel( 'Wide' ).check();
		await expect(
			page.getByRole( 'tab', { name: 'Layout •' } )
		).toBeVisible();

		await page.getByRole( 'tab', { name: 'General' } ).click();
		await page.getByLabel( 'Tagline' ).fill( 'Saved tagline' );
		await page.getByLabel( 'Tagline' ).press( 'Tab' );
		await page.getByLabel( 'Density' ).selectOption( 'relaxed' );
		await page.getByRole( 'button', { name: 'Add item to Links' } ).click();
		const item = page.locator( '.wp-app-framework-list__item' );
		await item.getByLabel( 'Label' ).fill( 'Docs' );
		await item.getByLabel( 'Url' ).fill( 'https://example.com/docs' );
		await item.getByLabel( 'Url' ).press( 'Tab' );
		await expect(
			page.getByRole( 'tab', { name: 'General •' } )
		).toBeVisible();
		// Switching tabs keeps the changes.
		await page.getByRole( 'tab', { name: 'Layout •' } ).click();
		await expect( page.getByLabel( 'Wide' ) ).toBeChecked();

		const saves = [];
		page.on( 'request', ( request ) => {
			if (
				request.method() === 'POST' &&
				request.url().includes( '/wp/v2/settings' )
			) {
				saves.push( request.postDataJSON() );
			}
		} );
		await page.getByRole( 'button', { name: 'Save' } ).click();
		await expect( page.getByTestId( 'snackbar' ) ).toHaveText(
			'Settings saved.'
		);
		expect( saves ).toHaveLength( 1 );
		expect( Object.keys( saves[ 0 ] ).sort() ).toEqual( [
			GENERAL,
			LAYOUT,
		] );
		await expect( page.getByRole( 'tab' ) ).toHaveText( [
			'Layout',
			'General',
		] );

		const values = await injectedValues( requestUtils );
		expect( values.layout.wide ).toBe( true );
		expect( values.general ).toEqual(
			expect.objectContaining( {
				tagline: 'Saved tagline',
				density: 'relaxed',
				links: [
					{
						label: 'Docs',
						url: 'https://example.com/docs',
						external: false,
					},
				],
			} )
		);

		await page.reload();
		await page.getByRole( 'tab', { name: 'General' } ).click();
		await expect( page.getByLabel( 'Tagline' ) ).toHaveValue(
			'Saved tagline'
		);
	} );

	test( 'select an image setting in the media library', async ( {
		page,
		requestUtils,
	} ) => {
		const imageId = await uploadImage( requestUtils, IMAGE );
		await page.goto( PAGE );
		await page.getByRole( 'tab', { name: 'General' } ).click();
		await page.getByRole( 'button', { name: 'Select Logo' } ).click();
		const library = page.getByRole( 'dialog' );
		await library.getByRole( 'tab', { name: 'Media Library' } ).click();
		await library
			.locator( `li.attachment[data-id="${ imageId }"]` )
			.click();
		await library
			.getByRole( 'button', { name: 'Select', exact: true } )
			.click();

		await expect(
			page.locator( '.wp-app-framework-image__preview' )
		).toBeVisible();
		await expect(
			page.getByRole( 'tab', { name: 'General •' } )
		).toBeVisible();
		await screenshot( page, 'settings-image' );
		await page.getByRole( 'button', { name: 'Save' } ).click();
		await expect( page.getByTestId( 'snackbar' ) ).toHaveText(
			'Settings saved.'
		);

		expect( ( await injectedValues( requestUtils ) ).general.logo ).toBe(
			imageId
		);
		const twig = await restResponse( requestUtils, {
			path: '/dev-test/v1/settings/twig',
			as: 'anonymous',
		} );
		expect( twig.body.html ).toContain( 'attachment-thumbnail' );

		await page.getByRole( 'button', { name: 'Remove Logo' } ).click();
		await page.getByRole( 'button', { name: 'Save' } ).click();
		await expect( page.getByTestId( 'snackbar' ).last() ).toHaveText(
			'Settings saved.'
		);
		await expect
			.poll(
				async () =>
					( await injectedValues( requestUtils ) ).general.logo
			)
			.toBeNull();
	} );

	test( 'edit text, rich text and references on the settings page', async ( {
		page,
		requestUtils,
	} ) => {
		const privacy = await requestUtils.createPage( {
			title: 'Privacy policy',
			status: 'publish',
		} );
		try {
			await page.goto( PAGE );
			await page.getByRole( 'tab', { name: 'General' } ).click();
			await page.getByLabel( 'Footer' ).fill( 'Footer & text' );
			await page.getByLabel( 'Footer' ).press( 'Tab' );

			// #[RichText] with the classic editor.
			const notice = page.frameLocator(
				'.wp-app-framework-settings iframe[id$="_ifr"]'
			);
			await notice.locator( 'body' ).click();
			await page.keyboard.type( 'Important' );
			await page.keyboard.press( 'Shift+Home' );
			await page.keyboard.press( 'Control+b' );
			await page.keyboard.press( 'End' );

			await page
				.getByRole( 'combobox', { name: 'Privacy page' } )
				.fill( 'Privacy' );
			await page
				.getByRole( 'option', { name: 'Privacy policy' } )
				.click();
			await page
				.getByRole( 'combobox', { name: 'Add to Featured' } )
				.fill( 'Privacy' );
			await page
				.getByRole( 'option', { name: 'Privacy policy' } )
				.click();
			await screenshot( page, 'settings-text-references' );

			await page.getByRole( 'button', { name: 'Save' } ).click();
			await expect( page.getByTestId( 'snackbar' ) ).toHaveText(
				'Settings saved.'
			);

			const values = ( await injectedValues( requestUtils ) ).general;
			expect( values ).toEqual(
				expect.objectContaining( {
					footer: 'Footer & text',
					notice: '<strong>Important</strong>',
					privacyPage: privacy.id,
					featured: [ privacy.id ],
				} )
			);
			const twig = await restResponse( requestUtils, {
				path: '/dev-test/v1/settings/twig',
				as: 'anonymous',
			} );
			expect( twig.body.html ).toContain(
				'|Footer &amp; text|<strong>Important</strong>|Privacy policy</p>'
			);

			// The stored values show again after reloading.
			await page.reload();
			await page.getByRole( 'tab', { name: 'General' } ).click();
			await expect(
				page.getByRole( 'combobox', { name: 'Privacy page' } )
			).toHaveValue( 'Privacy policy' );
			await expect( notice.locator( 'body strong' ) ).toHaveText(
				'Important'
			);
		} finally {
			await requestUtils.rest( {
				method: 'DELETE',
				path: `/wp/v2/pages/${ privacy.id }`,
				params: { force: true },
			} );
		}
	} );

	test( 'name the group and the setting of an invalid value', async ( {
		page,
		requestUtils,
		expectConsole,
	} ) => {
		expectConsole.push( BAD_REQUEST );
		// The form only produces valid values; the request is changed on its way.
		await page.route( '**/wp/v2/settings**', async ( route ) => {
			const request = route.request();
			if ( request.method() !== 'POST' ) {
				return route.continue();
			}
			const data = request.postDataJSON();
			data[ GENERAL ].density = 'bogus';
			return route.continue( { postData: JSON.stringify( data ) } );
		} );

		await page.goto( PAGE );
		await page.getByRole( 'tab', { name: 'General' } ).click();
		await page.getByLabel( 'Tagline' ).fill( 'Not saved' );
		await page.getByLabel( 'Tagline' ).press( 'Tab' );
		await page.getByRole( 'button', { name: 'Save' } ).click();

		await expect(
			page.locator( '.components-notice.is-error' )
		).toContainText(
			`The settings were not saved. General: ${ GENERAL }[density] is not one of`
		);
		// The changes stay in the form.
		await expect(
			page.getByRole( 'tab', { name: 'General •' } )
		).toBeVisible();
		expect( ( await injectedValues( requestUtils ) ).general.tagline ).toBe(
			'Just a test'
		);
	} );

	test( 'refuse page and REST API to users without manage_options', async ( {
		browser,
		requestUtils,
	} ) => {
		const author = await createUserWithPassword( requestUtils, 'author' );
		const response = await restResponse( requestUtils, {
			path: '/wp/v2/settings',
			as: author,
		} );
		expect( response.status ).toBe( 403 );

		const baseURL = test.info().project.use.baseURL;
		const context = await browser.newContext( {
			baseURL,
			storageState: { cookies: [], origins: [] },
		} );
		try {
			const page = await context.newPage();
			await page.goto( '/wp-login.php' );
			await page.locator( '#user_login' ).fill( author.username );
			await page.locator( '#user_pass' ).fill( 'e2e-password' );
			await page.locator( '#wp-submit' ).click();
			await expect( page.locator( '#wpadminbar' ) ).toBeVisible();
			await expect(
				page.locator( 'a[href$="page=theme-dev-test-settings"]' )
			).toHaveCount( 0 );

			const forbidden = await page.goto( PAGE );
			expect( forbidden.status() ).toBe( 403 );
		} finally {
			await context.close();
		}
	} );
} );
