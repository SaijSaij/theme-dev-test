const path = require( 'path' );
const { request: apiRequest } = require( '@playwright/test' );

const RENDER_ROUTE = '/wp-app-framework/v1/theme-dev-test/render';

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

module.exports = {
	block,
	blockCount,
	cleanUp,
	createDraft,
	createPost,
	createUserWithPassword,
	openBlockSettings,
	openPostWith,
	RENDER_ROUTE,
	restResponse,
	screenshot,
	storedContent,
	trackMedia,
	trackRenderRequests,
	uploadImage,
};
