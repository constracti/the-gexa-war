import { api } from './common.js';
import { lexicon } from './lexicon.js';

/**
 * @type {?{password: string}}
 */
let state = null;

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
	 * @type {boolean}
	 */
	const result = await api.post('admin_login', new FormData(login_form));
	if (!result) {
		alert(lexicon.wrong_password);
		return;
	}
	login_form.classList.add('d-none');
	const password = password_input.value;
	login_form.reset();
	state = {
		password: password,
	};
	localStorage.setItem('password', password);
	main_div.classList.remove('d-none');
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
	main_div.classList.add('d-none');
	localStorage.removeItem('password');
	login_form.classList.remove('d-none');
});

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
	 * @type {boolean}
	 */
	const result = await api.post('admin_login', formData);
	if (!result) {
		login_form.classList.remove('d-none');
		return;
	}
	state = {
		password: password,
	};
	main_div.classList.remove('d-none');
})();