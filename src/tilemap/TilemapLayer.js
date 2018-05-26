import Engine from "../Engine"
import Renderable from "../entity/Renderable"
import Sprite from "../entity/Sprite"
import Material from "../resources/Material"
import Vector2 from "../math/Vector2"
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

const output = new Vector2(0, 0)

class TilemapLayer extends Renderable
{
	constructor() {
		super()
		this.name = "Layer"
		this.numTilesX = 0
		this.numTilesY = 0
		this.tileWidth = 0
		this.tileHeight = 0
		this.halfTileWidth = 0
		this.halfTileHeight = 0		
		this.offsetX = 0
		this.offsetY = 0
		this.tileset = null
		this.color = new Vector4(1, 1, 1, 1)
		this.data = null
		this.material = tilemapMaterial
		this._entityMode = false
	}

	create(numTilesX, numTilesY, tileWidth, tileHeight, data, name = "Layer") {
		this.name = name
		this.numTilesX = numTilesX
		this.numTilesY = numTilesY
		this.tileWidth = tileWidth
		this.tileHeight = tileHeight
		this.halfTileWidth = tileWidth * 0.5
		this.halfTileHeight = tileHeight * 0.5
		this.dataInfo = new Array(numTilesX * numTilesY)
		this.updateData(data)
		this.extractTileset()
		if(this.tileset) {
			this.updateSize()
		}

		const numTiles = numTilesX * numTilesY
		this.indices = new Uint16Array(numTiles * 6)
		let indiceIndex = 0
		let verticeOffset = 0
		for(let n = 0; n < numTiles; n++) {
			this.indices[indiceIndex++] = verticeOffset
			this.indices[indiceIndex++] = verticeOffset + 2
			this.indices[indiceIndex++] = verticeOffset + 1
			this.indices[indiceIndex++] = verticeOffset
			this.indices[indiceIndex++] = verticeOffset + 3
			this.indices[indiceIndex++] = verticeOffset + 2	
			verticeOffset += 4			
		}
		this.drawCommand.mesh.uploadIndices(this.indices)
	}

	updateSize() {}

	updateData(data) {
		this.data = data
		this.needUpdateMesh = true
	}

	updateMesh() {
		if(this._entityMode) {
			return
		}
		this.buffer = new Float32Array(this.numTilesX * this.numTilesY * 16)
		
		let index = 0
		let numElements = 0
		for(let y = 0; y < this.numTilesY; y++) {
			for(let x = 0; x < this.numTilesX; x++) {
				const id = x + (y * this.numTilesX)
				let gid = this.data[id] - this.tileset.gid
				if(gid > -1) {
					this.getWorldFromTile(x, y, output, false)
					const frame = this.tileset.getTileFrame(gid)
					const posX = output.x
					const posY = output.y
					this.buffer.set(frame, index)
					this.buffer[index + 0] += posX
					this.buffer[index + 1] += posY
					this.buffer[index + 4] += posX
					this.buffer[index + 5] += posY	
					this.buffer[index + 8] += posX
					this.buffer[index + 9] += posY	
					this.buffer[index + 12] += posX
					this.buffer[index + 13] += posY
					index += 16
					numElements++
				}
			}
		}

		this.drawCommand.mesh.upload(this.buffer)
		this.drawCommand.mesh.numElements = numElements * 6
		this.needUpdateMesh = false
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

	entityMode(flag) {
		this._entityMode = flag
		this.hidden = true
		this.createSprites()
	}

	createSprites() {
		for(let y = 0; y < this.numTilesY; y++) {
			for(let x = 0; x < this.numTilesX; x++) {
				const id = x + (y * this.numTilesX)
				let gid = this.data[id] - this.tileset.gid
				if(gid > -1) {
					this.createSprite(gid, x, y)
				}
			}
		}
	}

	createSprite(gid, x, y) {
		const output = TilemapLayer.output
		const sprite = new Sprite()
		sprite.frame = this.tileset.getFrame(gid & ~ALL_FLAGS)
		sprite.z = x + (y * this.numTilesX)
		this.addChild(sprite)
		this.getWorldFromTile(x, y)
		sprite.position.set(output.x, output.y)
		
		if(gid >= FLIPPED_DIAGONALLY_FLAG) {
			let scaleX = 1
			let scaleY = 1
			if(gid & FLIPPED_HORIZONTALLY_FLAG) {
				scaleX = -1
			}
			if(gid & FLIPPED_VERTICALLY_FLAG) {
				scaleY = -1
			}				
			sprite.scale.set(scaleX, scaleY)
			if(scaleX === -1) {
				sprite.position.x += this.tileWidth
			}
			if(scaleY === -1) {
				sprite.position.y += this.tileHeight
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

	getProperties(gid) {
		return this.tileset.getProperties(gid - this.tileset.gid)
	}

	updateUniforms() {
		this.drawCommand.uniforms = Object.assign({
			color: this.color
		}, this.drawCommand.material.uniforms)	
	}	
}

export default TilemapLayer