import { Resource } from "./Resource"
import { Resources } from "./Resources"
import { ResourceConfigType } from "./Resource"

type ContentConfigType = ResourceConfigType & {
    path: string
}

export class Content extends Resource {
    text: string = null

	loadFromConfig(config: ContentConfigType) {
		this.loading = true
		this.loadFromPath(config.path)
	}

	loadFromPath(path: string) {
		this.loading = true
		fetch(path)
			.then((response) => response.text())
			.then(this.loadFromText.bind(this))
	}

	loadFromText(text: string) {
		this.text = text
		this.loading = false
	}
}

Resources.register(Content)
