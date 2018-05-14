import Engine from "../Engine"
import TilemapLayer from "./TilemapLayer"

class TilemapIsometricLayer extends TilemapLayer
{
	constructor() {
		super()
	}

	updateMesh() {
		if(this.needUpdateInfo) {
			this.updateAllInfo()
		}

		const numTiles = this.numTilesX * this.numTilesY
		this.buffer = new Float32Array(numTiles * 16)
		this.indices = new Uint16Array(numTiles * 6)
		
		let index = 0
		let indiceIndex = 0
		let verticeOffset = 0
		let posX = 0
		let posY = 0
		let numElements = 0
		for(let y = 0; y < 1; y++) {
			for(let x = 0; x < this.numTilesX; x++) {
				const id = x + (y * this.numTilesY)
				const info = this.dataInfo[id]
				if(info) {
					const frame = info.frame
					const uvOffsetX = 1.0 / info.texture.width
					const uvOffsetY = 1.0 / info.texture.height
					
					this.buffer[index++] = posX + this.tileWidth
					this.buffer[index++] = posY + 64
					this.buffer[index++] = uvOffsetX * 64
					this.buffer[index++] = uvOffsetY * 64
	
					this.buffer[index++] = 0
					this.buffer[index++] = 64
					this.buffer[index++] = 0
					this.buffer[index++] = uvOffsetY * 64
	
					this.buffer[index++] = 0
					this.buffer[index++] = 0
					this.buffer[index++] = 0
					this.buffer[index++] = 0
	
					this.buffer[index++] = 64
					this.buffer[index++] = 0
					this.buffer[index++] = uvOffsetX * 64
					this.buffer[index++] = 0
	
					this.indices[indiceIndex++] = verticeOffset
					this.indices[indiceIndex++] = verticeOffset + 2
					this.indices[indiceIndex++] = verticeOffset + 1
					this.indices[indiceIndex++] = verticeOffset
					this.indices[indiceIndex++] = verticeOffset + 3
					this.indices[indiceIndex++] = verticeOffset + 2	
					verticeOffset += 4
					numElements++
					break
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
		const dx = -this._pivot.x * this._size.x
		const dy = -this._pivot.y * this._size.y			
		let x = Math.floor((worldX + this._position.x + dx) / this.tileWidth)
		let y = Math.floor((worldY + this._position.y + dy) / this.tileHeight)

		if(x < 0) { x = 0 }
		else if(x >= this.numTilesX) { x = this.numTilesX - 1 }

		if(y < 0) { y = 0 }
		else if(y >= this.numTilesY) { y = this.numTilesY - 1 }

		return [ x, y ]
	}
}

export default TilemapIsometricLayer