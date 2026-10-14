/**
 * A document view: runs on every page of the front end, before the views of blocks; reads view data set in PHP,
 * takes the first place of the shared module order.js and loads an "external" script (document-views.spec.js);
 * passes on the URL of an imported image (assets.spec.js).
 */
import { DocumentView } from '@saij/wp-app-framework/view';
import { take } from '#shared/order';
import swatch from './images/swatch.png';

export default class DocumentMarker extends DocumentView {
	async mount() {
		const { greeting, external } = this.data( 'document' );
		this.element.dataset.devTestDocument = greeting;
		this.element.dataset.devTestOrder = String( take( 'document' ) );
		// An image imported by a script: the build copies it to build/images/ (assets.spec.js).
		this.element.dataset.devTestImage = swatch;

		await this.loadScript( external, { 'data-dev-test': 'external' } );
		this.element.dataset.devTestExternal = this.window.devTestExternal;
	}
}
