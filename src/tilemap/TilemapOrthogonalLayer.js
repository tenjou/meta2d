import Engine from "../Engine"
import TilemapLayer from "./TilemapLayer"

class TilemapOrthogonalLayer extends TilemapLayer
{
	constructor() {
		super()
	}

	updateSize() {
		this.startX = -this.tileset.offsetX
		this.startY = -this.tileset.offsetY		
		this.size.set(
			this.tileset.offsetX + (this.numTilesX * this.tileWidth), 
			this.tileset.offsetY + (this.numTilesY * this.tileHeight))
	}

	getWorldFromTile(tileX, tileY) {
		const output = TilemapLayer.output
		output[0] = this.startX + (tileX * this.tileWidth)
		output[1] = this.startY + (tileY * this.tileHeight)
		return output
	}

	getTileFromWorld(worldX, worldY) {
		const transform = this.transform	
		worldX += transform.m[6]
		worldY += transform.m[7] - this._size.y
		const x = Math.floor(worldX / this.tileWidth)
		const y = Math.floor(worldY / this.tileHeight) + this.numTilesY
		return [ x, y ]
	}
}

export default TilemapOrthogonalLayer