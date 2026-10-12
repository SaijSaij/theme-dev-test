const path = require( 'path' );
const { expect, request: apiRequest } = require( '@playwright/test' );

const RENDER_ROUTE = '/wp-app-framework/v1/theme-dev-test/render';

/** The tests run against the release ZIP (E2E_TARGET=release, checked in playwright.config.js). */
const IS_RELEASE = process.env.E2E_TARGET === 'release';

/** Namespace prefix of the dependencies in a release (extra.strauss.namespace_prefix in composer.json). */
const VENDOR_PREFIX = IS_RELEASE ? 'Saij\\ThemeDevTest\\Vendor\\' : '';

/** Posts, media and users created by the tests; cleanUp() removes exactly these. */
const createdPosts = [];
const createdMedia = [];
const createdUsers = [];

/**
 * Records the requests of the editor runtime to the render route.
 *
 * @param {import('@playwright/test').Page} page
 * @return {import('@playwright/test').Request[]} Requests, filled while the page runs.
 */
function trackRenderRequests( page ) {
	const requests = [];
	page.on( 'request', ( request ) => {
		if ( decodeURIComponent( request.url() ).includes( RENDER_ROUTE ) ) {
			requests.push( request );
		}
	} );
	return requests;
}

/**
 * Number of blocks a render request asked for.
 *
 * @param {import('@playwright/test').Request} request
 * @return {number} Blocks.
 */
function blockCount( request ) {
	return JSON.parse( request.postData() ).blocks.length;
}

/**
 * Serialized block comment of a block with attributes.
 *
 * @param {string} name
 * @param {Object} attributes
 * @param {string} [inner]    Serialized inner blocks.
 * @return {string} Block markup.
 */
function block( name, attributes = {}, inner ) {
	const json = Object.keys( attributes ).length
		? ` ${ JSON.stringify( attributes ) }`
		: '';
	return inner === undefined
		? `<!-- wp:${ name }${ json } /-->`
		: `<!-- wp:${ name }${ json } -->\n${ inner }\n<!-- /wp:${ name } -->`;
}

/**
 * Creates a draft with the given content and opens it in the block editor.
 *
 * @param {Object} fixtures              Playwright fixtures.
 * @param {Object} fixtures.admin        Admin utilities.
 * @param {Object} fixtures.editor       Editor utilities.
 * @param {Object} fixtures.requestUtils REST utilities.
 * @param {string} content               Serialized blocks.
 * @return {Promise<number>} Post ID.
 */
async function openPostWith( { admin, editor, requestUtils }, content ) {
	const id = await createDraft( requestUtils, content );
	await admin.visitAdminPage( 'post.php', `post=${ id }&action=edit` );
	await editor.setPreferences( 'core/edit-post', {
		welcomeGuide: false,
		fullscreenMode: false,
	} );
	return id;
}

/**
 * Creates a draft with the given content (the admin can view it with
 * `/?p=<id>&preview=true`).
 *
 * @param {Object} requestUtils
 * @param {string} content      Serialized blocks.
 * @return {Promise<number>} Post ID.
 */
async function createDraft( requestUtils, content ) {
	return createPost( requestUtils, {
		title: 'E2E',
		content,
		status: 'draft',
	} );
}

/**
 * Creates a post; cleanUp() deletes it.
 *
 * @param {Object} requestUtils
 * @param {Object} post         Fields of the post: title, content, status.
 * @return {Promise<number>} Post ID.
 */
async function createPost( requestUtils, post ) {
	const created = await requestUtils.createPost( post );
	createdPosts.push( created.id );
	return created.id;
}

/**
 * Registers a post created otherwise (e.g. by another user) for cleanUp().
 *
 * @param {number} id Post ID.
 * @return {number} The ID.
 */
function trackPost( id ) {
	createdPosts.push( id );
	return id;
}

/**
 * Uploads an image to the media library.
 *
 * @param {Object} requestUtils
 * @param {string} file         Path of the image.
 * @return {Promise<number>} Attachment ID.
 */
async function uploadImage( requestUtils, file ) {
	const media = await requestUtils.uploadMedia( file );
	return trackMedia( media.id );
}

/**
 * Registers an attachment created in the browser for cleanUp().
 *
 * @param {number} id Attachment ID.
 * @return {number} The ID.
 */
function trackMedia( id ) {
	createdMedia.push( id );
	return id;
}

/**
 * Creates a user with an application password.
 *
 * @param {Object} requestUtils
 * @param {string} role         E.g. "subscriber".
 * @return {Promise<{id: number, username: string, password: string}>} User ID and the credentials for HTTP Basic authentication.
 */
