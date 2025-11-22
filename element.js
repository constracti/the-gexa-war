/**
 * @param {object} options
 * @param {?string} options.tag
 * @param {?string} options.class
 * @param {?string} options.value
 * @param {?(string|HTMLElement[])} options.content
 * @returns {HTMLElement}
 */
export function n(options) {
	if (options.tag === undefined)
		options.tag = 'div';
	if (options.class === undefined)
		options.class = null;
	if (options.value === undefined)
		options.value = null;
	if (options.content === undefined)
		options.content = null;
	const element = document.createElement(options.tag);
	if (options.class !== null)
		element.className = options.class;
	if (options.value !== null)
		element.value = options.value;
	if (options.content === null) {
	} else if (typeof(options.content) === 'string') {
		element.innerHTML = options.content;
	} else {
		for (const child of options.content)
			element.appendChild(child);
	}
	return element;
}

/**
 * @param {{id: number, name: string}[]} option_list
 * @param {?string} option_null
 * @returns {HTMLOptionElement[]}
 */
export function n_option_list(option_list, option_null) {
	if (option_null === undefined)
		option_null = null;
	/**
	 * @type {HTMLOptionElement[]}
	 */
	const element_list = [];
	if (option_null !== null) {
		element_list.push(n({
			tag: 'option',
			value: '',
			content: option_null,
		}));
	}
	for (const option of option_list) {
		element_list.push(n({
			tag: 'option',
			value: `${option.id}`,
			content: option.name,
		}));
	}
	return element_list;
}