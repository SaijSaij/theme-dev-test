/**
 * View script of the Reveal block support: marks the root element with the
 * support's value and records its life cycle in window.devTestViewLog for
 * frontend.spec.js.
 */
import { SupportView } from '@webcodingcat/wp-app-framework/view';

export default class Reveal extends SupportView {
	mount() {
		this.element.dataset.revealed = String( this.value );
		this.onUnmount( () => delete this.element.dataset.revealed );
		this.window.devTestViewLog = this.window.devTestViewLog ?? [];
		this.window.devTestViewLog.push( `reveal ${ this.value }` );
	}
}
