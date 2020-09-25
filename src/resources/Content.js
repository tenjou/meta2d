import { Resource } from "./Resource"
import { Resources } from "./Resources"

class Content extends Resource 
{
	constructor() {
		super()
		this.text = null
	}

	loadFromConfig(config) {
		this.loading = true
		this.loadFromPath(config.path)
	}

	loadFromPath(path) {
		this.loading = true
		fetch(path)
			.then((response) => response.text())
			.then(this.loadFromText.bind(this))
	}

	loadFromText(text) {
		this.text = text
		this.loading = false
	}
}

Resources.register(Content)

export default Content