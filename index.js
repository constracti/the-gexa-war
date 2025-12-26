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

/**
 * @typedef State
 * @type {object}
 * @property {Map<number, Station} place_station_map
 * @property {Map<number, ?Success} station_conquest_map
 * @property {Map<number, Team>} team_map
 * @property {number} timer
 * @property {?number} selected_place
 */

/**
 * @type {?State}
 */
let state = null;

/**
 * @type {HTMLStyleElement}
 */
const style = document.getElementById('style');

/**
 * @type {HTMLDivElement}
 */
const heading_section = document.getElementById('heading-section');

/**
 * @type {HTMLDivElement}
 */
const status_section = document.getElementById('status-section');

/**
 * @type {HTMLDivElement}
 */
const spinner_div = document.getElementById('spinner-div');

document.getElementById('map').addEventListener('click', () => {
	place_select(0);
});

/**
 * @type {HTMLDivElement}
 */
const time_div = document.getElementById('time-div');

/**
 * @param {number} seconds
 * @returns {string}
 * @throws {RangeError}
 */
function human_duration(seconds) {
	if (seconds < 0)
		throw new RangeError();
	seconds = Math.floor(seconds);
	let minutes = Math.floor(seconds / 60);
	seconds -= minutes * 60;
	let hours = Math.floor(minutes / 60);
	minutes -= hours * 60;
	return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * 
 * @param {number} time_start
 * @param {number} time_stop
 * @param {number} time_now
 * @param {number} ms_refresh
 */
function timer_tick(time_start, time_stop, time_now, ms_refresh) {
	const ms_current = Date.now();
	time_now += Math.round((ms_current - ms_refresh) / 1000);
	if (time_now < time_start)
		time_div.innerHTML = `${lexicon.game_start}: ${human_duration(time_start - time_now)}`;
	else if (time_now < time_stop)
		time_div.innerHTML = `${lexicon.game_stop}: ${human_duration(time_stop - time_now)}`;
	else
		time_div.innerHTML = lexicon.game_finished;
}

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
 * @type {HTMLDivElement}
 */
const place_popup = document.getElementById('place-popup');

/**
 * @param {?number} place - null keeps selection, zero nullifies selection
 */
function place_select(place) {
	place_popup.innerHTML = '';
	place_svg_map.forEach(place_svg => place_svg.classList.remove('place-selected'));
	if (state === null)
		return;
	if (place !== null) {
		if (place !== 0)
			state.selected_place = place;
		else
			state.selected_place = null;
	}
	if (state.selected_place !== null) {
		place_svg_map.get(state.selected_place).classList.add('place-selected');
		const station = state.place_station_map.get(state.selected_place) ?? null;
		if (station !== null) {
			const conquest = state.station_conquest_map.get(station.id);
			const team = conquest !== null ? state.team_map.get(conquest.team) : null;
			place_popup.append(n({
				class: 'm-2 alert alert-dark d-flex flex-row align-items-center p-1',
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
					}) : n({}),
					n({
						tag: 'button',
						class: 'btn-close m-1',
						click: () => {
							place_select(0);
						},
					}),
				],
			}));
		}
	}
}

/**
 * @type {HTMLDivElement}
 */
const canvas = document.getElementById('canvas');

/**
 * @type {HTMLDivElement}
 */
const header_div = document.getElementById('header-div');

/**
 * @type {HTMLDivElement}
 */
const footer_div = document.getElementById('footer-div');

function responsive() {
	if (screen.availWidth >= 768) {
		header_div.classList.remove('p-2');
		heading_section.classList.add('p-2');
		status_section.classList.add('p-2');
		footer_div.classList.remove('p-2');
		score_section.classList.add('p-2');
		recent_section.classList.add('p-2');
		canvas.append(heading_section, status_section, score_section, recent_section);
	} else {
		header_div.append(heading_section, status_section);
		header_div.classList.add('p-2');
		heading_section.classList.remove('p-2');
		status_section.classList.remove('p-2');
		footer_div.append(score_section, recent_section);
		footer_div.classList.add('p-2');
		score_section.classList.remove('p-2');
		recent_section.classList.remove('p-2');
	}
}
addEventListener('resize', responsive);
responsive();

const place_svg_map = await (async () => {
	/**
	 * @type {{place_list: [{id: number, name: string, content: string, top: number, left: number, width: number}]}}
	 */
	const result = await api.get('map');
	return new Map(result.place_list.map(place => {
		/**
		 * @param {number} id
		 * @param {string} content
		 * @returns {SVGElement}
		 */
		function svg(id, content) {
			const template = document.createElement('template');
			template.innerHTML = content.replace(/(cls-\d)/g, '$1-id-' + id); // make class names unique
			return template.content.firstElementChild;
		}
		const place_svg = svg(place.id, place.content);
		place_svg.id = `place-svg-${place.id}`;
		place_svg.style.position = 'absolute';
		place_svg.style.top = `${100 * place.top}%`;
		place_svg.style.left = `${100 * place.left}%`;
		place_svg.style.width = `${100 * place.width}%`;
		place_svg.addEventListener('click', () => {
			place_select(place.id);
		});
		canvas.append(place_svg);
		return [place.id, place_svg];
	}));
})();

