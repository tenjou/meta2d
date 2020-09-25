import Entity from "../entity/Entity"
import { Resources } from "../resources/Resources"
import Tileset from "../resources/Tileset"
import Tiled from "../resources/Tiled"
import TilemapOrthogonalLayer from "./TilemapOrthogonalLayer"
import TilemapIsometricLayer from "./TilemapIsometricLayer"

class Tilemap extends Entity {
	constructor(resource) {
		super()
		this.sizeX = 0
		this.sizeY = 0
		this.tileWidth = 0
		this.tileHeight = 0
		this.type = Tilemap.Type.Orthographic
		this.tilesets = []
		this.properties = {}
		if(resource) {
			this.loadFromResource(resource)
		}
	}

	create(sizeX, sizeY, tileWidth, tileHeight, type = Tilemap.Type.Orthogonal, name = "Layer") {
		this.name = name
		this.sizeX = sizeX
		this.sizeY = sizeY
		this.tileWidth = tileWidth
		this.tileHeight = tileHeight
		this.type = type
		this.tilesets = []
		this.size.set(sizeX * tileWidth, sizeY * tileHeight)
	}

	createLayer(data, name) {
		let layer = null
		switch(this.type) {
			case Tilemap.Type.Orthogonal:
				layer = new TilemapOrthogonalLayer()
				break
			case Tilemap.Type.Isometric:
				layer = new TilemapIsometricLayer()
				break
			default:
				console.warn(`(Tilemap.createLayer) Unsupported layer type: ${type}`)
				break
		}
		if(!layer) {
			return null
		}

		this.addChild(layer)
		layer.create(this.sizeX, this.sizeY, this.tileWidth, this.tileHeight, data, name)
		return layer
	}

	createTileset(config) {
		const tileset = new Tileset()
		tileset.loadFromConfig(config)
		this.tilesets.push(tileset)
	}

	loadFromResource(resource) {
		let ref = null
		if(typeof resource === "string") {
			ref = Resources.get(resource)
			if(!ref) {
				console.error(`(Tilemap.loadFromResource) No such resource found: ${resource}`)
				return
			}
		}
		else {
			ref = resource
		}

		if(ref instanceof Tiled) {
			this.loadFromTiled(ref)
		}
	}

	loadFromTiled(tiled) {
		this.create(tiled.width, tiled.height, tiled.tileWidth, tiled.tileHeight, tiled.orientation, tiled.name)
		this.tilesets = tiled.tilesets
		this.properties = tiled.properties
		const layers = tiled.layers
		for(let n = 0; n < layers.length; n++) {
			const layerInfo = layers[n]
			const layer = this.createLayer(layerInfo.data, layerInfo.name)
			if(layer) {
				if(layer.tileset) {
					layer.hidden = layerInfo.visible ? false : true
				}
				layer.color.set(1, 1, 1, layerInfo.opacity)
			}
		}
	}

	getLayer(name) {
		if(!this.children) { 
			return null 
		}
		for(let n = 0; n < this.children.length; n++) {
			const child = this.children[n]
			if(child.name === name) {
				return child
			}
		}
		return null
	}

	getTileFromWorld(x, y, output) {
		if(!this.children) { return }
		
		const child = this.children[0]
		return child.getTileFromWorld(x, y, output)
	}

	getWorldFromTile(x, y, output) {
		if(!this.children) { return }
		
		const child = this.children[0]
		return child.getWorldFromTile(x, y, output)
	}

	getProperties(gid) {
		for(let n = 0; n < this.tilesets.length; n++) {
			const tileset = this.tilesets[n]
			if(tileset.gid <= gid) {
				return tileset.getProperties(gid - tileset.gid)
			}
		}
		return null
	}
}

Tilemap.Type = {
	Orthogonal: "orthogonal",
	Isometric: "isometric",
	Hexagon: "hexagon"
}

Tilemap.Flag = {
	FlipHorizontally: 0x80000000,
	FlipVertically: 0x40000000,
	FlipDiagonally: 0x20000000
}

export default Tilemap