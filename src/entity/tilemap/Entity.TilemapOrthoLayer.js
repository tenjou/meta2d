"use strict";

meta.class("Entity.TilemapOrthoLayer", "Entity.TilemapLayer",
{
	gridFromPos: function(worldX, worldY) 
	{
		var gridX = Math.floor((worldX - this.volume.minX) / this.tileWidth);
		var gridY = Math.floor((worldY - this.volume.minY) / this.tileHeight);

		return [ gridX, gridY ];
	},

	draw: function(ctx) 
	{
		if((this.parent.flags & this.Flag.LOADED) === 0) { return; }

		var cameraVolume = meta.camera.volume;

		var startTileX = Math.floor((cameraVolume.minX - this.volume.minX) / this.tileWidth);
		var startTileY = Math.floor((cameraVolume.minY - this.volume.minY) / this.tileHeight);
		var endTileX = Math.ceil((cameraVolume.maxX - this.volume.minX) / this.tileWidth);
		var endTileY = Math.ceil((cameraVolume.maxY - this.volume.minY) / this.tileHeight);

		if(startTileX < 0) {
			startTileX = 0;
		}
		if(startTileY < 0) {
			startTileY = 0;
		}
		if(endTileX > this.tilesX) {
			endTileX = this.tilesX;
		}
		if(endTileY > this.tilesY) {
			endTileY = this.tilesY;
		}

		var minX = Math.floor((startTileX * this.tileWidth));
		var minY = Math.floor((startTileY * this.tileHeight));

		var id = 0, texture;
		var posX = minX | 0;
		var posY = minY | 0;

		if(this._dataFlags)
		{
			var flags = 0;

			for(var y = startTileY; y < endTileY; y++)
			{
				id = startTileX + (y * this.tilesX);

				for(var x = startTileX; x < endTileX; x++)
				{
					info = this._dataInfo[id];
					if(info) 
					{
						flags = this._dataFlags[id];
						if(flags) 
						{
							var flipX = 1.0;
							var flipY = 1.0;
							var offsetX = 0;
							var offsetY = 0;

							ctx.save();

							// FLIPPED_DIAGONALLY_FLAG 
							if(flags & 0x20000000) 
							{
								ctx.rotate(Math.PI / 2);

								// FLIPPED_HORIZONTALLY_FLAG & FLIPPED_VERTICALLY_FLAG 
								if(flags & 0x80000000 && flags & 0x40000000) {	
									flipX = -1.0;
									offsetX = this.tileWidth;
									offsetY = this.tileHeight;
								}
								// FLIPPED_VERTICALLY_FLAG 
								else if(flags & 0x80000000) {
									offsetY = this.tileWidth;
								}
								// FLIPPED_VERTICALLY_FLAG 
								else if(flags & 0x40000000) {
									flipX = -1.0;
									flipY = -1.0;
									offsetX = this.tileWidth;
								}
								else {
									flipY = -1;
								}
							}	
							else
							{
								// FLIPPED_HORIZONTALLY_FLAG
								if(flags & 0x80000000) {
									flipX = -1.0;
									offsetX = this.tileWidth;
								}

								// FLIPPED_VERTICALLY_FLAG 
								if(flags & 0x40000000) {
									flipY = -1.0;
									offsetY = this.tileHeight;
								}	
							}
							
							ctx.scale(flipX, flipY);

							ctx.drawImage(info.canvas, 
								info.posX, info.posY, this.tileWidth, this.tileHeight, 
								posX * flipX - offsetX, 
								posY * flipY - offsetY, 
								this.tileWidth, this.tileHeight);

							ctx.restore();
						}
						else
						{
							ctx.drawImage(info.canvas, 
								info.posX, info.posY, info.width, info.height, 
								posX, posY, info.width, info.height);
						}
					}

					id++;
					posX += this.tileWidth;
				}

				posX = minX | 0;
				posY += this.tileHeight;
			}
		}
		else
		{
			for(var y = startTileY; y < endTileY; y++)
			{
				id = startTileX + (y * this.tilesX);

				for(var x = startTileX; x < endTileX; x++)
				{
					texture = this._dataInfo[id];

					if(texture) 
					{
						ctx.drawImage(texture.canvas, 
							texture.x, texture.y, texture.width, texture.height, 
							posX, posY - texture.height + this.tileHeight, texture.width, texture.height);
					}

					if(this._cells)
					{
						var cell = this._cells[id];
						if(cell)
						{
							var num = cell.length;
							for(var n = 0; n < num; n ++) {
								var entity = cell[n];
								entity._texture.draw(ctx, entity.volume.x - entity.volume.pivotPosX, entity.volume.y - entity.volume.pivotPosY);
							}
						}

					}

					id++;
					posX += this.tileWidth;
				}

				posX = minX;
				posY += this.tileHeight;
			}
		}
	},

	_calcEntityCell: function(entity)
	{
		var cell, cellId;

		// calculate new cell coordinates:
		entity.cellX = Math.floor((entity.volume.x) / this.tileWidth);
		entity.cellY = Math.floor((entity.volume.y) / this.tileHeight);

		if(entity.cellX < 0 || entity.cellX >= this.tilesX) {
			cellId = this.numTiles + 1;
		}
		else
		{
			if(entity.cellY < 0 || entity.cellY >= this.tilesY) {
				cellId = this.numTiles + 1;
			}	
			else {
				cellId = entity.cellX + (entity.cellY * this.tilesX);
			}		
		}		

		if(entity._cellId !== cellId) 
		{
			if(entity._cellId !== -1)
			{
				cell = this._cells[entity._cellId];
				if(cell.length > 1)
				{
					var tmpEntity = cell.pop();
					tmpEntity._cellIndex = entity._cellIndex;
					cell[entity._cellIndex] = tmpEntity;
				}
				else {
					cell.length = 0;
				}
			}

			entity._cellId = cellId;

			cell = this._cells[entity._cellId];
			if(!cell) {
				cell = [ entity ];
				this._cells[entity._cellId] = cell;
				entity._cellIndex = 0;
			}
			else {
				entity._cellIndex = cell.length;
				cell.push(entity);
			}
		}
	},

	_calcEntityPos: function(entity)
	{
		var x = Math.floor(entity.cellX * this.tileWidth) + this.tileHalfWidth;
		var y = Math.floor(entity.cellY * this.tileHeight) + this.tileHalfHeight;
		entity._x = x;
		entity._y = y;
		entity.updatePos();
	}
});
