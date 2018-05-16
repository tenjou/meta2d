import Resources from "./Resources"
import Resource from "./Resource"
import Tileset from "./Tileset"
import Utils from "../Utils"

function Layer() {
	this.name = null
	this.width = 0
	this.height = 0
	this.tileWidth = 0
	this.tileHeight = 0
	this.opacity = 1.0
	this.visible = 1
	this.data = null
}

class Tiled extends Resource
{
	constructor() {
		super()
		this.width = 0
		this.height = 0
		this.orientation = null
		this.layers = null
		this.tilesets = null
		this.path = null
		this._dependencies = 0
		this._dependenciesLoaded = 0
	}

	loadFromConfig(cfg) {
		this.loading = true
		this.loadFromPath(cfg.path)
	}

	loadFromPath(path) {
		this.loading = true
		this.path = path
		const ext = Utils.getExt(path)
		switch(ext) {
			case "json": {
				fetch(path)
				.then(response => { return response.json() })
				.then(this.parseJson.bind(this))
			} break

			case "tmx": {
				fetch(path)
				.then(response => response.text())
				.then(str => new DOMParser().parseFromString(str, "text/xml"))
				.then(this.parseTmx.bind(this))
			} break
		}
	}

	parseData(data, encoding) {
		if(encoding) {
			switch(encoding) {
				case "csv":
					return JSON.parse(`[${data}]`)
				case "base64": {
					data = atob(data)
					const result = new Array(data.length / 4)
					let index = 0
					for(let n = 0; n < result.length; n++) {
						result[n] = data.charCodeAt(index) |
									data.charCodeAt(index + 1) << 8 |
									data.charCodeAt(index + 2) << 16 |
									data.charCodeAt(index + 3) << 24
						index += 4
					}
					return result
				}
				default:
					console.error(`(Tiled.parseData) Unsupported encoding format for layer: ${encoding}`)
					return null
			}
		}
		return data
	}

	parseJson(data) {
		this.width = data.width
		this.height = data.height
		this.tileWidth = data.tilewidth
		this.tileHeight = data.tileheight
		this.orientation = data.orientation

		const tilesets = data.tilesets
		const tilesetsToLoad = {}
		const rootPath = Utils.getRootPath(this.path)
		this.tilesets = new Array(tilesets.length)

		for(let n = 0; n < tilesets.length; n++) {
			const tilesetInfo = tilesets[n]
			const gid = tilesetInfo.firstgid
			if(tilesetInfo.source) {
				this._dependencies++
				fetch(`${rootPath}/${tilesetInfo.source}`)
				.then(response => response.text())
				.then(str => (new DOMParser()).parseFromString(str, "text/xml"))
				.then((data) => {
					this.parseTsxTileset(data.documentElement, gid, rootPath)
				})
			}
			else {
				const image = tilesetInfo.image
				const id = `${rootPath}${image}.${gid}`
				let tileset = Resources.get(id)
				if(!tileset) {
					tileset = Resources.load(id, {
						type: "Tileset",
						gid,
						path: `${rootPath}${image}`,
						width: tilesetInfo.imagewidth,
						height: tilesetInfo.imageheight,
						tileWidth: tilesetInfo.tilewidth,
						tileHeight: tilesetInfo.tileheight,
						spacing: tilesetInfo.spacing | 0,
						margin: tilesetInfo.margin | 0
					})
				}
				this.tilesets[n] = tileset
			}
		}

		const numLayers = data.layers.length
		this.layers = new Array(numLayers)

		for(let n = 0; n < numLayers; n++) {
			const layerInfo = data.layers[n]
			const layerData = this.parseData(layerInfo.data, layerInfo.encoding)
			if(!layerData) {
				continue
			}
			const layer = new Layer()
			layer.name = layerInfo.name
			layer.width = layerInfo.width
			layer.height = layerInfo.height
			layer.data = layerData
			layer.visible = (layerInfo.visible !== undefined) ? layerInfo.visible : 1
			layer.opacity = (layerInfo.opacity !== undefined) ? layerInfo.opacity : 1.0
			this.layers[n] = layer
		}

		if(this._dependencies === 0) {
			this.loading = false
		}
	}

