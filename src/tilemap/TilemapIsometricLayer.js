import Engine from "../Engine"
import TilemapLayer from "./TilemapLayer"

class TilemapIsometricLayer extends TilemapLayer
{
	constructor() {
		super()
	}

	updateSize() {
		const halfTileWidth = this.tileWidth * 0.5
		const halfTileHeight = this.tileHeight * 0.5
		this.size.set(
			this.tileset.tileWidth + ((this.numTilesX - 1) * halfTileWidth) + (this.numTilesY - 1) * halfTileWidth,
			this.tileset.tileHeight + ((this.numTilesX - 1) * halfTileHeight) + (this.numTilesY - 1) * halfTileHeight)
	}

	updateMesh() {
		if(!this.tileset) {
			return
		}
		const numTiles = this.numTilesX * this.numTilesY
		const tileWidth = this.tileset.tileWidth
		const tileHeight = this.tileset.tileHeight
		const halfTileWidth = this.tileWidth * 0.5
		const halfTileHeight = this.tileHeight * 0.5
		const startX = halfTileWidth * (this.numTilesY - 1)
		const startY = 0
		this.buffer = new Float32Array(numTiles * 16)
		this.indices = new Uint16Array(numTiles * 6)
		
		let index = 0
		let indiceIndex = 0
		let verticeOffset = 0
		let numElements = 0
		let posX = startX
		let posY = startY
		for(let x = 0; x < this.numTilesX; x++) {
			for(let y = 0; y < this.numTilesY; y++) {
				const id = x + (y * this.numTilesX)
				const gid = this.data[id] - this.tileset.gid
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

				posX -= halfTileWidth
				posY += halfTileHeight
			}
			posX = startX + (halfTileWidth * (x + 1))
			posY = startY + (halfTileHeight * (x + 1))
		}

		this.drawCommand.mesh.upload(this.buffer)
		this.drawCommand.mesh.uploadIndices(this.indices)
		this.drawCommand.mesh.numElements = numElements * 6
		this.needUpdateMesh = false
	}

	getCellFromWorldPos(worldX, worldY) {	
		const halfTileWidth = this.tileWidth * 0.5
		const halfTileHeight = this.tileHeight * 0.5
		const transform = this.transform
		worldX -= transform.m[6] + ((this.numTilesX - 1) * halfTileWidth) - this.tileset.offsetX
		worldY -= transform.m[7] + this._size.y - halfTileHeight - this.tileset.offsetY
		const x = Math.floor((worldX / halfTileWidth + (worldY / halfTileHeight)) / 2) + this.numTilesX - 1
		const y = Math.floor((worldY / halfTileHeight - (worldX / halfTileWidth)) / 2) + this.numTilesY
		return [ x, y ]
	}
}

export default TilemapIsometricLayer