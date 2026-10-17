/**
 * Step 5: the generated inspector controls, the JS extension points and the
 * development warnings of the editor runtime. Step 21: links (`Link`) with
 * LinkControl, resolved on the front end.
 */
const path = require( 'path' );

const { test, expect } = require( '../fixtures' );

const {
	block,
	cleanUp,
	IS_RELEASE,
	openBlockSettings,
	openPostWith,
	screenshot,
	storedContent,
	trackRenderRequests,
	uploadImage,
} = require( '../helpers' );

const IMAGE = path.join( __dirname, '../assets/image.png' );

test.describe( 'Inspector controls', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await cleanUp( requestUtils );
	} );

	test( 'generates a control per value type', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const renders = trackRenderRequests( page );
		const id = await openPostWith(
			{ admin, editor, requestUtils },
			block( 'dev-test/check', { text: 'Check' } )
		);
		const check = editor.canvas.locator( '[data-type="dev-test/check"]' );
		await check.locator( '.check__text' ).click();

		// Content group: the URL of the link and of the nested value class; inline fields have no control.
		await editor.openDocumentSettingsSidebar();
		const sidebar = page.getByRole( 'region', { name: 'Editor settings' } );
		await expect(
			sidebar.getByRole( 'textbox', { name: 'Link' } )
		).toHaveAttribute( 'type', 'url' );
		await expect(
			sidebar.getByRole( 'textbox', { name: 'Source' } )
		).toHaveAttribute( 'type', 'url' );
		await expect(
			sidebar.getByRole( 'textbox', { name: 'Caption' } )
		).toHaveCount( 0 );

		// Settings group.
		await openBlockSettings( page, editor );
		await expect(
			sidebar.getByRole( 'spinbutton', { name: 'Amount' } )
		).toBeVisible();
		await expect(
			sidebar.getByRole( 'textbox', { name: 'Note' } )
		).toBeVisible();
		await expect(
			sidebar
				.getByRole( 'combobox', { name: 'Variant' } )
				.locator( 'option' )
		).toHaveText( [ 'Light theme', 'Dark theme' ] );
		// #[Hidden]
		await expect( sidebar.getByText( 'Secret' ) ).toHaveCount( 0 );
		// registerControl() of Check.editor.js replaces the generated number control.
		await expect(
			sidebar.getByRole( 'spinbutton', {
				name: 'Ratio (custom control)',
			} )
		).toBeVisible();
		await expect(
			sidebar.getByRole( 'spinbutton', { name: 'Ratio', exact: true } )
		).toHaveCount( 0 );

		const rendered = renders.length;
		await sidebar.getByRole( 'checkbox', { name: 'Flag' } ).check();
		await sidebar
			.getByRole( 'combobox', { name: 'Variant' } )
			.selectOption( { label: 'Dark theme' } );
		await sidebar
			.getByRole( 'spinbutton', { name: 'Ratio (custom control)' } )
			.fill( '1.5' );
		await sidebar.getByRole( 'textbox', { name: 'Note' } ).fill( 'Hi' );
		await expect( check.locator( '.check__values' ) ).toHaveText(
			'on 1.5 Hi hidden'
		);
		await expect( check ).toContainClass( 'check--dark' );
		// Inspector changes re-render the block.
		expect( renders.length ).toBeGreaterThan( rendered );

		await editor.saveDraft();
		const attributes = JSON.parse(
			( await storedContent( requestUtils, id ) ).match(
				/^<!-- wp:dev-test\/check (\{.*\}) \/-->$/
			)[ 1 ]
		);
		expect( attributes ).toMatchObject( {
			flag: true,
			variant: 'dark',
			ratio: 1.5,
			note: 'Hi',
		} );
	} );

	test( 'warns about unknown names in the extension points', async ( {
		admin,
		editor,
		expectConsole,
		page,
		requestUtils,
	} ) => {
		expectConsole.push(
			{
				type: 'warning',
				text: 'wp-app-framework: registerPanel( "unknown" ): no block of this theme or plugin has that name.',
			},
			{
				type: 'warning',
				text: 'wp-app-framework: registerControl( "check", "unknown" ): the block has no attribute with that name.',
			},
			{
				type: 'warning',
				text: 'wp-app-framework: registerToolbarButton( "dev-test/faq" ): use the block name without namespace, e.g. "faq"; the namespace of this theme or plugin is added.',
			}
		);
		await openPostWith( { admin, editor, requestUtils }, '' );
		const api = await page.evaluate( () => {
			// The import @webcodingcat/wp-app-framework resolves to this object; the rest of the global is internal.
			const instance = window.wpAppFramework[ 'theme-dev-test' ].api;
			instance.registerPanel( 'unknown', () => null );
			instance.registerControl( 'check', 'unknown', () => null );
			instance.registerToolbarButton( 'dev-test/faq', () => null );
			return {
				names: Object.keys( instance ).sort(),
				frozen: Object.isFrozen( instance ),
			};
		} );
		expect( api ).toEqual( {
			names: [
				'getData',
				'loadScript',
				'registerControl',
				'registerPanel',
				'registerSupportControl',
				'registerToolbarButton',
			],
			frozen: true,
		} );
	} );

	test( 'warns in development mode about inline fields without field(), not in a release', async ( {
		admin,
		editor,
		expectConsole,
		requestUtils,
	} ) => {
		// The warning is a development aid; in a release the console guard fails on any warning.
		if ( ! IS_RELEASE ) {
			expectConsole.push( {
				type: 'warning',
				text: 'wp-app-framework: dev-test/unmarked renders no element with field( "title" ) in the editor, so it cannot be edited inline.',
			} );
		}
		await openPostWith( { admin, editor, requestUtils }, '' );
		await editor.insertBlock( {
			name: 'dev-test/unmarked',
			attributes: { title: 'Plain' },
		} );
		// The render request blanks inline values and nothing puts the value back without field().
		await expect(
			editor.canvas.locator( '[data-type="dev-test/unmarked"]' )
		).toHaveText( '' );
	} );

	test( 'allows inserting into containers with contentRole in contentOnly mode', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await openPostWith(
			{ admin, editor, requestUtils },
			'<!-- wp:group {"templateLock":"contentOnly"} -->\n<div class="wp-block-group">' +
				block( 'dev-test/section', {}, block( 'dev-test/hero' ) ) +
				block( 'dev-test/container', {}, block( 'dev-test/hero' ) ) +
				'</div>\n<!-- /wp:group -->'
		);
		await expect(
			editor.canvas.locator( '[data-type="dev-test/hero"]' )
		).toHaveCount( 2 );

		const allowed = await page.evaluate( () => {
			const store = window.wp.data.select( 'core/block-editor' );
			const [ group ] = store.getBlocks();
			const [ section, container ] = group.innerBlocks;
			return {
				section: store.canInsertBlockType(
					'dev-test/hero',
					section.clientId
				),
				container: store.canInsertBlockType(
					'dev-test/hero',
					container.clientId
				),
			};
		} );
		// Both containers lack content attributes; only dev-test/section has #[Supports(contentRole: true)].
		// (A block with content attributes is a content block anyway, see isContentBlock() of @wordpress/blocks.)
		expect( allowed ).toEqual( { section: true, container: false } );
	} );
} );

