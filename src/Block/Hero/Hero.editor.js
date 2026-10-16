/**
 * Editor extension of the hero block: a panel that summarizes the lists and shows that panels receive the
 * same props as toolbar buttons (clientId, isPreview).
 */
import { registerPanel } from '@saij/wp-app-framework';
import { PanelBody } from '@wordpress/components';

registerPanel( 'hero', ( { attributes, clientId, isPreview } ) => (
	<PanelBody title="Hero summary" initialOpen={ false }>
		<p className="dev-test-hero-summary">{ `${ attributes.badges.length } badge(s), ${ attributes.buttons.length } button(s)` }</p>
		<p className="dev-test-hero-props" data-client-id={ clientId }>
			{ isPreview ? 'preview' : 'editing' }
		</p>
	</PanelBody>
) );
