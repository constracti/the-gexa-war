import { api, human_duration, team_badge } from './common.js';
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
 * @property {number} time_start
 * @property {number} time_stop
 * @property {number} time_now
 * @property {number} reward_success
 * @property {number} reward_conquest
 * @property {number} reward_rate
 * @property {Station[]} station_list
 * @property {Team[]} team_list
 * @property {Success[]} success_list
 */

const time_div = document.getElementById('time-div');

/**
 * @type {HTMLDivElement}
 */
const station_section = document.getElementById('station-section');
station_section.firstElementChild.innerHTML = lexicon.station_list;

/**
 * @type {HTMLDivElement}
 */
const station_list = document.getElementById('station-list');

/**
 * @type {HTMLDivElement}
 */
const score_section = document.getElementById('score-section');
score_section.firstElementChild.innerHTML = lexicon.score;

/**
 * @type {HTMLDivElement}
 */
const score_list = document.getElementById('score-list');

/**
 * @type {HTMLDivElement}
 */
const recent_section = document.getElementById('recent-section');
recent_section.firstElementChild.innerHTML = lexicon.success_list;

/**
 * @type {HTMLDivElement}
 */
const recent_list = document.getElementById('recent-list');

/**
 * @type {Game}
 */
const result = await api.get('game');
result.time_now = result.time_start;

function refresh() {
	const station_map = new Map(result.station_list.map(station => [station.id, station]));
	const station_conquest_map = new Map(result.station_list.map(station => [station.id, null]));
	const team_map = new Map(result.team_list.map(team => [team.id, team]));
	const team_score_map = new Map(result.team_list.map(team => [team.id, 0]));
	const success_list = result.success_list.filter(success => success.timestamp < result.time_now).sort((lhs, rhs) => lhs.timestamp - rhs.timestamp);
	/**
	 * @param {number} success_timestamp success timestamp in seconds
	 * @returns {number}
	 */
	function team_score_success(success_timestamp) {
		const current_value = 1 + result.reward_rate / 3600 * (success_timestamp - result.time_start);
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
		const mean_value = 1 + result.reward_rate / 3600 * (mean_timestamp - result.time_start);
		return result.reward_conquest / 60 * mean_value * duration;
	}
	// score from successes and previous conquests
	success_list.forEach(success => {
		const station = station_map.get(success.station);
		const conquest = station_conquest_map.get(success.station);
		if (success.type !== 'simple') {
			// add points to previous conqueror
			if (conquest !== null) {
				const conquest_score = team_score_conquest(conquest.timestamp, success.timestamp);
				team_score_map.set(conquest.team, team_score_map.get(conquest.team) + conquest_score);
			}
			// set current conqueror
			if (success.type === 'conquest')
				station_conquest_map.set(success.station, success);
			else
				station_conquest_map.set(success.station, null);
		}
		// add success points
		team_score_map.set(success.team, team_score_map.get(success.team) + team_score_success(success.timestamp) / station.capacity);
	});
	// score from current conquests
	result.station_list.forEach(station => {
		const conquest = station_conquest_map.get(station.id);
		if (conquest === null)
			return;
		const conquest_score = team_score_conquest(conquest.timestamp, result.time_now);
		team_score_map.set(conquest.team, team_score_map.get(conquest.team) + conquest_score);
	});
	// score normalization
	result.team_list.forEach(team => {
		if (team.players > 0) {
			team_score_map.set(team.id, team_score_map.get(team.id) / team.players);
		}
	});
	// time
	time_div.innerHTML = human_duration(result.time_now - result.time_start);
	// station
	station_list.innerHTML = '';
	station_list.append(...result.station_list.map(station => {
		const conquest = station_conquest_map.get(station.id);
		const team = conquest !== null ? team_map.get(conquest.team) : null;
		return n({
			class: 'col-6 p-0',
			content: [
				n({
					class: 'm-2 border rounded d-flex flex-row justify-content-between align-items-center p-1',
					content: [
						n({
							class: 'm-1',
							content: station.name,
						}),
						team !== null ? team_badge(team) : n({}),
					],
				}),
			],
		});
	}));
	// score
	score_list.innerHTML = '';
	const team_list = result.team_list.toSorted((lhs, rhs) => -(team_score_map.get(lhs.id) - team_score_map.get(rhs.id)));
	score_list.append(...team_list.map(team => n({
		class: 'list-group-item d-flex flex-row justify-content-between align-items-center p-1',
		content: [
			team_badge(team),
			n({
				class: 'm-1',
				content: team_score_map.get(team.id).toFixed(0),
			}),
		],
	})));
	// recent
	recent_list.innerHTML = '';
	recent_list.append(...success_list.toReversed().map(success => {
		const station = station_map.get(success.station);
		const team = team_map.get(success.team);
		const type = success.type === 'conquest' ? lexicon.success_conquest :
			(success.type === 'neutralization' ? lexicon.success_neutralization : lexicon.success_simple);
		return n({
			class: 'list-group-item d-flex flex-column p-1',
			content: [
				n({
					class: 'd-flex flex-row justify-content-between align-items-center',
					content: [
						n({
							class: 'm-1',
							content: station.name,
						}),
						team_badge(team),
					],
				}),
				n({
					class: 'd-flex flex-row justify-content-between align-items-center',
					content: [
						n({
							class: 'm-1',
							content: type,
						}),
						n({
							class: 'm-1',
							content: human_duration(success.timestamp - result.time_start),
						}),
					],
				}),
			],
		});
	}));
	// loop
	if (result.time_now < result.time_stop) {
		result.time_now = Math.min(result.time_now + 30, result.time_stop);
		setTimeout(refresh, 1000);
	}
}

refresh();
