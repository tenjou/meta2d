
class Resources 
{
	constructor() {
		this.resources = {}
		this.listeners = {}
        this.loadLaterBuffer = []
        this.resourcesTypes = {}
		this.loading = false
		this.numToLoad = 0
		this.numToLoadMax = 0
	}

	loadFromConfig(config) {
		for(let key in config) {
			this.load(key, config[key])
		}
    }
    
    register(resourceCls) {
        this.resourcesTypes[resourceCls.name] = resourceCls 
    }

	load(id, config) 
	{
		if(this.resources[id]) {
			console.warn(`(Resources.load) There is already resource with id: ${id}`)
			return
		}

		const cls = this.resourcesTypes[config.type]
		if(!cls) {
			console.warn(`(Resources.load) No such resource type registered: ${config.type}`)
			return
		}

		const resource = new cls()
		if(resource.loadLater) {
			this.loadLaterBuffer.push({ resource, config })
		}
		else {
			resource.loadFromConfig(config)
		}

		this.resources[id] = resource

		return resource
	}

	loadDelayed() {
		for(let n = 0; n < this.loadLaterBuffer.length; n++) {
			const info = this.loadLaterBuffer[n]
			info.resource.loadFromConfig(info.config)
		}
		this.loadLaterBuffer.length = 0
	}

	resourceLoading(resource) {
		if(this.numToLoad === 0) {
			this.loading = true
			this.emit("loading")
		}
		this.numToLoad++
		this.numToLoadMax++
	}

	resourceLoaded(resource) {
		this.numToLoad--
		this.emit("progress", (100 / this.numToLoadMax) * (this.numToLoadMax - this.numToLoad))
		if(this.numToLoad === 0) {
			this.loadDelayed()
			this.loading = false
			this.emit("ready")
		}
	}

	get(id) {
		const resource = this.resources[id]
		return resource || null
	}

	on(event, func) 
	{
		const buffer = this.listeners[event]
		if(buffer) {
			buffer.push(func)
		}
		else {
			this.listeners[event] = [ func ]
		}
	}

	off(event, func) 
	{
		const buffer = this.listeners[event]
		if(!buffer) { return }

		const index = buffer.indexOf(func)
		if(index === -1) { return }

		buffer[index] = buffer[buffer.length - 1]
		buffer.pop()
	}

	emit(event, arg) 
	{
		const buffer = this.listeners[event]
		if(!buffer) { return }

		if(arg) {
			for(let n = 0; n < buffer.length; n++) {
				buffer[n](arg)
			}
		}
		else {
			for(let n = 0; n < buffer.length; n++) {
				buffer[n]()
			}
		}
	}
}

export default new Resources()