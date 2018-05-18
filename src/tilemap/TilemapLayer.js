import Engine from "../Engine"
import Renderable from "../entity/Renderable"
import Material from "../resources/Material"
import Vector4 from "../math/Vector4"
import tilemapVertexSrc from "../../shaders/tilemap.vertex.glsl"
import tilemapFragmentSrc from "../../shaders/tilemap.fragment.glsl"

let tilemapMaterial = null
Engine.on("setup", () => { 
	tilemapMaterial = new Material()
	tilemapMaterial.loadFromConfig({
		vertexSrc: tilemapVertexSrc,
		fragmentSrc: tilemapFragmentSrc
	})
})

const FLIPPED_HORIZONTALLY_FLAG = 0x80000000
const FLIPPED_VERTICALLY_FLAG = 0x40000000
const FLIPPED_DIAGONALLY_FLAG = 0x20000000
const ALL_FLAGS = (FLIPPED_HORIZONTALLY_FLAG | FLIPPED_VERTICALLY_FLAG | FLIPPED_DIAGONALLY_FLAG)

class TilemapLayer extends Renderable
{
	constructor() {
		super()
		this.name = "Layer"
		this.numTilesX = 0
		this.numTilesY = 0
		this.tileWidth = 0
		this.tileHeight = 0
		this.tileset = null
		this.color = new Vector4(1, 1, 1, 1)
		this.data = null
		this.material = tilemapMaterial
	}

	create(numTilesX, numTilesY, tileWidth, tileHeight, data) {
		this.numTilesX = numTilesX
		this.numTilesY = numTilesY
		this.tileWidth = tileWidth
		this.tileHeight = tileHeight
		this.dataInfo = new Array(numTilesX * numTilesY)
		this.updateData(data)
		this.extractTileset()
		if(this.tileset) {
			this.updateSize()
		}
	}

	updateSize() {}

	updateData(data) {
		this.data = data
		this.needUpdateMesh = true
	}

	extractTileset() {
		const num = this.numTilesX * this.numTilesY
		const tilesets = this.parent.tilesets

		let tileset = null
		for(let n = 0; n < num; n++) {
			let gid = this.data[n]
			if(gid === 0) { continue }
			gid &= ~ALL_FLAGS

			tileset = tilesets[0]
			for(let n = 1; n < tilesets.length; n++) {
				if(gid < tilesets[n].gid) {
					break
				}
				tileset = tilesets[n]
			}
			break
		}
		this.tileset = tileset
		if(tileset) {
			this.drawCommand.uniforms.albedo = this.tileset.instance
		}
		else {
			this.drawCommand.uniforms.albedo = null
			this.hidden = true
		}
	}

	setGid(x, y, gid) {
		const id = x + (y * this.numTilesX)
		this.data[id] = gid
		this.updateInfo(id)
	}

	getGid(x, y) {
		const id = x + (y * this.numTilesX)
		if(id < 0) {
			return 0
		}
		if(id >= this.data.length) {
			return 0
		}
		return this.data[id]
	}

	updateUniforms() {
		this.drawCommand.uniforms = Object.assign({
			color: this.color
		}, this.drawCommand.material.uniforms)	
	}	
}

export default TilemapLayer