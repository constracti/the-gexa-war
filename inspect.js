import { api, textColor } from './common.js';
import { n } from './element.js';
import { lexicon } from './lexicon.js';

/**
 * @typedef {import('./common.js').Station} Station
 */

/**
 * @typedef {import('./common.js').Team} Team
 */

/**
 * @typedef {import('./common.js').Player} Player
 */

/**
 * @typedef Success
 * @type {object}
 * @property {number} id
 * @property {string} player
 * @property {number} station
 * @property {string} type
 * @property {number} timestamp
 */

document.getElementById('inspect-heading').innerHTML = lexicon.inspect;

/**
 * @type {HTMLDivElement}
 */
const inspect_div = document.getElementById('inspect-div');

(async () => {
	const password = localStorage.getItem('password');
	if (password === null) {
		location.href = './admin.html';
		return;
	}
	const formData = new FormData();
	formData.append('password', password);
	/**
	 * @type {{station_list: Station[], team_list: Team[], player_list: Player[], success_list: Success[]}}
	 */
	const result = await api.post('inspect', formData);
	if (result === null) {
		location.href = './admin.html';
		return;
	}
	const station_map = new Map(result.station_list.map(station => [station.id, station]));
	const team_map = new Map(result.team_list.map(team => [team.id, team]));
	const player_map = new Map(result.player_list.map(player => [player.id, player]));
	/**
	 * @type {Map<string, Success[]>}
	 */
	const success_list_by_player = new Map(result.player_list.map(player => [player.id, []]));
	result.success_list.forEach(success => {
		success_list_by_player.get(success.player).push(success);
	});
	/**
	 * @type {{player: Player, seconds: number, previous: Success, current: Success}[]}
	 */
	const interval_list = [];
	success_list_by_player.forEach((success_list, player_id) => {
		const player = player_map.get(player_id);
		/**
		 * @type {?Success}
		 */
		let previous = null;
		success_list.forEach(current => {
			if (previous !== null) {
				interval_list.push({
					player: player,
					seconds: current.timestamp - previous.timestamp,
					previous: previous,
					current: current,
				});
			}
			previous = current;
		});
	});
	interval_list.sort((lhs, rhs) => lhs.seconds - rhs.seconds);
	interval_list.forEach(interval => {
		const team = team_map.get(interval.player.team);
		inspect_div.append(n({
			class: `list-group-item ${interval.player.block ? 'list-group-item-warning' : ''} p-1 d-flex flex-row align-items-center`,
			content: [
				n({
					class: 'm-1',
					content: interval.player.name,
				}),
				n({
					class: 'badge m-1',
					style: {
						backgroundColor: team.color,
						color: textColor(team.color),
					},
					content: team.name,
				}),
				n({
					class: 'flex-grow-1 m-1',
					content: [
						station_map.get(interval.previous.station).name,
						station_map.get(interval.current.station).name,
					].join(' &rarr; '),
				}),
				n({
					class: 'badge text-bg-info m-1',
					content: interval.seconds.toString(),
				}),
			],
		}));
	});
})();