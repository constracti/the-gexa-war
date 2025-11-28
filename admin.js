import { api } from './common.js';
import { n } from './element.js';
import { lexicon } from './lexicon.js';

/**
 * @typedef {{id: number, name: string, code: string}} StationSecret
 * @typedef {import('./common.js').Team} Team
 * @typedef {import('./common.js').Player} Player
 */

/**
 * @typedef {{deadline: string, reward_success: number, reward_conquest: number, station_list: StationSecret[], team_list: Team[], player_list: Player[]}|null} AdminLogin
 * @typedef {{team_list: Team[]}} TeamSubmit
 */

/**
 * @type {?{password: string, deadline: string, reward_success: number, reward_conquest: number, station_list: StationSecret[], team_list: Team[], player_list: Player[]}}
 */
let state = null;

function refresh() {
	if (state !== null) {
		login_form.classList.add('d-none');
		login_form.reset();
		deadline_input.value = state.deadline;
		reward_success_input.value = state.reward_success.toString();
		reward_conquest_input.value = state.reward_conquest.toString();
		station_div.innerHTML = '';
		state.station_list.forEach(station => {
			station_div.appendChild(n({
				class: 'list-group-item d-flex flex-row justify-content-between align-items-center p-1',
				content: [
					n({
						class: 'm-1',
						content: station.name,
					}),
					n({
						tag: 'code',
						class: 'm-1',
						content: station.code,
					}),
				],
			}));
		});
		team_div.innerHTML = '';
		state.team_list.forEach(team => {
			const name_div = n({
				class: 'flex-grow-1 m-1',
				content: team.name,
			});
			const player_count = state.player_list.filter(player => player.team === team.id).length;
			const count_div = n({
				class: 'badge text-bg-info m-1',
				content: player_count.toString(),
			});
			const edit_button = n({
				tag: 'button',
				class: 'btn btn-secondary btn-sm m-1',
				click: () => {
					element_list.forEach(element => element.classList.toggle('d-none'));
				},
				content: lexicon.edit,
			});
			const delete_button = n({
				tag: 'button',
				class: 'btn btn-danger btn-sm m-1',
				click: async () => {
					if (!confirm(`${lexicon.delete} ${team.name}${lexicon.question_mark}`))
						return;
					const formData = new FormData();
					formData.append('password', state.password);
					formData.append('id', team.id.toString());
					/**
					 * @type {TeamSubmit}
					 */
					const result = await api.post('team_delete', formData);
					state.team_list = result.team_list;
					refresh();
				},
				content: lexicon.delete,
			});
			delete_button.disabled = player_count !== 0;
			const name_input = n({
				tag: 'input',
				class: 'form-control form-control-sm',
				value: team.name,
			});
			const submit_button = n({
				tag: 'button',
				class: 'btn btn-primary btn-sm m-1',
				click: async () => {
					const formData = new FormData();
					formData.append('password', state.password);
					formData.append('id', team.id.toString());
					formData.append('name', name_input.value);
					/**
					 * @type {TeamSubmit}
					 */
					const result = await api.post('team_update', formData);
					state.team_list = result.team_list;
					refresh();
				},
				content: lexicon.submit,
			});
			const cancel_button = n({
				tag: 'button',
				class: 'btn btn-secondary btn-sm m-1',
				click: () => {
					element_list.forEach(element => element.classList.toggle('d-none'));
				},
				content: lexicon.cancel,
			});
			const element_list = [
				name_div,
				count_div,
				n({
					class: 'd-flex flex-row',
					content: [
						edit_button,
						delete_button,
					],
				}),
				n({
					class: 'flex-grow-1 m-1 d-none',
					content: [
						name_input,
					],
				}),
				n({
					class: 'd-flex flex-row d-none',
					content: [
						submit_button,
						cancel_button,
					],
				}),
			];
			team_div.appendChild(n({
				class: 'list-group-item d-flex flex-row flex-wrap justify-content-end align-items-center p-1',
				content: element_list,
			}));
		});
		(() => {
			const add_button = n({
				tag: 'button',
				class: 'btn btn-secondary btn-sm m-1',
				click: () => {
					element_list.forEach(element => element.classList.toggle('d-none'));
				},
				content: lexicon.add,
			});
			const name_input = n({
				tag: 'input',
				class: 'form-control form-control-sm',
			});
			const submit_button = n({
				tag: 'button',
				class: 'btn btn-primary btn-sm m-1',
				click: async () => {
					const formData = new FormData();
					formData.append('password', state.password);
					formData.append('name', name_input.value);
					/**
					 * @type {TeamSubmit}
					 */
					const result = await api.post('team_insert', formData);
					state.team_list = result.team_list;
					refresh();
				},
				content: lexicon.submit,
			});
			const cancel_button = n({
				tag: 'button',
				class: 'btn btn-secondary btn-sm m-1',
				click: () => {
					element_list.forEach(element => element.classList.toggle('d-none'));
				},
				content: lexicon.cancel,
			});
			const element_list = [
				add_button,
				n({
					class: 'flex-grow-1 m-1 d-none',
					content: [
						name_input,
					],
				}),
				n({
					class: 'd-flex flex-row d-none',
					content: [
						submit_button,
						cancel_button,
					],
				}),
			];
			team_div.appendChild(n({
				class: 'list-group-item d-flex flex-row justify-content-end align-items-center p-1',
				content: element_list,
			}));
		})();
		main_div.classList.remove('d-none');
	} else {
		main_div.classList.add('d-none');
		config_form.reset();
		station_div.innerHTML = '';
		team_div.innerHTML = '';
		login_form.classList.remove('d-none');
	}
}