async function refresh() {
	spinner_div.classList.remove('d-none');
	/**
	 * @type {Game}
	 */
	const result = await api.get('game');
	spinner_div.classList.add('d-none');
	if (state !== null)
		clearInterval(state.timer);
	const ms_refresh = Date.now();
	state = {
		place_station_map: new Map(result.station_list.filter(station => station.place !== null).map(station => [station.place, station])),
		station_conquest_map: new Map(result.station_list.map(station => [station.id, null])),
		team_map: new Map(result.team_list.map(team => [team.id, team])),
		timer: setInterval(timer_tick, 1000, result.time_start, result.time_stop, result.time_now, ms_refresh),
		selected_place: state !== null ? state.selected_place : null,
	};
	const current_timestamp = result.time_now < result.time_start ? result.time_start :
		(result.time_now < result.time_stop ? result.time_now : result.time_stop);
	const station_map = new Map(result.station_list.map(station => [station.id, station]));
	// score
	const team_score_map = new Map(result.team_list.map(team => [team.id, 0]));
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
	result.success_list.forEach(success => {
		const station = station_map.get(success.station);
		const conquest = state.station_conquest_map.get(success.station);
		if (success.type !== 'simple') {
			// add points to previous conqueror
			if (conquest !== null) {
				const conquest_score = team_score_conquest(conquest.timestamp, success.timestamp);
				team_score_map.set(conquest.team, team_score_map.get(conquest.team) + conquest_score);
			}
			// set current conqueror
			if (success.type === 'conquest')
				state.station_conquest_map.set(success.station, success);
			else
				state.station_conquest_map.set(success.station, null);
		}
		// add success points
		team_score_map.set(success.team, team_score_map.get(success.team) + team_score_success(success.timestamp) / station.capacity);
	});
	// score from current conquests
	result.station_list.forEach(station => {
		const conquest = state.station_conquest_map.get(station.id);
		if (conquest === null)
			return;
		const conquest_score = team_score_conquest(conquest.timestamp, current_timestamp);
		team_score_map.set(conquest.team, team_score_map.get(conquest.team) + conquest_score);
	});
	// score normalization
	result.team_list.forEach(team => {
		if (team.players > 0) {
			team_score_map.set(team.id, team_score_map.get(team.id) / team.players);
		}
	});
	// style
	place_select(null);
	style.innerHTML = result.station_list.map(station => {
		if (station.place === null)
			return '';
		const conquest = state.station_conquest_map.get(station.id);
		if (conquest === null)
			return '';
		const team = state.team_map.get(conquest.team);
		return ['path', 'polygon', '>g>rect'].map(tag => {
			return `#canvas #place-svg-${station.place} ${tag} { stroke: ${team.color}; fill: ${team.color}; }`;
		}).join('\n');
	}).join('\n');
	// time
	time_div.classList.remove('d-none');
	timer_tick(result.time_start, result.time_stop, result.time_now, ms_refresh);
	// team
	score_list.innerHTML = '';
	if (result.team_list.length !== 0) {
		const max_score = Math.max(...team_score_map.values(), 1);
		const team_list = result.team_list.toSorted((lhs, rhs) => {
			return -(team_score_map.get(lhs.id) - team_score_map.get(rhs.id)); // sort by score in descending order
		});
		score_list.append(...team_list.map(team => n({
			class: 'list-group-item d-flex flex-column p-1',
			content: [
				n({
					class: 'border m-1',
					content: [
						n({
							class: 'pb-1',
							style: {
								backgroundColor: team.color,
								width: `${team_score_map.get(team.id) / max_score * 100}%`,
							},
						}),
					],
				}),
				n({
					class: 'd-flex flex-row flex-wrap align-items-center',
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
							class: 'flex-grow-1 text-end m-1',
							content: team_score_map.get(team.id).toFixed(),
						}),
					],
				}),
			],
		})));
		score_section.classList.remove('d-none');
	} else {
		score_section.classList.add('d-none');
	}
	// success
	recent_list.innerHTML = '';
	if (result.success_list.length !== 0) {
		const success_list = result.success_list.toSorted((lhs, rhs) => {
			return -(lhs.timestamp - rhs.timestamp); // sort by timestamp in descending order
		});
		recent_list.append(...success_list.map(success => {
			const station = station_map.get(success.station);
			const team = state.team_map.get(success.team);
			const type = success.type === 'conquest' ? lexicon.success_conquest :
				(success.type === 'neutralization' ? lexicon.success_neutralization : lexicon.success_simple);
			return n({
				class: 'list-group-item d-flex flex-column p-1',
				content: [
					n({
						class: 'm-1',
						content: type,
					}),
					n({
						class: 'd-flex flex-row flex-wrap justify-content-end align-items-center',
						content: [
							n({
								class: 'flex-grow-1 m-1',
								content: station.name,
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
					})
				],
			});
		}));
		recent_section.classList.remove('d-none');
	} else {
		recent_section.classList.add('d-none');
	}
	setTimeout(refresh, 10000);
}

refresh();
