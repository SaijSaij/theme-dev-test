/**
 * Marks the root element of the cached block, also when the block comes from the cache (cache.spec.js). On the
 * front end it shows the render count from the view data, set again by a cache hit, and its place in the mount
 * order of the shared module order.js, after the document view (document-views.spec.js).
 */
import { BlockView } from '@saij/wp-app-framework/view';
import { take } from '#shared/order';

export default class Cached extends BlockView {
	mount() {
		this.element.dataset.mounted = 'true';
		// The view data of the editor does not hold renders of the preview route.
		if ( ! this.isPreview ) {
			this.element.dataset.viewData = String(
				this.data( 'cached' ).render
			);
			this.element.dataset.order = String( take( 'cached' ) );
		}
	}
}
