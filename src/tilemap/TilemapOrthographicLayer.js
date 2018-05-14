import Engine from "../Engine"
import TilemapLayer from "./TilemapLayer"

class TilemapOrthographicLayer extends TilemapLayer
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
		for(let y = 0; y < this.numTilesY; y++) {
			for(let x = 0; x < this.numTilesX; x++) {
				const id = x + (y * this.numTilesY)
				const info = this.dataInfo[id]
				if(info) {
					const frame = info.frame
					
					this.buffer[index++] = posX + this.tileWidth
					this.buffer[index++] = posY + this.tileHeight
					this.buffer[index++] = frame[2]
					this.buffer[index++] = frame[3]
	
					this.buffer[index++] = posX
					this.buffer[index++] = posY + this.tileWidth
					this.buffer[index++] = frame[0]
					this.buffer[index++] = frame[3]
	
					this.buffer[index++] = posX
					this.buffer[index++] = posY
					this.buffer[index++] = frame[0]
					this.buffer[index++] = frame[1]
	
					this.buffer[index++] = posX + this.tileHeight
					this.buffer[index++] = posY
					this.buffer[index++] = frame[2]
					this.buffer[index++] = frame[1]
	
					this.indices[indiceIndex++] = verticeOffset
					this.indices[indiceIndex++] = verticeOffset + 2
					this.indices[indiceIndex++] = verticeOffset + 1
					this.indices[indiceIndex++] = verticeOffset
					this.indices[indiceIndex++] = verticeOffset + 3
					this.indices[indiceIndex++] = verticeOffset + 2	
					verticeOffset += 4
				}

				posX += this.tileWidth
			}
			posX = 0
			posY += this.tileHeight
		}

		this.drawCommand.mesh.upload(this.buffer)
		this.drawCommand.mesh.uploadIndices(this.indices)
		this.needUpdateMesh = false


		// const transform = this.worldTransform
		// const cameraTransform = Engine.scene.camera.worldTransform
		// const ctx = Engine.ctx
		// const tilesets = this.parent.tilesets
		// const texture = tilesets[0].texture
		// const dx = -this.pivot.x * this._size.x
		// const dy = -this.pivot.y * this._size.y	

		// if(this.opacity !== 1) {
		// 	ctx.globalAlpha = this.opacity
		// }

		// ctx.setTransform(transform.a, transform.b,
		// 	transform.c, transform.d,
		// 	transform.tx - cameraTransform.tx | 0, transform.ty - cameraTransform.ty | 0)

		// let posX = 0
		// let posY = 0
		// for(let y = 0; y < this.numTilesY; y++) 
		// {
		// 	for(let x = 0; x < this.numTilesX; x++) 
		// 	{
				// const id = x + (y * this.numTilesY)
				// const info = this.dataInfo[id]

		// 		if(info) {
		// 			const frame = info.frame
		// 			ctx.drawImage(info.canvas, frame[0], frame[1], this.tileWidth, this.tileHeight, 
		// 				posX + dx, posY + dy, this.tileWidth, this.tileHeight)
		// 		}

		// 		posX += this.tileWidth
		// 	}
		// 	posX = 0
		// 	posY += this.tileHeight
		// }

		// if(this.opacity !== 1) {
		// 	ctx.globalAlpha = 1
		// }
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

export default TilemapOrthographicLayer