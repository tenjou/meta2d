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
		this.startX = halfTileWidth * (this.numTilesY - 1)
		this.startY = 0
		this.size.set(
			this.tileset.tileWidth + ((this.numTilesX - 1) * halfTileWidth) + (this.numTilesY - 1) * halfTileWidth,
			this.tileset.tileHeight + ((this.numTilesX - 1) * halfTileHeight) + (this.numTilesY - 1) * halfTileHeight)
	}

	getWorldFromTile(x, y) {
		const output = TilemapLayer.output
		output[0] = this.startX + ((this.tileWidth * 0.5) * x) - ((this.tileWidth * 0.5) * y) 
		output[1] = this.startY + ((this.tileHeight * 0.5) * x) + ((this.tileHeight * 0.5) * y)
		return output
	}	

	getTileFromWorld(worldX, worldY) {	
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
