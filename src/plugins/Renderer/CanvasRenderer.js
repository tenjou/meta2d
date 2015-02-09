"use strict";

meta.CanvasRenderer = meta.Renderer.extend
({
	init: function() 
	{
		this.engine = meta.engine;
		this.ctx = this.engine.canvas.getContext("2d");
		this.engine.ctx = this.ctx;
	},

	render: function(tDelta)
	{
		//if(!this.needRender) { return; }

		this.clear();

		var numEntities = this.entities.length;
		for(var i = 0; i < numEntities; i++) {
			this.drawEntity(this.entities[i]);
		}

		if(this.meta.cache.debug) 
		{
			this.ctx.save();
			this.ctx.lineWidth = 2;
			this.ctx.strokeStyle = "red";
			this.ctx.fillStyle = "red";

			for(i = 0; i < numEntities; i++) {
				this.drawVolume(this.entities[i]);
			}

			this.ctx.restore();
		}

		this.needRender = false;
	},

	clear: function()
	{
		this.ctx.fillStyle = "#ddd";
		this.ctx.fillRect(0, 0, this.engine.width, this.engine.height);
	},

	drawEntity: function(entity)
	{
		var volume = entity.volume;

		if(entity.__type === 0) {
			this.ctx.drawImage(entity.texture.canvas, Math.floor(volume.minX), Math.floor(volume.minY));
		}
		else if(entity.__type === 1) 
		{
			this.ctx.save();

			this.ctx.globalAlpha = entity._alpha;

			this.ctx.translate(volume.x, volume.y);
			this.ctx.rotate(entity._angleRad);
		  	this.ctx.translate(volume.halfWidth - volume.pivotPosX, volume.halfHeight - volume.pivotPosY);
			this.ctx.scale(volume.scaleX, volume.scaleY);
		  	this.ctx.translate(-volume.halfWidth, -volume.halfHeight);

			this.ctx.drawImage(entity.texture.canvas, 0, 0);

			this.ctx.restore();
		}
	},

	drawVolume: function(entity)
	{
		var volume = entity.volume;

		if(entity.__type === 0) {
			this._drawVolume(volume);
		}
		else if(entity.__type === 1) 
		{
			this.ctx.save();

			this.ctx.translate(volume.x, volume.y);
			this.ctx.rotate(entity._angleRad);
			this.ctx.translate(-volume.x, -volume.y);

			this._drawVolume(volume);

			this.ctx.restore();
		}
	},

	_drawVolume: function(volume) 
	{
		var minX = volume.minX;
		var minY = volume.minY;
		var maxX = volume.maxX;
		var maxY = volume.maxY - 1;		

		this.ctx.beginPath();
		this.ctx.moveTo(minX, minY);
		this.ctx.lineTo(maxX, minY);
		this.ctx.lineTo(maxX, maxY);
		this.ctx.lineTo(minX, maxY);
		this.ctx.lineTo(minX, minY - 1);
		this.ctx.stroke();	

		this.ctx.fillRect(volume.x - 3, volume.y - 3, 6, 6);
	},

	//
	engine: null,
	ctx: null
});
