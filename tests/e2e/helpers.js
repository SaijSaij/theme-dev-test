const path = require( 'path' );

const RENDER_ROUTE = '/wp-app-framework/v1/theme-sections/render';

/** Posts created by the tests; deletePostsOfTests() removes exactly these. */
const createdPosts = [];

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
 * @param {string} [inner] Serialized inner blocks.
 * @return {string} Block markup.
 */
function block( name, attributes = {}, inner ) {
	const json = Object.keys( attributes ).length ? ` ${ JSON.stringify( attributes ) }` : '';
	return inner === undefined ? `<!-- wp:${ name }${ json } /-->` : `<!-- wp:${ name }${ json } -->\n${ inner }\n<!-- /wp:${ name } -->`;
}

/**
 * Creates a draft with the given content and opens it in the block editor.
 *
 * @param {Object} fixtures   Playwright fixtures: admin, editor, requestUtils.
 * @param {string} content    Serialized blocks.
 * @return {Promise<number>} Post ID.
 */
async function openPostWith( { admin, editor, requestUtils }, content ) {
	const post = await requestUtils.createPost( { title: 'E2E', content, status: 'draft' } );
	createdPosts.push( post.id );
	await admin.visitAdminPage( 'post.php', `post=${ post.id }&action=edit` );
	await editor.setPreferences( 'core/edit-post', { welcomeGuide: false, fullscreenMode: false } );
	return post.id;
}

/**
 * The raw content of a post as stored.
 *
 * @param {Object} requestUtils
 * @param {number} id
 * @return {Promise<string>} post_content.
 */
async function storedContent( requestUtils, id ) {
	const post = await requestUtils.rest( { path: `/wp/v2/posts/${ id }`, params: { context: 'edit' } } );
	return post.content.raw;
}

/**
 * Saves a screenshot for the visual review under the results directory.
 *
 * @param {import('@playwright/test').Page|import('@playwright/test').Locator} target
 * @param {string} name
 */
async function screenshot( target, name ) {
	await target.screenshot( { path: path.join( process.env.E2E_SCREENSHOT_DIR, `${ name }.png` ) } );
}

/**
 * Opens the "Settings" tab of the block inspector (the generated settings
 * controls and registered panels; content controls are on the other tab).
 *
 * @param {import('@playwright/test').Page} page
 * @param {Object}                           editor
 */
async function openBlockSettings( page, editor ) {
	await editor.openDocumentSettingsSidebar();
	await page.getByRole( 'region', { name: 'Editor settings' } ).getByRole( 'tab', { name: 'Settings' } ).click();
}

/**
 * Deletes the posts the tests created, and nothing else.
 *
 * @param {Object} requestUtils
 */
async function deletePostsOfTests( requestUtils ) {
	while ( createdPosts.length > 0 ) {
		const id = createdPosts.pop();
		await requestUtils.rest( { method: 'DELETE', path: `/wp/v2/posts/${ id }`, params: { force: true } } );
	}
}

module.exports = { deletePostsOfTests, openBlockSettings, RENDER_ROUTE, trackRenderRequests, blockCount, block, openPostWith, storedContent, screenshot };
