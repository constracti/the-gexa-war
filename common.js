import { API } from './api.js';
import { n } from './element.js';
import { lexicon } from './lexicon.js';

/**
 * @typedef Station
 * @type {object}
 * @property {number} id
 * @property {string} name
 * @property {number} capacity - positive integer
 * @property {?number} place
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
 * @param {string} background_color
 * @returns {string}
 */
function text_color(background_color) {
	const mean = 60;
	return `lab(from ${background_color} calc((${mean} - l) * 100 + 100 - ${mean}) 0 0)`;
}

/**
 * @param {Team} team
 * @returns {HTMLDivElement}
 */
export function team_badge(team) {
	return n({
		class: 'badge border m-1',
		style: {
			backgroundColor: team.color,
			color: text_color(team.color),
		},
		content: team.name,
	});
}

/**
 * @param {number} seconds
 * @returns {string}
 * @throws {RangeError}
 */
export function human_duration(seconds) {
	if (seconds < 0)
		throw new RangeError();
	seconds = Math.floor(seconds);
	let minutes = Math.floor(seconds / 60);
	seconds -= minutes * 60;
	let hours = Math.floor(minutes / 60);
	minutes -= hours * 60;
	return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
