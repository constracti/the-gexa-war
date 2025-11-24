import { API } from './api.js';
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
 * @property {string} id
 * @property {string} name
 * @property {number} team
 */

(title => {
	document.title = title;
	for (const element of document.getElementsByTagName('h1'))
		element.innerHTML = title;
})(lexicon.title);

export const api = new API();