/**
 * The WordPress template functions of the framework (wp_…) in the block
 * dev-test/wordpress-functions, compared with the values of the REST API.
 * The front end is fetched as HTML and parsed without loading it in the
 * browser: wp_avatar() points to Gravatar, which the test must not load.
 * wp_post_url(), wp_post_title(), wp_term_*() and wp_user_name() with
 * missing and other objects are covered by references.spec.js.
 */
const path = require( 'path' );
const { request: apiRequest } = require( '@playwright/test' );
const { test, expect } = require( '../fixtures' );

const {
	block,
	cleanUp,
	createPost,
	restResponse,
	uploadImage,
} = require( '../helpers' );

const BLOCK = 'dev-test/wordpress-functions';
const IMAGE = path.join( __dirname, '../assets/image.png' );
// 2026-01-01 12:00 UTC: the same date in every time zone of the site.
const TIMESTAMP = 1767268800;

/**
 * The results of the blocks on a page: per block and function its text, its
 * HTML and the attributes of its first element.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string}                          html Page HTML.
 * @return {Promise<Array<Object<string, {text: string, html: string, attributes: Object<string, string>}>>>} Results.
 */
function parse( page, html ) {
	return page.evaluate( ( source ) => {
		const doc = new window.DOMParser().parseFromString(
			source,
			'text/html'
		);
		return [ ...doc.querySelectorAll( '.wordpress-functions' ) ].map(
			( element ) =>
				Object.fromEntries(
					[ ...element.querySelectorAll( '[data-fn]' ) ].map(
						( item ) => [
							item.dataset.fn,
							{
								text: item.textContent.trim(),
								html: item.innerHTML.trim(),
								attributes: Object.fromEntries(
									[
										...( item.firstElementChild
											?.attributes ?? [] ),
									].map( ( { name, value } ) => [
										name,
										value,
									] )
								),
							},
						]
					)
				)
		);
	}, html );
}

/**
 * Fetches a page without the admin's session.
 *
 * @param {string} url
 * @return {Promise<string>} HTML.
 */
async function fetchAnonymous( url ) {
	const context = await apiRequest.newContext( {
		storageState: { cookies: [], origins: [] },
	} );
	try {
		const response = await context.get( url );
		expect( response.status() ).toBe( 200 );
		return await response.text();
	} finally {
		await context.dispose();
	}
}

