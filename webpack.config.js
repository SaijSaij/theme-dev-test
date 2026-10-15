/**
 * Builds the editor runtime of the framework and the editor scripts in src/
 * into build/ (see the webpack helper of the framework, `@saij/wp-app-framework/webpack`).
 */
module.exports = require( '@saij/wp-app-framework/webpack' )( {
	slug: 'theme-dev-test',
	root: __dirname,
} );
