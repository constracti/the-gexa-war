import { api, textColor } from './common.js';
import { n } from './element.js';
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
 * @property {string} color
 * @property {number} players
 */

/**
 * @typedef Success
 * @type {object}
 * @property {number} id
 * @property {number} station
 * @property {number} team
 * @property {string} type
 * @property {number} timestamp
 */

/**
 * @typedef Game
 * @type {object}
 * @property {string} deadline
 * @property {number} present
 * @property {boolean} expired
 * @property {number} reward_success
 * @property {number} reward_conquest
 * @property {Station[]} station_list
 * @property {Team[]} team_list
 * @property {Success[]} success_list
 */

/**
 * @type {HTMLDivElement}
 */
const spinner_div = document.getElementById('spinner-div');

/**
 * @type {HTMLDivElement}
 */
const alert_div = document.getElementById('alert-div');

/**
 * @type {HTMLDivElement}
 */
const station_list = document.getElementById('station-list');
station_list.previousElementSibling.innerHTML = lexicon.station_list;

/**
 * @type {HTMLDivElement}
 */
const team_list = document.getElementById('team-list');
team_list.previousElementSibling.innerHTML = lexicon.team_list;

// TODO recent events

async function refresh() {
	spinner_div.classList.remove('d-none');
	/**
	 * @type {Game}
	 */
	const result = await api.get('game');
	spinner_div.classList.add('d-none');
	console.log(result); // TODO delete
	alert_div.classList.remove('alert-info', 'alert-danger');
	alert_div.classList.add(result.expired ? 'alert-danger' : 'alert-info');
	alert_div.innerHTML = `${lexicon.deadline}: ${result.deadline.split(' ')[1]}`;
	/**
	 * @type {{[k: number]: Team}}
	 */
	const team_dict = Object.fromEntries(result.team_list.map(team => [team.id, team]));
	/**
	 * @type {{[k: number]: number}}
	 */
	const team_score_dict = Object.fromEntries(result.team_list.map(team => [team.id, 0]));
	/**
	 * @type {{[k: number]: ?Success}}
	 */
	const station_conquest_dict = Object.fromEntries(result.station_list.map(station => [station.id, null]));
	result.success_list.forEach(success => {
		const conquest = station_conquest_dict[success.station];
		switch (success.type) {
			case 'neutralization':
				if (conquest !== null) {
					team_score_dict[conquest.team] += (success.timestamp - conquest.timestamp) * result.reward_conquest / 60;
					station_conquest_dict[success.station] = null;
				}
				break;
			case 'conquest':
				if (conquest !== null) {
					team_score_dict[conquest.team] += (success.timestamp - conquest.timestamp) * result.reward_conquest / 60;
				}
				station_conquest_dict[success.station] = success;
				break;
		}
		team_score_dict[success.team] += result.reward_success;
	});
	// TODO normalize score
	station_list.innerHTML = '';
	result.station_list.forEach(station => {
		const conquest = station_conquest_dict[station.id];
		station_list.appendChild(n({
			class: 'list-group-item d-flex flex-row justify-content-between align-items-center p-1',
			content: [
				n({
					class: 'm-1',
					content: station.name,
				}),
				n({
					class: 'badge text-bg-secondary m-1',
					content: conquest !== null ? `${team_dict[conquest.team].name}` : '-',
				}),
			],
		}));
		if (conquest !== null) {
			team_score_dict[conquest.team] += (result.present - conquest.timestamp) * result.reward_conquest / 60;
			station_conquest_dict[station.id] = null;
		}
	});
	team_list.innerHTML = '';
	result.team_list.forEach(team => {
		team_list.appendChild(n({
			class: 'list-group-item d-flex flex-row justify-content-between align-items-center p-1',
			content: [
				n({
					class: 'm-1',
					content: team.name,
				}),
				n({
					class: 'badge m-1',
					style: {
						backgroundColor: team.color,
						color: textColor(team.color),
					},
					content: `${team_score_dict[team.id].toFixed(0)}`,
				}),
			],
		}));
	});
	if (!result.expired)
		setTimeout(refresh, 10000); // TODO delay
}

refresh();