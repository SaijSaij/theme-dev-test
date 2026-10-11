/**
 * Replaces the generated text control of the accent support in every block that uses it.
 */
import { registerSupportControl } from '@saij/wp-app-framework';
import { RadioControl } from '@wordpress/components';

registerSupportControl( 'accent', ( { value, onChange } ) => (
	<RadioControl
		className="dev-test-accent-control"
		label="Accent"
		selected={ value ?? '' }
		options={ [
			{ label: 'None', value: '' },
			{ label: 'Coral', value: 'coral' },
			{ label: 'Teal', value: 'teal' },
		] }
		onChange={ ( accent ) => onChange( accent === '' ? null : accent ) }
	/>
) );
