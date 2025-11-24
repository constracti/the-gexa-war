import { api } from './common.js';
import { n } from './element.js';

/**
 * @typedef {import('./common.js').Station} Station
 * @typedef {import('./common.js').Team} Team
 * @typedef {import('./common.js').Player} Player
 */

/**
 * @type {HTMLUListElement}
 */
const station_list = document.getElementById('station-list');

/**
 * @type {HTMLDivElement}
 */
const team_list = document.getElementById('team-list');

(async () => {
	/**
	 * @type {{station_list: Station[], team_list: Team[], player_list: Player[]}}
	 */
	const result = await api.get('game');
	console.log(result);
	for (const station of result.station_list) {
		station_list.appendChild(n({
			tag: 'li',
			class: 'list-group-item',
			content: station.name,
		}));
	}
	for (const team of result.team_list) {
		team_list.appendChild(n({
			class: 'list-group-item p-1',
			content: [
				n({
					class: 'm-1',
					content: team.name,
				}),
				n({
					class: 'list-group m-1',
					content: result.player_list.filter(player => player.team === team.id).map(player => n({
						class: 'list-group-item',
						content: player.name,
					})),
				}),
			],
		}));
	}
})();