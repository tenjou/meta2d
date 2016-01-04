"use strict";

meta.class("Entity.TilemapIsoLayer", "Entity.TilemapLayer",
{
	draw: function(ctx, minX, minY) 
	{
		if((this.parent.flags & this.Flag.LOADED) === 0) { return; }

		var cameraVolume = meta.camera.volume;
		var renderer = meta.renderer;

		var startTileX = 0;
		var endTileX = this.tilesX;
		var startTileY = 0;
		var endTileY = this.tilesY;

		var texture, posX, posY, x, y;
		var id = 0;

		if(this._dataFlags)
		{		
			for(var y = startTileY; y < this.tilesY; y++)
			{
				posX = (this.tilesX * this.tileHalfWidth) - (y * this.tileHalfWidth) - this.tileHalfWidth + minX;
				posY = (y * this.tileHalfHeight) + this.tileOffsetY + minY;

				for(var x = startTileX; x < endTileX; x++)
				{
					texture = this._dataInfo[id];
					if(texture) 
					{
						ctx.drawImage(texture.canvas, 
							texture.x, texture.y, texture.width, texture.height, 
							posX, posY + this.tileHeight - texture.height, texture.width, texture.height);
					}

					id++;
					posX += this.tileHalfWidth;
					posY += this.tileHalfHeight;
				}
			}	
		}
		else
		{
			for(var y = startTileY; y < this.tilesY; y++)
			{
				posX = (this.tilesX * this.tileHalfWidth) - (y * this.tileHalfWidth) - this.tileHalfWidth + minX;
				posY = (y * this.tileHalfHeight) + this.tileOffsetY + minY;

				for(var x = startTileX; x < this.tilesX; x++)
				{					
					texture = this._dataInfo[id];
					if(texture) 
					{
						ctx.drawImage(texture.canvas, 
							texture.x, texture.y, texture.width, texture.height, 
							posX, posY + this.tileHeight - texture.height, texture.width, texture.height);
					}

					if(this._cells)
					{
						var cell = this._cells[id];
						if(cell)
						{
							var num = cell.length;
							for(var n = 0; n < num; n ++) 
							{
								var entity = cell[n];
								if(!entity.texture) { continue; }

								renderer.drawEntity(entity);
							}
						}
					}					

					id++;
					posX += this.tileHalfWidth;
					posY += this.tileHalfHeight;
				}
			}
		}
	},

	_calcEntityCell: function(entity)
	{
		var adjScreenX = entity.x - (this.tilesX * this.tileHalfWidth);
		var adjScreenY = entity.y
		entity.cellX = Math.floor(((adjScreenY / this.tileHalfHeight) + (adjScreenX / this.tileHalfWidth)) / 2);
		entity.cellY = Math.floor(((adjScreenY / this.tileHalfHeight) - (adjScreenX / this.tileHalfWidth)) / 2);

		this._updateEntityCell(entity);
	},

	_calcEntityPos: function(entity)
	{
		var x = ((this.tilesX * this.tileHalfWidth) - (entity.cellY * this.tileHalfWidth) - this.tileHalfWidth) + 
			(entity.cellX * this.tileHalfWidth);
		var y = ((entity.cellY * this.tileHalfHeight) + this.tileOffsetY) +
			(entity.cellX * this.tileHalfHeight);

		entity._x = x + this.tileHalfWidth;
		entity._y = y + this.tileHalfHeight;
		entity.updatePos();
	},

	getPos: function(cellX, cellY)
	{
		var x = (this.tilesX * this.tileHalfWidth) - (cellY * this.tileHalfWidth) + 
			(cellX * this.tileHalfWidth);
		var y = (cellY * this.tileHalfHeight) + (cellX * this.tileHalfHeight) + 
			this.tileHalfHeight + this.tileOffsetY;

		return [ x, y ];
	},

	getWorldPos: function(cellX, cellY)
	{
		var x = (this.tilesX * this.tileHalfWidth) - (cellY * this.tileHalfWidth) + 
			(cellX * this.tileHalfWidth) + this.volume.minX;
		var y = (cellY * this.tileHalfHeight) + (cellX * this.tileHalfHeight) + 
			this.tileHalfHeight + this.tileOffsetY + this.volume.minY;

		return [ x, y ];
	},	

	getPosEx: function(cellPos)
	{
		cellPos.x = (this.tilesX * this.tileHalfWidth) - (cellPos.cellY * this.tileHalfWidth) + 
			(cellPos.cellX * this.tileHalfWidth);
		cellPos.y = (cellPos.cellY * this.tileHalfHeight) + (cellPos.cellX * this.tileHalfHeight) + 
			this.tileHalfHeight + this.tileOffsetY;
	},

	getWorldPosEx: function(cellPos)
	{
		cellPos.x = (this.tilesX * this.tileHalfWidth) - (cellPos.cellY * this.tileHalfWidth) + 
			(cellPos.cellX * this.tileHalfWidth) + this.volume.minX;
		cellPos.y = (cellPos.cellY * this.tileHalfHeight) + (cellPos.cellX * this.tileHalfHeight) + 
			this.tileHalfHeight + this.tileOffsetY + this.volume.minY;
	},	

	getPosX: function(cellX, cellY)
	{
		var x = (this.tilesX * this.tileHalfWidth) - (cellY * this.tileHalfWidth) + 
			(cellX * this.tileHalfWidth);
		
		return x;
	},

	getPosY: function(cellX, cellY)
	{
		var y = (cellY * this.tileHalfHeight) + (cellX * this.tileHalfHeight) + 
			this.tileOffsetY + this.tileOffsetY;

		return y;
	},

	getCellFromPos: function(posX, posY)
	{
		var adjScreenX = posX - (this.tilesX * this.tileHalfWidth) - this.offsetX;
		var adjScreenY = posY - this.offsetY;

		var cellX = Math.floor(((adjScreenY / this.tileHalfHeight) + (adjScreenX / this.tileHalfWidth)) / 2);
		var cellY = Math.floor(((adjScreenY / this.tileHalfHeight) - (adjScreenX / this.tileHalfWidth)) / 2);

		return [ cellX, cellY ];
	},

	getCellFromWorldPos: function(worldX, worldY) 
	{
		var adjScreenX = worldX - (this.tilesX * this.tileHalfWidth) - (this.volume.x + this.offsetX);
		var adjScreenY = worldY - (this.volume.y - this.offsetY);

		var gridX = Math.floor(((adjScreenY / this.tileHalfHeight) + (adjScreenX / this.tileHalfWidth)) / 2);
		var gridY = Math.floor(((adjScreenY / this.tileHalfHeight) - (adjScreenX / this.tileHalfWidth)) / 2);

		return [ gridX, gridY ];
	},

	getCellFromPosEx: function(cellPos)
	{
		var adjScreenX = cellPos.x - (this.tilesX * this.tileHalfWidth) - this.offsetX;
		var adjScreenY = cellPos.y - this.offsetY;

		cellPos.cellX = Math.floor(((adjScreenY / this.tileHalfHeight) + (adjScreenX / this.tileHalfWidth)) / 2);
		cellPos.cellY = Math.floor(((adjScreenY / this.tileHalfHeight) - (adjScreenX / this.tileHalfWidth)) / 2);
	},

	getCellFromWorldPosEx: function(cellPos)
	{
		var adjScreenX = cellPos.x - (this.tilesX * this.tileHalfWidth) - (this.volume.x + this.offsetX);
		var adjScreenY = cellPos.y - (this.volume.y - this.offsetY);

		cellPos.cellX = Math.floor(((adjScreenY / this.tileHalfHeight) + (adjScreenX / this.tileHalfWidth)) / 2);
		cellPos.cellY = Math.floor(((adjScreenY / this.tileHalfHeight) - (adjScreenX / this.tileHalfWidth)) / 2);
	}
});
