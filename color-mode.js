if (window.matchMedia) {
	if (window.matchMedia('(prefers-color-scheme: dark)').matches)
		document.documentElement.dataset.bsTheme = 'dark';
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
		document.documentElement.dataset.bsTheme = event.matches ? 'dark' : 'light';
	});
}