test.describe( 'Links in the inspector', () => {
	const pages = [];
	const terms = [];

	/**
	 * Creates a page; deleted after the test.
	 *
	 * @param {Object} requestUtils
	 * @param {string} title
	 * @return {Promise<Object>} The page.
	 */
	async function createPage( requestUtils, title ) {
		const created = await requestUtils.createPage( {
			title,
			status: 'publish',
		} );
		pages.push( created.id );
		return created;
	}

	/**
	 * Creates a category; deleted after the test.
	 *
	 * @param {Object} requestUtils
	 * @param {string} name
	 * @return {Promise<Object>} The term.
	 */
	async function createCategory( requestUtils, name ) {
		const term = await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/categories',
			data: { name },
		} );
		terms.push( term.id );
		return term;
	}

	/**
	 * The link attribute "cta" of the first block in the editor.
	 *
	 * @param {import('@playwright/test').Page} page
	 * @return {Promise<Object>} The stored link.
	 */
	function cta( page ) {
		return page.evaluate(
			() =>
				window.wp.data.select( 'core/block-editor' ).getBlocks()[ 0 ]
					.attributes.cta
		);
	}

	/**
	 * Opens the link control of "Call to action" in the inspector.
	 *
	 * @param {import('@playwright/test').Page} page
	 * @return {Promise<import('@playwright/test').Locator>} The link control in its popover.
	 */
	async function openLinkControl( page ) {
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'group', { name: 'Call to action' } )
			.getByRole( 'button' )
			.click();
		const control = page.locator( '.block-editor-link-control' );
		await expect( control ).toBeVisible();
		return control;
	}

	/**
	 * Searches in the link control and chooses a result.
	 *
	 * @param {import('@playwright/test').Page}    page
	 * @param {import('@playwright/test').Locator} control
	 * @param {string}                             title   Title of the result.
	 */
	async function choose( page, control, title ) {
		await control.getByRole( 'combobox' ).fill( title );
		await page
			.getByRole( 'option', { name: new RegExp( title ) } )
			.first()
			.click();
	}

	test.afterEach( async ( { requestUtils } ) => {
		await cleanUp( requestUtils );
		while ( pages.length > 0 ) {
			await requestUtils.rest( {
				method: 'DELETE',
				path: `/wp/v2/pages/${ pages.pop() }`,
				params: { force: true },
			} );
		}
		while ( terms.length > 0 ) {
			await requestUtils.rest( {
				method: 'DELETE',
				path: `/wp/v2/categories/${ terms.pop() }`,
				params: { force: true },
			} );
		}
	} );

	test( 'links a page by ID, opens it in a new tab and resolves its current URL', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const target = await createPage( requestUtils, 'Link target page' );
		const id = await openPostWith(
			{ admin, editor, requestUtils },
			block( 'dev-test/check', { text: 'Check' } )
		);
		const check = editor.canvas.locator( '[data-type="dev-test/check"]' );
		await check.locator( '.check__text' ).click();
		await editor.openDocumentSettingsSidebar();
		const sidebar = page.getByRole( 'region', { name: 'Editor settings' } );
		// A content control: in the default tab, next to the other content controls.
		await expect(
			sidebar
				.getByRole( 'group', { name: 'Call to action' } )
				.getByRole( 'button', { name: 'Call to action: Add link' } )
		).toBeVisible();

		const control = await openLinkControl( page );
		await choose( page, control, 'Link target page' );
		await expect
			.poll( () => cta( page ) )
			.toEqual( {
				url: target.link,
				opensInNewTab: false,
				kind: 'post',
				id: target.id,
			} );

		// Synced: the URL field is locked until "Unsync and edit".
		await control.getByRole( 'button', { name: 'Edit link' } ).click();
		await expect(
			control.getByText( /^Synced with the selected/ )
		).toBeVisible();
		await expect( control.getByRole( 'combobox' ) ).toBeDisabled();
		// "Advanced" remembers its state as a preference of the user.
		const advanced = control.getByRole( 'button', { name: 'Advanced' } );
		if ( ( await advanced.getAttribute( 'aria-expanded' ) ) === 'false' ) {
			await advanced.click();
		}
		await expect( advanced ).toHaveAttribute( 'aria-expanded', 'true' );
		await control
			.getByRole( 'checkbox', { name: 'Open in new tab' } )
			.check();
		// Settings apply with "Apply" only.
		expect( ( await cta( page ) ).opensInNewTab ).toBe( false );
		await control.getByRole( 'button', { name: 'Apply' } ).click();
		await expect
			.poll( () => cta( page ) )
			.toEqual( {
				url: target.link,
				opensInNewTab: true,
				kind: 'post',
				id: target.id,
			} );
		await screenshot( sidebar, 'inspector-link' );
		await page.keyboard.press( 'Escape' );
		await expect( check.locator( '.check__cta' ) ).toHaveAttribute(
			'href',
			target.link
		);

		await editor.saveDraft();
		const attributes = JSON.parse(
			( await storedContent( requestUtils, id ) ).match(
				/^<!-- wp:dev-test\/check (\{.*\}) \/-->$/
			)[ 1 ]
		);
		// Exactly the four values of a link, nothing else of LinkControl.
		expect( Object.keys( attributes.cta ).sort() ).toEqual( [
			'id',
			'kind',
			'opensInNewTab',
			'url',
		] );

		await page.goto( `/?p=${ id }&preview=true` );
		const link = page.locator( '.wp-block-dev-test-check .check__cta' );
		await expect( link ).toHaveAttribute( 'href', target.link );
		await expect( link ).toHaveAttribute( 'target', '_blank' );
		await expect( link ).toHaveAttribute( 'rel', 'noopener' );

		// A new slug: the link follows without editing the post.
		const moved = await requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/pages/${ target.id }`,
			data: { slug: 'link-target-moved' },
		} );
		expect( moved.link ).not.toBe( target.link );
		await page.reload();
		await expect( link ).toHaveAttribute( 'href', moved.link );

		// A draft: no link on the front end, but in the editor.
		await requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/pages/${ target.id }`,
			data: { status: 'draft' },
		} );
		await page.reload();
		await expect(
			page.locator( '.wp-block-dev-test-check .check__text' )
		).toHaveText( 'Check' );
		await expect( link ).toHaveCount( 0 );
		await admin.visitAdminPage( 'post.php', `post=${ id }&action=edit` );
		await expect(
			editor.canvas.locator( '[data-type="dev-test/check"] .check__cta' )
		).toHaveCount( 1 );

		// Deleted: no link anywhere; the ID stays stored.
		await requestUtils.rest( {
			method: 'DELETE',
			path: `/wp/v2/pages/${ pages.pop() }`,
			params: { force: true },
		} );
		await page.goto( `/?p=${ id }&preview=true` );
		await expect(
			page.locator( '.wp-block-dev-test-check .check__text' )
		).toHaveText( 'Check' );
		await expect( link ).toHaveCount( 0 );
	} );

	test( 'links a term and a media file, unsyncs to a free URL and removes the link', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const topic = await createCategory( requestUtils, 'Link target topic' );
		const imageId = await uploadImage( requestUtils, IMAGE );
		const image = await requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/media/${ imageId }`,
			data: { title: 'Link target image' },
		} );
		await openPostWith(
			{ admin, editor, requestUtils },
			block( 'dev-test/check', { text: 'Check' } )
		);
		const check = editor.canvas.locator( '[data-type="dev-test/check"]' );
		await check.locator( '.check__text' ).click();
		await editor.openDocumentSettingsSidebar();

		let control = await openLinkControl( page );
		await choose( page, control, 'Link target topic' );
		await expect
			.poll( () => cta( page ) )
			.toEqual( {
				url: topic.link,
				opensInNewTab: false,
				kind: 'term',
				id: topic.id,
			} );
		await expect( check.locator( '.check__cta' ) ).toHaveAttribute(
			'href',
			topic.link
		);

		// "Unsync and edit" turns the link into a free URL.
		await control.getByRole( 'button', { name: 'Edit link' } ).click();
		await control
			.getByRole( 'button', { name: 'Unsync and edit' } )
			.click();
		await control
			.getByRole( 'combobox' )
			.fill( 'https://example.com/free/' );
		await control.getByRole( 'combobox' ).press( 'Enter' );
		await expect
			.poll( () => cta( page ) )
			.toEqual( {
				url: 'https://example.com/free/',
				opensInNewTab: false,
				kind: 'url',
				id: 0,
			} );

		await control.getByRole( 'button', { name: 'Edit link' } ).click();
		await choose( page, control, 'Link target image' );
		await expect
			.poll( () => cta( page ) )
			.toEqual( {
				url: image.source_url,
				opensInNewTab: false,
				kind: 'attachment',
				id: imageId,
			} );
		await expect( check.locator( '.check__cta' ) ).toHaveAttribute(
			'href',
			image.source_url
		);

		// Removing empties the link.
		await control.getByRole( 'button', { name: 'Remove link' } ).click();
		await expect
			.poll( () => cta( page ) )
			.toEqual( { url: '', opensInNewTab: false, kind: 'url', id: 0 } );
		await expect( check.locator( '.check__cta' ) ).toHaveCount( 0 );
		control = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Call to action: Add link' } );
		await expect( control ).toBeVisible();
	} );

	test( 'edits the link of a pattern in contentOnly mode', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await openPostWith(
			{ admin, editor, requestUtils },
			'<!-- wp:pattern {"slug":"dev-test/hero-section"} /-->'
		);
		const check = editor.canvas.locator( '[data-type="dev-test/check"]' );
		// The free URL of the pattern.
		await expect( check.locator( '.check__cta' ) ).toHaveAttribute(
			'href',
			'https://example.org/pattern/'
		);
		await check.locator( '.check__text' ).click();
		const mode = await page.evaluate( () => {
			const store = window.wp.data.select( 'core/block-editor' );
			return store.getBlockEditingMode(
				store.getSelectedBlockClientId()
			);
		} );
		expect( mode ).toBe( 'contentOnly' );

		await editor.openDocumentSettingsSidebar();
		const control = await openLinkControl( page );
		await control.getByRole( 'button', { name: 'Edit link' } ).click();
		await control
			.getByRole( 'combobox' )
			.fill( 'https://example.org/changed/' );
		await control.getByRole( 'button', { name: 'Apply' } ).click();
		await expect( check.locator( '.check__cta' ) ).toHaveAttribute(
			'href',
			'https://example.org/changed/'
		);
	} );

	test( 'are content in the block schema', async ( { requestUtils } ) => {
		const type = await requestUtils.rest( {
			path: '/wp/v2/block-types/dev-test/check',
		} );
		expect( type.attributes.cta ).toEqual( {
			type: 'object',
			properties: {
				url: { type: 'string', format: 'uri', default: '' },
				opensInNewTab: { type: 'boolean', default: false },
				kind: {
					type: 'string',
					enum: [ 'url', 'post', 'term', 'attachment' ],
					default: 'url',
				},
				id: { type: 'integer', default: 0 },
			},
			default: { url: '', opensInNewTab: false, kind: 'url', id: 0 },
			role: 'content',
		} );
	} );
} );
