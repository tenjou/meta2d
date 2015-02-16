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
		var numEntities = this.entitiesAnim.length;
		for(var i = 0; i < numEntities; i++) {
			this.entitiesAnim[i].anim(tDelta);
		}
			
		var numRemove = this.entitiesAnimRemove.length;
		if(numRemove > 0) 
		{
			for(i = 0; i < numEntities; i++) {
				this.entitiesAnim[this.entitiesAnimRemove[i]] = this.entitiesAnim[numEntities - 1];
				this.entitiesAnim.pop();
			}

			this.entitiesAnimRemove.length = 0;
		}

		if(!this.needRender) { return; }

		var camera = meta.camera;

		this.clear();

		this.ctx.save();
		this.ctx.translate(camera._x, camera._y);

		numEntities = this.entities.length;
		for(i = 0; i < numEntities; i++) {
			this.drawEntity(this.entities[i]);
		}

		this.ctx.resetTransform();

		/* Debug */
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
		else if(this.numDebug > 0) 
		{
			this.ctx.save();
			this.ctx.lineWidth = 2;
			this.ctx.strokeStyle = "red";
			this.ctx.fillStyle = "red";

			var entity;
			for(i = 0; i < numEntities; i++) 
			{
				entity = this.entities[i];
				if(entity.__debug) {
					this.drawVolume(entity);
				}
			}

			this.ctx.restore();
		}

		this.needRender = false;

		this.ctx.restore();
	},

	clear: function() 
	{
		if(this._transparent) {
			this.ctx.clearRect(0, 0, this.engine.width, this.engine.height);
		}
		else {
			this.ctx.fillStyle = this._bgColor;
			this.ctx.fillRect(0, 0, this.engine.width, this.engine.height);
		}
	},

	drawEntity: function(entity)
	{
		var texture = entity._texture;
		if(!texture) { return; }

		var volume = entity.volume;
		var anim = entity.anim;

		if(volume.__type === 0) 
		{
			if(anim.frames > 1) {
				texture.drawFrame(this.ctx, volume.minX | 0, volume.minY | 0, anim._frame);
			}
			else {
				this.ctx.drawImage(texture.canvas, volume.minX | 0, volume.minY | 0);
			}
		}
		else if(volume.__type === 1) 
		{
			this.ctx.globalAlpha = entity._alpha;

			this.ctx.setTransform(
				volume.m11, volume.m12, 
				volume.m21, volume.m22,
				volume.x | 0, volume.y | 0);

			if(anim.frames > 1) {
				texture.drawFrame(this.ctx, -volume.initPivotPosX, -volume.initPivotPosY, entity._frame);
			}
			else {
				this.ctx.drawImage(texture.canvas, -volume.initPivotPosX, -volume.initPivotPosY);
			}			

			this.ctx.globalAlpha = 1.0;
		}
		else if(volume.__type === 2)
		{

		}
	},

	drawVolume: function(entity)
	{
		var volume = entity.volume;

		if(volume.__type === 0) {
			this._drawVolume(volume);
		}
		else if(volume.__type === 1) 
		{
			this.ctx.save();

			this.ctx.translate(volume.x, volume.y);
			this.ctx.rotate(entity.volume.angle);
			this.ctx.translate(-volume.x, -volume.y);

			this._drawVolume(volume);

			this.ctx.restore();
		}
	},

	_drawVolume: function(volume) 
	{
		var minX = Math.floor(volume.minX);
		var minY = Math.floor(volume.minY);
		var maxX = Math.floor(volume.maxX);
		var maxY = Math.floor(volume.maxY - 1);		

		this.ctx.beginPath();
		this.ctx.moveTo(minX, minY);
		this.ctx.lineTo(maxX, minY);
		this.ctx.lineTo(maxX, maxY);
		this.ctx.lineTo(minX, maxY);
		this.ctx.lineTo(minX, minY - 1);
		this.ctx.stroke();	

		this.ctx.fillRect(volume.x - 3, volume.y - 3, 6, 6);
	},

	updateBgColor: function() {},

	//
	engine: null,
	ctx: null
});