async function createUserWithPassword( requestUtils, role ) {
	const username = `e2e-${ role }-${ Date.now() }`;
	const user = await requestUtils.createUser( {
		username,
		email: `${ username }@example.test`,
		password: 'e2e-password',
		roles: [ role ],
	} );
	createdUsers.push( user.id );
	const password = await requestUtils.rest( {
		method: 'POST',
		path: `/wp/v2/users/${ user.id }/application-passwords`,
		data: { name: 'e2e' },
	} );
	return { id: user.id, username, password: password.password };
}

/**
 * Calls the REST API and returns the response whatever its status.
 *
 * @param {Object}        requestUtils
 * @param {Object}        options
 * @param {string}        options.path     Route, e.g. "/dev-test/v1/items".
 * @param {string}        [options.method] HTTP method.
 * @param {Object}        [options.params] Query arguments.
 * @param {Object}        [options.data]   JSON body.
 * @param {string|Object} [options.as]     "admin" (default, logged-in session), "anonymous" or credentials ({username, password}) for HTTP Basic authentication.
 * @return {Promise<{status: number, headers: Object<string, string>, body: (Object|Array|string|number|boolean|null)}>} Status, headers and the decoded JSON body (null if empty).
 */
async function restResponse(
	requestUtils,
	{ path: route, method = 'GET', params, data, as = 'admin' }
) {
	if ( ! requestUtils.storageState?.nonce ) {
		await requestUtils.setupRest();
	}
	const url = requestUtils.storageState.rootURL + route.replace( /^\//, '' );
	const options = { method, params, data, failOnStatusCode: false };
	if ( as === 'admin' ) {
		return decode(
			await requestUtils.request.fetch( url, {
				...options,
				headers: { 'X-WP-Nonce': requestUtils.storageState.nonce },
			} )
		);
	}
	// A fresh context; inside the test runner it would inherit the admin's session (storageState of
	// the config), whose cookie WordPress prefers over Basic authentication. Credentials are sent
	// without waiting for a challenge.
	const context = await apiRequest.newContext( {
		storageState: { cookies: [], origins: [] },
		...( as === 'anonymous'
			? {}
			: { httpCredentials: { ...as, send: 'always' } } ),
	} );
	try {
		return decode( await context.fetch( url, options ) );
	} finally {
		await context.dispose();
	}
}

/**
 * The active theme: its directory name (stylesheet) and that of its parent
 * (template; the same without a child theme). In wp-dev-env the test child theme
 * (https://github.com/saijsaij/theme-dev-test-child) may be active; the theme's
 * tests must pass with and without it.
 *
 * @param {Object} requestUtils
 * @return {Promise<{stylesheet: string, template: string, isChild: boolean}>} Active theme.
 */
async function activeTheme( requestUtils ) {
	const response = await restResponse( requestUtils, {
		path: '/wp/v2/themes',
		params: { status: 'active' },
	} );
	if ( response.status !== 200 || response.body.length !== 1 ) {
		throw new Error(
			`Cannot read the active theme: HTTP ${ response.status }.`
		);
	}
	const { stylesheet, template } = response.body[ 0 ];
	return { stylesheet, template, isChild: stylesheet !== template };
}

/**
 * @param {import('@playwright/test').APIResponse} response
 * @return {Promise<{status: number, headers: Object<string, string>, body: (Object|Array|string|number|boolean|null)}>} Decoded response.
 */
async function decode( response ) {
	const text = await response.text();
	return {
		status: response.status(),
		headers: response.headers(),
		body: text === '' ? null : JSON.parse( text ),
	};
}

/**
 * The raw content of a post as stored.
 *
 * @param {Object} requestUtils
 * @param {number} id
 * @return {Promise<string>} post_content.
 */
async function storedContent( requestUtils, id ) {
	const post = await requestUtils.rest( {
		path: `/wp/v2/posts/${ id }`,
		params: { context: 'edit' },
	} );
	return post.content.raw;
}

/**
 * Saves a screenshot for the visual review under the results directory.
 *
 * @param {import('@playwright/test').Page|import('@playwright/test').Locator} target
 * @param {string}                                                             name
 */
async function screenshot( target, name ) {
	await target.screenshot( {
		path: path.join( process.env.E2E_SCREENSHOT_DIR, `${ name }.png` ),
	} );
}

/** Computed properties that decide the size, spacing and type of an element. */
const MEASURED_PROPERTIES = [
	'display',
	'box-sizing',
	'margin-top',
	'margin-right',
	'margin-bottom',
	'margin-left',
	'padding-top',
	'padding-right',
	'padding-bottom',
	'padding-left',
	'border-top-width',
	'border-right-width',
	'border-bottom-width',
	'border-left-width',
	'row-gap',
	'column-gap',
	'font-family',
	'font-size',
	'font-weight',
	'font-style',
	'line-height',
	'letter-spacing',
	'text-align',
	// Not white-space: RichText sets pre-wrap on every field in the editor, to keep typed spaces visible.
	'overflow-wrap',
	'color',
	'background-color',
];

/**
 * Measures blocks and every element inside them: position relative to the
 * block, size and the computed properties above, plus the space between two
 * consecutive blocks. The result is the same for the front end and the editor
 * canvas if both render the block alike. The margins of a block are left out:
 * they place it in its container (centered in a container that is narrower in
 * the editor, the gap to a preceding sibling); the gaps between the blocks are
 * measured instead.
 *
 * @param {import('@playwright/test').Locator} blocks Root elements of the blocks.
 * @return {Promise<{blocks: Array<Array<Object>>, gaps: Array<number>}>} Measurements, rounded to 0.5px.
 */
async function measureBlocks( blocks ) {
	return blocks.evaluateAll( ( roots, properties ) => {
		const round = ( value ) => Math.round( value * 2 ) / 2;
		const measure = ( root ) => {
			const origin = root.getBoundingClientRect();
			return [ root, ...root.querySelectorAll( '*' ) ].map(
				( element ) => {
					const rect = element.getBoundingClientRect();
					const style = window.getComputedStyle( element );
					return {
						element:
							element.tagName.toLowerCase() +
							( element === root
								? ''
								: `.${ [ ...element.classList ]
										.filter( ( name ) =>
											/^[a-z]+__/.test( name )
										)
										.join( '.' ) }` ),
						x: round( rect.left - origin.left ),
						y: round( rect.top - origin.top ),
						width: round( rect.width ),
						height: round( rect.height ),
						...Object.fromEntries(
							properties
								.filter(
									( property ) =>
										element !== root ||
										! property.startsWith( 'margin-' )
								)
								.map( ( property ) => [
									property,
									style.getPropertyValue( property ),
								] )
						),
					};
				}
			);
		};
		const gaps = roots
			.slice( 1 )
			.map( ( root, index ) =>
				round(
					root.getBoundingClientRect().top -
						roots[ index ].getBoundingClientRect().bottom
				)
			);
		return { blocks: roots.map( measure ), gaps };
	}, MEASURED_PROPERTIES );
}

/**
 * Opens the "Settings" tab of the block inspector (the generated settings
 * controls and registered panels; content controls are on the other tab).
 *
 * @param {import('@playwright/test').Page} page
 * @param {Object}                          editor
 */
async function openBlockSettings( page, editor ) {
	await editor.openDocumentSettingsSidebar();
	await page
		.getByRole( 'region', { name: 'Editor settings' } )
		.getByRole( 'tab', { name: 'Settings' } )
		.click();
}

/**
 * Deletes the posts, media and users the tests created, and nothing else.
 *
 * @param {Object} requestUtils
 */
async function cleanUp( requestUtils ) {
	while ( createdPosts.length > 0 ) {
		await requestUtils.rest( {
			method: 'DELETE',
			path: `/wp/v2/posts/${ createdPosts.pop() }`,
			params: { force: true },
		} );
	}
	while ( createdMedia.length > 0 ) {
		await requestUtils.deleteMedia( createdMedia.pop() );
	}
	while ( createdUsers.length > 0 ) {
		await requestUtils.rest( {
			method: 'DELETE',
			path: `/wp/v2/users/${ createdUsers.pop() }`,
			params: { force: true, reassign: 1 },
		} );
	}
}

/**
 * Whether the test plugin (https://github.com/saijsaij/plugin-dev-test) is installed and active, from the plugins endpoint of WordPress.
 *
 * @param {Object} requestUtils
 * @return {Promise<boolean>} Active.
 */
async function pluginActive( requestUtils ) {
	const response = await restResponse( requestUtils, {
		path: '/wp/v2/plugins/plugin-dev-test/plugin-dev-test',
	} );
	if ( response.status === 404 ) {
		return false;
	}
	expect( response.status ).toBe( 200 );
	return response.body.status === 'active';
}

module.exports = {
	activeTheme,
	block,
	blockCount,
	cleanUp,
	createDraft,
	createPost,
	createUserWithPassword,
	IS_RELEASE,
	measureBlocks,
	openBlockSettings,
	openPostWith,
	pluginActive,
	RENDER_ROUTE,
	restResponse,
	screenshot,
	storedContent,
	trackMedia,
	trackPost,
	trackRenderRequests,
	uploadImage,
	VENDOR_PREFIX,
};
