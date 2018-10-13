import Resources from "./Resources"

class Resource 
{
	constructor() {
		this.watchers = []
		this.loadLater = false
		this._loaded = false
		this._loading = false
	}

	watch(func) {
		this.watchers.push(func)
	}

	unwatch(func) {
		const index = this.watchers.indexOf(func)
		if(index == -1) { return }
		this.watchers[index] = this.watchers[this.watchers.length - 1]
		this.watchers.pop()
	}

	emit(event) {
		for(let n = 0; n < this.watchers.length; n++) {
			this.watchers[n](event, this)
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
				this.emit("unloaded", this)
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
				this.emit("unloaded", this)
				Resources.resourceLoading(this)
			}
		}
		else {
			if(this._loading) {
				this._loading = false
				this._loaded = true
				this.emit("loaded", this)
				Resources.resourceLoaded(this)
			}			
		}
	}

	get loading() {
		return this._loading
	}
}

Resources.Resource = Resource

export default Resource