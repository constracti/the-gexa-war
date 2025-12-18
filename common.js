import { API } from './api.js';
import { lexicon } from './lexicon.js';

/**
 * @typedef Station
 * @type {object}
 * @property {number} id
 * @property {string} name
 * @property {?number} team
 */

/**
 * @typedef Team
 * @type {object}
 * @property {number} id
 * @property {string} name
 * @property {string} color
 */

/**
 * @typedef Player
 * @type {object}
 * @property {string} id
 * @property {string} name
 * @property {number} team
 * @property {boolean} block
 */

(title => {
	document.title = title;
	for (const element of document.getElementsByTagName('h1'))
		element.innerHTML = title;
})(lexicon.title);

export const api = new API();

/**
 * css expression resulting in a contrasting black or white color,
 * that depends on background color lightness (l)
 * and assuming lightness is not near 50
 * @param {string} backgroundColor
 * @returns {string}
 */
export function textColor(backgroundColor) {
	const mean = 60;
	return `lab(from ${backgroundColor} calc((${mean} - l) * 100 + 100 - ${mean}) 0 0)`;
}