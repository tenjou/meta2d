import Engine from "../Engine"
import TilemapLayer from "./TilemapLayer"

class TilemapOrthographicLayer extends TilemapLayer
{
	constructor() {
		super()
	}

	draw() 
	{
		if(this.needUpdateInfo) {
			this.updateAllInfo()
		}

		const transform = this.worldTransform
		const cameraTransform = Engine.scene.camera.worldTransform
		const ctx = Engine.ctx
		const tilesets = this.parent.tilesets
		const texture = tilesets[0].texture
		const dx = -this.pivot.x * this._size.x
		const dy = -this.pivot.y * this._size.y	

		if(this.opacity !== 1) {
			ctx.globalAlpha = this.opacity
		}

		ctx.setTransform(transform.a, transform.b,
			transform.c, transform.d,
			transform.tx - cameraTransform.tx | 0, transform.ty - cameraTransform.ty | 0)

		let posX = 0
		let posY = 0
		for(let y = 0; y < this.numTilesY; y++) 
		{
			for(let x = 0; x < this.numTilesX; x++) 
			{
				const id = x + (y * this.numTilesY)
				const info = this.dataInfo[id]

				if(info) {
					const frame = info.frame
					ctx.drawImage(info.canvas, frame[0], frame[1], this.tileWidth, this.tileHeight, 
						posX + dx, posY + dy, this.tileWidth, this.tileHeight)
				}

				posX += this.tileWidth
			}
			posX = 0
			posY += this.tileHeight
		}

		if(this.opacity !== 1) {
			ctx.globalAlpha = 1
		}
	}

	getCellFromWorldPos(worldX, worldY) 
	{
		const transform = this.worldTransform
		const dx = -this.pivot.x * this._size.x
		const dy = -this.pivot.y * this._size.y			

		let x = Math.floor((worldX + transform.tx + dx) / this.tileWidth)
		let y = Math.floor((worldY + transform.ty + dy) / this.tileHeight)

		if(x < 0) { x = 0 }
		else if(x >= this.numTilesX) { x = this.numTilesX - 1 }

		if(y < 0) { y = 0 }
		else if(y >= this.numTilesY) { y = this.numTilesY - 1 }

		return [ x, y ]
	}
}

export default TilemapOrthographicLayer