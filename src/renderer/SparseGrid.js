"use strict";

meta.SparseGrid = function()
{
	this.cells = [];
	this.cellWidth = meta.flags.cullingWidth || 256;
	this.cellHeight = meta.flags.cullingHeight || 256;

	this.startX = 0;
	this.startY = 0;
	this.endX = 0;
	this.endY = 0;
	this.newMinX = 0;
	this.newMinY = 0;
	this.newMaxX = 0;
	this.newMaxY = 0;
};

meta.SparseGrid.prototype =
{
	calc: function()
	{
		var cameraVolume = meta.camera.volume;
		var startX = Math.floor(cameraVolume.minX / this.cellWidth);
		var startY = Math.floor(cameraVolume.minY / this.cellHeight);
		var endX = Math.floor(cameraVolume.maxX / this.cellWidth);
		var endY = Math.floor(cameraVolume.maxY / this.cellHeight);

		if(startX === this.startX && startY === this.startY && 
		   endX === this.endX && endY === this.endY)
		{
			return;
		}

		var uid, cell, x, y;	

		// is previous visible region not overlapping with the new one?
		if(startX > this.endX || endX < this.startX || startY > this.endY || endY < this.startY)
		{
			// make previous cells invisible:
			for(y = this.startY; y <= this.endY; y++) 
			{
				for(x = this.startX; x <= this.endX; x++) 
				{
					uid = (x << 16) | (y & 0xffff);
					cell = this.cells[uid];
					if(!cell) { continue; }

					cell.visible = 0;
					this.makeInvisible(cell.data);
				}
			}

			// make new cells visible:
			for(y = startY; y <= endY; y++) 
			{
				for(x = startX; x <= endX; x++) 
				{
					uid = (x << 16) | (y & 0xffff);
					cell = this.cells[uid];
					if(!cell) { continue; }

					cell.visible = 1;
					this.makeVisible(cell.data);
				}
			}			
		}
		else
		{
			var minX = (startX < this.startX) ? startX : this.startX;
			var minY = (startY < this.startY) ? startY : this.startY;
			var maxX = (endX > this.endX) ? endX : this.endX;
			var maxY = (endY > this.endY) ? endY : this.endY;

			for(var y = minY; y <= maxY; y++)
			{
				for(var x = minX; x <= maxX; x++)
				{
					// is visible?
					if(x >= startX && x <= endX && y >= startY && y <= endY) 
					{
						// is this previously not seen cell?
						if(x < this.startX || x > this.endX || y < this.startY || y > this.endY) 
						{
							uid = (x << 16) | (y & 0xffff);
							cell = this.cells[uid];
							if(!cell) { continue; }

							cell.visible = 1;
							this.makeVisible(cell.data);
						}
					}
					else 
					{
						uid = (x << 16) | (y & 0xffff);
						cell = this.cells[uid];
						if(!cell) { continue; }

						if(cell.visible) {
							cell.visible = 0;
							this.makeInvisible(cell.data);
						}
					}
				}
			}
		}

		this.startX = startX;
		this.startY = startY;
		this.endX = endX;
		this.endY = endY;
	},

	makeVisible: function(entities)
	{
		var renderer = meta.renderer;

		var entity;
		var num = entities.length;
		for(var n = 0; n < num; n++)
		{
			entity = entities[n];

			if(entity.node.numVisible === 0) {
				renderer.makeEntityVisible(entity);
			}

			entity.node.numVisible++;
		}
	},

	makeInvisible: function(entities)
	{
		var renderer = meta.renderer;

		var entity;
		var num = entities.length;
		for(var n = 0; n < num; n++)
		{
			entity = entities[n];

			entity.node.numVisible--;

			if(entity.node.numVisible === 0) {
				renderer.makeEntityInvisible(entity);
			}
		}
	},

	add: function(entity)
	{
		var node = entity.node;
		var volume = entity.volume;

		this.calcBounds(volume);

		var cell, uid;
		for(var y = this.newMinY; y <= this.newMaxY; y++)
		{
			for(var x = this.newMinX; x <= this.newMaxX; x++)
			{
				uid = (x << 16) | (y & 0xffff);
				cell = this.cells[uid];

				if(!cell) 
				{
					cell = new this.Cell();
					cell.data.push(entity);
					this.cells[uid] = cell;

					if(x >= this.startX && x <= this.endX && y >= this.startY && y <= this.endY) {
						cell.visible = 1;
						node.numVisible++;
					}
				}
				else 
				{
					cell.data.push(entity);

					if(cell.visible) {
						node.numVisible++;
					}
				}
			}
		}

		node.minX = this.newMinX;
		node.minY = this.newMinY;
		node.maxX = this.newMaxX;
		node.maxY = this.newMaxY;

		if(node.numVisible > 0) {
			meta.renderer.makeEntityVisible(entity);
		}
	},

	remove: function(entity)
	{
		var volume = entity.volume;
		var node = entity.node;

		var data, uid, n, num;
		for(var y = node.minY; y < node.maxY; y++)
		{
			for(var x = node.minX; x < node.maxX; x++)
			{
				uid = (x << 16) | (y & 0xffff);
				data = this.cells[uid].data;
				num = data.length;

				for(n = 0; n < num; n++) 
				{
					if(data[n] === entity) {
						data[n] = data[num - 1];
						data.pop();
						break;
					}
				}
			}
		}

		node.minX = 0;
		node.minY = 0;
		node.maxX = 0;
		node.maxY = 0;

		if(entity.node.numVisible > 0) {
			entity.node.numVisible = 0;
			meta.renderer.makeEntityInvisible(entity);
		}
	},

	update: function(entity)
	{
		if((entity.flags & entity.Flag.ACTIVE) === 0) { return; }

		var node = entity.node;
		var volume = entity.volume;

		this.calcBounds(volume);

		if(node.minX === this.newMinX && node.minY === this.newMinY && 
		   node.maxX === this.newMaxX && node.maxY === this.newMaxY) 
		{
			return;
		}

		var cell, data, uid, index, y, x;
		var prevNumVisible = node.numVisible;

		if(node.minX > this.newMaxX || node.maxX < this.newMinX || node.minY > this.newMaxY || node.maxY < this.newMinY)
		{
			// remove from cells:
			for(y = node.minY; y <= node.maxY; y++)
			{
				for(x = node.minX; x <= node.maxX; x++)
				{
					uid = (x << 16) | (y & 0xffff);
					data = this.cells[uid].data;
					index = data.indexOf(entity);
					data[index] = data[data.length - 1];
					data.pop();
				}
			}

			node.numVisible = 0;

			// add to new cells:
			for(y = this.newMinY; y <= this.newMaxY; y++)
			{
				for(x = this.newMinX; x <= this.newMaxX; x++)
				{
					uid = (x << 16) | (y & 0xffff);
					cell = this.cells[uid];

					if(!cell) 
					{
						cell = new this.Cell();
						cell.data.push(entity);
						this.cells[uid] = cell;

						if(x >= this.startX && x <= this.endX && y >= this.startY && y <= this.endY) {
							cell.visible = 1;
							node.numVisible++;
						}
					}
					else 
					{
						cell.data.push(entity);

						if(cell.visible) {
							node.numVisible++;
						}
					}
				}
			}
		}
		else 
		{
			var minX = (this.newMinX < node.minX) ? this.newMinX : node.minX;
			var minY = (this.newMinY < node.minY) ? this.newMinY : node.minY;
			var maxX = (this.newMaxX > node.maxX) ? this.newMaxX : node.maxX;
			var maxY = (this.newMaxY > node.maxY) ? this.newMaxY : node.maxY;

			for(y = minY; y <= maxY; y++)
			{
				for(x = minX; x <= maxX; x++)
				{
					// if cell was already handled previously:
					if(x >= node.minX && x <= node.maxX && y >= node.minY && y <= node.maxY) 
					{
						// remove from cell?
						if(x > this.newMaxX || x < this.newMinX || y > this.newMaxY || y < this.newMinY) 
						{
							uid = (x << 16) | (y & 0xffff);
							cell = this.cells[uid];
							data = cell.data;
							index = data.indexOf(entity);
							data[index] = data[data.length - 1];
							data.pop();

							if(x >= this.startX && x <= this.endX && y >= this.startY && y <= this.endY) {
								cell.visible = 1;
								node.numVisible--;
							}
						}
					}
					else
					{
						uid = (x << 16) | (y & 0xffff);
						cell = this.cells[uid];

						if(!cell) 
						{
							cell = new this.Cell();
							cell.data.push(entity);
							this.cells[uid] = cell;

							if(x >= this.startX && x <= this.endX && y >= this.startY && y <= this.endY) {
								cell.visible = 1;
								node.numVisible++;
							}
						}
						else 
						{
							cell.data.push(entity);

							if(cell.visible) {
								node.numVisible++;
							}
						}
					}
				}
			}
		}

		if(node.numVisible === 0)
		{
			if(prevNumVisible > 0) {
				meta.renderer.makeEntityInvisible(entity);
			}
		}
		else 
		{
			if(prevNumVisible === 0) {
				meta.renderer.makeEntityVisible(entity);
			}		
		}

		node.minX = this.newMinX;
		node.minY = this.newMinY;
		node.maxX = this.newMaxX;
		node.maxY = this.newMaxY;			
	},

	calcBounds: function(volume)
	{
		if(volume.angle !== 0)
		{	
			var sin = volume.sin;
			var cos = volume.cos;
			var px = volume.x + (-volume.pivotPosX * cos) - (-volume.pivotPosY * sin);
			var py = volume.y + (-volume.pivotPosX * sin) + (-volume.pivotPosY * cos);
			var widthCos = volume.width * cos;
			var heightCos = volume.height * cos;
			var widthSin = volume.width * sin;
			var heightSin = volume.height * sin;

			var minX, minY, maxX, maxY;
			if(volume.angle < Math.PI)
			{
				// < 90
				if(volume.angle < 1.5707963267948966)
				{
					minX = px - heightSin;
					maxX = px + widthCos;				
					minY = py;
					maxY = py + heightCos + widthSin;
				}
				// < 180
				else
				{
					minX = px - heightSin + widthCos;
					maxX = px;				
					minY = py + heightCos;
					maxY = py + widthSin;
				}
			}
			else
			{
				// < 270
				if(volume.angle < 4.71238898038469)
				{
					minX = px + widthCos;
					maxX = px - heightSin;				
					minY = py + widthSin + heightCos;
					maxY = py;				
				}
				// < 360
				else
				{
					minX = px;
					maxX = px + widthCos - heightSin;				
					minY = py + widthSin;
					maxY = py + heightCos;
				}
			}	

			this.newMinX = Math.floor(minX / this.cellWidth);
			this.newMinY = Math.floor(minY / this.cellHeight);
			this.newMaxX = Math.floor(maxX / this.cellWidth);
			this.newMaxY = Math.floor(maxY / this.cellHeight);
		}
		else
		{
			this.newMinX = Math.floor(volume.minX / this.cellWidth);
			this.newMinY = Math.floor(volume.minY / this.cellHeight);
			this.newMaxX = Math.floor(volume.maxX / this.cellWidth);
			this.newMaxY = Math.floor(volume.maxY / this.cellHeight);			
		}
	},

	drawDebug: function(ctx)
	{
		if(!this.debug) { return; }
		
		ctx.save();
		ctx.lineWidth = 1;
		ctx.strokeStyle = "#43a6e2";	
		ctx.fillStyle = "#c9e3f3";
		
		var posX, posY, uid, cell;
		for(var y = this.startY; y <= this.endY; y++)
		{
			for(var x = this.startX; x <= this.endX; x++)
			{
				posX = x * this.cellWidth + 0.5;
				posY = y * this.cellHeight + 0.5;

				ctx.beginPath();
				ctx.rect(posX, posY, this.cellWidth, this.cellHeight);
				ctx.stroke();
			}
		}	

		ctx.restore();
	},

	Cell: function() {
		this.data = [];
		this.visible = 0;
	},

	//
	debug: true
};

meta.SparseNode = function(owner) {
	this.owner = owner;
	this.numVisible = 0;
	this.minX = 0;
	this.minY = 0;
	this.maxX = 0;
	this.maxY = 0;
};