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
		// this.size.set(
		// 	this.tileset.offsetX + halfTileWidth + (this.numTilesX * halfTileWidth) + ((this.numTilesY - 1) * halfTileWidth),
		// 	this.tileset.tileHeight + this.tileset.offsetY + (this.numTilesX * halfTileHeight) + ((this.numTilesY - 1) * halfTileHeight))
		this.size.set(
			this.tileset.offsetX + this.tileset.tileWidth + ((this.numTilesX - 1) * halfTileWidth) + (this.numTilesY - 1) * halfTileWidth,
			this.tileset.offsetY + this.tileset.tileHeight + ((this.numTilesX - 1) * halfTileHeight) + (this.numTilesY - 1) * halfTileHeight)
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
		const startX = this.tileset.offsetX + halfTileWidth * (this.numTilesY - 1)
		const startY = this.tileset.offsetY
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
					const frame = this.tileset.getFrame(gid)
					const flip = frame[4]
					
					if(flip === 0) {
						this.buffer[index++] = posX + tileWidth
						this.buffer[index++] = posY + tileHeight
						this.buffer[index++] = frame[2]
						this.buffer[index++] = frame[3]
		
						this.buffer[index++] = posX
						this.buffer[index++] = posY + tileHeight
						this.buffer[index++] = frame[0]
						this.buffer[index++] = frame[3]
		
						this.buffer[index++] = posX
						this.buffer[index++] = posY
						this.buffer[index++] = frame[0]
						this.buffer[index++] = frame[1]
		
						this.buffer[index++] = posX + tileWidth
						this.buffer[index++] = posY
						this.buffer[index++] = frame[2]
						this.buffer[index++] = frame[1]
					}
					else {
						this.buffer[index++] = posX + tileWidth
						this.buffer[index++] = posY + tileHeight
						this.buffer[index++] = frame[0]
						this.buffer[index++] = frame[1]
		
						this.buffer[index++] = posX
						this.buffer[index++] = posY + tileWidth
						this.buffer[index++] = frame[0]
						this.buffer[index++] = frame[3]
		
						this.buffer[index++] = posX
						this.buffer[index++] = posY
						this.buffer[index++] = frame[2]
						this.buffer[index++] = frame[3]
		
						this.buffer[index++] = posX + tileHeight
						this.buffer[index++] = posY
						this.buffer[index++] = frame[2]
						this.buffer[index++] = frame[1]						
					}
	
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
		const halfWidth = this.tileWidth * 0.5
		const halfHeight = this.tileHeight * 0.5
		const transform = this.transform
		worldX -= transform.m[6] + (halfWidth * this.numTilesY)
		worldY -= transform.m[7] + halfHeight
		const x = Math.floor((worldX / halfWidth + worldY / halfHeight) / 2)
		const y = Math.floor((worldY / halfHeight -(worldX / halfWidth)) / 2)
		return [ x, y ]
	}
}

export default TilemapIsometricLayer