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
 * @typedef State
 * @type {object}
 * @property {Map<number, Station} place_station_map
 * @property {Map<number, ?Success} station_conquest_map
 * @property {Map<number, Team>} team_map
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
const spinner_div = document.getElementById('spinner-div');

document.getElementById('map').addEventListener('click', () => {
	place_select(0);
});

/**
 * @type {HTMLDivElement}
 */
const time_div = document.getElementById('time-div');

/**
 * @type {HTMLDivElement}
 */
const score_section = document.getElementById('score-section');

/**
 * @type {HTMLDivElement}
 */
const success_section = document.getElementById('success-section');

/**
 * @type {HTMLDivElement}
 */
const place_popup = document.getElementById('place-popup');

/**
 * @type {HTMLDivElement}
 */
const alert_popup = document.getElementById('alert-popup');

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

// TODO responsive

const place_svg_map = await (async () => {
	/**
	 * @type {{place_list: [{id: number, name: string, content: string, top: number, left: number, width: number}]}}
	 */
	const result = await api.get('map');
	console.log(result); // TODO delete
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
	console.log(result); // TODO delete
	state = {
		place_station_map: new Map(result.station_list.filter(station => station.place !== null).map(station => [station.place, station])),
		station_conquest_map: new Map(result.station_list.map(station => [station.id, null])),
		team_map: new Map(result.team_list.map(team => [team.id, team])),
		selected_place: state !== null ? state.selected_place : null,
	};
	const station_map = new Map(result.station_list.map(station => [station.id, station]));
	// score
	const team_score_map = new Map(result.team_list.map(team => [team.id, 0]));
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
	// score from successes and previous conquests
	result.success_list.forEach(success => {
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
		team_score_map.set(success.team, team_score_map.get(success.team) + team_score_success(success.timestamp));
	});
	// score from current conquests
	result.station_list.forEach(station => {
		const conquest = state.station_conquest_map.get(station.id);
		if (conquest === null)
			return;
		const conquest_score = team_score_conquest(conquest.timestamp, result.current_timestamp);
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
	// time // TODO countdown
	time_div.classList.remove('d-none');
	if (result.game_state === 'pending')
		time_div.innerHTML = `${lexicon.game_start}: ${result.game_start.split(' ')[1]}`;
	else
		time_div.innerHTML = `${lexicon.game_stop}: ${result.game_stop.split(' ')[1]}`;
	alert_popup.classList.add('d-none');
	if (result.game_state !== 'running') {
		alert_popup.classList.remove('d-none');
		alert_popup.innerHTML = result.game_state === 'pending' ? lexicon.game_pending : lexicon.game_finished;
	}
	// team
	score_section.innerHTML = '';
	if (result.team_list.length !== 0) {
		score_section.append(
			n({
				tag: 'h2',
				class: 'm-2',
				content: lexicon.score,
			}),
			n({
				class: 'flex-fill',
				style: {
					overflowY: 'auto',
				},
				content: [
					n({
						class: 'list-group',
						content: result.team_list.toSorted((lhs, rhs) => {
							return -(team_score_map.get(lhs.id) - team_score_map.get(rhs.id)); // sort by score in descending order
						}).map(team => n({
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
									content: team_score_map.get(team.id).toFixed(0), // TODO also as horizontal bars
								}),
							],
						})),
					}),
				],
			}),
		);
	}
	// success
	success_section.innerHTML = '';
	if (result.success_list.length !== 0) {
		success_section.append(
			n({
				tag: 'h2',
				class: 'm-2',
				content: lexicon.success_list,
			}),
			n({
				class: 'flex-fill',
				style: {
					overflowY: 'auto',
				},
				content: [
					n({
						class: 'list-group',
						content: result.success_list.toSorted((lhs, rhs) => {
							return -(lhs.timestamp - rhs.timestamp); // sort by timestamp in descending order
						}).map(success => {
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
										class: 'd-flex flex-row justify-content-between align-items-center',
										content: [
											n({
												class: 'm-1',
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
						}),
					}),
				],
			}),
		);
	}
	setTimeout(refresh, 10000);
}

refresh();