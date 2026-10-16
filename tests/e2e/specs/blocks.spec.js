/**
 * Step 4: server-side blocks – escaping and sanitizing on the front end, the
 * stored content and the block type the editor receives.
 */
const { test, expect } = require( '../fixtures' );

const path = require( 'path' );

const {
	block,
	cleanUp,
	createDraft,
	createPost,
	openPostWith,
	storedContent,
	uploadImage,
} = require( '../helpers' );

const IMAGE = path.join( __dirname, '../assets/image.png' );

test.describe( 'Blocks', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await cleanUp( requestUtils );
	} );

	test( 'escapes and sanitizes every value type on the front end', async ( {
		page,
		requestUtils,
	} ) => {
		const imageId = await uploadImage( requestUtils, IMAGE );
		const content = [
			block(
				'dev-test/check',
				{
					text: 'Tom & <script>x</script>',
					rich: 'Hello <em>world</em>',
					count: '5',
					link: 'javascript:alert(1)',
					variant: 'purple',
					imageId,
					anchor: 'check-anchor',
					align: 'wide',
					className: 'extra',
					flag: true,
					ratio: 1.25,
					meta: { caption: 'Cap & <b>', source: 'javascript:x' },
				},
				block( 'dev-test/hero', { subline: 'Inner' } )
			),
			block( 'dev-test/check', {
				link: 'https://example.test/?a=1&b=2',
				variant: 'dark',
				note: 'Hi',
			} ),
		].join( '\n\n' );
		const id = await createDraft( requestUtils, content );

		// Only block comments are stored (WordPress escapes <, > and & in the JSON).
		const stored = await storedContent( requestUtils, id );
		expect(
			stored
				.replace( /<!-- \/?wp:[a-z-]+\/[a-z-]+( \{.*?\})? \/?-->/g, '' )
				.trim()
		).toBe( '' );
		expect(
			JSON.parse(
				stored.match( /^<!-- wp:dev-test\/check (\{.*?\}) -->/ )[ 1 ]
			)
		).toMatchObject( {
			text: 'Tom & <script>x</script>',
			rich: 'Hello <em>world</em>',
		} );

		const response = await page.request.get( `/?p=${ id }&preview=true` );
		expect( response.status() ).toBe( 200 );
		const html = await response.text();
		expect( html ).toContain(
			'<p class="check__text">Tom &amp; &lt;script&gt;x&lt;/script&gt;</p>'
		);
		expect( html ).toContain(
			'<div class="check__rich">Hello <em>world</em></div>'
		);
		expect( html ).toContain( '<p class="check__count">5</p>' );
		expect( html ).toContain( '<a class="check__link" href="">Link</a>' );
		expect( html ).toContain(
			'<a class="check__link" href="https://example.test/?a=1&amp;b=2">Link</a>'
		);
		// bool, float, nullable string with default null, #[Hidden] value.
		expect( html ).toContain(
			'<p class="check__values">on 1.25 none hidden</p>'
		);
		expect( html ).toContain(
			'<p class="check__values">off 0.5 Hi hidden</p>'
		);
		// Nested value class: escaped inline field, sanitized URL.
		expect( html ).toContain(
			'<figcaption>Cap &amp; &lt;b&gt;</figcaption>'
		);
		expect( html ).toContain(
			'<a class="check__source" href="">Source</a>'
		);
		expect( html ).not.toMatch( /data-field|data-inner-blocks/ );

		await page.goto( `/?p=${ id }&preview=true` );
		const checks = page.locator( '.wp-block-dev-test-check' );
		await expect( checks ).toHaveCount( 2 );
		const first = checks.nth( 0 );
		// An invalid enum value falls back to the default; supports add their classes and the anchor.
		for ( const name of [
			'check',
			'check--light',
			'alignwide',
			'extra',
		] ) {
			await expect( first ).toContainClass( name );
		}
		await expect( first ).toHaveAttribute( 'id', 'check-anchor' );
		await expect( first ).not.toContainClass( 'has-custom-css' );
		await expect( checks.nth( 1 ) ).toContainClass( 'check--dark' );
		await expect( first.locator( '.check__name' ) ).toHaveText(
			'dev-test/check'
		);
		// wp_get_attachment_image() with the size of the template.
		await expect(
			first.locator( '.check__image img.attachment-thumbnail' )
		).toHaveAttribute( 'src', /\/wp-content\/uploads\// );
		await expect(
			first.locator(
				'.check__inner .wp-block-dev-test-hero .hero__subline'
			)
		).toHaveText( 'Inner' );
	} );

	test( 'passes the derived block type to the editor', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await openPostWith( { admin, editor, requestUtils }, '' );
		const type = await page.evaluate( () => {
			const blockType = window.wp.blocks.getBlockType( 'dev-test/check' );
			return {
				apiVersion: blockType.apiVersion,
				supports: blockType.supports,
				roles: Object.fromEntries(
					Object.entries( blockType.attributes ).map(
						( [ name, schema ] ) => [ name, schema.role ?? null ]
					)
				),
				attributes: blockType.attributes,
				containerSupports:
					window.wp.blocks.getBlockType( 'dev-test/container' )
						.supports,
				sectionSupports:
					window.wp.blocks.getBlockType( 'dev-test/section' )
						.supports,
				sectionAllowedBlocks:
					window.wp.blocks.getBlockType( 'dev-test/section' )
						.allowedBlocks,
			};
		} );
		// Declared as #[InnerBlocks(allowed: [Hero::class])]; the build resolves the class to the block name.
		expect( type.sectionAllowedBlocks ).toEqual( [ 'dev-test/hero' ] );
		expect( type.containerSupports ).toEqual( {
			html: false,
			customClassName: false,
			multiple: false,
			reusable: false,
			inserter: false,
			lock: false,
			renaming: false,
		} );
		expect( type.sectionSupports ).toMatchObject( {
			html: false,
			contentRole: true,
			align: [ 'wide', 'full' ],
		} );
		expect( type.apiVersion ).toBe( 3 );
		expect( type.supports ).toMatchObject( {
			html: false,
			anchor: true,
			align: [ 'wide' ],
			customCSS: false,
		} );
		expect( type.roles ).toMatchObject( {
			text: 'content',
			rich: 'content',
			link: 'content',
			imageId: 'content',
			count: null,
			variant: null,
			flag: null,
			ratio: null,
			note: null,
			// A nested value class with an inline field is content.
			meta: 'content',
			secret: null,
		} );
		expect( type.roles ).not.toHaveProperty( 'style' );
		const { attributes } = type;
		expect( attributes.variant ).toMatchObject( {
			type: 'string',
			enum: [ 'light', 'dark' ],
			default: 'light',
		} );
		expect( attributes.flag ).toMatchObject( {
			type: 'boolean',
			default: false,
		} );
		expect( attributes.ratio ).toMatchObject( {
			type: 'number',
			default: 0.5,
		} );
		expect( attributes.note ).toMatchObject( {
			type: [ 'string', 'null' ],
		} );
		expect( attributes.note ).not.toHaveProperty( 'default' );
		expect( attributes.meta ).toMatchObject( {
			type: 'object',
			properties: {
				caption: { type: 'string' },
				source: { type: 'string', format: 'uri' },
			},
			default: { caption: '', source: '' },
		} );
		expect( attributes.secret ).toMatchObject( {
			type: 'string',
			default: 'hidden',
		} );
	} );

	test( 'reads the post of a query loop from the block context', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const token = `context${ Date.now() }`;
		const titles = [ `${ token } one`, `${ token } two` ];
		for ( const title of titles ) {
			await createPost( requestUtils, {
				title,
				content: '',
				status: 'publish',
			} );
		}
		const query = `<!-- wp:query {"queryId":1,"query":{"perPage":10,"postType":"post","search":"${ token }","order":"asc","orderBy":"title","inherit":false}} -->
<div class="wp-block-query"><!-- wp:post-template -->
<!-- wp:dev-test/post-info /-->
<!-- /wp:post-template --></div>
<!-- /wp:query -->`;

		const id = await createDraft( requestUtils, query );
		await page.goto( `/?p=${ id }&preview=true` );
		await expect( page.locator( '.post-info' ) ).toHaveText( titles );

		// The editor renders each item with the postId of its context.
		await openPostWith( { admin, editor, requestUtils }, query );
		await expect(
			editor.canvas.locator( '[data-type="dev-test/post-info"]' ).first()
		).toHaveText( titles[ 0 ] );
		await expect(
			// The query loop also keeps a hidden preview of the active item.
			editor.canvas
				.locator( '.post-info' )
				.filter( { hasText: token, visible: true } )
		).toHaveText( titles );
	} );
} );
