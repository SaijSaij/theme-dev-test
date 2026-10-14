/**
 * A shared module: one instance for the whole page, whichever views import it. Each view takes a place in the
 * order in which the views mount (document-views.spec.js).
 */
const mounted = [];

/**
 * @param {string} name
 * @return {number} Place of the view, starting at 1.
 */
export function take( name ) {
	mounted.push( name );
	return mounted.length;
}
