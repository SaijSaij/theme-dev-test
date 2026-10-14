/**
 * Step 26: static assets of the theme – asset_url(), asset_image() and
 * asset_svg() in Twig (versioned URLs, size of images, attributes on the root
 * element of an inline SVG), and files referenced by URL in assets/styles.css
 * and imported by a script, which the build copies to build/; image variants
 * in srcset and <picture>, the preload of a marked font and the import of an
 * asset into the media library.
 */
const { test, expect } = require( '../fixtures' );

const {
	IS_RELEASE,
	block,
	cleanUp,
	createPost,
	restResponse,
	trackMedia,
} = require( '../helpers' );

const ASSETS = '/wp-content/themes/theme-dev-test/assets/';

test.describe( 'Static assets', () => {
	let url;

	test.beforeEach( async ( { requestUtils } ) => {
		const id = await createPost( requestUtils, {
			title: 'E2E assets',
			content: block( 'dev-test/asset-showcase' ),
			status: 'publish',
		} );
		url = `/?p=${ id }`;
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await cleanUp( requestUtils );
	} );

	test( 'have URLs versioned by their content', async ( {
		page,
		request,
	} ) => {
		await page.goto( url );

		const href = await page
			.locator( '.asset-showcase__link' )
			.getAttribute( 'href' );
		expect( new URL( href ).pathname + new URL( href ).search ).toMatch(
			new RegExp( `^${ ASSETS }docs/readme\\.txt\\?ver=[0-9a-f]{12}$` )
		);
		const response = await request.get( href );
		expect( response.status() ).toBe( 200 );
		expect( await response.text() ).toContain(
			'A static asset of theme-dev-test'
		);
	} );

	test( 'print images with their size and attributes', async ( {
		page,
		request,
	} ) => {
		await page.goto( url );

		const image = page.locator( '.asset-showcase__image' );
		await expect( image ).toHaveAttribute( 'width', '4' );
		await expect( image ).toHaveAttribute( 'height', '2' );
		await expect( image ).toHaveAttribute( 'alt', 'Swatch' );
		await expect( image ).toHaveAttribute( 'decoding', 'async' );
		await expect( image ).toHaveAttribute( 'loading', 'lazy' );
		const src = await image.getAttribute( 'src' );
		expect( src ).toContain( `${ ASSETS }images/swatch.png?ver=` );
		expect( ( await request.get( src ) ).status() ).toBe( 200 );

		// The child theme may override the logo (tested in its own suite).
		const logo = page.locator( '.asset-showcase__logo' );
		await expect( logo ).toHaveAttribute( 'alt', 'Logo' );
		expect( await logo.getAttribute( 'src' ) ).toContain(
			'/assets/images/logo.svg?ver='
		);
	} );

	test( 'inline SVGs with attributes on their root element', async ( {
		page,
	} ) => {
		await page.goto( url );

		const icon = page.locator( '.asset-showcase svg' );
		await expect( icon ).toHaveCount( 1 );
		await expect( icon ).toHaveClass( 'icon asset-showcase__icon' );
		await expect( icon ).toHaveAttribute( 'aria-hidden', 'true' );
		await expect( icon.locator( 'path' ) ).toHaveCount( 1 );
		expect( await page.content() ).not.toContain( '<?xml' );
	} );

	test( 'referenced in the stylesheet and imported by scripts load from build/', async ( {
		page,
		request,
	} ) => {
		await page.goto( url );

		const background = await page
			.locator( '.asset-showcase' )
			.evaluate(
				( element ) =>
					element.ownerDocument.defaultView.getComputedStyle(
						element
					).backgroundImage
			);
		const backgroundUrl = background.match( /url\("(.+)"\)/ )[ 1 ];
		expect( backgroundUrl ).toMatch(
			/\/build\/images\/swatch\.[0-9a-f]+\.png$/
		);
		expect( ( await request.get( backgroundUrl ) ).status() ).toBe( 200 );

		await expect
			.poll( () =>
				page.evaluate( async () => {
					await document.fonts.ready;
					return document.fonts.check( '16px "Dev Test Icons"' );
				} )
			)
			.toBe( true );

		// Relative to the script in build/assets/: the URL normalizes to build/images/.
		const imported = new URL(
			await page.locator( 'html' ).getAttribute( 'data-dev-test-image' )
		).href;
		expect( imported ).toMatch(
			/\/build\/images\/swatch\.[0-9a-f]+\.png$/
		);
		expect( ( await request.get( imported ) ).status() ).toBe( 200 );
	} );

	test( 'print image variants in a srcset and a source per format', async ( {
		page,
		request,
	} ) => {
		await page.goto( url );

		const picture = page.locator( 'picture:has(.asset-showcase__hero)' );
		const sources = picture.locator( 'source' );
		await expect( sources ).toHaveCount( 2 );
		await expect( sources.nth( 0 ) ).toHaveAttribute(
			'type',
			'image/avif'
		);
		await expect( sources.nth( 1 ) ).toHaveAttribute(
			'type',
			'image/webp'
		);
		const image = picture.locator( 'img' );
		await expect( image ).toHaveAttribute( 'width', '1600' );
		await expect( image ).toHaveAttribute( 'height', '900' );
		await expect( image ).toHaveAttribute(
			'sizes',
			'(min-width: 800px) 50vw, 100vw'
		);

		// Development mode: the cache directory; release: generated/assets/ of the theme.
		const directory = IS_RELEASE
			? '/wp-content/themes/theme-dev-test/generated/assets/images/'
			: '/wp-content/cache/theme-dev-test/assets/images/';
		const candidates = [
			await sources.nth( 0 ).getAttribute( 'srcset' ),
			await sources.nth( 1 ).getAttribute( 'srcset' ),
			await image.getAttribute( 'srcset' ),
		].flatMap( ( srcset ) => srcset.split( ', ' ) );
		expect( candidates ).toHaveLength( 7 );
		for ( const [ extension, type ] of [
			[ 'avif', 'image/avif' ],
			[ 'webp', 'image/webp' ],
			[ 'jpg', 'image/jpeg' ],
		] ) {
			for ( const width of [ 400, 800 ] ) {
				const candidate = candidates.find( ( entry ) =>
					entry.endsWith( `.${ width }.${ extension } ${ width }w` )
				);
				const variant = candidate.split( ' ' )[ 0 ];
				expect( new URL( variant ).pathname ).toMatch(
					new RegExp(
						`^${ directory }hero\\.[0-9a-f]{12}\\.${ width }\\.${ extension }$`
					)
				);
				const response = await request.get( variant );
				expect( response.status() ).toBe( 200 );
				expect( response.headers()[ 'content-type' ] ).toBe( type );
			}
		}
		// The original is the largest candidate of its own format.
		expect( candidates.at( -1 ) ).toMatch(
			/\/assets\/images\/hero\.jpg\?ver=[0-9a-f]{12} 1600w$/
		);
	} );

	test( 'preload the font marked in the stylesheet', async ( { page } ) => {
		await page.goto( url );

		const preload = page.locator( 'link[rel="preload"][as="font"]' );
		await expect( preload ).toHaveCount( 1 );
		await expect( preload ).toHaveAttribute( 'type', 'font/woff2' );
		await expect( preload ).toHaveAttribute( 'crossorigin', 'anonymous' );
		expect( await preload.getAttribute( 'href' ) ).toMatch(
			/\/wp-content\/themes\/theme-dev-test\/build\/fonts\/dev-test-icons\.[0-9a-f]+\.woff2$/
		);
	} );

	test( 'are imported into the media library once', async ( {
		requestUtils,
	} ) => {
		const imported = async () => {
			const { status, body } = await restResponse( requestUtils, {
				path: '/dev-test/v1/assets/media',
				method: 'POST',
				data: { name: 'images/swatch.png' },
			} );
			expect( status ).toBe( 200 );
			return body.id;
		};

		const id = trackMedia( await imported() );
		expect( await imported() ).toBe( id );

		const media = await requestUtils.rest( {
			path: `/wp/v2/media/${ id }`,
		} );
		expect( media.mime_type ).toBe( 'image/png' );
		expect( media.media_details.width ).toBe( 4 );
		expect( media.source_url ).toMatch(
			/\/uploads\/.+\/swatch(-\d+)?\.png$/
		);
	} );
} );
