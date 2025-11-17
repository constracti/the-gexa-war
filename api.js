import { lexicon } from "./lexicon.js";


export class API {

	get url() {
		return '/api.php';
	}

	async get() {
		try {
			const response = await fetch(this.url);
			let contentType = response.headers.get('content-type');
			if (!contentType.startsWith('application/json;')) {
				let text = await response.text();
				throw new Error(text);
			}
			return await response.json();
		} catch (error) {
			console.error(error);
			alert(lexicon.error);
		}
	}
}