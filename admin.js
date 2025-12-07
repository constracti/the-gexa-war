import { api, textColor } from './common.js';
import { n, n_option_list } from './element.js';
import { lexicon } from './lexicon.js';

/**
 * @typedef Station
 * @type {object}
 * @property {number} id
 * @property {string} name
 * @property {string} code
 * @property {?number} team
 */

/**
 * @typedef {import('./common.js').Team} Team
 */

/**
 * @typedef {import('./common.js').Player} Player
 */

/**
 * @typedef AdminLoginSuccess
 * @type {object}
 * @property {string} game_start
 * @property {string} game_stop
 * @property {number} reward_success
 * @property {number} reward_conquest
 * @property {number} reward_rate
 * @property {Station[]} station_list
 * @property {Team[]} team_list
 * @property {Player[]} player_list
 */

/**
 * @typedef {AdminLoginSuccess|null} AdminLogin
 */

/**
 * @typedef State
 * @type {object}
 * @property {string} password
 * @property {string} game_start
 * @property {string} game_stop
 * @property {number} reward_success
 * @property {number} reward_conquest
 * @property {number} reward_rate
 * @property {Station[]} station_list
 * @property {Team[]} team_list
 * @property {Player[]} player_list
 */

/**
 * @type {?State}
 */
let state = null;

