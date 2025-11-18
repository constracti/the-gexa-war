import { api } from './common.js';
import { n } from './element.js';
import { lexicon } from './lexicon.js';

const result = await api.get('station_list');

/**
 * @type {(?string)[]}
 */
const station_list = result.station_list;
station_list.splice(0, 0, null);

document.body.appendChild(n({
	tag: 'form',
	submit: async event => {
		const form = event.currentTarget;
		const result = await api.post('station_login', new FormData(form));
		console.log(result);
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
					content: station_list.map(station => n({
						tag: 'option',
						content: station ?? lexicon.select,
					})),
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