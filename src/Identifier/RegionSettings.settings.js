/**
 * Adds a preview below the generated controls of each region on the settings
 * page (registerSettingsControl() with DefaultControl), with the identifier,
 * the index from the path and the number of regions from the group value.
 */
import { registerSettingsControl } from '@saij/wp-app-framework/settings';

registerSettingsControl(
	'regions',
	[ 'regions', '*' ],
	( { value, path, groupValue, DefaultControl } ) => (
		<>
			<DefaultControl />
			<p className="dev-test-region-preview">
				{ `${ value.name } (${ value.id || 'new' }), ${
					path[ 1 ] + 1
				} of ${ groupValue.regions.length }` }
			</p>
		</>
	)
);
