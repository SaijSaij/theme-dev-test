/**
 * An editor script without a block: a RichText format of the theme, titled with view data set in PHP
 * (editor-scripts.spec.js).
 */
import { getData } from '@saij/wp-app-framework';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import { registerFormatType, toggleFormat } from '@wordpress/rich-text';

const NAME = 'dev-test/highlight';
const { highlightTitle } = getData( 'editor' );

registerFormatType( NAME, {
	title: highlightTitle,
	tagName: 'mark',
	className: 'dev-test-highlight',
	edit: ( { isActive, value, onChange } ) => (
		<RichTextToolbarButton
			icon="admin-appearance"
			title={ highlightTitle }
			isActive={ isActive }
			onClick={ () => onChange( toggleFormat( value, { type: NAME } ) ) }
		/>
	),
} );
