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
		this.dataInfo = null
		this.needUpdateInfo = true
		this.material = tilemapMaterial
	}

	create(numTilesX, numTilesY, tileWidth, tileHeight, data) {
		this.numTilesX = numTilesX
		this.numTilesY = numTilesY
		this.tileWidth = tileWidth
		this.tileHeight = tileHeight
		this.size.set(this.numTilesX * this.tileWidth, this.numTilesY * this.tileHeight)
		this.dataInfo = new Array(numTilesX * numTilesY)
		this.updateData(data)
	}

	updateData(data) {
		this.data = data
		this.needUpdateInfo = true
	}

	extractTileset() {
		const num = this.numTilesX * this.numTilesY
		const tilesets = this.parent.tilesets

		let tileset = null
		for(let n = 0; n < num; n++) {
			let gid = this.data[n]
			if(gid === 0) { continue }

			let flags = 0
			flags |= (gid & 0x20000000)
			flags |= (gid & 0x40000000)
			flags |= (gid & 0x80000000)
			gid &= 536870911		

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
		this.drawCommand.uniforms.albedo = this.tileset.texture.instance	
	}

	updateAllInfo() {
		const num = this.numTilesX * this.numTilesY
		this.extractTileset()
		for(let n = 0; n < num; n++) {
			this.updateInfo(n)
		}
		this.needUpdateInfo = false	
	}

	updateInfo(id) {
		let gid = this.data[id]
		if(gid === 0) {
			this.dataInfo[id] = null
		}
		else {
			let flags = 0
			flags |= (gid & 0x20000000)
			flags |= (gid & 0x40000000)
			flags |= (gid & 0x80000000)
			gid &= 536870911	
			
			const frameId = gid - this.tileset.gid
			if(frameId < 0) {
				this.dataInfo[id] = null
				console.trace(`Non-matching tileset used`)
			}
			else {
				const frame = this.tileset.frames[frameId]				
				this.dataInfo[id] = {
					gid, 
					frameId,
					frame,
					flags
				}
			}
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