/**
 * ESLint configuration: the defaults of `@wordpress/scripts`.
 *
 * WordPress provides its packages to the editor at runtime (script handles,
 * mapped by the dependency extraction plugin); they are not installed.
 * `@saij/wp-app-framework` is mapped the same way, to the runtime of this
 * theme's framework instance (see the framework's webpack helper).
 */
const defaults = require( '@wordpress/scripts/config/eslint.config.cjs' );

const PROVIDED_AT_RUNTIME = [
	'@wordpress/components',
	'@saij/wp-app-framework',
];

module.exports = [
	...defaults,
	{
		settings: {
			'import/core-modules': PROVIDED_AT_RUNTIME,
		},
	},
];
