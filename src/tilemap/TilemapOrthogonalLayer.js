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
		this.buffer = new Float32Array(numTiles * 16)
		this.indices = new Uint16Array(numTiles * 6)
		
		let index = 0
		let indiceIndex = 0
		let verticeOffset = 0
		let posX = this.tileset.offsetX
		let posY = this.tileset.offsetY
		let numElements = 0
		for(let y = 0; y < this.numTilesY; y++) {
			for(let x = 0; x < this.numTilesX; x++) {
				const id = x + (y * this.numTilesX)
				let gid = this.data[id] - this.tileset.gid
				if(gid > -1) {
					const frame = this.tileset.getFrame(gid)
					const flip = frame[4]
					
					if(flip === 0) {
						this.buffer[index++] = posX + tileWidth
						this.buffer[index++] = posY + tileHeight
						this.buffer[index++] = frame[2]
						this.buffer[index++] = frame[3]
		
						this.buffer[index++] = posX
						this.buffer[index++] = posY + tileWidth
						this.buffer[index++] = frame[0]
						this.buffer[index++] = frame[3]
		
						this.buffer[index++] = posX
						this.buffer[index++] = posY
						this.buffer[index++] = frame[0]
						this.buffer[index++] = frame[1]
		
						this.buffer[index++] = posX + tileHeight
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

				posX += this.tileWidth
			}
			posX = 0
			posY += this.tileHeight
		}

		this.drawCommand.mesh.upload(this.buffer)
		this.drawCommand.mesh.uploadIndices(this.indices)
		this.drawCommand.mesh.numElements = numElements * 6
		this.needUpdateMesh = false
	}

	getCellFromWorldPos(worldX, worldY) {
		const transform = this.transform	
		worldX += this.tileset.offsetX - transform.m[6]
		worldY += this.tileset.offsetY - transform.m[7]
		const x = Math.floor(worldX / this.tileWidth)
		const y = Math.floor(worldY / this.tileHeight)
		return [ x, y ]
	}
}

export default TilemapOrthogonalLayer