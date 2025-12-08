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

const station_list = await (async () => {
	/**
	 * @type {{station_list: Station[]}}
	 */
	const result = await api.get('station_list');
	return result.station_list;
})();

/**
 * @typedef StationLoginSuccess
 * @type {object}
 * @property {string} game_start
 * @property {string} game_stop
 * @property {Team[]} team_list
 * @property {Player[]} player_list
 * @property {Success[]} success_list
 */

/**
 * @typedef {StationLoginSuccess|null} StationLogin
 */

/**
 * @typedef State
 * @type {object}
 * @property {Station} station
 * @property {string} password
 * @property {string} game_start
 * @property {string} game_stop
 * @property {Team[]} team_list
 * @property {Player[]} player_list
 * @property {Success[]} success_list
 * @property {string} query
 * @property {?Player} player
 */

// TODO use dictionaries instead of lists

/**
 * @type {?State}
 */
let state = null;

function refresh() {
	if (state !== null) {
		login_form.classList.add('d-none');
		login_form.reset();
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
n_option_list(station_list, lexicon.select).forEach(option => {
	station_select.appendChild(option);
});

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
	 * @type {StationLogin}
	 */
	const result = await api.post('station_login', new FormData(login_form));
	if (result === null) {
		alert(lexicon.password_wrong);
		return;
	}
	state = {
		station: station_list.filter(station => station.id === parseInt(station_select.value))[0],
		password: password_input.value,
		game_start: result.game_start,
		game_stop: result.game_stop,
		team_list: result.team_list,
		player_list: result.player_list,
		success_list: result.success_list,
		query: '',
		player: null,
	};
	localStorage.setItem('station', state.station.id.toString());
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
				conqueror = state.player_list.filter(player => player.id === success.player)[0].team;
				break;
		}
	});
	const team = state.team_list.filter(team => team.id === state.player.team)[0];
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
		const player_list = state.player_list.filter(player => player.id === state.query);
		state.player = player_list.length === 1 ? player_list[0] : null;
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
		 * @type {{game_start: string, game_stop: string, game_state: string, success_list: ?Success[]}}
		 */
		const result = await api.post('success_insert', formData);
		if (result.game_state === 'pending')
			alert(lexicon.game_pending);
		else if (result.game_state === 'finished')
			alert(lexicon.game_finished);
		state.game_start = result.game_start;
		state.game_stop = result.game_stop;
		if (result.success_list !== null)
			state.success_list = result.success_list;
		state.query = '';
		state.player = null;
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
		const team = state.team_list.filter(team => team.id === state.station.team)[0];
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
		const player = state.player_list.filter(player => player.id === success.player)[0];
		const team = state.team_list.filter(team => team.id === player.team)[0];
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
								formData.append('id', success.id.toString());
								/**
								 * @type {{game_start: string, game_stop: string, success_list: Success[]}}
								 */
								const result = await api.post('success_delete', formData);
								state.game_start = result.game_start;
								state.game_stop = result.game_stop;
								state.success_list = result.success_list;
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

/**
 * @returns {?Station}
 */
function station_read() {
	const station_str = localStorage.getItem('station');
	if (station_str === null)
		return null;
	const station_id = parseInt(station_str);
	const station_list_by_id = station_list.filter(station => station.id === station_id);
	if (station_list_by_id.length !== 1)
		return null;
	return station_list_by_id[0];
}

(async () => {
	const station = station_read();
	const password = localStorage.getItem('password');
	if (station === null || password === null) {
		login_form.classList.remove('d-none');
		return;
	}
	const formData = new FormData();
	formData.append('station', station.id);
	formData.append('password', password);
	/**
	 * @type {StationLogin}
	 */
	const result = await api.post('station_login', formData);
	if (result === null) {
		login_form.classList.remove('d-none');
		return;
	}
	state = {
		station: station,
		password: password,
		game_start: result.game_start,
		game_stop: result.game_stop,
		team_list: result.team_list,
		player_list: result.player_list,
		success_list: result.success_list,
		query: '',
		player: null,
	};
	refresh();
})();