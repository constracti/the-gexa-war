import { api } from './common.js';
import { n } from './element.js';
import { lexicon } from './lexicon.js';

const result = await api.get();

/**
 * @type {(?string)[]}
 */
const station_list = result.station_list;
station_list.splice(0, 0, null);

document.body.appendChild(n({
	tag: 'form',
	submit: () => {
		console.log('submit');
	},
	content: [
		n({
			tag: 'select',
			klass: 'form-select m-2',
			content: station_list.map(station => n({
				tag: 'option',
				content: station ?? lexicon.select,
			})),
		}),
		n({
			tag: 'button',
			klass: 'm-2 btn btn-primary',
			content: lexicon.submit,
		}),
	],
}));