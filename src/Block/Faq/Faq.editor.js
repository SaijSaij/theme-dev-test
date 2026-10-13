/**
 * Editor extension of the FAQ block: a toolbar button that switches whether the answer is open by default.
 */
import { registerToolbarButton } from '@saij/wp-app-framework';
import { ToolbarButton } from '@wordpress/components';

registerToolbarButton( 'faq', ( { attributes, setAttributes } ) => (
	<ToolbarButton
		icon="arrow-down-alt2"
		label={ attributes.open ? 'Closed by default' : 'Open by default' }
		isPressed={ attributes.open }
		onClick={ () => setAttributes( { open: ! attributes.open } ) }
	/>
) );
