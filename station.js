import { api, textColor } from './common.js';
import { n, n_option_list } from './element.js';
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
 * @property {string} type
 * @property {string} timestamp
 */

let station_map = await (async () => {
	/**
	 * @type {{station_list: Station[]}}
	 */
	const result = await api.get('station_list');
	return new Map(result.station_list.map(station => [station.id, station]));
})();

/**
 * @typedef ServerData
 * @type {object}
 * @property {string} game_start
 * @property {string} game_stop
 * @property {Station[]} station_list
 * @property {Team[]} team_list
 * @property {Player[]} player_list
 * @property {Success[]} success_list
 */

/**
 * @typedef State
 * @type {object}
 * @property {Station} station
 * @property {string} password
 * @property {string} game_start
 * @property {string} game_stop
 * @property {Map<number, Team>} team_map
 * @property {Map<string, Player>} player_map
 * @property {Success[]} success_list
 * @property {string} query
 * @property {?Player} player
 */

/**
 * @type {?State}
 */
let state = null;

/**
 * @param {number} id station id
 * @param {string} password
 * @param {ServerData} result
 * @returns {void}
 */
function state_load(id, password, result) {
	station_map = new Map(result.station_list.map(station => [station.id, station]));
	state = {
		station: station_map.get(id),
		password: password,
		game_start: result.game_start,
		game_stop: result.game_stop,
		team_map: new Map(result.team_list.map(team => [team.id, team])),
		player_map: new Map(result.player_list.map(player => [player.id, player])),
		success_list: result.success_list,
		query: '',
		player: null,
	};
}

function refresh() {
	if (state !== null) {
		login_form.classList.add('d-none');
		login_form.reset();
		station_select.innerHTML = '';
		station_heading.innerHTML = state.station.name;
		game_state_div.innerHTML = [
			`${lexicon.game_start}: ${state.game_start.split(' ')[1]}`,
			`${lexicon.game_stop}: ${state.game_stop.split(' ')[1]}`,
		].join('<br>');
		keyboard_render();
		history_div.innerHTML = '';
		history_render();
		main_div.classList.remove('d-none');
	} else {
		main_div.classList.add('d-none');
		station_select.innerHTML = '';
		station_select.append(...n_option_list(Array.from(station_map.values()), lexicon.select));
		station_heading.innerHTML = '';
		game_state_div.innerHTML = '';
		keyboard_render();
		history_div.innerHTML = '';
		login_form.classList.remove('d-none');
	}
}

// login

/**
 * @type {HTMLSelectElement}
 */
const station_select = document.getElementById('station-select');
station_select.previousElementSibling.innerHTML = lexicon.station;

/**
 * @type {HTMLInputElement}
 */
const password_input = document.getElementById('password-input');
password_input.previousElementSibling.innerHTML = lexicon.password;

document.getElementById('login-button').innerHTML = lexicon.login;

/**
 * @type {HTMLFormElement}
 */
const login_form = document.getElementById('login-form');
login_form.addEventListener('submit', async event => {
	event.preventDefault();
	/**
	 * @type {ServerData|null}
	 */
	const result = await api.post('station_login', new FormData(login_form));
	if (result === null) {
		alert(lexicon.password_wrong);
		return;
	}
	state_load(parseInt(station_select.value), password_input.value, result);
	localStorage.setItem('station', state.station.id);
	localStorage.setItem('password', state.password);
	refresh();
});

// main

/**
 * @type {HTMLDivElement}
 */
const main_div = document.getElementById('main-div');

/**
 * @type {HTMLHeadingElement}
 */
const station_heading = document.getElementById('station-heading');

const logout_button = document.getElementById('logout-button');
logout_button.innerHTML = lexicon.logout;
logout_button.addEventListener('click', () => {
	state = null;
	localStorage.removeItem('station');
	localStorage.removeItem('password');
	refresh();
});

/**
 * @type {HTMLDivElement}
 */
const game_state_div = document.getElementById('game-state-div');

/**
 * @type {HTMLDivElement}
 */
const keyboard_alert = document.getElementById('keyboard-alert');

/**
 * @type {HTMLInputElement}
 */
const keyboard_screen = document.getElementById('keyboard-screen');

function keyboard_render() {
	if (state === null || state.query === '') {
		keyboard_screen.value = '';
		keyboard_delete.disabled = true;
		keyboard_alert.classList.remove('alert-success');
		keyboard_alert.classList.remove('alert-warning');
		keyboard_alert.classList.add('alert-info');
		keyboard_alert.innerHTML = lexicon.player_info;
		keyboard_success_array.forEach(button => button.disabled = true);
		return;
	}
	keyboard_screen.value = state.query;
	keyboard_delete.disabled = false;
	if (state.player === null) {
		keyboard_alert.classList.remove('alert-success');
		keyboard_alert.classList.add('alert-warning');
		keyboard_alert.classList.remove('alert-info');
		keyboard_alert.innerHTML = lexicon.player_warning;
		keyboard_success_array.forEach(button => button.disabled = true);
		return;
	}
	let conqueror = state.station.team;
	state.success_list.forEach(success => {
		switch (success.type) {
			case 'neutralization':
				conqueror = null;
				break;
			case 'conquest':
				conqueror = state.player_map.get(success.player).team;
				break;
		}
	});
	const team = state.team_map.get(state.player.team);
	keyboard_alert.classList.add('alert-success');
	keyboard_alert.classList.remove('alert-warning');
	keyboard_alert.classList.remove('alert-info');
	keyboard_alert.innerHTML = `${state.player.name} ${lexicon.player_from} ${team.name}`;
	keyboard_success_array.forEach(button => {
		switch (button.dataset.success) {
			case 'simple':
				button.disabled = false;
				break;
			case 'neutralization':
				button.disabled = (conqueror === null) || (conqueror === team.id);
				break;
			case 'conquest':
				button.disabled = conqueror === team.id;
				break;
		}
	});
}