test.describe( 'WordPress functions', () => {
	let settings;

	test.beforeEach( async ( { requestUtils } ) => {
		settings = await requestUtils.rest( { path: '/wp/v2/settings' } );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/settings',
			data: {
				title: settings.title,
				description: settings.description,
			},
		} );
		await cleanUp( requestUtils );
	} );

	test( 'print attachments, posts, users, site values and formatted values', async ( {
		page,
		requestUtils,
	} ) => {
		// Stored with esc_html(), printed decoded and escaped once by Twig.
		await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/settings',
			data: {
				title: 'Dev & Test <Site>',
				description: `It's "quoted"`,
			},
		} );
		expect( settings.date_format ).toBe( 'F j, Y' );

		const attachment = await uploadImage( requestUtils, IMAGE );
		const media = await requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/media/${ attachment }`,
			data: {
				caption:
					'A <a href="https://example.test/">link</a> &amp; more',
				alt_text: 'Alt & text',
			},
		} );
		const post = await createPost( requestUtils, {
			title: 'Fish & chips',
			status: 'publish',
			date: '2026-01-02T03:04:05',
			excerpt: '<em>Crispy</em> fish &amp; chips',
			featured_media: attachment,
		} );
		const words = Array.from( { length: 60 }, ( _, i ) => `word${ i }` );
		const automatic = await createPost( requestUtils, {
			title: 'Automatic excerpt',
			status: 'publish',
			content: `<p>Salt &amp; vinegar ${ words.join( ' ' ) }</p>`,
		} );
		const draft = await createPost( requestUtils, {
			title: 'Draft',
			status: 'draft',
			excerpt: 'Hidden',
		} );
		const id = await createPost( requestUtils, {
			title: 'WordPress functions',
			status: 'publish',
			content: [
				block( BLOCK, {
					post,
					attachment,
					user: 1,
					timestamp: TIMESTAMP,
					number: 1234.5,
					bytes: 2048,
				} ),
				block( BLOCK, { post: automatic } ),
				block( BLOCK, {
					post: draft,
					attachment: 999999,
					user: 999999,
				} ),
			].join( '\n' ),
		} );

		const root = ( await restResponse( requestUtils, { path: '/' } ) ).body;
		const stored = await requestUtils.rest( {
			path: `/wp/v2/posts/${ id }`,
		} );
		const target = await requestUtils.rest( {
			path: `/wp/v2/posts/${ post }`,
		} );
		const user = await requestUtils.rest( { path: '/wp/v2/users/1' } );

		const response = await page.request.get( stored.link );
		expect( response.status() ).toBe( 200 );
		const [ first, second, third ] = await parse(
			page,
			await response.text()
		);

		// Attachments. The image is smaller than the thumbnail size, so the
		// thumbnail is the original file.
		expect( first.attachment_image.attributes ).toMatchObject( {
			src: media.source_url,
			alt: 'Alt & text',
		} );
		expect( first.attachment_image.attributes.class ).toContain(
			'wordpress-functions__image'
		);
		expect( first.attachment_image_url.text ).toBe( media.source_url );
		expect( first.attachment_url.text ).toBe( media.source_url );
		expect( first.attachment_caption.html ).toBe(
			'A <a href="https://example.test/">link</a> &amp; more'
		);
		expect( first.attachment_alt.text ).toBe( 'Alt & text' );

		// Posts.
		expect( first.post_url.text ).toBe( target.link );
		expect( first.post_title.text ).toBe( 'Fish & chips' );
		expect( first.post_excerpt.text ).toBe( 'Crispy fish & chips' );
		expect( first.post_excerpt.html ).toBe( 'Crispy fish &amp; chips' );
		expect( first.post_date.text ).toBe( 'January 2, 2026' );
		expect( first.post_date_format.text ).toBe( '2026-01-02 03:04' );
		expect( first.post_thumbnail.attributes.src ).toBe( media.source_url );
		expect( first.post_thumbnail.attributes.class ).toContain(
			'wp-post-image'
		);
		// An automatic excerpt (55 words, "&" counts as one): plain text with the "more" string decoded.
		expect( second.post_excerpt.text ).toMatch(
			/^Salt & vinegar word0 .* word51 \[…\]$/
		);

		// Users.
		expect( first.user_name.text ).toBe( user.name );
		expect( first.user_url.text ).toBe( user.link );
		expect( first.avatar.attributes.class ).toContain( 'avatar' );
		expect( first.avatar.attributes.width ).toBe( '48' );

		// Site and URLs.
		expect( first.home_url.text ).toBe( `${ root.home }/shop` );
		expect( first.site_name.text ).toBe( 'Dev & Test <Site>' );
		expect( first.site_name.html ).toBe( 'Dev &amp; Test &lt;Site&gt;' );
		expect( first.site_description.text ).toBe( `It's "quoted"` );
		expect( first.login_url.text ).toMatch(
			/\/wp-login\.php\?redirect_to=%2Fshop$/
		);
		// Escaped once: the attribute holds a plain "&".
		expect( first.logout_url.attributes.href ).toMatch(
			/\/wp-login\.php\?action=logout&_wpnonce=[0-9a-f]+$/
		);
		expect( first.is_user_logged_in.text ).toBe( 'yes' );

		// Formatting.
		expect( first.date.text ).toBe( '2026-01-01' );
		expect( first.human_time_diff.text ).toBe( '5 minutes' );
		expect( first.number_format.text ).toBe( '1,234.50' );
		expect( first.size_format.text ).toBe( '2 KB' );

		// A draft, a missing attachment and a missing user give ''.
		for ( const fn of [
			'attachment_image',
			'attachment_image_url',
			'attachment_url',
			'attachment_caption',
			'attachment_alt',
			'post_url',
			'post_title',
			'post_excerpt',
			'post_date',
			'post_thumbnail',
			'user_name',
			'user_url',
			'avatar',
		] ) {
			expect( third[ fn ].html, fn ).toBe( '' );
		}

		// Without a session.
		const [ anonymous ] = await parse(
			page,
			await fetchAnonymous( stored.link )
		);
		expect( anonymous.is_user_logged_in.text ).toBe( 'no' );
		expect( anonymous.post_title.text ).toBe( 'Fish & chips' );
	} );
} );
