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
 * @typedef {import('./common.js').Game} Game
 */

/**
 * @typedef State
 * @type {object}
 * @property {Game} game
 * @property {number} speed
 * @property {number} time_now
 * @property {number} time_max
 * @property {?number} timer_id
 */

// TODO align control div

/**
 * @type {HTMLInputElement}
 */
const speed_input = document.getElementById('speed-input');
speed_input.previousElementSibling.innerHTML = lexicon.speed;
speed_input.addEventListener('change', () => {
	const speed = parseInt(speed_input.value);
	if (isNaN(speed) || speed < 1)
		return;
	state.speed = speed;
});

const time_div = document.getElementById('time-div');

/**
 * @type {HTMLInputElement}
 */
const time_input = document.getElementById('time-input');
time_input.previousElementSibling.firstElementChild.innerHTML = lexicon.time;
time_input.addEventListener('input', () => {
	const time_now = parseInt(time_input.value);
	if (isNaN(time_now))
		return;
	state.time_now = time_now;
	render_control();
	render_main();
});

/**
 * @type {HTMLButtonElement}
 */
const play_button = document.getElementById('play-button');
play_button.addEventListener('click', () => {
	if (state.timer_id !== null)
		return;
	const restart = state.time_now === state.time_max;
	if (restart) {
		state.time_now = state.game.time_start;
		time_input.value = state.time_now.toFixed();
	}
	state.timer_id = setInterval(() => {
		if (state.timer_id === null)
			return;
		state.time_now += state.speed;
		if (state.time_now >= state.time_max) {
			state.time_now = state.time_max;
			clearInterval(state.timer_id);
			state.timer_id = null;
		}
		time_input.value = state.time_now.toFixed();
		render_control();
		render_main();
	}, 1000);
	render_control();
	if (restart)
		render_main();
});

/**
 * @type {HTMLButtonElement}
 */
const pause_button = document.getElementById('pause-button');
pause_button.addEventListener('click', () => {
	if (state.timer_id === null)
		return;
	clearInterval(state.timer_id);
	state.timer_id = null;
	render_control();
});

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

const state = await (async () => {
	/**
	 * @type {Game}
	 */
	const result = await api.get('game');
	/**
	 * @type {State}
	 */
	const state = {
		game: result,
		speed: 60,
		time_now: result.time_start,
		time_max: Math.min(Math.max(result.time_now, result.time_start), result.time_stop),
		timer_id: null,
	};
	speed_input.value = state.speed.toFixed();
	time_input.min = state.game.time_start.toFixed();
	time_input.max = state.time_max.toFixed();
	time_input.value = state.time_now.toFixed();
	return state;
})();

function render_control() {
	time_div.innerHTML = human_duration(state.time_now - state.game.time_start);
	if (state.timer_id === null) {
		play_button.classList.remove('disabled');
		pause_button.classList.add('disabled');
	} else {
		play_button.classList.add('disabled');
		pause_button.classList.remove('disabled');
	}
}
render_control();

document.getElementById('control-div').classList.remove('d-none');

function render_main() {
	const station_map = new Map(state.game.station_list.map(station => [station.id, station]));
	const station_conquest_map = new Map(state.game.station_list.map(station => [station.id, null]));
	const team_map = new Map(state.game.team_list.map(team => [team.id, team]));
	const team_score_map = new Map(state.game.team_list.map(team => [team.id, 0]));
	const success_list = state.game.success_list.filter(success => success.timestamp <= state.time_now).sort((lhs, rhs) => lhs.timestamp - rhs.timestamp);
	/**
	 * @param {number} success_timestamp success timestamp in seconds
	 * @returns {number}
	 */
	function team_score_success(success_timestamp) {
		const current_value = 1 + state.game.reward_rate / 3600 * (success_timestamp - state.game.time_start);
		return state.game.reward_success * current_value;
	}
	/**
	 * @param {number} start_timestamp conquest start timestamp in seconds
	 * @param {number} stop_timestamp conquest stop timestamp in seconds
	 * @returns {number}
	 */
	function team_score_conquest(start_timestamp, stop_timestamp) {
		const duration = stop_timestamp - start_timestamp // seconds
		const mean_timestamp = (start_timestamp + stop_timestamp) / 2 // seconds
		const mean_value = 1 + state.game.reward_rate / 3600 * (mean_timestamp - state.game.time_start);
		return state.game.reward_conquest / 60 * mean_value * duration;
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
	state.game.station_list.forEach(station => {
		const conquest = station_conquest_map.get(station.id);
		if (conquest === null)
			return;
		const conquest_score = team_score_conquest(conquest.timestamp, state.time_now);
		team_score_map.set(conquest.team, team_score_map.get(conquest.team) + conquest_score);
	});
	// score normalization
	state.game.team_list.forEach(team => {
		if (team.players > 0) {
			team_score_map.set(team.id, team_score_map.get(team.id) / team.players);
		}
	});
	// station
	station_list.innerHTML = '';
	station_list.append(...state.game.station_list.map(station => {
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
	const team_list = state.game.team_list.toSorted((lhs, rhs) => -(team_score_map.get(lhs.id) - team_score_map.get(rhs.id)));
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
							content: human_duration(success.timestamp - state.game.time_start),
						}),
					],
				}),
			],
		});
	}));
}
render_main();

document.getElementById('main-div').classList.remove('d-none');
