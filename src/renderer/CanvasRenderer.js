"use strict";

meta.class("meta.CanvasRenderer", "meta.Renderer", 
{
	init: function() 
	{
		this._super();

		this.ctx = meta.engine.canvas.getContext("2d");
		meta.engine.ctx = this.ctx;
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

	renderFrame: function()
	{
		this.clear();

		var zoom = this.camera._zoom;

		// normal
		this.setProjection(this.perspectiveProjection);
		this.renderEntities(this.entities);

		// static
		if(this.entitiesStatic.length > 0) {
			this.setProjection(this.orthoProjection);
			this.renderEntities(this.entitiesStatic);	
		}
	},

	renderDebugDrame: function() 
	{
		this.ctx.save();
		this.renderEntities(this.entitiesDebug);	
		this.ctx.restore()
	},

	renderEntities: function(entities)
	{
		var entity;
		var num = entities.length;
		for(var n = 0; n < num; n++) 
		{
			entity = entities[n];
			if(entity.flags & this.entityFlag.INSTANCE_HIDDEN) { continue; }

			if(entity.draw) {
				this.ctx.save();
				entity.draw(this.ctx);
				this.ctx.restore();
			}
			else {
				this.drawEntity(entity);
			}
		}
	},

	renderDebugVolumes: function()
	{
		this.ctx.save();

		if(this.culling && meta.debug) {
			this.culling.drawDebug(this.ctx);
		}

		this.ctx.lineWidth = 2;
		
		// normal
		this.setProjection(this.perspectiveProjection);
		this._renderVolumes(this.entities);

		// static
		if(this.entitiesStatic.length > 0) {
			this.setProjection(this.orthoProjection);
			this._renderVolumes(this.entitiesStatic);	
		}

		this.ctx.restore();
	},

	_renderVolumes: function(entities)
	{
		var entity;
		var num = entities.length;
		for(var n = 0; n < num; n++) 
		{
			entity = entities[n];
			if(entity.flags & this.entityFlag.INSTANCE_HIDDEN) { continue; }

			if(entity.flags & this.entityFlag.DEBUG || this.meta.cache.debug) 
			{
				if(entity.flags & this.entityFlag.PICKING) {
					this.ctx.strokeStyle = "green";
					this.ctx.fillStyle = "green";
				}
				else {
					this.ctx.strokeStyle = "red";
					this.ctx.fillStyle = "red";
				}

				this.drawVolume(entity);
			}
		}
	},

	drawEntity: function(entity)
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
			
			this.resetProjection();
		}

		if(entity.clipVolume) {
			this.ctx.restore();
		}
	},

	drawVolume: function(entity)
	{
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

			this.ctx.restore();
		}
	},

	updateBgColor: function() {},

	// projection:
	perspectiveProjection: function() {
		var zoom = this.camera._zoom;
		this.ctx.setTransform(zoom, 0, 0, zoom, -Math.floor(this.cameraVolume.x * zoom), -Math.floor(this.cameraVolume.y * zoom));
	},

	orthoProjection: function() {
		var zoom = this.camera._zoom;
		this.ctx.setTransform(zoom, 0, 0, zoom, 0, 0);
	},

	resetProjection: null,	

	setProjection: function(projFunc) {
		this.resetProjection = projFunc;
		projFunc.call(this);
	},

	//
	entityFlag: null,
	viewFlag: null
});
