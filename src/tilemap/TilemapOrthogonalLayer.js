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
		output.x = this.startX + (tileX * this.tileWidth)
		output.y = this.startY + (tileY * this.tileHeight)
		return output
	}

	getTileFromWorld(worldX, worldY) {
		const output = TilemapLayer.output
		const transform = this.transform	
		worldX += transform.m[6]
		worldY += transform.m[7] - this._size.y
		output.x = Math.floor(worldX / this.tileWidth)
		output.y = Math.floor(worldY / this.tileHeight) + this.numTilesY
		return output
	}
}

export default TilemapOrthogonalLayer