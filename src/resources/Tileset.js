import Resources from "./Resources"
import Resource from "./Resource"
import Texture from "./Texture"
import Utils from "../Utils"

class Tileset extends Resource
{
	constructor() {
		super()
		this.gid = 1
		this.width = 0
		this.height = 0
		this.tileWidth = 0
		this.tileHeight = 0
		this.spacing = 0
		this.margin = 0
		this.path = null
		this.texture = null
		this.frames = null
	}

	loadFromConfig(cfg) {
		this.loading = true
		this.gid = cfg.gid
		this.width = cfg.width || 0
		this.height = cfg.height || 0
		this.tileWidth = cfg.tileWidth || 0
		this.tileHeight = cfg.tileHeight || 0
		this.spacing = cfg.spacing || 0
		this.margin = cfg.margin || 0
		if(cfg.path) {
			this.loadFromPath(cfg.path)
		}
		else {
			this.texture = cfg.texture || null
			this.createFrames(this.texture.width, this.texture.height)
		}
	}

	loadFromPath(path) {
		this.path = path
		const format = Utils.getExt(path)
		switch(format) {
			case "tsx":
				fetch(path)
				.then(response => response.text())
				.then(str => (new DOMParser()).parseFromString(str, "text/xml"))
				.then(data => this.parseFromData(data, format))
				break
			default:
				this.texture = Resources.get(path)
				if(!this.texture) {
					this.texture = new Texture()
					this.texture.loadFromPath(path)
				}
				this.createFrames()
				this.loading = false
				break
		}
	}

	parseFromData(data, format) {
		switch(format) {
			case "tsx":
				this.parseFromTsx(data)
				break
			default:
				console.warn(`(Tileset.parseFromData) Unsupported file format: ${format}`)
				break
		}
		this.loading = false
	}

	parseFromTsx(data) 
	{
		const node = data.documentElement
		this.tileWidth = parseInt(node.getAttribute("tilewidth"))
		this.tileHeight = parseInt(node.getAttribute("tileheight"))
		this.spacing = parseInt(node.getAttribute("spacing"))
		this.margin = parseInt(node.getAttribute("margin"))

		const children = node.childNodes
		for(let n = 0; n < children.length; n++) {
			const node = children[n]
			if(node.nodeType !== 1) { 
				continue 
			}
			switch(node.nodeName) {
				case "image": {
					this.width = parseInt(node.getAttribute("width"))
					this.height = parseInt(node.getAttribute("height"))
					const source = node.getAttribute("source")
					const rootPath = Utils.getRootPath(this.path)
					const id = source.replace(/\./g, '_')
					this.texture = Resources.load(id, {
						type: "Texture",
						path: `${rootPath}${source}`,
						minFilter: Texture.NEAREST,
						magFilter: Texture.NEAREST
					})
					this.createFrames()
				} break
			}
		}
	}

	createFrames() {
		const tilesX = Math.floor(this.width / this.tileWidth)
		const tilesY = Math.floor(this.height / this.tileHeight)
		const uvOffsetX = 1.0 / this.width
		const uvOffsetY = 1.0 / this.height
		this.frames = new Array(tilesX * tilesY)
		
		let n = 0
		let posX = this.spacing
		let posY = this.spacing
		for(let y = 0; y < tilesY; y++) {
			for(let x = 0; x < tilesX; x++) {
				this.frames[n] = new Float32Array([ 
					uvOffsetX * posX, 
					uvOffsetY * posY, 
					uvOffsetX * (posX + this.tileWidth - this.margin), 
					uvOffsetY * (posY + this.tileHeight - this.margin)
				])
				posX += this.tileWidth + this.spacing
				n++
			}
			posX = this.spacing
			posY += this.tileHeight + this.spacing
		}
	}
}

export default Tileset