/**
 * @type {HTMLButtonElement}
 */
const keyboard_delete = document.getElementById('keyboard-delete');
keyboard_delete.addEventListener('click', () => {
	state.query = '';
	state.player = null;
	refresh();
});

for (const keyboard_number of document.getElementsByClassName('keyboard-number')) {
	keyboard_number.addEventListener('click', event => {
		state.query += event.currentTarget.innerHTML;
		state.player = state.player_map.get(state.query) ?? null;
		refresh();
	});
}

/**
 * @type {HTMLButtonElement[]}
 */
const keyboard_success_array = Array.from(document.getElementsByClassName('keyboard-success'));
keyboard_success_array.forEach(button => {
	switch (button.dataset.success) {
		case 'simple':
			button.innerHTML = lexicon.success_simple;
			break;
		case 'neutralization':
			button.innerHTML = lexicon.success_neutralization;
			break;
		case 'conquest':
			button.innerHTML = lexicon.success_conquest;
			break;
	}
	button.addEventListener('click', async () => {
		const formData = new FormData();
		formData.append('station', state.station.id);
		formData.append('password', state.password);
		formData.append('type', button.dataset.success);
		formData.append('player', state.player.id);
		/**
		 * @type {ServerData|string}
		 */
		const result = await api.post('success_insert', formData);
		if (typeof(result) === 'string') {
			if (result === 'pending')
				alert(lexicon.game_pending);
			else if (result === 'finished')
				alert(lexicon.game_finished);
			return;
		}
		state_load(state.station.id, state.password, result);
		refresh();
	});
});

document.getElementById('history-heading').innerHTML = lexicon.history;

/**
 * @type {HTMLDivElement}
 */
const history_div = document.getElementById('history-div');

function history_render() {
	(() => {
		const team = state.team_map.get(state.station.team);
		history_div.prepend(n({
			class: 'list-group-item p-1 d-flex flex-column',
			content: [
				n({
					class: 'd-flex flex-row align-items-center',
					content: [
						n({
							class: 'badge text-bg-info m-1',
							content: state.game_start.split(' ')[1],
						}),
						n({
							class: 'flex-grow-1 m-1',
							content: lexicon.team_initial,
						}),
					],
				}),
				n({
					class: 'd-flex flex-row align-items-center',
					content: [
						team ? n({
							class: 'badge m-1',
							style: {
								backgroundColor: team.color,
								color: textColor(team.color),
							},
							content: team.name,
						}) : n({
							class: 'badge text-bg-info m-1',
							content: '-',
						}),
					],
				}),
			],
		}));
	})();
	state.success_list.forEach((success, index, array) => {
		const player = state.player_map.get(success.player);
		const team = state.team_map.get(player.team);
		history_div.prepend(n({
			class: 'list-group-item p-1 d-flex flex-column',
			content: [
				n({
					class: 'd-flex flex-row align-items-center',
					content: [
						n({
							class: 'badge text-bg-info m-1',
							content: success.timestamp.split(' ')[1],
						}),
						n({
							class: 'flex-grow-1 m-1',
							content: success.type === 'conquest' ? lexicon.success_conquest : (
								success.type === 'neutralization' ? lexicon.success_neutralization : lexicon.success_simple
							),
						}),
						index === array.length - 1 ? n({
							class: 'btn btn-danger btn-sm m-1',
							click: async () => {
								if (!confirm(`${lexicon.delete}${lexicon.question_mark}`))
									return;
								const formData = new FormData();
								formData.append('station', state.station.id);
								formData.append('password', state.password);
								formData.append('id', success.id);
								/**
								 * @type {ServerData}
								 */
								const result = await api.post('success_delete', formData);
								state_load(state.station.id, state.password, result);
								refresh();
							},
							content: lexicon.delete,
						}) : n({}),
					],
				}),
				n({
					class: 'd-flex flex-row align-items-center',
					content: [
						n({
							class: 'badge m-1',
							style: {
								backgroundColor: team.color,
								color: textColor(team.color),
							},
							content: team.name,
						}),
						n({
							class: 'm-1',
							content: player.name,
						}),
					],
				}),
			],
		}));
	});
}

// init

(async () => {
	const station_str = localStorage.getItem('station');
	const station_id = station_str !== null ? parseInt(station_str) : null;
	const password = localStorage.getItem('password');
	if (station_id === null || password === null) {
		refresh();
		return;
	}
	const formData = new FormData();
	formData.append('station', station_id);
	formData.append('password', password);
	/**
	 * @type {ServerData|null}
	 */
	const result = await api.post('station_login', formData);
	if (result === null) {
		refresh();
		return;
	}
	state_load(station_id, password, result);
	refresh();
})();