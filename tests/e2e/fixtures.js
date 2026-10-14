/**
 * Playwright fixtures of the browser tests: those of
 * `@wordpress/e2e-test-utils-playwright` plus a console guard. Every console
 * warning, console error and uncaught page error fails the test, except the
 * messages listed in ALLOWED.
 */
const base = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Console messages caused by WordPress itself, each with its reason.
 *
 * The editor copies every stylesheet of the admin page whose id does not start
 * with "wp-" and that has a selector containing ".wp-block" into the canvas
 * iframe and warns about it (getCompatibilityStyles() in
 * wp-includes/js/dist/block-editor.js). WordPress' own stylesheet
 * global-styles-css-custom-properties (wp-includes/default-filters.php,
 * enqueue_block_editor_assets) contains `.wp-block-button{--wp--preset--dimension--…}`
 * from wp-includes/theme.json, so the editor warns about it with every theme,
 * e.g. Twenty Twenty-Five (verified with WordPress 7.1.3).
 */
const ALLOWED = [
	{
		type: 'warning',
		text: 'global-styles-css-custom-properties-inline-css was added to the iframe incorrectly. Please use block.json or enqueue_block_assets to add styles to the iframe.',
	},
];

/** Pages of the block editor, where the allowed messages are expected. */
const EDITOR_PAGES = /\/wp-admin\/(?:post|post-new|site-editor)\.php/;

/**
 * @param {string} type Console message type.
 * @param {string} text Console message text.
 * @return {Object|undefined} The matching ALLOWED entry.
 */
function allowed( type, text ) {
	return ALLOWED.find(
		( entry ) => entry.type === type && text.startsWith( entry.text )
	);
}

const test = base.test.extend( {
	/*
	 * Logs in to the worker's WordPress instance once, before its first test, and
	 * stores the session in STORAGE_STATE_PATH (one file per worker, set in
	 * playwright.config.js), which the browser contexts of its tests load.
	 */
	login: [
		async ( { requestUtils }, provide ) => {
			await requestUtils.setupRest();
			await provide();
		},
		{ scope: 'worker', auto: true },
	],

	/*
	 * Counts per worker which allowed messages appeared. If the block editor
	 * was opened but an allowed message never appeared, WordPress changed and
	 * the entry must be removed. (Playwright reads the fixtures a fixture needs
	 * from the object pattern of its first parameter; the second provides the value.)
	 */
	allowedMessages: [
		async ( {}, provide ) => {
			const state = { editorOpened: false, seen: new Set() };
			await provide( state );
			const unseen = ALLOWED.filter(
				( entry ) => ! state.seen.has( entry )
			);
			if ( state.editorOpened && unseen.length > 0 ) {
				throw new Error(
					`Allowed console messages did not appear any more; remove them from ALLOWED in tests/e2e/fixtures.js: ${ unseen
						.map( ( entry ) => entry.text )
						.join( ' | ' ) }`
				);
			}
		},
		{ scope: 'worker' },
	],

	/*
	 * Console messages a test expects, e.g. a warning of the runtime it checks:
	 * `expectConsole.push( { type: 'warning', text: '…' } )`. Each must appear at
	 * least once (text compared from the start).
	 */
	expectConsole: async ( {}, provide ) => {
		await provide( [] );
	},

	consoleGuard: [
		async ( { page, allowedMessages, expectConsole }, provide ) => {
			const unexpected = [];
			const seenExpected = new Set();
			page.on( 'console', ( message ) => {
				const type = message.type();
				if ( type !== 'warning' && type !== 'error' ) {
					return;
				}
				const text = message.text();
				const expected = expectConsole.find(
					( entry ) =>
						entry.type === type && text.startsWith( entry.text )
				);
				const entry = allowed( type, text );
				if ( expected ) {
					seenExpected.add( expected );
				} else if ( entry ) {
					allowedMessages.seen.add( entry );
				} else {
					unexpected.push( `console ${ type }: ${ text }` );
				}
			} );
			page.on( 'pageerror', ( error ) =>
				unexpected.push( `page error: ${ error.message }` )
			);
			page.on( 'framenavigated', ( frame ) => {
				if ( EDITOR_PAGES.test( frame.url() ) ) {
					allowedMessages.editorOpened = true;
				}
			} );

			await provide();

			base.expect(
				unexpected,
				'No console warnings, console errors or page errors'
			).toEqual( [] );
			base.expect(
				expectConsole.filter(
					( entry ) => ! seenExpected.has( entry )
				),
				'Expected console messages appeared'
			).toEqual( [] );
		},
		{ auto: true },
	],
} );

module.exports = { test, expect: base.expect };
