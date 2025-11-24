import { api } from './common.js';
import { n_option_list } from './element.js';
import { lexicon } from './lexicon.js';

/**
 * @typedef {import('./common.js').Station} Station
 * @typedef {import('./common.js').Team} Team
 * @typedef {import('./common.js').Player} Player
 */

const station_list = await (async () => {
	/**
	 * @type {{station_list: Station[]}}
	 */
	const result = await api.get('station_list');
	return result.station_list;
})();

/**
 * @type {?{station: Station, password: string, team_list: Team[], player_list: Player[], player: ?Player}}
 */
let state = null;

// login

const station_select = document.getElementById('station-select');
station_select.previousElementSibling.innerHTML = lexicon.station;
n_option_list(station_list, lexicon.select).forEach(option => {
	station_select.appendChild(option);
});

const password_input = document.getElementById('password-input');
password_input.previousElementSibling.innerHTML = lexicon.password;

document.getElementById('login-button').innerHTML = lexicon.login;

const login_form = document.getElementById('login-form');
login_form.addEventListener('submit', async event => {
	event.preventDefault();
	const form = event.currentTarget;
	/**
	 * @type {{team_list: Team[], player_list: Player[]}|null}
	 */
	const result = await api.post('station_login', new FormData(form));
	if (result === null) {
		alert(lexicon.wrong_password);
		return;
	}
	login_form.classList.add('d-none');
	state = {
		station: station_list.filter(station => station.id === parseInt(station_select.value))[0],
		password: password_input.value,
		team_list: result.team_list,
		player_list: result.player_list,
		player: null,
	};
	localStorage.setItem('station', state.station.id.toString());
	localStorage.setItem('password', state.password);
	keyboard_search();
	station_header.innerHTML = state.station.name;
	main_div.classList.remove('d-none');
});

// main

const main_div = document.getElementById('main-div');

const station_header = document.getElementById('station-header');

const logout_button = document.getElementById('logout-button');
logout_button.innerHTML = lexicon.logout;
logout_button.addEventListener('click', () => {
	main_div.classList.add('d-none');
	station_header.innerHTML = '';
	localStorage.removeItem('station');
	localStorage.removeItem('password');
	keyboard_search();
	state = null;
	login_form.classList.remove('d-none');
});

const keyboard_alert = document.getElementById('keyboard-alert');

/**
 * @type {HTMLInputElement}
 */
const keyboard_screen = document.getElementById('keyboard-screen');

/**
 * @param {string} query
 * @returns {void}
 */
function keyboard_search(query) {
	if (query === undefined)
		query = '';
	keyboard_screen.value = query;
	if (query === '') {
		state.player = null;
		keyboard_alert.classList.remove('alert-success');
		keyboard_alert.classList.remove('alert-warning');
		keyboard_alert.classList.add('alert-info');
		keyboard_alert.innerHTML = lexicon.player_info;
		keyboard_delete.disabled = true;
		keyboard_success_array.forEach(button => button.disabled = true);
		return;
	}
	keyboard_delete.disabled = false;
	const player_list = state.player_list.filter(player => player.id === query);
	if (player_list.length !== 1) {
		state.player = null;
		keyboard_alert.classList.remove('alert-success');
		keyboard_alert.classList.add('alert-warning');
		keyboard_alert.classList.remove('alert-info');
		keyboard_alert.innerHTML = lexicon.player_warning;
		keyboard_success_array.forEach(button => button.disabled = true);
		return;
	}
	state.player = player_list[0];
	const team = state.team_list.filter(team => team.id === state.player.team)[0];
	keyboard_alert.classList.add('alert-success');
	keyboard_alert.classList.remove('alert-warning');
	keyboard_alert.classList.remove('alert-info');
	keyboard_alert.innerHTML = `${state.player.name} ${lexicon.player_from} ${team.name}`;
	keyboard_success_array.forEach(button => button.disabled = false);
}

/**
 * @type {HTMLButtonElement}
 */
const keyboard_delete = document.getElementById('keyboard-delete');
keyboard_delete.addEventListener('click', () => {
	keyboard_search();
});

for (const keyboard_number of document.getElementsByClassName('keyboard-number')) {
	keyboard_number.addEventListener('click', event => {
		keyboard_search(keyboard_screen.value + event.currentTarget.innerHTML);
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
		const message = `${button.innerHTML}: ${state.player.name}`;
		if (!confirm(message))
			return;
		const formData = new FormData();
		formData.append('station', state.station.id);
		formData.append('password', state.password);
		formData.append('type', button.dataset.success);
		formData.append('player', state.player.id);
		/**
		 * @type {null}
		 */
		const result = await api.post('player_success', formData);
		keyboard_search();
	});
});

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
	 * @type {{team_list: Team[], player_list: Player[]}|null}
	 */
	const result = await api.post('station_login', formData);
	if (result === null) {
		login_form.classList.remove('d-none');
		return;
	}
	state = {
		station: station,
		password: password,
		team_list: result.team_list,
		player_list: result.player_list,
		player: null,
	};
	station_header.innerHTML = state.station.name;
	keyboard_search();
	main_div.classList.remove('d-none');
})();