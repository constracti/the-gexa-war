import { api } from './common.js';
import { lexicon } from './lexicon.js';

/**
 * @typedef {{deadline: string, reward_success: number, reward_conquest: number}|null} AdminLogin
 */

/**
 * @type {?{password: string, deadline: string, reward_success: number, reward_conquest: number}}
 */
let state = null;

function refresh() {
	if (state !== null) {
		login_form.classList.add('d-none');
		login_form.reset();
		deadline_input.value = state.deadline;
		reward_success_input.value = state.reward_success.toString();
		reward_conquest_input.value = state.reward_conquest.toString();
		main_div.classList.remove('d-none');
	} else {
		main_div.classList.add('d-none');
		config_form.reset();
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

// TODO show stations with passwords

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
		};
	}
	refresh();
})();