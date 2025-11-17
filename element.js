/**
 * @param {object} options
 * @param {?string} options.tag
 * @param {?string} options.klass
 * @param {?{(): void}} options.submit // TODO pass event parameter
 * @param {string|HTMLElement[]} options.content
 * @returns {HTMLElement}
 */
export function n(options) {
	if (options.tag === undefined)
		options.tag = 'div';
	if (options.klass === undefined)
		options.klass = null;
	if (options.submit === undefined)
		options.submit = null;
	let element = document.createElement(options.tag);
	if (options.klass !== null)
		element.className = options.klass;
	if (options.submit !== null) {
		element.addEventListener('submit', event => {
			event.preventDefault();
			options.submit();
		});
	}
	if (typeof(options.content) === 'string') {
		element.innerHTML = options.content;
	} else {
		for (let child of options.content)
			element.appendChild(child);
	}
	return element;
}