/**
 * Translations (languages/theme-dev-test-de_DE.po and the framework's German translation): texts of attributes,
 * templates and the controls of the framework, in the language of the site on the front end and of the user in the
 * editor. The language is set through a route of the theme (src/I18n/LocaleController.php), because the instances
 * have no language packs.
 */
const { test, expect } = require( '../fixtures' );

const {
	block,
	cleanUp,
	createDraft,
	openPostWith,
	restResponse,
} = require( '../helpers' );

/**
 * @param {Object} requestUtils
 * @param {string} locale
 */
async function setLocale( requestUtils, locale ) {
	const response = await restResponse( requestUtils, {
		method: 'POST',
		path: '/dev-test/v1/locale',
		data: { locale },
	} );
	expect( response.status ).toBe( 200 );
}

test.describe( 'Translations', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await setLocale( requestUtils, 'en_US' );
		await cleanUp( requestUtils );
	} );

	test( 'translate templates on the front end in the language of the site', async ( {
		page,
		requestUtils,
	} ) => {
		const id = await createDraft(
			requestUtils,
			block( 'dev-test/translated' )
		);
		await page.goto( `/?p=${ id }&preview=true` );
		await expect( page.locator( '.translated' ) ).toHaveText(
			'Hello world · May · 2 days'
		);

		await setLocale( requestUtils, 'de_DE' );
		await page.reload();
		await expect( page.locator( '.translated' ) ).toHaveText(
			'Hallo Welt · Mai · 2 Tage'
		);
	} );

	test( 'translate attributes, templates and the controls of the framework in the editor', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		await setLocale( requestUtils, 'de_DE' );
		await openPostWith(
			{ admin, editor, requestUtils },
			[
				block( 'dev-test/translated' ),
				block( 'dev-test/hero', { headline: 'Head' } ),
			].join( '\n' )
		);

		await expect( editor.canvas.locator( '.translated' ) ).toHaveText(
			'Hallo Welt · Mai · 2 Tage'
		);
		expect(
			await page.evaluate(
				() =>
					window.wp.data
						.select( 'core/blocks' )
						.getBlockType( 'dev-test/translated' ).title
			)
		).toBe( 'Übersetzt' );

		await editor.canvas.locator( '.hero__headline' ).click();
		await editor.openDocumentSettingsSidebar();
		// Panels and controls of the framework, with a label of the theme (#[Label]) in a text of the framework.
		await expect(
			page.getByRole( 'button', { name: 'Inhalt' } )
		).toBeVisible();
		await expect(
			page.getByRole( 'button', { name: 'Hintergrundbild auswählen' } )
		).toBeVisible();
		await expect(
			page.getByRole( 'button', { name: 'Eintrag zu Badges hinzufügen' } )
		).toBeVisible();

		// The labels of a post type.
		await admin.visitAdminPage( 'edit.php', 'post_type=dev_test_event' );
		await expect( page.locator( '#adminmenu' ) ).toContainText(
			'Veranstaltungen'
		);
	} );
} );
