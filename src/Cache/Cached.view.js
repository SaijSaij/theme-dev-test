/**
 * Marks the root element of the cached block, also when the block comes from the cache (cache.spec.js).
 */
import { BlockView } from '@saij/wp-app-framework/view';

export default class Cached extends BlockView {
	mount() {
		this.element.dataset.mounted = 'true';
	}
}