// login

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
	 * @type {AdminLogin}
	 */
	const result = await api.post('admin_login', new FormData(login_form));
	if (result === null) {
		alert(lexicon.password_wrong);
		return;
	}
	state = {
		password: password_input.value,
		deadline: result.deadline,
		reward_success: result.reward_success,
		reward_conquest: result.reward_conquest,
		station_list: result.station_list,
		team_list: result.team_list,
		player_list: result.player_list,
	};
	localStorage.setItem('password', state.password);
	refresh();
});

// main

/**
 * @type {HTMLDivElement}
 */
const main_div = document.getElementById('main-div');

document.getElementById('admin-heading').innerHTML = lexicon.admin;

/**
 * @type {HTMLButtonElement}
 */
const logout_button = document.getElementById('logout-button');
logout_button.innerHTML = lexicon.logout;
logout_button.addEventListener('click', () => {
	state = null;
	localStorage.removeItem('password');
	refresh();
});

/**
 * @type {HTMLInputElement}
 */
const deadline_input = document.getElementById('deadline-input');
deadline_input.previousElementSibling.innerHTML = lexicon.deadline;

/**
 * @type {HTMLInputElement}
 */
const reward_success_input = document.getElementById('reward-success-input');
reward_success_input.previousElementSibling.innerHTML = lexicon.reward_success;

/**
 * @type {HTMLInputElement}
 */
const reward_conquest_input = document.getElementById('reward-conquest-input');
reward_conquest_input.previousElementSibling.innerHTML = lexicon.reward_conquest;

document.getElementById('submit-button').innerHTML = lexicon.submit;

/**
 * @type {HTMLFormElement}
 */
const config_form = document.getElementById('config-form');
config_form.addEventListener('submit', async event => {
	event.preventDefault();
	const formData = new FormData(config_form);
	formData.append('password', state.password);
	/**
	 * @type {null}
	 */
	const result = await api.post('admin_config', formData);
	console.log(result);
});

document.getElementById('station-heading').innerHTML = lexicon.station_list;

/**
 * @type {HTMLButtonElement}
 */
const station_button = document.getElementById('station-button');
station_button.innerHTML = lexicon.show;
station_button.addEventListener('click', () => {
	if (station_div.classList.contains('d-none')) {
		station_button.innerHTML = lexicon.hide;
		station_div.classList.remove('d-none');
	} else {
		station_button.innerHTML = lexicon.show;
		station_div.classList.add('d-none');
	}
});

/**
 * @type {HTMLDivElement}
 */
const station_div = document.getElementById('station-div');

document.getElementById('team-heading').innerHTML = lexicon.team_list;

/**
 * @type {HTMLButtonElement}
 */
const team_button = document.getElementById('team-button');
team_button.innerHTML = lexicon.show;
team_button.addEventListener('click', () => {
	if (team_div.classList.contains('d-none')) {
		team_button.innerHTML = lexicon.hide;
		team_div.classList.remove('d-none');
	} else {
		team_button.innerHTML = lexicon.show;
		team_div.classList.add('d-none');
	}
});

/**
 * @type {HTMLDivElement}
 */
const team_div = document.getElementById('team-div');

// init

(async () => {
	const password = localStorage.getItem('password');
	if (password === null) {
		login_form.classList.remove('d-none');
		return;
	}
	const formData = new FormData();
	formData.append('password', password);
	/**
	 * @type {AdminLogin}
	 */
	const result = await api.post('admin_login', formData);
	if (result !== null) {
		state = {
			password: password,
			deadline: result.deadline,
			reward_success: result.reward_success,
			reward_conquest: result.reward_conquest,
			station_list: result.station_list,
			team_list: result.team_list,
			player_list: result.player_list,
		};
	}
	refresh();
})();