function refresh() {
	if (state !== null) {
		login_form.classList.add('d-none');
		login_form.reset();
		game_start_input.value = state.game_start;
		game_stop_input.value = state.game_stop;
		reward_success_input.value = state.reward_success.toString();
		reward_conquest_input.value = state.reward_conquest.toString();
		reward_rate_input.value = state.reward_rate.toString();
		reward_rate_refresh();
		station_div.innerHTML = '';
		station_render();
		team_div.innerHTML = '';
		team_render();
		player_div.innerHTML = '';
		player_render();
		main_div.classList.remove('d-none');
	} else {
		main_div.classList.add('d-none');
		config_form.reset();
		reward_rate_refresh();
		station_div.innerHTML = '';
		team_div.innerHTML = '';
		player_div.innerHTML = '';
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
		game_start: result.game_start,
		game_stop: result.game_stop,
		reward_success: result.reward_success,
		reward_conquest: result.reward_conquest,
		reward_rate: result.reward_rate,
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
const game_start_input = document.getElementById('game-start-input');
game_start_input.previousElementSibling.innerHTML = lexicon.game_start;

/**
 * @type {HTMLInputElement}
 */
const game_stop_input = document.getElementById('game-stop-input');
game_stop_input.previousElementSibling.innerHTML = lexicon.game_stop;

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

/**
 * @type {HTMLInputElement}
 */
const reward_rate_input = document.getElementById('reward-rate-input');
reward_rate_input.previousElementSibling.innerHTML = lexicon.reward_rate;

function reward_rate_refresh() {
	const html = [`${lexicon.reward_rate_begin}: 1.00`];
	const game_start = Date.parse(game_start_input.value);
	const game_stop = Date.parse(game_stop_input.value);
	const game_duration_in_hours = (game_stop - game_start) / (60 * 60 * 1000);
	const reward_rate = parseFloat(reward_rate_input.value);
	const reward_rate_begin = 1;
	const reward_rate_end = reward_rate_begin + reward_rate * game_duration_in_hours;
	if (!isNaN(reward_rate_end))
		html.push(`${lexicon.reward_rate_end}: ${reward_rate_end.toFixed(2)}`);
	reward_rate_input.nextElementSibling.innerHTML = html.join(' - ');
}
[game_start_input, game_stop_input, reward_rate_input].forEach(element => {
	element.addEventListener('change', reward_rate_refresh);
});

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
	console.log(result); // TODO delete
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

function station_render() {
	// row
	state.station_list.forEach(station => {
		const element_list = [
			// row text
			n({
				class: 'flex-grow-1 m-1',
				content: station.name,
			}),
			n({
				tag: 'code',
				class: 'm-1',
				content: station.code,
			}),
			n({
				class: 'badge text-bg-info m-1',
				content: station.team !== null ? state.team_list.filter(team => team.id === station.team)[0].name : '-',
			}),
			n({
				tag: 'button',
				class: 'btn btn-secondary btn-sm m-1',
				click: () => {
					element_list.forEach(element => element.classList.toggle('d-none'));
				},
				content: lexicon.edit,
			}),
			// row form
			n({
				tag: 'form',
				class: 'd-flex flex-row flex-wrap flex-grow-1 justify-content-end d-none',
				submit: async event => {
					event.preventDefault();
					const formData = new FormData(event.currentTarget);
					formData.append('password', state.password);
					formData.append('id', station.id.toString());
					/**
					 * @type {{station_list: Station[]}}
					 */
					const result = await api.post('station_update', formData);
					state.station_list = result.station_list;
					refresh();
				},
				content: [
					// row form fields
					n({
						class: 'flex-grow-1 m-1',
						content: [
							n({
								tag: 'input',
								class: 'form-control form-control-sm',
								value: station.name,
								name: 'name',
								placeholder: lexicon.name,
								required: true,
							}),
						],
					}),
					n({
						class: 'flex-grow-1 m-1',
						content: [
							n({
								tag: 'input',
								class: 'form-control form-control-sm',
								value: station.code,
								name: 'code',
								placeholder: lexicon.password,
								required: true,
							}),
						],
					}),
					n({
						class: 'flex-grow-1 m-1',
						content: [
							n({
								tag: 'select',
								class: 'form-select form-select-sm',
								value: station.team?.toString(),
								name: 'team',
								content: n_option_list(state.team_list, `(${lexicon.team})`),
							}),
						],
					}),
					// row form buttons
					n({
						class: 'd-flex flex-row',
						content: [
							n({
								tag: 'button',
								class: 'btn btn-primary btn-sm m-1',
								type: 'submit',
								content: lexicon.submit,
							}),
							n({
								tag: 'button',
								class: 'btn btn-secondary btn-sm m-1',
								type: 'button',
								click: () => {
									element_list.forEach(element => element.classList.toggle('d-none'));
								},
								content: lexicon.cancel,
							}),
						],
					}),
					// row form stop
				],
			}),
			// row stop
		];
		station_div.appendChild(n({
			class: 'list-group-item d-flex flex-row flex-wrap justify-content-end align-items-center p-1',
			content: element_list,
		}));
	});
}

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

function team_render() {
	// row
	state.team_list.forEach(team => {
		const station_count = state.station_list.filter(station => station.team === team.id).length;
		const player_count = state.player_list.filter(player => player.team === team.id).length;
		const element_list = [
			// row text
			n({
				class: 'flex-grow-1 m-1',
				content: team.name,
			}),
			n({
				class: 'badge border m-1',
				style: {
					backgroundColor: team.color,
					color: textColor(team.color),
				},
				content: [
					`${lexicon.station_list}: ${station_count}`,
					`${lexicon.player_list}: ${player_count}`,
				].join(' | '),
			}),
			n({
				class: 'd-flex flex-row',
				content: [
					n({
						tag: 'button',
						class: 'btn btn-secondary btn-sm m-1',
						click: () => {
							element_list.forEach(element => element.classList.toggle('d-none'));
						},
						content: lexicon.edit,
					}),
					n({
						tag: 'button',
						class: 'btn btn-danger btn-sm m-1',
						disabled: station_count !== 0 || player_count !== 0,
						click: async () => {
							if (!confirm(`${lexicon.delete} ${team.name}${lexicon.question_mark}`))
								return;
							const formData = new FormData();
							formData.append('password', state.password);
							formData.append('id', team.id.toString());
							/**
							 * @type {{team_list: Team[]}}
							 */
							const result = await api.post('team_delete', formData);
							state.team_list = result.team_list;
							refresh();
						},
						content: lexicon.delete,
					}),
				],
			}),
			// row form
			n({
				tag: 'form',
				class: 'd-flex flex-row flex-wrap flex-grow-1 justify-content-end d-none',
				submit: async event => {
					event.preventDefault();
					const formData = new FormData(event.currentTarget);
					formData.append('password', state.password);
					formData.append('id', team.id.toString());
					/**
					 * @type {{team_list: Team[]}}
					 */
					const result = await api.post('team_update', formData);
					state.team_list = result.team_list;
					refresh();
				},
				content: [
					// row form fields
					n({
						class: 'flex-grow-1 m-1',
						content: [
							n({
								tag: 'input',
								class: 'form-control form-control-sm',
								value: team.name,
								name: 'name',
								placeholder: lexicon.name,
								required: true,
							}),
						],
					}),
					n({
						class: 'm-1',
						content: [
							n({
								tag: 'input',
								class: 'form-control form-control-sm form-control-color',
								value: team.color,
								name: 'color',
								required: true,
								type: 'color',
							}),
						],
					}),
					// row form buttons
					n({
						class: 'd-flex flex-row',
						content: [
							n({
								tag: 'button',
								class: 'btn btn-primary btn-sm m-1',
								type: 'submit',
								content: lexicon.submit,
							}),
							n({
								tag: 'button',
								class: 'btn btn-secondary btn-sm m-1',
								type: 'button',
								click: () => {
									element_list.forEach(element => element.classList.toggle('d-none'));
								},
								content: lexicon.cancel,
							}),
						],
					}),
					// row form stop
				],
			}),
			// row stop
		];
		team_div.appendChild(n({
			class: 'list-group-item d-flex flex-row flex-wrap justify-content-end align-items-center p-1',
			content: element_list,
		}));
	});
	// new
	(() => {
		const element_list = [
			// new text
			n({
				tag: 'button',
				class: 'btn btn-secondary btn-sm m-1',
				click: () => {
					element_list.forEach(element => element.classList.toggle('d-none'));
				},
				content: lexicon.add,
			}),
			// new form
			n({
				tag: 'form',
				class: 'd-flex flex-row flex-wrap flex-grow-1 justify-content-end d-none',
				submit: async event => {
					event.preventDefault();
					const formData = new FormData(event.currentTarget);
					formData.append('password', state.password);
					/**
					 * @type {{team_list: Team[]}}
					 */
					const result = await api.post('team_insert', formData);
					state.team_list = result.team_list;
					refresh();
				},
				content: [
					// new form inputs
					n({
						class: 'flex-grow-1 m-1',
						content: [
							n({
								tag: 'input',
								class: 'form-control form-control-sm',
								name: 'name',
								placeholder: lexicon.name,
								required: true,
							}),
						],
					}),
					n({
						class: 'm-1',
						content: [
							n({
								tag: 'input',
								class: 'form-control form-control-sm form-control-color',
								name: 'color',
								required: true,
								type: 'color',
							}),
						],
					}),
					// new form buttons
					n({
						class: 'd-flex flex-row',
						content: [
							n({
								tag: 'button',
								class: 'btn btn-primary btn-sm m-1',
								type: 'submit',
								content: lexicon.submit,
							}),
							n({
								tag: 'button',
								class: 'btn btn-secondary btn-sm m-1',
								type: 'button',
								click: () => {
									element_list.forEach(element => element.classList.toggle('d-none'));
								},
								content: lexicon.cancel,
							}),
						],
					}),
					// new form stop
				],
			}),
			// new stop
		];
		team_div.appendChild(n({
			class: 'list-group-item d-flex flex-row flex-wrap justify-content-end align-items-center p-1',
			content: element_list,
		}));
	})();
}

document.getElementById('player-heading').innerHTML = lexicon.player_list;

/**
 * @type {HTMLButtonElement}
 */
const player_button = document.getElementById('player-button');
player_button.innerHTML = lexicon.show;
player_button.addEventListener('click', () => {
	if (player_div.classList.contains('d-none')) {
		player_button.innerHTML = lexicon.hide;
		player_div.classList.remove('d-none');
	} else {
		player_button.innerHTML = lexicon.show;
		player_div.classList.add('d-none');
	}
});

/**
 * @type {HTMLDivElement}
 */
const player_div = document.getElementById('player-div');

function player_render() {
	// row
	state.player_list.forEach(player => {
		const element_list = [
			// row text
			n({
				tag: 'code',
				class: 'm-1',
				content: player.id,
			}),
			n({
				class: 'flex-grow-1 m-1',
				content: player.name,
			}),
			n({
				class: 'badge text-bg-info m-1',
				content: state.team_list.filter(team => team.id === player.team)[0].name,
			}),
			n({
				class: 'd-flex flex-row',
				content: [
					n({
						tag: 'button',
						class: 'btn btn-secondary btn-sm m-1',
						click: () => {
							element_list.forEach(element => element.classList.toggle('d-none'));
						},
						content: lexicon.edit,
					}),
					n({
						tag: 'button',
						class: 'btn btn-danger btn-sm m-1',
						click: async () => {
							if (!confirm(`${lexicon.delete} ${player.name}${lexicon.question_mark}`))
								return;
							const formData = new FormData();
							formData.append('password', state.password);
							formData.append('id', player.id);
							/**
							 * @type {{player_list: Player[]}}
							 */
							const result = await api.post('player_delete', formData);
							state.player_list = result.player_list;
							refresh();
						},
						content: lexicon.delete,
					}),
				],
			}),
			// row form
			n({
				tag: 'form',
				class: 'd-flex flex-row flex-wrap flex-grow-1 justify-content-end d-none',
				submit: async event => {
					event.preventDefault();
					const formData = new FormData(event.currentTarget);
					formData.append('password', state.password);
					formData.append('player', player.id);
					/**
					 * @type {{player_list: Player[]}|null}
					 */
					const result = await api.post('player_update', formData);
					if (result === null) {
						alert(lexicon.id_exists);
						return;
					}
					state.player_list = result.player_list;
					refresh();
				},
				content: [
					// row form fields
					n({
						class: 'flex-grow-1 m-1',
						content: [
							n({
								tag: 'input',
								class: 'form-control form-control-sm',
								value: player.id,
								name: 'id',
								placeholder: lexicon.id,
								required: true,
							}),
						],
					}),
					n({
						class: 'flex-grow-1 m-1',
						content: [
							n({
								tag: 'input',
								class: 'form-control form-control-sm',
								value: player.name,
								name: 'name',
								placeholder: lexicon.name,
								required: true,
							}),
						],
					}),
					n({
						class: 'flex-grow-1 m-1',
						content: [
							n({
								tag: 'select',
								class: 'form-select form-select-sm',
								value: player.team.toString(),
								name: 'team',
								content: n_option_list(state.team_list, `(${lexicon.team})`),
								required: true,
							}),
						],
					}),
					// row form buttons
					n({
						class: 'd-flex flex-row',
						content: [
							n({
								tag: 'button',
								class: 'btn btn-primary btn-sm m-1',
								type: 'submit',
								content: lexicon.submit,
							}),
							n({
								tag: 'button',
								class: 'btn btn-secondary btn-sm m-1',
								type: 'button',
								click: () => {
									element_list.forEach(element => element.classList.toggle('d-none'));
								},
								content: lexicon.cancel,
							}),
						],
					}),
					// row form stop
				],
			}),
			// row stop
		];
		player_div.appendChild(n({
			class: 'list-group-item d-flex flex-row flex-wrap justify-content-end align-items-center p-1',
			content: element_list,
		}));
	});
	// new
	(() => {
		const element_list = [
			// new text
			n({
				tag: 'button',
				class: 'btn btn-secondary btn-sm m-1',
				click: () => {
					element_list.forEach(element => element.classList.toggle('d-none'));
				},
				content: lexicon.add,
			}),
			// new form
			n({
				tag: 'form',
				class: 'd-flex flex-row flex-wrap flex-grow-1 justify-content-end d-none',
				submit: async event => {
					event.preventDefault();
					const formData = new FormData(event.currentTarget);
					formData.append('password', state.password);
					/**
					 * @type {{player_list: Player[]}|null}
					 */
					const result = await api.post('player_insert', formData);
					if (result === null) {
						alert(lexicon.id_exists);
						return;
					}
					state.player_list = result.player_list;
					refresh();
				},
				content: [
					// new form inputs
					n({
						class: 'flex-grow-1 m-1',
						content: [
							n({
								tag: 'input',
								class: 'form-control form-control-sm',
								name: 'id',
								placeholder: lexicon.id,
								required: true,
							}),
						],
					}),
					n({
						class: 'flex-grow-1 m-1',
						content: [
							n({
								tag: 'input',
								class: 'form-control form-control-sm',
								name: 'name',
								placeholder: lexicon.name,
								required: true,
							}),
						],
					}),
					n({
						class: 'flex-grow-1 m-1',
						content: [
							n({
								tag: 'select',
								class: 'form-select form-select-sm',
								name: 'team',
								content: n_option_list(state.team_list, `(${lexicon.team})`),
								required: true,
							}),
						],
					}),
					// new form buttons
					n({
						class: 'd-flex flex-row',
						content: [
							n({
								tag: 'button',
								class: 'btn btn-primary btn-sm m-1',
								type: 'submit',
								content: lexicon.submit,
							}),
							n({
								tag: 'button',
								class: 'btn btn-secondary btn-sm m-1',
								type: 'button',
								click: () => {
									element_list.forEach(element => element.classList.toggle('d-none'));
								},
								content: lexicon.cancel,
							}),
						],
					}),
					// new form stop
				],
			}),
			// new stop
		];
		player_div.appendChild(n({
			class: 'list-group-item d-flex flex-row flex-wrap justify-content-end align-items-center p-1',
			content: element_list,
		}));
	})();
}

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
			game_start: result.game_start,
			game_stop: result.game_stop,
			reward_success: result.reward_success,
			reward_conquest: result.reward_conquest,
			reward_rate: result.reward_rate,
			station_list: result.station_list,
			team_list: result.team_list,
			player_list: result.player_list,
		};
	}
	refresh();
})();