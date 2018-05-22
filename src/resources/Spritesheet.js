import Texture from "./Texture"
import Frame from "./Frame"
import Utils from "../Utils"

class Spritesheet extends Texture
{
	constructor() {
		super()
		this.path = null
	}

	loadFromConfig(config) {
		this.loading = true
		if(config.path) {
			this.loadFromPath(config.path)
		}
		else {
			this.loading = false
		}
	}

	loadFromPath(path) 
	{
		this.loading = true
		this.path = path

		const ext = Utils.getExt(path)
		switch(ext)
		{
			case "json": {
				fetch(path)
				.then(response => response.json())
				.then(this.loadFromJson.bind(this))
			} break

			case "xml": {
				fetch(path)
				.then(response => response.text())
				.then(str => (new DOMParser().parseFromString(str, "text/xml")))
				.then(this.loadFromXml.bind(this))
			} break

			default:
				this.loading = false
				console.warn(`(Spritesheet.loadFromPath) Unsupported file extenssion: ${ext}`)
				break
		}
	}

	loadFromJson(data)
	{
		const rootPath = Utils.getRootPath(this.path)

		this.loading = true
		this.width = data.meta.size.w
		this.height = data.meta.size.h
		super.loadFromPath(`${rootPath}${data.meta.image}`)
		
		const frames = data.frames
		if(Array.isArray(frames)) {
			for(let n = 0; n < frames.length; n++) {
				const frameInfo = frames[n]
				const frame = frameInfo.frame
				this.createFrame(frameInfo.filename, frame.x, frame.y, frame.w, frame.h)
			}
		}
		else {
			for(let key in frames) {
				const frameInfo = frames[key]
				const frame = frameInfo.frame
				this.createFrame(key, frame.x, frame.y, frame.w, frame.h)
			}
		}
	}

	loadFromXml(xml)
	{
		const rootPath = Utils.getRootPath(this.path)
		const document = xml.documentElement

		this.loading = true
		this.width = parseInt(document.getAttribute("width"))
		this.height = parseInt(document.getAttribute("height"))
		const imagePath = document.getAttribute("imagePath")
		super.loadFromPath(`${rootPath}${imagePath}`)

		const childNodes = document.childNodes
		for(let n = 0; n < childNodes.length; n++) {
			const node = childNodes[n]
			switch(node.nodeName) {
				case "#text":
					continue
				case "SubTexture": // Starling
					this.createFrame(
						node.getAttribute("name"),
						parseInt(node.getAttribute("x")),
						parseInt(node.getAttribute("y")),
						parseInt(node.getAttribute("width")),
						parseInt(node.getAttribute("height")))
					break
				case "sprite": // Generic XML
					this.createFrame(
						node.getAttribute("n"),
						parseInt(node.getAttribute("x")),
						parseInt(node.getAttribute("y")),
						parseInt(node.getAttribute("width")),
						parseInt(node.getAttribute("height")))				
					break
				default:
					console.warn(`(Spritesheet.loadFromXml) Unsupported node: ${node.nodeName}`)
					break
			}
		}
	}

	createFrame(name, x, y, width, height) {
		const widthUV = 1.0 / this.width
		const heightUV = 1.0 / this.height
		const minX = x * widthUV
		const minY = y * heightUV
		const maxX = (x + width) * widthUV
		const maxY = (y + height) * heightUV								
		this.frames[name] = new Frame(this, [
			width, height, 	maxX, maxY,
			0, height, 		minX, maxY,
			0, 0,			minX, minY,
			width, 0,		maxX, minY
		], 0)
	}
}

export default Spritesheet