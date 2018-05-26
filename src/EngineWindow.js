import Engine from "./Engine"
import Device from "./Device"
import Time from "./Time"
import Resources from "./resources/Resources"
import Vector4 from "./math/Vector4"

class EngineWindow 
{
	constructor() 
	{		
		this.width = 0
		this.height = 0
		this.offsetLeft = 0
		this.offsetTop = 0
		this.ratio = 1
		this.scaleX = 1
		this.scaleY = 1		
		this.bgColor = new Vector4(0.8, 0.8, 0.8, 1)
		this._cursor = "auto"
	}

	create() 
	{
		const container = document.createElement("div")
		container.style.cssText = "position:absolute; width:100%; height:100%; background: #ddd; display:flex; align-items:center; justify-content:center;"
	
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
		document.body.appendChild(container)
	
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

		this.readyFunc = this.ready.bind(this)
		this.updateFunc = this.update.bind(this)
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

	updateScreenSize()
	{
		const settings = Engine.settings
		const container = Engine.container
		const canvas = Engine.canvas

		const targetWidth = settings.width ? settings.width : window.innerWidth
		const targetHeight = settings.height ? settings.height : window.innerHeight

		const widthRatio = window.innerWidth / targetWidth
		const heightRatio = window.innerHeight / targetHeight
		const currRatio = (widthRatio < heightRatio) ? widthRatio : heightRatio 

		let ratio
		if(settings.upscale) {
			ratio = currRatio
		}
		else {
			ratio = (currRatio > 1.0) ? 1.0 : currRatio
		}
	
		this.width = targetWidth
		this.height = targetHeight
		canvas.width = targetWidth
		canvas.height = targetHeight
		canvas.style.width = `${targetWidth * ratio}px`
		canvas.style.height = `${targetHeight * ratio}px`
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

	updateOffset()
	{
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

	ready()
	{
		Resources.off("ready", this.readyFunc)
	
		if(Engine.app.ready) {
			Engine.app.ready()
		}
	
		this.render(Time.deltaF)
	}

	update()
	{
		while(Time.accumulator >= Time.updateFreq) {
			Time.accumulator -= Time.updateFreq
			Engine.emit("updateFixed", Time.updateFreq)
		}

		Time.alpha = Time.accumulator / Time.updateFreq

		const updating = Engine.updating
		for(let n = 0; n < updating.length; n++) {
			updating[n].update(Time.deltaF)	
		}

		Engine.emit("update", Time.deltaF)
	
		if(Engine.app.update) {
			Engine.app.update(Time.deltaF)
		}
	}
	
	render()
	{
		Time.start()

		this.update()

		const gl = Engine.gl
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

		Engine.emit("pre-render", Time.deltaRenderF)
		Engine.renderer.render()
		Engine.emit("render", Time.deltaRenderF)
		Engine.emit("post-render", Time.deltaRenderF)
	
		if(Engine.app.render) {
			Engine.app.render(Time.deltaRenderF)
		}
	
		Time.end()
	
		requestAnimationFrame(this.renderFunc)
	}

	background(r, g, b) {
		const weight = 1 / 255
		this.bgColor.set(r * weight, g * weight, b * weight, 1)
		Engine.gl.clearColor(this.bgColor.x, this.bgColor.y, this.bgColor.z, this.bgColor.w)
	}

	set cursor(type) 
	{
		if(this._cursor === type) { return }
		this._cursor = type

		document.body.style.cursor = type
	}

	get cursor() {
		return this._cursor
	}
}

export default EngineWindow