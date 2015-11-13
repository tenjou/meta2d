"use strict";

meta.SparseGrid = function()
{
	this.cells = [];
	this.nodeWidth = meta.flags.visibilityCellWidth || 512;
	this.nodeHeight = meta.flags.visibilityCellHeight || 512;

	this.startX = 0;
	this.startY = 0;
	this.endX = 0;
	this.endY = 0;
};

meta.SparseGrid.prototype =
{
	calc: function()
	{
		var cameraVolume = meta.camera.volume;
		var startX = Math.floor(cameraVolume.minX / this.nodeWidth);
		var startY = Math.floor(cameraVolume.minY / this.nodeHeight);
		var endX = Math.floor(cameraVolume.maxX / this.nodeWidth);
		var endY = Math.floor(cameraVolume.maxY / this.nodeHeight);

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

						cell.visible = 0;
						this.makeInvisible(cell.data);
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
		var minCellX = Math.floor(volume.minX / this.nodeWidth);
		var minCellY = Math.floor(volume.minY / this.nodeHeight);
		var maxCellX = Math.floor(volume.maxX / this.nodeWidth);
		var maxCellY = Math.floor(volume.maxY / this.nodeHeight);

		var cell, uid;
		for(var y = minCellY; y <= maxCellY; y++)
		{
			for(var x = minCellX; x <= maxCellX; x++)
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

		node.minX = minCellX;
		node.minY = minCellY;
		node.maxX = maxCellX;
		node.maxY = maxCellY;

		if(node.numVisible > 0) {
			meta.renderer.makeEntityVisible(entity);
		}
	},

	remove: function(entity)
	{
		var volume = entity.volume;
		var minCellX = Math.floor(volume.minX / this.nodeWidth);
		var minCellY = Math.floor(volume.minY / this.nodeHeight);
		var maxCellX = Math.floor(volume.maxX / this.nodeWidth);
		var maxCellY = Math.floor(volume.maxY / this.nodeHeight);

		var data, uid, n, num;
		for(var y = minCellY; y < maxCellY; y++)
		{
			for(var x = minCellX; x < maxCellX; x++)
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
		var startX = Math.floor(volume.minX / this.nodeWidth);
		var startY = Math.floor(volume.minY / this.nodeHeight);
		var endX = Math.floor(volume.maxX / this.nodeWidth);
		var endY = Math.floor(volume.maxY / this.nodeHeight);
		console.log("bounds", startX, startY, endX, endY)

		if(node.minX === startX && node.minY === startY && 
		   node.maxX === endX && node.maxY === endY) 
		{
			return;
		}

		console.log("---")

		var cell, data, uid, index, y, x;
		var prevNumVisible = node.numVisible;

		if(node.minX > endX || node.maxX < startX || node.minY > endY || node.maxY < startY)
		{
			console.log("TOTAL_REBUILD")
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
			for(y = startY; y <= endY; y++)
			{
				for(x = startX; x <= endY; x++)
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
			console.log("--")
			var minX = (startX < node.minX) ? startX : node.minX;
			var minY = (startY < node.minY) ? startY : node.minY;
			var maxX = (endX > node.maxX) ? endX : node.maxX;
			var maxY = (endY > node.maxY) ? endY : node.maxY;

			for(y = minY; y <= maxY; y++)
			{
				for(x = minX; x <= maxX; x++)
				{
					// if cell was already handled previously:
					if(x >= node.minX && x <= node.maxX && y >= node.minY && y <= node.maxY) 
					{
						// remove from cell?
						if(x > endX || x < startX || y > endY || y < startY) 
						{
							uid = (x << 16) | (y & 0xffff);
							cell = this.cells[uid];
							data = cell.data;
							index = data.indexOf(entity);
							data[index] = data[data.length - 1];
							data.pop();

							console.log("REMOVE_FROM", x, y);

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

						console.log("ADD_IN", x, y)

						if(!cell) 
						{
							cell = new this.Cell();
							cell.data.push(entity);
							this.cells[uid] = cell;

							console.log("create", uid);

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

					console.log("->",x,y)
				}
			}

			console.log("---->",node.numVisible)
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

		console.log("bounds", startX, startY, endX, endY)

		node.minX = startX;
		node.minY = startY;
		node.maxX = endX;
		node.maxY = endY;			

		console.log(node.numVisible);
	},

	drawDebug: function(ctx)
	{
		var width = (this.endX - this.startX + 1) * this.nodeWidth;
		var height = (this.endY - this.startY + 1) * this.nodeHeight;

		ctx.lineWidth = 2.5;
		ctx.strokeStyle = "#e74c3c";
		ctx.beginPath();

		var posX = this.startX * this.nodeWidth;
		var posY = this.startY * this.nodeHeight;
		for(var x = this.startX; x <= this.endX; x++)
		{
			ctx.moveTo(posX, posY);
			ctx.lineTo(posX, posY + height);

			posX += this.nodeWidth;
		}

		posX = this.startX * this.nodeWidth;
		for(var y = this.startY; y <= this.endY; y++)
		{
			ctx.moveTo(posX, posY);
			ctx.lineTo(posX + width, posY);

			posY += this.nodeHeight;
		}

		ctx.stroke();
	},

	//
	Cell: function() {
		this.data = [];
		this.visible = 0;
	}
};

meta.SparseNode = function(owner) {
	this.owner = owner;
	this.numVisible = 0;
	this.minX = 0;
	this.minY = 0;
	this.maxX = 0;
	this.maxY = 0;
};