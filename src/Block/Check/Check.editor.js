/**
 * Editor extension of the check block: replaces the generated control of an attribute.
 */
import { registerControl } from '@saij/wp-app-framework';
import { RangeControl } from '@wordpress/components';

registerControl( 'check', 'ratio', ( { value, onChange } ) => (
	<RangeControl
		__next40pxDefaultSize
		__nextHasNoMarginBottom
		label="Ratio (custom control)"
		value={ value }
		onChange={ onChange }
		min={ 0 }
		max={ 2 }
		step={ 0.25 }
	/>
) );
