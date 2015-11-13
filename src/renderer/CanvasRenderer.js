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
		this.ctx.setTransform(zoom, 0, 0, zoom, -Math.floor(this.cameraVolume.x * zoom), -Math.floor(this.cameraVolume.y * zoom));

		var entity;
		numEntities = this.entities.length;
		for(i = 0; i < numEntities; i++) 
		{
			entity = this.entities[i];
			if(entity.flags & entity.Flag.INSTANCE_HIDDEN) { return; }

			this.drawEntity(entity);
		}

		var numFuncs = this._renderFuncs.length;
		for(i = 0; i < numFuncs; i++) {
			this._renderFuncs[i].render(tDelta);
		}

		var entity = null;

		/* Debug */
		if(this.meta.cache.debug)
		{
			this.ctx.save();

			if(this.visibility) {
				this.visibility.drawDebug(this.ctx);
			}

			if(this.numDebug > 0)
			{
				this.ctx.lineWidth = 2;
				this.ctx.strokeStyle = "red";
				this.ctx.fillStyle = "red";
				
				for(i = 0; i < numEntities; i++) 
				{
					entity = this.entities[i];
					if(entity.flags & entity.Flag.DEBUG || this.meta.cache.debug) 
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
							this.ctx.setTransform(zoom, 0, 0, zoom, -Math.floor(this.cameraVolume.x * zoom), -Math.floor(this.cameraVolume.y * zoom));
						}
						else {				
							this.drawVolume(entity);
						}
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
			
			this.ctx.setTransform(zoom, 0, 0, zoom, -Math.floor(this.cameraVolume.x * zoom), -Math.floor(this.cameraVolume.y * zoom));
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
		if(!texture || !entity._texture._loaded) { return; }

		var volume = entity.volume;
		var anim = entity.anim;

		if(entity.clipVolume) 
		{
			this.ctx.save();

			this.ctx.beginPath();

			if(entity.flags & entity.Flag.CLIP_BOUNDS) {
				this.ctx.rect(Math.floor(entity.volume.minX), Math.floor(entity.volume.minY), 
					entity.clipVolume.width, entity.clipVolume.height);
			}
			else {
				this.ctx.rect(Math.floor(entity.clipVolume.minX), Math.floor(entity.clipVolume.minY), 
					entity.clipVolume.width, entity.clipVolume.height);
			}

			this.ctx.closePath();
			this.ctx.clip();
		}
		
		if(entity.flags & entity.Flag.DYNAMIC_CLIP)
		{
			if(volume.width > 0 && volume.height > 0)
			{
				this.ctx.drawImage(texture.canvas, 
					0, 0, volume.width, volume.height,
					Math.floor(volume.minX), Math.floor(volume.minY), volume.width, volume.height);
			}

			return;
		}

		if(!volume.__transformed) 
		{
			if(texture.frames > 1) {
				texture.drawFrame(this.ctx, Math.floor(volume.minX), Math.floor(volume.minY), anim._frame);
			}
			else 
			{
				if(texture.fromAtlas) 
				{
					this.ctx.drawImage(texture.ptr.canvas, 
						texture.x, texture.y, texture.fullWidth, texture.fullHeight, 
						Math.floor(volume.minX), Math.floor(volume.minY), texture.fullWidth, texture.fullHeight);
				}
				else {
					this.ctx.drawImage(texture.canvas, Math.floor(volume.minX), Math.floor(volume.minY));
				}
			}
		}
		else
		{
			this.ctx.globalAlpha = entity.totalAlpha;

			this.ctx.transform(
				volume.m11, volume.m12, 
				volume.m21, volume.m22,
				Math.floor(volume.x), Math.floor(volume.y));
				
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
			this.ctx.setTransform(zoom, 0, 0, zoom, -Math.floor(this.camera.volume.x * zoom), -Math.floor(this.camera.volume.y * zoom));
		}

		if(entity.clipVolume) {
			this.ctx.restore();
		}
	},

	drawVolume: function(entity)
	{
		if(entity._view.debugger) { return; }

		var volume = entity.volume;

		if(volume.__type === 0) {
			this._drawVolume(volume);
		}
		else
		{
			this.ctx.save();

			this.ctx.translate(Math.floor(volume.x), Math.floor(volume.y));
			this.ctx.rotate(entity.volume.angle);
			this.ctx.translate(-Math.floor(volume.x), -Math.floor(volume.y));

			this._drawVolume(volume);

			this.ctx.restore();
		}
	},

	_drawVolume: function(volume) 
	{
		var minX = Math.floor(volume.minX);
		var minY = Math.floor(volume.minY);
		var maxX = Math.ceil(volume.maxX);
		var maxY = Math.ceil(volume.maxY);		

		this.ctx.beginPath();
		this.ctx.moveTo(minX, minY);
		this.ctx.lineTo(maxX, minY);
		this.ctx.lineTo(maxX, maxY);
		this.ctx.lineTo(minX, maxY);
		this.ctx.lineTo(minX, minY - 1);
		this.ctx.stroke();	

		this.ctx.fillRect(Math.floor(volume.x) - 3, Math.floor(volume.y) - 3, 6, 6);
	},

	updateBgColor: function() {}
});
