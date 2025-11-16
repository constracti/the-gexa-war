import { API } from './api.js';
import { lexicon } from './lexicon.js';

(title => {
	document.title = title;
	for (let element of document.getElementsByTagName('h1'))
		element.innerHTML = title;
})(lexicon.title);

export const api = new API();