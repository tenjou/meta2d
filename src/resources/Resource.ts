import { Resources } from "./Resources"

export type ResourceConfigType = {
    type: string
    [prop: string]: unknown
}
export type ResourceEvent = "loaded" | "unloaded" | "ended"
export type ResourceCallback = (eventId: ResourceEvent, resource: Resource) => void

export class Resource {
    watchers: Array<ResourceCallback> = []
    loadLater: boolean = false
    _loaded: boolean = false
    _loading: boolean = false
    
    loadFromConfig(config: ResourceConfigType) {}

	watch(callback: ResourceCallback) {
		this.watchers.push(callback)
	}

	unwatch(callback: ResourceCallback) {
		const index = this.watchers.indexOf(callback)
		if(index == -1) { return }
		this.watchers[index] = this.watchers[this.watchers.length - 1]
		this.watchers.pop()
	}

	emit(eventId: ResourceEvent) {
		for(let n = 0; n < this.watchers.length; n++) {
			this.watchers[n](eventId, this)
		}
	}

	set loaded(value) {
		if(value) {
			if(!this._loaded) {
				this._loaded = true
				this.loading = false
			}
		}
		else {
			if(this._loaded) {
				this._loaded = false
				this.emit("unloaded")
			}
		}
	}

	get loaded() {
		return this._loaded
	}

	set loading(value) {
		if(value) {
			if(!this._loading) {
				this._loading = true
				this._loaded = false
				this.emit("unloaded")
				Resources.resourceLoading(this)
			}
		}
		else {
			if(this._loading) {
				this._loading = false
				this._loaded = true
				this.emit("loaded")
				Resources.resourceLoaded(this)
			}			
		}
	}

	get loading() {
		return this._loading
	}
}
