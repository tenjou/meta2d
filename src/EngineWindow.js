import Engine from "./Engine"
import Device from "./Device"
import Time from "./Time"
import Resources from "./resources/Resources"
import Vector4 from "./math/Vector4"

class EngineWindow {
	constructor() {		
		this.width = 0
		this.height = 0
		this.offsetLeft = 0
		this.offsetTop = 0
		this.ratio = 1
		this.scaleX = 1
		this.scaleY = 1		
		this.bgColor = new Vector4(0.8, 0.8, 0.8, 1)
		this._cursor = "auto"
		this._updating = false
		this._updateWorker = null
		this.readyFunc = null
		this.renderFunc = null
	}

	create() {
		let container = null

		const engineContainer = Engine.settings.container
		if(engineContainer) {
			container = (typeof engineContainer === "string") ? document.querySelector(engineContainer) : engineContainer
		}
		if(!container) {
			container = document.createElement("div")
			container.style.cssText = "position:absolute; width:100%; height:100%; background: #ddd; display:flex; align-items:center; justify-content:center;"
		}
		
		const canvas = document.createElement("canvas")
		const gl = canvas.getContext("webgl", { 
			antialias: Engine.settings.antialias, 
			alpha: Engine.settings.alpha 
		})
		if(!gl) {
			console.error("Unable to initialize WebgGL context. Your browser or machine may not support it.")
			return
		}
		
		container.appendChild(canvas)
		if(!engineContainer) {
			document.body.appendChild(container)
		}
	
		Engine.container = container
		Engine.canvas = canvas
		Engine.gl = gl	

		this.setup()
		Engine.emit("setup")
	
		if(Engine.app.setup) {
			Engine.app.setup()
		}
	
		this.updateScreenSize()
		Device.on("resize", this.updateScreenSize.bind(this))
		Device.on("visible", this.handleVisible.bind(this))
		this.handleVisible(Device.visible)

		this.readyFunc = this.ready.bind(this)
		this.renderFunc = this.render.bind(this)
	
		Resources.on("ready", this.readyFunc)
		if(!Resources.loading) {
			this.ready()
		}
	}

	setup() {
		const gl = Engine.gl

		gl.clearColor(this.bgColor.x, this.bgColor.y, this.bgColor.z, this.bgColor.w)
		gl.clearDepth(1.0)
		gl.enable(gl.DEPTH_TEST)
		gl.depthFunc(gl.LEQUAL)
		gl.enable(gl.BLEND)
		gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA)	
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
	}

	updateScreenSize() {
		const settings = Engine.settings
		const container = Engine.container
		const canvas = Engine.canvas

		const targetWidth = settings.width ? settings.width : container.clientWidth
		const targetHeight = settings.height ? settings.height : container.clientHeight

		const widthRatio = container.clientWidth / targetWidth
		const heightRatio = container.clientHeight / targetHeight
		const currRatio = (widthRatio < heightRatio) ? widthRatio : heightRatio 

		if(settings.upscale) {
			this.ratio = currRatio
		}
		else {
			this.ratio = (currRatio > 1.0) ? 1.0 : currRatio
		}
	
		this.width = targetWidth
		this.height = targetHeight
		canvas.width = targetWidth
		canvas.height = targetHeight
		canvas.style.width = `${targetWidth * this.ratio}px`
		canvas.style.height = `${targetHeight * this.ratio}px`
		this.updateOffset()

		Engine.gl.viewport(0, 0, targetWidth, targetHeight)
		Engine.view.size.set(targetWidth, targetHeight)

		const cameras = Engine.cameras
		for(let n = 0; n < cameras.length; n++) {
			const camera = cameras[n]
			camera.size.set(targetWidth, targetHeight)
			camera.updateProjectionTransform()		
		}
	
		Engine.emit("resize")
	}

	updateOffset() {
		this.offsetLeft = 0
		this.offsetTop = 0

		let element = Engine.container
		if(element.offsetParent)
		{
			do {
				this.offsetLeft += element.offsetLeft
				this.offsetTop += element.offsetTop
			} while(element = element.offsetParent);
		}

		let rect = Engine.container.getBoundingClientRect()
		this.offsetLeft += rect.left
		this.offsetTop += rect.top

		rect = Engine.canvas.getBoundingClientRect()
		this.offsetLeft += rect.left
		this.offsetTop += rect.top
	}

	ready() {
		Resources.off("ready", this.readyFunc)
	
		if(Engine.app.ready) {
			Engine.app.ready()
		}

		this.render(Time.deltaF)
	}

	update() {
		Time.start()

		while(Time.accumulator >= Time.updateFreq) {
			Time.accumulator -= Time.updateFreq
			Engine.emit("updateFixed", Time.updateFreq)
		}

		Time.alpha = Time.accumulator / Time.updateFreq

		this._updating = true
		const updatingComponents = Engine.updatingComponents
		for(let n = 0; n < updatingComponents.length; n++) {
			updatingComponents[n].update(Time.deltaF)	
		}

		const updating = Engine.updating
		for(let n = 0; n < updating.length; n++) {
			updating[n].update(Time.deltaF)	
		}
		this._updating = false

		if(Engine.updatingRemove.length > 0) {
			const buffer = Engine.updatingRemove.length
			for(let n = 0; n < buffer.length; n++) {
				Engine.removeUpdating(buffer[n])
			}
			buffer.length = 0
		}
		if(Engine.updatingComponentsRemove.length > 0) {
			const buffer = Engine.updatingComponentsRemove.length
			for(let n = 0; n < buffer.length; n++) {
				Engine.removeUpdatingComponent(buffer[n])
			}
			buffer.length = 0
		}		

		Engine.emit("update", Time.deltaF)
	
		if(Engine.app.update) {
			Engine.app.update(Time.deltaF)
		}

		Time.end()
	}
	
	render() {
		this.update()

		Time.startRender()

		const gl = Engine.gl
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

		Engine.emit("pre-render", Time.deltaRenderF)
		Engine.renderer.render()
		Engine.emit("render", Time.deltaRenderF)
		Engine.emit("post-render", Time.deltaRenderF)
	
		if(Engine.app.render) {
			Engine.app.render(Time.deltaRenderF)
		}
	
		Time.endRender()
	
		requestAnimationFrame(this.renderFunc)
	}

	handleVisible(visible) {
		if(visible) {
			if(this.updateWorker) {
				this.updateWorker.terminate()
				this.updateWorker = null
			}
		}
		else {
			const workerUpdateFunc = function() {
				setInterval(() => {
					postMessage("update")
				}, 1000 / 60)			
			}
			this.updateWorker = new Worker(URL.createObjectURL(
				new Blob([ `(${workerUpdateFunc.toString()})()` ], { type: "text/javascript" })))
			this.updateWorker.onmessage = (msg) => {
				this.update()
			}
		}
	}

	backgroundColor(r, g, b) {
		const weight = 1 / 255
		this.bgColor.set(r * weight, g * weight, b * weight, 1)
		Engine.gl.clearColor(this.bgColor.x, this.bgColor.y, this.bgColor.z, this.bgColor.w)
	}

	set cursor(type) {
		if(this._cursor === type) { return }
		this._cursor = type

		document.body.style.cursor = type
	}

	get cursor() {
		return this._cursor
	}
}

export default EngineWindow