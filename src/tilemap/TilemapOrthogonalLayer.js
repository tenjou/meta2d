import Engine from "../Engine"
import TilemapLayer from "./TilemapLayer"

class TilemapOrthogonalLayer extends TilemapLayer
{
	constructor() {
		super()
	}

	updateSize() {
		this.size.set(
			this.tileset.offsetX + (this.numTilesX * this.tileWidth), 
			this.tileset.offsetY + (this.numTilesY * this.tileHeight))
	}

	updateMesh() {
		const numTiles = this.numTilesX * this.numTilesY
		const tileWidth = this.tileset.tileWidth
		const tileHeight = this.tileset.tileHeight
		const startX = -this.tileset.offsetX
		const startY = -this.tileset.offsetY
		this.buffer = new Float32Array(numTiles * 16)
		this.indices = new Uint16Array(numTiles * 6)
		
		let index = 0
		let indiceIndex = 0
		let verticeOffset = 0
		let posX = startX
		let posY = startY
		let numElements = 0
		for(let y = 0; y < this.numTilesY; y++) {
			for(let x = 0; x < this.numTilesX; x++) {
				const id = x + (y * this.numTilesX)
				let gid = this.data[id] - this.tileset.gid
				if(gid > -1) {
					const frame = this.tileset.getTileFrame(gid)
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
	
					this.indices[indiceIndex++] = verticeOffset
					this.indices[indiceIndex++] = verticeOffset + 2
					this.indices[indiceIndex++] = verticeOffset + 1
					this.indices[indiceIndex++] = verticeOffset
					this.indices[indiceIndex++] = verticeOffset + 3
					this.indices[indiceIndex++] = verticeOffset + 2	
					verticeOffset += 4
					numElements++
				}

				posX += this.tileWidth
			}
			posX = startX
			posY += this.tileHeight
		}

		this.drawCommand.mesh.upload(this.buffer)
		this.drawCommand.mesh.uploadIndices(this.indices)
		this.drawCommand.mesh.numElements = numElements * 6
		this.needUpdateMesh = false
	}

	getCellFromWorldPos(worldX, worldY) {
		const transform = this.transform	
		worldX += transform.m[6]
		worldY += transform.m[7] - this._size.y
		const x = Math.floor(worldX / this.tileWidth)
		const y = Math.floor(worldY / this.tileHeight) + this.numTilesY
		return [ x, y ]
	}
}

export default TilemapOrthogonalLayer