"use strict";

meta.class("meta.CanvasRenderer", "meta.Renderer", 
{
	init: function() 
	{
		this._super();

		this.ctx = meta.engine.canvas.getContext("2d");
		meta.engine.ctx = this.ctx;
	},

	render: function(tDelta, alpha)
	{
		var numEntities = this.entitiesAnim.length;
		for(var i = 0; i < numEntities; i++) {
			this.entitiesAnim[i].update(tDelta);
		}
		
		if(!this.needRender) { return; }

		this.clear();

		this.ctx.save();

		var zoom = this.camera._zoom;
		this.ctx.setTransform(zoom, 0, 0, zoom, -this.cameraVolume.x * zoom | 0, -this.cameraVolume.y * zoom | 0);

		numEntities = this.entities.length;
		for(i = 0; i < numEntities; i++) {
			this.drawEntity(this.entities[i]);
		}

		var numFuncs = this._renderFuncs.length;
		for(i = 0; i < numFuncs; i++) {
			this._renderFuncs[i].render(tDelta);
		}

		var entity = null;

		/* Debug */
		if(this.meta.cache.debug || this.numDebug > 0) 
		{
			this.ctx.save();
			this.ctx.lineWidth = 2;
			this.ctx.strokeStyle = "red";
			this.ctx.fillStyle = "red";

			for(i = 0; i < numEntities; i++) 
			{
				entity = this.entities[i];
				if(entity.flags & this.entityFlags.DEBUG || this.meta.cache.debug) 
				{
					if(entity._static) 
					{
						var zoom = this.camera._zoom;

						if(entity._debugger) {
							this.ctx.setTransform(1, 0, 0, 1, 0, 0);
						}
						else {
							this.ctx.setTransform(zoom, 0, 0, zoom, 0, 0);
						}
						
						this.drawVolume(entity);
						this.ctx.setTransform(zoom, 0, 0, zoom, -this.cameraVolume.x * zoom | 0, -this.cameraVolume.y * zoom | 0);
					}
					else {				
						this.drawVolume(entity);
					}
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
		if(!entity._visible) { return; }

		if(entity._static) 
		{
			var zoom = this.camera._zoom;

			if(entity._debugger) {
				this.ctx.setTransform(1, 0, 0, 1, 0, 0);
			}
			else {
				this.ctx.setTransform(zoom, 0, 0, zoom, 0, 0);
			}
			
			if(entity.draw) {
				this.ctx.save();
				entity.draw(this.ctx);
				this.ctx.restore();
			}
			else {
				this._drawEntity(entity);
			}			
			
			this.ctx.setTransform(zoom, 0, 0, zoom, -this.cameraVolume.x * zoom | 0, -this.cameraVolume.y * zoom | 0);
		}
		else 
		{
			if(entity.draw) {
				this.ctx.save();
				entity.draw(this.ctx);
				this.ctx.restore();
			}
			else {
				this._drawEntity(entity);
			}
		}
	},

	_drawEntity: function(entity)
	{
		var texture = entity._texture;
		if(!texture) { return; }

		var volume = entity.volume;
		var anim = entity.anim;

		if(entity.clipVolume) 
		{
			this.ctx.save();

			this.ctx.beginPath();

			if(entity.flags & this.entityFlags.CLIP_BOUNDS) {
				this.ctx.rect(entity.volume.minX | 0, entity.volume.minY | 0, 
					entity.clipVolume.width, entity.clipVolume.height);
			}
			else {
				this.ctx.rect(entity.clipVolume.minX | 0, entity.clipVolume.minY | 0, 
					entity.clipVolume.width, entity.clipVolume.height);
			}

			this.ctx.closePath();
			this.ctx.clip();
		}		

		if(!volume.__transformed) 
		{
			if(texture.frames > 1) {
				texture.drawFrame(this.ctx, volume.minX | 0, volume.minY | 0, anim._frame);
			}
			else {
				this.ctx.drawImage(texture.canvas, volume.minX | 0, volume.minY | 0);
			}

			this.ctx.restore();
		}
		else
		{
			this.ctx.globalAlpha = entity.totalAlpha;

			this.ctx.transform(
				volume.m11, volume.m12, 
				volume.m21, volume.m22,
				volume.x | 0, volume.y | 0);
				
			if(texture.frames > 1) {
				texture.drawFrame(this.ctx, -volume.initPivotPosX, -volume.initPivotPosY, anim._frame);
			}
			else 
			{
				if(texture.fromAtlas) 
				{
					this.ctx.drawImage(texture.ptr.canvas, 
						texture.x, texture.y, texture.fullWidth, texture.fullHeight, 
						-volume.initPivotPosX, -volume.initPivotPosY, texture.fullWidth, texture.fullHeight);
				}
				else {
					this.ctx.drawImage(texture.canvas, -volume.initPivotPosX, -volume.initPivotPosY);
				}
			}
		
			this.ctx.globalAlpha = 1.0;
			
			var zoom = this.camera._zoom;
			this.ctx.setTransform(zoom, 0, 0, zoom, -this.camera.volume.x * zoom | 0, -this.camera.volume.y * zoom | 0);
		}

		if(entity.clipVolume) {
			this.ctx.restore();
		}
	},

	drawVolume: function(entity)
	{
		if(!entity._visible) { return; }
		if(entity._debugger) { return; }

		var volume = entity.volume;

		if(volume.__type === 0) {
			this._drawVolume(volume);
		}
		else
		{
			this.ctx.save();

			this.ctx.translate(volume.x | 0, volume.y | 0);
			this.ctx.rotate(entity.volume.angle);
			this.ctx.translate(-volume.x | 0, -volume.y | 0);

			this._drawVolume(volume);

			this.ctx.restore();
		}
	},

	_drawVolume: function(volume) 
	{
		var minX = Math.floor(volume.minX);
		var minY = Math.floor(volume.minY);
		var maxX = Math.ceil(volume.maxX);
		var maxY = Math.ceil(volume.maxY - 1);		

		this.ctx.beginPath();
		this.ctx.moveTo(minX, minY);
		this.ctx.lineTo(maxX, minY);
		this.ctx.lineTo(maxX, maxY);
		this.ctx.lineTo(minX, maxY);
		this.ctx.lineTo(minX, minY - 1);
		this.ctx.stroke();	

		this.ctx.fillRect(volume.x - 3, volume.y - 3, 6, 6);
	},

	updateBgColor: function() {}
});
