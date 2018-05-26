import Engine from "../Engine"
import TilemapLayer from "./TilemapLayer"

class TilemapIsometricLayer extends TilemapLayer
{
	constructor() {
		super()
	}

	updateSize() {
		this.startX = this.halfTileWidth * (this.numTilesY - 1)
		this.startY = 0
		this.size.set(
			this.tileset.tileWidth + ((this.numTilesX - 1) * this.halfTileWidth) + (this.numTilesY - 1) * this.halfTileWidth,
			this.tileset.tileHeight + ((this.numTilesX - 1) * this.halfTileHeight) + (this.numTilesY - 1) * this.halfTileHeight)
	}

	getWorldFromTile(x, y, output, tileCenter = true) {
		if(tileCenter) {
			output.x = this.startX + (this.halfTileWidth * x) - (this.halfTileWidth * y) + this.halfTileWidth
			output.y = this.startY + this.halfTileHeight + (this.halfTileHeight * y) + this.halfTileHeight
		}
		else {
			output.x = this.startX + (this.halfTileWidth * x) - (this.halfTileWidth * y) 
			output.y = this.startY + (this.halfTileHeight * x) + (this.halfTileHeight * y)
		}
	}	

	getTileFromWorld(worldX, worldY, output) {	
		const transform = this.transform
		worldX -= transform.m[6] + ((this.numTilesX - 1) * this.halfTileWidth) - this.tileset.offsetX
		worldY -= transform.m[7] + this._size.y - this.halfTileHeight - this.tileset.offsetY
		output.x = Math.floor((worldX / this.halfTileWidth + (worldY / this.halfTileHeight)) / 2) + this.numTilesX - 1
		output.y = Math.floor((worldY / this.halfTileHeight - (worldX / this.halfTileWidth)) / 2) + this.numTilesY
	}
}

export default TilemapIsometricLayer
