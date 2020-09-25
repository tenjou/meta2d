import { Resource, ResourceConfigType } from "./Resource"

export type ResourceLoadLater = {
    resource: Resource
    config: ResourceConfigType
}

export type ResourceCallback = (arg?: unknown) => void

export enum ResourceEvent {
    Loading = "loading",
    Ready = "ready",
    Progress = "progress"
}

class Resources {
    resourceTypes: { [resourceType: string]: new () => Resource } = {}
    resources: { [prop: string]: Resource } = {}
    listeners: { [prop: string]: Array<ResourceCallback> } = {}
    loadLaterBuffer: Array<ResourceLoadLater> = []
    loading: boolean = false
    numToLoad: number = 0
    numToLoadMax: number = 0

    register(resourceCls: new () => Resource) {
        this.resourceTypes[resourceCls.name] = resourceCls 
    }

    loadFromConfig(config: { [key:string]: ResourceConfigType }) {
        for(let key in config) {
            this.load(key, config[key])
        }
    }

    load(resourceId: string, config: ResourceConfigType) {
        if(this.resources[resourceId]) {
            console.warn(`(Resources.load) There is already resource with id: ${resourceId}`)
            return
        }

        const cls = this.resourceTypes[config.type]
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

        this.resources[resourceId] = resource
        return resource
    }

    loadDelayed() {
        for(let n = 0; n < this.loadLaterBuffer.length; n++) {
            const info = this.loadLaterBuffer[n]
            info.resource.loadFromConfig(info.config)
        }
        this.loadLaterBuffer.length = 0
    }

    resourceLoading(resource: Resource) {
        if(this.numToLoad === 0) {
            this.loading = true
            this.emit(ResourceEvent.Loading)
        }
        this.numToLoad++
        this.numToLoadMax++
    }

    resourceLoaded(resource: Resource) {
        this.numToLoad--
        this.emit(ResourceEvent.Progress, (100 / this.numToLoadMax) * (this.numToLoadMax - this.numToLoad))
        if(this.numToLoad === 0) {
            this.loadDelayed()
            this.loading = false
            this.emit(ResourceEvent.Ready)
        }
    }

    get<T extends Resource>(id: string):T {
        return (this.resources[id] || null) as T
    }

    on(eventId: ResourceEvent, callback: ResourceCallback) {
        const buffer = this.listeners[eventId]
        if(buffer) {
            buffer.push(callback)
        }
        else {
            this.listeners[eventId] = [ callback ]
        }
    }

    off(eventId: ResourceEvent, callback: ResourceCallback) {
        const buffer = this.listeners[eventId]
        if(!buffer) { 
            return 
        }
        const index = buffer.indexOf(callback)
        if(index === -1) { 
            return 
        }
        buffer[index] = buffer[buffer.length - 1]
        buffer.pop()
    }

    emit(eventId: ResourceEvent, arg?: unknown) {
        const buffer = this.listeners[eventId]
        if(!buffer) { 
            return 
        }
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

const instance = new Resources()
export { instance as Resources }