	parseTmx(data) {
		const node = data.documentElement
		this.width = parseInt(node.getAttribute("width"))
		this.height = parseInt(node.getAttribute("height"))
		this.tileWidth = parseInt(node.getAttribute("tilewidth"))
		this.tileHeight = parseInt(node.getAttribute("tileheight"))
		this.orientation = node.getAttribute("orientation")
		this.tilesets = new Array()
		this.layers = new Array()

		const rootPath = Utils.getRootPath(this.path)
		const children = node.childNodes
		for(let n = 0; n < children.length; n++) {
			const child = children[n]
			switch(child.nodeName) {
				case "tileset":
					this.parseTmxTileset(child, rootPath)
					break

				case "layer": {
					let layerData = null
					const children = child.childNodes
					for(let n = 0; n < children.length; n++) {
						const child = children[n]
						switch(child.nodeName) {
							case "data":
								const encoding = child.getAttribute("encoding")
								if(encoding) {
									layerData = this.parseData(child.textContent, encoding)
								}
								else {
									const children = data.children
									layerData = new Array(children.length)
									for(let n = 0; n < result.length; n++) {
										layerData[n] = parseInt(children[n].getAttribute("gid"))
									}
									return result
								}
								if(!layerData) {
									continue
								}
								break
						}
					}
					const visible = child.getAttribute("visible")
					const opacity = child.getAttribute("opacity")
					const layer = new Layer()
					layer.name = child.getAttribute("name")
					layer.width = parseInt(child.getAttribute("width"))
					layer.height = parseInt(child.getAttribute("height"))
					layer.visible = (visible !== null) ? parseInt(visible) : 1
					layer.opacity = (opacity !== null) ? parseFloat(opacity) : 1.0
					layer.data = layerData
					this.layers.push(layer)
				} break
			}
		}

		if(this._dependencies === 0) {
			this.loading = false
		}
	}

	parseTmxTileset(node, rootPath) {
		const gid = parseInt(node.getAttribute("firstgid"))
		const source = node.getAttribute("source")
		if(source) {
			this._dependencies++
			fetch(`${rootPath}/${source}`)
			.then(response => response.text())
			.then(str => (new DOMParser()).parseFromString(str, "text/xml"))
			.then((data) => {
				this.parseTsxTileset(data.documentElement, gid, rootPath)
			})
		}
		else {
			this.parseTsxTileset(node, gid, rootPath)
		}
	}

	parseTsxTileset(node, gid, rootPath) {
		const tileWidth = parseInt(node.getAttribute("tilewidth"))
		const tileHeight = parseInt(node.getAttribute("tileheight"))

		let source = null
		let width = 0
		let height = 0
		let margin = 0
		let spacing = 0
		const children = node.childNodes
		for(let n = 0; n < children.length; n++) {
			const child = children[n]
			switch(child.nodeName) {
				case "image":
					source = child.getAttribute("source")
					width = parseInt(child.getAttribute("width"))
					height = parseInt(child.getAttribute("height"))
					spacing = parseInt(node.getAttribute("spacing")) || 0
					margin = parseInt(node.getAttribute("margin")) || 0
					break
			}
		}

		const id = `${rootPath}${source}.${gid}`
		let tileset = Resources.get(id)
		if(!tileset) {
			tileset = Resources.load(id, {
				type: "Tileset",
				gid,
				path: `${rootPath}${source}`,
				width, height,
				tileWidth,
				tileHeight,
				spacing,
				margin
			})
		}
		this.tilesets.push(tileset)

		if(this._dependencies > 0) {
			this._dependenciesLoaded++
			if(this._dependencies === this._dependenciesLoaded) {
				this.loading = false
			}
		}
	}
}

export default Tiled