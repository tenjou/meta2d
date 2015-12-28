"use strict";

"use strict";

meta.class("Entity.TilemapHexLayer", "Entity.TilemapLayer",
{
	draw: function(ctx) 
	{
		if((this.parent.flags & this.Flag.LOADED) === 0) { return; }
		if(this.layerFlags & this.LayerFlag.CONVERTED_TO_ENTITIES) { return; }

		var cameraVolume = meta.camera.volume;

		var startTileX = 0;
		var endTileX = this.tilesX;
		var startTileY = 0;
		var endTileY = this.tilesY;

		// var minX = Math.floor(this.volume.minX + (startTileX * this.tileWidth));
		// var minY = Math.floor(this.volume.minY + (startTileY * this.tileHeight));
		var minX = 0;
		var minY = this.offsetY;

		var id = 0, info;
		var posX = minX | 0;
		var posY = minY | 0;

		var halfWidth = this.tileWidth * 0.5;
		var halfHeight = this.tileHeight * 0.5;

		startTileX = 0;
		startTileY = 0;
		endTileX = this.tilesX;
		endTileY = this.tilesY;

		//this.tilesY = 2;

		// var centerX = this.tilesX * halfWidth;
		// var centerY = this.tilesY * halfHeight;
		// var startPosX = cameraVolume.minX - centerX;
		// var startPosY = cameraVolume.minY - centerY;
		// var endPosX = cameraVolume.maxX - centerX + halfWidth;
		// var endPosY = cameraVolume.maxY - centerY + halfHeight;
		
		// var minTileX = Math.floor(startPosX / halfWidth);
		// var minTileY = Math.floor(startPosY / halfHeight);
		// var maxTileX = Math.ceil(endPosX / halfWidth);
		// var maxTileY = Math.ceil(endPosY / halfHeight);
		// console.log(minTileX, minTileY, maxTileX, maxTileY);

		// if(minTileX < 0) {

		// }

		if(this._dataFlags)
		{		
			for(var y = startTileY; y < this.tilesY; y++)
			{
				posX = -(y * halfWidth) + ((this.tilesX - 1) * halfWidth) + minX;
				posY = (y * halfHeight) - halfHeight + minY;		
				// posX = -(y * halfWidth);
				// posY = y * halfHeight;

				for(var x = startTileX; x < endTileX; x++)
				{
					info = this._dataInfo[id++];
					if(info) 
					{
						ctx.drawImage(info.canvas, 
							info.posX, info.posY, info.width, info.height, 
							posX, posY, info.width, info.height);
					}

					posX += halfWidth;
					posY += halfHeight;
				}
			}	
		}
		else
		{
			var texture;

			for(var y = startTileY; y < this.tilesY; y++)
			{
				posX = (this.tilesX * halfWidth) - (y * halfWidth) - halfWidth;
				posY = (y * halfHeight) + this.tileOffsetY;

				for(var x = startTileX; x < this.tilesX; x++)
				{
					// console.log(posX, posY);
					// console.log("here:",this.getPosX(0, 0), this.getPosY(0, 0))
					// return;
					
					texture = this._dataInfo[id++];
					if(texture) 
					{
						ctx.drawImage(texture.canvas, 
							texture.x, texture.y, texture.width, texture.height, 
							posX, posY - texture.width + this.tileHeight, texture.width, texture.height);
					}

					posX += halfWidth;
					posY += halfHeight;
				}
			}			
		}


	},

	getPos: function(cellX, cellY)
	{
		var x = ((this.tilesX * this.tileHalfWidth) - (cellY * this.tileHalfWidth) - this.tileHalfWidth) + 
			(cellX * this.tileHalfWidth);
		var y = y = ((cellY * this.tileHalfHeight) + this.tileOffsetY) +
			(cellX * this.tileHalfHeight);

		return [ x, y ];
	},

	getWorldPos: function(cellX, cellY)
	{
		var x = ((this.tilesX * this.tileHalfWidth) - (cellY * this.tileHalfWidth) - this.tileHalfWidth) + 
			(cellX * this.tileHalfWidth) + this.volume.minX;
		var y = y = ((cellY * this.tileHalfHeight) + this.tileOffsetY) +
			(cellX * this.tileHalfHeight) + this.volume.minY;

		return [ x, y ];
	},	

	getPosEx: function(cellPos)
	{
		cellPos.x = ((this.tilesX * this.tileHalfWidth) - (cellPos.cellY * this.tileHalfWidth) - this.tileHalfWidth) + 
			(cellPos.cellX * this.tileHalfWidth);
		cellPos.y = y = ((cellPos.cellY * this.tileHalfHeight) + this.tileOffsetY) +
			(cellPos.cellX * this.tileHalfHeight);
	},

	getWorldPosEx: function(cellPos)
	{
		cellPos.x = ((this.tilesX * this.tileHalfWidth) - (cellPos.cellY * this.tileHalfWidth) - this.tileHalfWidth) + 
			(cellPos.cellX * this.tileHalfWidth) + this.volume.minX;
		cellPos.y = y = ((cellPos.cellY * this.tileHalfHeight) + this.tileOffsetY) +
			(cellPos.cellX * this.tileHalfHeight) + this.volume.minY;
	},	

	getPosX: function(cellX, cellY)
	{
		var x = ((this.tilesX * this.tileHalfWidth) - (cellY * this.tileHalfWidth) - this.tileHalfWidth) + 
			(cellX * this.tileHalfWidth);
		
		return x;
	},

	getPosY: function(cellX, cellY)
	{
		var y = ((cellY * this.tileHalfHeight) + this.tileOffsetY) +
			(cellX * this.tileHalfHeight);

		return y;
	},

	getGridFromWorldPos: function(worldX, worldY) 
	{
		var adjScreenX = worldX - (this.tilesX * this.tileHalfWidth) - (this.volume.x + this.offsetX);
		var adjScreenY = worldY - (this.volume.y - this.offsetY);

		var gridX = Math.floor(((adjScreenY / this.tileHalfHeight) + (adjScreenX / this.tileHalfWidth)) / 2);
		var gridY = Math.floor(((adjScreenY / this.tileHalfHeight) - (adjScreenX / this.tileHalfWidth)) / 2);

		return [ gridX, gridY ];
	},	
});
