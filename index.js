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
 * @property {string} game_start
 * @property {string} game_stop
 * @property {string} game_state
 * @property {number} initial_timestamp
 * @property {number} current_timestamp
 * @property {number} reward_success
 * @property {number} reward_conquest
 * @property {number} reward_rate
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
	if (result.game_state === 'pending')
		alert_div.innerHTML = `${lexicon.game_start}: ${result.game_start.split(' ')[1]}<br>${lexicon.game_pending}`;
	else if (result.game_state === 'finished')
		alert_div.innerHTML = `${lexicon.game_stop}: ${result.game_stop.split(' ')[1]}<br>${lexicon.game_finished}`;
	else
		alert_div.innerHTML = `${lexicon.game_stop}: ${result.game_stop.split(' ')[1]}`;
	/**
	 * @type {{[k: number]: Team}}
	 */
	const team_dict = Object.fromEntries(result.team_list.map(team => [team.id, team]));
	/**
	 * @type {{[k: number]: number}}
	 */
	const team_score_dict = Object.fromEntries(result.team_list.map(team => [team.id, 0]));
	/**
	 * @param {number} current_timestamp success timestamp in seconds
	 * @returns {number}
	 */
	function team_score_success(current_timestamp) {
		const current_value = 1 + result.reward_rate / 3600 * (current_timestamp - result.initial_timestamp);
		return result.reward_success * current_value;
	}
	/**
	 * @param {number} start_timestamp conquest start timestamp in seconds
	 * @param {number} stop_timestamp conquest stop timestamp in seconds
	 * @returns {number}
	 */
	function team_score_conquest(start_timestamp, stop_timestamp) {
		const duration = stop_timestamp - start_timestamp // seconds
		const mean_timestamp = (start_timestamp + stop_timestamp) / 2 // seconds
		const mean_value = 1 + result.reward_rate / 3600 * (mean_timestamp - result.initial_timestamp);
		return result.reward_conquest / 60 * mean_value * duration;
	}
	/**
	 * @type {{[k: number]: ?Success}}
	 */
	const station_conquest_dict = Object.fromEntries(result.station_list.map(station => [station.id, null]));
	result.success_list.forEach(success => {
		const conquest = station_conquest_dict[success.station];
		switch (success.type) {
			case 'neutralization':
				if (conquest !== null) {
					team_score_dict[conquest.team] += team_score_conquest(conquest.timestamp, success.timestamp);
					station_conquest_dict[success.station] = null;
				}
				break;
			case 'conquest':
				if (conquest !== null) {
					team_score_dict[conquest.team] += team_score_conquest(conquest.timestamp, success.timestamp);
				}
				station_conquest_dict[success.station] = success;
				break;
		}
		team_score_dict[success.team] += team_score_success(success.timestamp);
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
			team_score_dict[conquest.team] += team_score_conquest(conquest.timestamp, result.current_timestamp);
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
	if (result.game_state !== 'finished')
		setTimeout(refresh, 10000); // TODO delay
}

refresh();