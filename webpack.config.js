/**
 * Builds the editor runtime of the framework and the editor scripts in src/
 * into build/ (see vendor/saij/wp-app-framework/webpack.config.js).
 */
module.exports = require( './vendor/saij/wp-app-framework/webpack.config.js' )(
	{
		slug: 'theme-dev-test',
		root: __dirname,
	}
);
