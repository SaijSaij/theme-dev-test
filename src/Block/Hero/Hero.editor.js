/**
 * Editor extension of the hero block: a panel that summarizes the buttons.
 */
import { registerPanel } from '@saij/wp-app-framework';
import { PanelBody } from '@wordpress/components';

registerPanel( 'dev-test/hero', ( { attributes } ) => (
	<PanelBody title="Hero summary" initialOpen={ false }>
		<p className="dev-test-hero-summary">{ `${ attributes.buttons.length } button(s)` }</p>
	</PanelBody>
) );
