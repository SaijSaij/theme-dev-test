/**
 * Front-end behavior of the FAQ block: the question opens and closes the answer.
 * Records its life cycle in window.devTestViewLog for frontend.spec.js.
 */
import { BlockView } from '@webcodingcat/wp-app-framework/view';

export default class Faq extends BlockView {
	mount() {
		this.question = this.find( '.faq__question' );
		this.answer = this.find( '.faq__answer' );
		this.listen( this.question, 'click', () => this.toggle() );
		this.log( 'mount' );
	}

	toggle() {
		const open = this.answer.hidden;
		this.answer.hidden = ! open;
		this.question.setAttribute( 'aria-expanded', String( open ) );
		this.log( open ? 'open' : 'close' );
	}

	unmount() {
		this.log( 'unmount' );
	}

	log( event ) {
		this.window.devTestViewLog = this.window.devTestViewLog ?? [];
		this.window.devTestViewLog.push(
			`faq ${ event }${ this.isPreview ? ' (preview)' : '' }`
		);
	}
}
