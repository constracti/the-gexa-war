import { lexicon } from "./lexicon.js";


export class API {

	get url() {
		return '/api.php';
	}

	async get() {
		try {
			const response = await fetch(this.url);
			if (!response.ok)
				throw new Error(response.status);
			const result = await response.json();
			console.log(result);
		} catch (error) {
			alert(`${lexicon.error}: ${error}`); // TODO alert a generic error message
		}
	}
}