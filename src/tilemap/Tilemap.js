import Entity from "../entity/Entity"
import Resources from "../resources/Resources"
import Tileset from "../resources/Tileset"
import Tiled from "../resources/Tiled"
import Texture from "../resources/Texture"
import TilemapOrthogonalLayer from "./TilemapOrthogonalLayer"
import TilemapIsometricLayer from "./TilemapIsometricLayer"

class Tilemap extends Entity
{
	constructor(resource) {
		super()
		this.numTilesX = 0
		this.numTilesY = 0
		this.tileWidth = 0
		this.tileHeight = 0
		this.columns
		this.type = Tilemap.Type.Orthographic
		this.tilesets = []
		if(resource) {
			this.loadFromResource(resource)
		}
	}

	create(numTilesX, numTilesY, tileWidth, tileHeight, type = Tilemap.Type.Orthographic, name = "Layer") {
		this.name = name
		this.numTilesX = numTilesX
		this.numTilesY = numTilesY
		this.tileWidth = tileWidth
		this.tileHeight = tileHeight
		this.type = type
		this.tilesets = []
		this.size.set(numTilesX * tileWidth, numTilesY * tileHeight)
	}

	createLayer(data, tileWidth, tileHeight, type, name) {
		let layer = null
		switch(type) {
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
		layer.create(this.numTilesX, this.numTilesY, this.tileWidth, this.tileHeight, data, name)
		return layer
	}

	createTileset(config) {
		const tileset = new Tileset()
		tileset.loadFromCfg(config)
		this.tilesets.push(tileset)
	}

	loadFromResource(resource) 
	{
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
		const layers = tiled.layers
		for(let n = 0; n < layers.length; n++) {
			const layerInfo = layers[n]
			const layer = this.createLayer(layerInfo.data, layerInfo.tileWidth, layerInfo.tileHeight, this.type, layerInfo.name)
			if(layer) {
				if(layer.tilemap) {
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

	getCellFromWorldPos(x, y) 
	{
		if(!this.children) { return null }

		const child = this.children[0]
		return child.getCellFromWorldPos(x, y)
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