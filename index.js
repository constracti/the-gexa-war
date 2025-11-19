import { api } from './common.js';
import { n, n_option_list } from './element.js';
import { lexicon } from './lexicon.js';

/**
 * @typedef Station
 * @type {object}
 * @property {number} id
 * @property {string} name
 */

/**
 * @typedef Team
 * @type {object}
 * @property {number} id
 * @property {string} name
 */

/**
 * @typedef Player
 * @type {object}
 * @property {number} id
 * @property {string} name
 * @property {number} team
 */

/**
 * @type {{station_list: Station[]}}
 */
const result = await api.get('station_list');
const station_list = result.station_list;

document.body.appendChild(n({
	tag: 'form',
	submit: async event => {
		const form = event.currentTarget;
		/**
		 * @type {{team_list: Team[], player_list: Player[]}}
		 */
		const result = await api.post('station_login', new FormData(form));
		const station = station_list.filter(station => station.id === parseInt(form.station.value)).at(0);
		const password = form.password.value;
		// TODO save station and password in local storage
		console.log(result);
		document.body.appendChild(n({
			class: 'm-2',
			content: station.name,
		}));
	},
	content: [
		n({
			class: 'm-2',
			content: [
				n({
					tag: 'label',
					class: 'form-label',
					for: 'station',
					content: lexicon.station,
				}),
				n({
					tag: 'select',
					class: 'form-select',
					id: 'station',
					name: 'station',
					required: true,
					content: n_option_list(station_list, lexicon.select),
				}),
			],
		}),
		n({
			class: 'm-2',
			content: [
				n({
					tag: 'label',
					class: 'form-label',
					for: 'password',
					content: lexicon.password,
				}),
				n({
					tag: 'input',
					class: 'form-control',
					id: 'password',
					name: 'password',
					required: true,
					type: 'password',
				}),
			],
		}),
		n({
			tag: 'button',
			class: 'm-2 btn btn-primary',
			content: lexicon.submit,
		}),
	],
}));