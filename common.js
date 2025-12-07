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
	return `lab(from ${backgroundColor} calc((50 - l) * 100 + 50) 0 0)`;
}