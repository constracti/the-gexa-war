import { api, textColor } from './common.js';
import { n } from './element.js';
import { lexicon } from './lexicon.js';

/**
 * @typedef {import('./common.js').Station} Station
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

/**
 * @type {HTMLDivElement}
 */
const success_list = document.getElementById('success-list');
success_list.previousElementSibling.innerHTML = lexicon.success_recent;

async function refresh() {
	spinner_div.classList.remove('d-none');
	/**
	 * @type {Game}
	 */
	const result = await api.get('game');
	spinner_div.classList.add('d-none');
	console.log(result); // TODO delete
	if (result.game_state === 'pending')
		alert_div.innerHTML = `${lexicon.game_start}: ${result.game_start.split(' ')[1]}`;
	else
		alert_div.innerHTML = `${lexicon.game_stop}: ${result.game_stop.split(' ')[1]}`;
	/**
	 * @type {Map<number, Station>}
	 */
	const station_map = new Map(result.station_list.map(station => [station.id, station]));
	/**
	 * @type {Map<number, Team>}
	 */
	const team_map = new Map(result.team_list.map(team => [team.id, team]));
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
	result.station_list.forEach(station => {
		if (station.team === null)
			return;
		/**
		 * @type {Success}
		 */
		const success = {
			id: 0,
			station: station.id,
			team: station.team,
			type: 'conquest',
			timestamp: result.initial_timestamp,
		};
		// apply initial conquest
		station_conquest_dict[station.id] = success;
	});
	result.success_list.forEach(success => {
		const conquest = station_conquest_dict[success.station];
		// apply conquests and neutralizations
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
		// add success score
		team_score_dict[success.team] += team_score_success(success.timestamp);
	});
	station_list.innerHTML = '';
	result.station_list.forEach(station => {
		const conquest = station_conquest_dict[station.id];
		const team = conquest !== null ? team_map.get(conquest.team) : null;
		station_list.appendChild(n({
			class: 'list-group-item d-flex flex-row justify-content-between align-items-center p-1',
			content: [
				n({
					class: 'm-1',
					content: station.name,
				}),
				team !== null ? n({
					class: 'badge border m-1',
					style: {
						backgroundColor: team.color,
						color: textColor(team.color),
					},
					content: team.name,
				}) : n({
					class: 'm-0',
				}),
			],
		}));
		// add present conquest
		if (conquest !== null) {
			team_score_dict[conquest.team] += team_score_conquest(conquest.timestamp, result.current_timestamp);
			station_conquest_dict[station.id] = null;
		}
	});
	// normalize score
	result.team_list.forEach(team => {
		if (team.players > 0)
			team_score_dict[team.id] /= team.players;
	});
	team_list.innerHTML = '';
	result.team_list.toSorted((lhs, rhs) => {
		return -(team_score_dict[lhs.id] - team_score_dict[rhs.id]); // sort by score in descending order
	}).forEach(team => {
		team_list.appendChild(n({
			class: 'list-group-item d-flex flex-row justify-content-between align-items-center p-1',
			content: [
				n({
					class: 'badge border m-1',
					style: {
						backgroundColor: team.color,
						color: textColor(team.color),
					},
					content: team.name,
				}),
				n({
					class: 'm-1',
					content: `${team_score_dict[team.id].toFixed(0)}`,
				}),
			],
		}));
	});
	success_list.innerHTML = '';
	if (result.game_state !== 'running') {
		success_list.append(n({
			class: 'list-group-item list-group-item-warning p-2',
			content: result.game_state === 'pending' ? lexicon.game_pending : lexicon.game_finished,
		}));
	} else {
		result.success_list.filter(success => {
			return result.current_timestamp - success.timestamp < 1e6; // TODO how old? in seconds - also, how many?
		}).sort((lhs, rhs) => {
			return -(lhs.timestamp - rhs.timestamp); // sort by timstamp in descending order
		}).forEach(success => {
			const station = station_map.get(success.station);
			const team = team_map.get(success.team);
			const type = success.type === 'conquest' ? lexicon.success_conquest :
				(success.type === 'neutralization' ? lexicon.success_neutralization : lexicon.success_simple);
			success_list.appendChild(n({
				class: 'list-group-item d-flex flex-row justify-content-between align-items-center p-1',
				content: [
					n({
						class: 'm-1',
						content: `${type} ${lexicon.at} ${station.name}`,
					}),
					n({
						class: 'badge border m-1',
						style: {
							backgroundColor: team.color,
							color: textColor(team.color),
						},
						content: team.name,
					}),
				],
			}));
		});
		if (success_list.childElementCount === 0) {
			success_list.append(n({
				class: 'list-group-item p-2',
				content: '-',
			}));
		}
	}
	if (result.game_state !== 'finished')
		setTimeout(refresh, 10000); // TODO delay
}

refresh();