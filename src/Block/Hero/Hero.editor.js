/**
 * Editor extension of the hero block: a panel that summarizes the buttons.
 */
import { registerPanel } from '@saij/wp-app-framework';
import { PanelBody } from '@wordpress/components';

registerPanel( 'sections/hero', ( { attributes } ) => (
	<PanelBody title="Hero summary" initialOpen={ false }>
		<p className="sections-hero-summary">{ `${ attributes.buttons.length } button(s)` }</p>
	</PanelBody>
) );
