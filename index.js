import { api } from './common.js';
import { n, n_option_list } from './element.js';
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
 */

/**
 * @typedef Player
 * @type {object}
 * @property {number} id
 * @property {string} name
 * @property {number} team
 */

const station_list = await (async () => {
	/**
	 * @type {{station_list: Station[]}}
	 */
	const result = await api.get('station_list');
	return result.station_list;
})();

// login form

const login_station = document.getElementById('login-station');
login_station.previousElementSibling.innerHTML = lexicon.station;
n_option_list(station_list, lexicon.select).forEach(option => {
	login_station.appendChild(option);
});

const login_password = document.getElementById('login-password');
login_password.previousElementSibling.innerHTML = lexicon.password;

document.getElementById('login-button').innerHTML = lexicon.submit;

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
	const station = station_list.filter(station => station.id === parseInt(login_station.value)).at(0);
	const password = login_password.value;
	localStorage.setItem('station', station.id.toString());
	localStorage.setItem('password', password);
	console.log(result);
	document.body.appendChild(n({
		class: 'm-2',
		content: station.name,
	}));
});

// init

let station = (() => {
	const station_str = localStorage.getItem('station');
	if (station_str === null)
		return null;
	const station_id = parseInt(station_str);
	const station_list_by_id = station_list.filter(station => station.id === station_id);
	if (station_list_by_id.length !== 1)
		return null;
	return station_list_by_id[0];
})();
let password = localStorage.getItem('password');

(async () => {
	const formData = new FormData();
	if (station === null) {
		login_form.classList.remove('d-none');
		return;
	}
	formData.append('station', station.id);
	if (password === null) {
		station = null;
		login_form.classList.remove('d-none');
		return;
	}
	formData.append('password', password);
	/**
	 * @type {{team_list: Team[], player_list: Player[]}|null}
	 */
	const result = await api.post('station_login', formData);
	if (result === null) {
		station = null;
		password = null;
		login_form.classList.remove('d-none');
		return;
	}
	console.log(result);
	document.body.appendChild(n({
		class: 'm-2',
		content: station.name,
	}));
})();