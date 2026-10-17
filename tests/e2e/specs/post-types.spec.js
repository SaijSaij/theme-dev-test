/**
 * Step 15: post types, meta and post objects – registration and REST API,
 * URLs without saving the permalinks, the panel in the block editor, the meta
 * box on the classic edit screen, post objects in PHP and Twig, and the
 * fallback of invalid stored values.
 */
const { test, expect } = require( '../fixtures' );

const {
	cleanUp,
	restResponse,
	screenshot,
	trackPost,
} = require( '../helpers' );

/**
 * Creates a post of a post type through its REST collection; cleanUp() deletes it.
 *
 * @param {Object} requestUtils
 * @param {string} restBase
 * @param {Object} data
 * @return {Promise<Object>} The created post.
 */
async function create( requestUtils, restBase, data ) {
	const post = await requestUtils.rest( {
		method: 'POST',
		path: `/wp/v2/${ restBase }`,
		data,
	} );
	trackPost( post.id, restBase );
	return post;
}

test.describe( 'Post types and meta', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await cleanUp( requestUtils );
	} );

	test( 'registers the post types, the taxonomy and the meta in the REST API', async ( {
		requestUtils,
	} ) => {
		const type = await restResponse( requestUtils, {
			path: '/wp/v2/types/dev_test_event',
		} );
		expect( type.body ).toMatchObject( {
			slug: 'dev_test_event',
			name: 'Events',
			rest_base: 'dev_test_event',
			taxonomies: [ 'dev_test_genre' ],
		} );
		const genre = await restResponse( requestUtils, {
			path: '/wp/v2/taxonomies/dev_test_genre',
		} );
		expect( genre.body.types ).toEqual( [ 'dev_test_event', 'post' ] );

		const schema = await restResponse( requestUtils, {
			method: 'OPTIONS',
			path: '/wp/v2/dev_test_event',
		} );
		const meta = schema.body.schema.properties.meta.properties;
		expect( Object.keys( meta ) ).toEqual(
			expect.arrayContaining( [
				'dev_test_start',
				'dev_test_end',
				'dev_test_capacity',
				'dev_test_kind',
				'dev_test_venue',
				'dev_test_tickets',
				'dev_test_note',
				'dev_test_photo',
				'dev_test_website',
			] )
		);
		// A date (#[DateTime]): its pattern rejects other formats.
		expect( meta.dev_test_end ).toMatchObject( {
			type: 'string',
			pattern: '^([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2})?$',
		} );
		const wrongEnd = await restResponse( requestUtils, {
			method: 'POST',
			path: '/wp/v2/dev_test_event',
			data: {
				title: 'E2E wrong end',
				status: 'draft',
				meta: { dev_test_end: '2026-11-14 20:00' },
			},
		} );
		expect( wrongEnd.status ).toBe( 400 );
		expect( wrongEnd.body.code ).toBe( 'rest_invalid_pattern' );
		expect( meta.dev_test_kind ).toMatchObject( {
			type: 'string',
			enum: [ 'concert', 'talk' ],
			default: 'concert',
		} );
		expect( meta.dev_test_venue ).toMatchObject( {
			type: 'integer',
			default: 0,
		} );

		const invalid = await restResponse( requestUtils, {
			method: 'POST',
			path: '/wp/v2/dev_test_event',
			data: {
				title: 'Invalid',
				meta: { dev_test_kind: 'opera' },
			},
		} );
		expect( invalid.status ).toBe( 400 );
		expect( invalid.body.message ).toContain(
			'meta.dev_test_kind is not one of concert and talk.'
		);
	} );

	test( 'reaches events and their archive at /event/ without saving the permalinks', async ( {
		page,
		requestUtils,
	} ) => {
		const venue = await create( requestUtils, 'dev_test_venue', {
			title: 'Town hall',
			status: 'publish',
		} );
		const event = await create( requestUtils, 'dev_test_event', {
			title: 'E2E summer concert',
			status: 'publish',
			meta: {
				dev_test_start: '2026-07-01 20:00',
				dev_test_capacity: 250,
				dev_test_venue: venue.id,
				dev_test_tickets: [ { label: 'Early bird', price: 12.5 } ],
				dev_test_note: '<strong>Doors</strong> open at 19:00',
				dev_test_website: 'https://example.com/concert',
			},
		} );
		expect( event.link ).toMatch( /\/event\/e2e-summer-concert\/$/ );

		const response = await page.goto( event.link );
		expect( response.status() ).toBe( 200 );
		// The paragraph of the template is bound to the meta key (core/post-meta).
		await expect( page.locator( '.event-start' ) ).toHaveText(
			'2026-07-01 20:00'
		);
		const info = page.locator( '.event-info' );
		await expect( info.locator( '.event-info__kind' ) ).toHaveText(
			'Concert'
		);
		await expect( info.locator( '.event-info__capacity' ) ).toHaveText(
			'250'
		);
		await expect( info.locator( '.event-info__venue' ) ).toHaveText(
			'Town hall'
		);
		await expect( info.locator( '.event-info__tickets li' ) ).toHaveText( [
			'Early bird: 12.5',
		] );
		await expect( info.locator( '.event-info__note strong' ) ).toHaveText(
			'Doors'
		);

		const archive = await page.goto( '/event/' );
		expect( archive.status() ).toBe( 200 );
		await expect(
			page.getByRole( 'link', { name: 'E2E summer concert' } )
		).toBeVisible();
	} );

	test( 'edits meta in a panel of the block editor, saved with the post in one request', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const event = await create( requestUtils, 'dev_test_event', {
			title: 'E2E panel',
			status: 'draft',
		} );
		await admin.visitAdminPage(
			'post.php',
			`post=${ event.id }&action=edit`
		);
		await editor.setPreferences( 'core/edit-post', {
			welcomeGuide: false,
			fullscreenMode: false,
		} );
		await editor.openDocumentSettingsSidebar();
		const toggle = page.getByRole( 'button', { name: 'Event details' } );
		if ( ( await toggle.getAttribute( 'aria-expanded' ) ) === 'false' ) {
			await toggle.click();
		}
		const panel = page.locator( '.wp-app-framework-meta-panel' );
		await panel.getByLabel( 'Start' ).fill( '2026-08-15' );
		await panel.getByLabel( 'Start' ).press( 'Tab' );
		await panel.getByLabel( 'Capacity' ).fill( '42' );
		await panel.getByLabel( 'Capacity' ).press( 'Tab' );
		await panel.getByLabel( 'Kind' ).selectOption( 'talk' );
		// The end (#[DateTime]): a button that opens the date picker, with a 12-hour clock for the
		// default time format of WordPress (g:i a).
		await panel.getByRole( 'button', { name: 'End: No date' } ).click();
		const picker = page.locator( '.wp-app-framework-date__picker' );
		for ( const [ label, value ] of [
			[ 'Day', '16' ],
			[ 'Year', '2026' ],
			[ 'Hours', '10' ],
			[ 'Minutes', '30' ],
		] ) {
			await picker.getByLabel( label, { exact: true } ).fill( value );
			await picker.getByLabel( label, { exact: true } ).press( 'Tab' );
		}
		await picker
			.getByLabel( 'Month', { exact: true } )
			.selectOption( '08' );
		await picker.getByRole( 'radio', { name: 'PM', exact: true } ).click();
		await page.keyboard.press( 'Escape' );
		await expect(
			panel.getByRole( 'button', { name: /^End: .*2026/ } )
		).toBeVisible();
		await panel.locator( 'iframe[id$="_ifr"]' ).waitFor();
		const note = page.frameLocator(
			'.wp-app-framework-meta-panel iframe[id$="_ifr"]'
		);
		await note.locator( 'body' ).click();
		await page.keyboard.type( 'Important' );
		await page.keyboard.press( 'Shift+Home' );
		await page.keyboard.press( 'Control+b' );
		await page.keyboard.press( 'End' );
		await screenshot( page, 'post-types-panel' );

		const saves = [];
		page.on( 'request', ( request ) => {
			if (
				[ 'POST', 'PUT' ].includes( request.method() ) &&
				decodeURIComponent( request.url() ).includes(
					`/wp/v2/dev_test_event/${ event.id }`
				)
			) {
				saves.push( request.url() );
			}
		} );
		await editor.saveDraft();
		expect( saves ).toHaveLength( 1 );

		const stored = await restResponse( requestUtils, {
			path: `/wp/v2/dev_test_event/${ event.id }`,
			params: { context: 'edit' },
		} );
		expect( stored.body.meta ).toMatchObject( {
			dev_test_start: '2026-08-15',
			dev_test_end: '2026-08-16T22:30',
			dev_test_capacity: 42,
			dev_test_kind: 'talk',
			dev_test_note: '<strong>Important</strong>',
		} );

		await page.reload();
		await editor.openDocumentSettingsSidebar();
		await expect(
			page
				.locator( '.wp-app-framework-meta-panel' )
				.getByLabel( 'Capacity' )
		).toHaveValue( '42' );
	} );

	test( 'edits the meta of a data type in a meta box of the classic edit screen', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const venue = await create( requestUtils, 'dev_test_venue', {
			title: 'E2E hall',
			status: 'publish',
		} );
		await admin.visitAdminPage(
			'post.php',
			`post=${ venue.id }&action=edit`
		);
		// The "Custom Fields" box of WordPress would edit the meta past the schema.
		await expect( page.locator( '#postcustom' ) ).toHaveCount( 0 );
		const box = page.locator( '#theme-dev-test-meta-place' );
		await expect(
			box.getByRole( 'heading', { name: 'Place' } )
		).toBeVisible();
		await box.getByLabel( 'Address' ).fill( 'Main street 1' );
		await box.getByLabel( 'Address' ).press( 'Tab' );
		await box.getByLabel( 'Seats' ).fill( '300' );
		await box.getByLabel( 'Seats' ).press( 'Tab' );
		await screenshot( page, 'post-types-meta-box' );
		await page.locator( '#publish' ).click();
		await expect( page.locator( '#message' ) ).toBeVisible();

		let stored = await restResponse( requestUtils, {
			path: `/wp/v2/dev_test_venue/${ venue.id }`,
			params: { context: 'edit' },
		} );
		expect( stored.body.meta ).toMatchObject( {
			dev_test_address: 'Main street 1',
			dev_test_seats: 300,
		} );
		await expect( box.getByLabel( 'Seats' ) ).toHaveValue( '300' );

		// A value the form cannot produce: changed on its way, rejected with its path.
		await page
			.locator(
				'input[name="wp-app-framework-meta[theme-dev-test][place]"]'
			)
			.evaluate( ( input ) => {
				input.value = JSON.stringify( {
					address: 'Changed',
					seats: 'many',
				} );
			} );
		await page.locator( '#publish' ).click();
		await expect(
			page.locator( '.wp-app-framework-meta-errors' )
		).toContainText( 'Place: seats is not of type integer.' );
		stored = await restResponse( requestUtils, {
			path: `/wp/v2/dev_test_venue/${ venue.id }`,
			params: { context: 'edit' },
		} );
		expect( stored.body.meta ).toMatchObject( {
			dev_test_address: 'Changed',
			dev_test_seats: 300,
		} );
	} );

	test( 'edits links in the meta panel and the classic meta box, stored by ID and resolved', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const target = await create( requestUtils, 'pages', {
			title: 'Registration page',
			status: 'publish',
		} );
		const event = await create( requestUtils, 'dev_test_event', {
			title: 'E2E link',
			status: 'draft',
		} );

		// The panel in the block editor: LinkControl with its search.
		await admin.visitAdminPage(
			'post.php',
			`post=${ event.id }&action=edit`
		);
		await editor.setPreferences( 'core/edit-post', {
			welcomeGuide: false,
			fullscreenMode: false,
		} );
		await editor.openDocumentSettingsSidebar();
		const toggle = page.getByRole( 'button', { name: 'Event details' } );
		if ( ( await toggle.getAttribute( 'aria-expanded' ) ) === 'false' ) {
			await toggle.click();
		}
		await page
			.locator( '.wp-app-framework-meta-panel' )
			.getByRole( 'group', { name: 'Registration' } )
			.getByRole( 'button' )
			.click();
		const control = page.locator( '.block-editor-link-control' );
		await control.getByRole( 'combobox' ).fill( 'Registration page' );
		await page
			.getByRole( 'option', { name: /Registration page/ } )
			.first()
			.click();
		await editor.saveDraft();

		const linked = {
			url: target.link,
			opensInNewTab: false,
			kind: 'post',
			id: target.id,
		};
		const stored = await restResponse( requestUtils, {
			path: `/wp/v2/dev_test_event/${ event.id }`,
			params: { context: 'edit' },
		} );
		expect( stored.body.meta.dev_test_registration ).toEqual( linked );

		// The meta object gets the current URL of the page.
		const moved = await requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/pages/${ target.id }`,
			data: { slug: 'registration-moved' },
		} );
		const read = await restResponse( requestUtils, {
			path: `/dev-test/v1/posts/events/${ event.id }`,
		} );
		expect( read.body.registration ).toEqual( {
			...linked,
			url: moved.link,
		} );

		// The meta box of the classic edit screen: a search of posts.
		const venue = await create( requestUtils, 'dev_test_venue', {
			title: 'E2E link hall',
			status: 'publish',
		} );
		await admin.visitAdminPage(
			'post.php',
			`post=${ venue.id }&action=edit`
		);
		const booking = page
			.locator( '#theme-dev-test-meta-place' )
			.getByRole( 'group', { name: 'Booking' } );
		await booking
			.getByRole( 'combobox', { name: 'Search content' } )
			.fill( 'Registration' );
		await page.getByRole( 'option', { name: 'Registration page' } ).click();
		await expect( booking.getByText( 'Registration page' ) ).toBeVisible();
		await page.locator( '#publish' ).click();
		await expect( page.locator( '#message' ) ).toBeVisible();
		const venueMeta = await restResponse( requestUtils, {
			path: `/wp/v2/dev_test_venue/${ venue.id }`,
			params: { context: 'edit' },
		} );
		expect( venueMeta.body.meta.dev_test_booking ).toEqual( {
			...linked,
			url: moved.link,
		} );
	} );

	test( 'loads, changes and creates posts with post objects in PHP', async ( {
		requestUtils,
	} ) => {
		const venue = await create( requestUtils, 'dev_test_venue', {
			title: 'Club',
			status: 'publish',
		} );
		const genre = await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/dev_test_genre',
			data: { name: `E2E jazz ${ Date.now() }` },
		} );

		try {
			const created = await restResponse( requestUtils, {
				method: 'POST',
				path: '/dev-test/v1/posts/events',
				data: {
					title: 'E2E created in PHP',
					capacity: 80,
					venue: venue.id,
					genre: genre.id,
				},
			} );
			expect( created.status ).toBe( 200 );
			const id = trackPost( created.body.id, 'dev_test_event' );

			const read = await restResponse( requestUtils, {
				path: `/dev-test/v1/posts/events/${ id }`,
			} );
			expect( read.body ).toMatchObject( {
				class: 'WebCodingCat\\ThemeDevTest\\Post\\Event',
				title: 'E2E created in PHP',
				status: 'publish',
				capacity: 80,
				kind: 'talk',
				venue: {
					class: 'WebCodingCat\\ThemeDevTest\\Post\\Venue',
					id: venue.id,
					title: 'Club',
				},
				tickets: [ { label: 'Standard', price: 15.5 } ],
				note: '<strong>Bring a friend</strong>',
				photo: null,
				// 100 sold of 80 seats.
				soldOut: true,
			} );
			const terms = await restResponse( requestUtils, {
				path: `/wp/v2/dev_test_event/${ id }`,
			} );
			expect( terms.body.dev_test_genre ).toEqual( [ genre.id ] );

			// A reference to a venue that has not been saved: nothing is written.
			const rejected = await restResponse( requestUtils, {
				method: 'POST',
				path: `/dev-test/v1/posts/events/${ id }`,
				data: { capacity: 120, title: 'Renamed', unsavedVenue: true },
			} );
			expect( rejected.body ).toEqual( {
				saved: false,
				errors: [
					'WebCodingCat\\ThemeDevTest\\Post\\EventDetails::$venue refers to a post that has not been saved yet; save it first.',
				],
			} );
			expect(
				(
					await restResponse( requestUtils, {
						path: `/dev-test/v1/posts/events/${ id }`,
					} )
				).body
			).toMatchObject( { title: 'E2E created in PHP', capacity: 80 } );

			const saved = await restResponse( requestUtils, {
				method: 'POST',
				path: `/dev-test/v1/posts/events/${ id }`,
				data: {
					capacity: 120,
					website: 'javascript:alert(1)',
					title: 'Renamed',
				},
			} );
			expect( saved.body ).toEqual( { saved: true, errors: [] } );
			expect(
				(
					await restResponse( requestUtils, {
						path: `/dev-test/v1/posts/events/${ id }`,
					} )
				).body
			).toMatchObject( {
				title: 'Renamed',
				capacity: 120,
				// Sanitized like every URL value (sanitize_url()).
				website: '',
				soldOut: false,
			} );
		} finally {
			await requestUtils.rest( {
				method: 'DELETE',
				path: `/wp/v2/dev_test_genre/${ genre.id }`,
				params: { force: true },
			} );
		}
	} );

	test( 'falls back to the default of an invalid stored value', async ( {
		requestUtils,
	} ) => {
		const event = await create( requestUtils, 'dev_test_event', {
			title: 'E2E fallback',
			status: 'publish',
			meta: { dev_test_kind: 'talk', dev_test_capacity: 5 },
		} );
		await restResponse( requestUtils, {
			method: 'POST',
			path: `/dev-test/v1/posts/raw/${ event.id }`,
			data: { key: 'dev_test_kind', value: 'opera' },
		} );

		const read = await restResponse( requestUtils, {
			path: `/dev-test/v1/posts/events/${ event.id }`,
		} );
		expect( read.body ).toMatchObject( { kind: 'concert', capacity: 5 } );
		// The REST API of WordPress returns null for the invalid value.
		const rest = await restResponse( requestUtils, {
			path: `/wp/v2/dev_test_event/${ event.id }`,
			params: { context: 'edit' },
		} );
		expect( rest.body.meta.dev_test_kind ).toBeNull();
	} );

	test( 'reads meta of posts of WordPress through the class Post', async ( {
		requestUtils,
	} ) => {
		const post = await create( requestUtils, 'posts', {
			title: 'E2E extras',
			status: 'publish',
			meta: { dev_test_subtitle: 'A subtitle', dev_test_featured: true },
		} );

		const extras = await restResponse( requestUtils, {
			path: `/dev-test/v1/posts/posts/${ post.id }/extras`,
		} );
		expect( extras.body ).toEqual( {
			subtitle: 'A subtitle',
			featured: true,
		} );
		const anonymous = await restResponse( requestUtils, {
			path: `/dev-test/v1/posts/posts/${ post.id }/extras`,
			as: 'anonymous',
		} );
		expect( anonymous.status ).toBe( 401 );
	} );
} );
