"use strict";

meta.class("Entity.Tiling", "Entity.Geometry", 
{
	onCreate: function(texture) 
	{
		var volume = meta.camera.volume;
		var newTexture = new Resource.Texture();
		newTexture.ctx.globalCompositeOperator = "copy";
		this.texture = newTexture;

		this.tile(texture);
	},

	draw: function(ctx)
	{
		var x = this.volume.minX | 0;
		var y = this.volume.minY | 0;

		ctx.transform(
			this.volume.m11, this.volume.m12, 
			this.volume.m21, this.volume.m22,
			this.volume.x | 0, this.volume.y | 0);		

		ctx.beginPath();
		ctx.rect(-this.volume.initPivotPosX, -this.volume.initPivotPosY, this.volume.width, this.volume.height);	
		ctx.clip();

		var image = this.tileTexture.canvas;		
		var width = this.tileTexture.fullWidth;
		var height = this.tileTexture.fullHeight;

		var posX = this._tileOffsetX;
		var posY = this._tileOffsetY;
		for(var y = 0; y < this._drawTilesY; y++) 
		{
			for(var x = 0; x < this._drawTilesX; x++) {
				ctx.drawImage(image, posX, posY);
				posX += width;
			}

			posX = this._tileOffsetX;
			posY += height;
		}
	},

	tile: function(texture)
	{
		if(this.tileTexture && !this.tileTexture._loaded) {
			this.tileTexture.unsubscribe(this);
		}

		if(typeof(texture) === "string") {
			this.tileTexture = meta.resources.textures[texture];
			if(!this.tileTexture) {
				console.warn("(Entity.Tiling.tile) Could not find texture with a name - " + texture);
				return;
			}
		}
		else {
			this.tileTexture = texture;
		}

		if(!this.tileTexture._loaded) {
			this.tileTexture.subscribe(this.onTextureEvent, this);
			return;
		}

		this.updateTiling();
	},

	options: function(opts) 
	{
		this.tileX = opts.tileX || 0;
		this.tileY = opts.tileY || 0;

		if(opts.wrap !== void(0)) {
			this.wrap = opts.wrap;
		}
		
		var follow = opts.follow || false;
		if(follow !== this.follow) {
			meta.subscribe(meta.Event.CAMERA_MOVE, this.onResize, this);	
		}
		else {
			meta.unsubscribe(meta.Event.CAMERA_MOVE, this);
		}
		this.follow = follow;

		this.updateSize();
	},

	resize: function(width, height)
	{
		this._origWidth = width;
		this._origHeight = height;

		this._super(width, height);

		this.updateSize();
	},

	updateTiling: function() 
	{
		if(!this.tileTexture._loaded) { return; }

		var width = this.tileTexture.fullWidth;
		var height = this.tileTexture.fullHeight;
		var scrollX = this._scrollX;
		var scrollY = this._scrollY;

		if(this.follow) {
			var cameraVolume = meta.camera.volume;	
			scrollX -= cameraVolume.minX;
			scrollY -= cameraVolume.minY;
		}

		if(this.tileX === 0) 
		{
			if(scrollX > 0) { 
				this._tileOffsetX = (scrollX % width) - width; 
			}
			else {
				this._tileOffsetX = (scrollX % width); 
			}
		}
		else {
			this._tileOffsetX = scrollX;
		}

		if(this.tileY === 0)
		{
			if(scrollY > 0) { 
				this._tileOffsetY = (scrollY % height) - height; 
			}
			else {
				this._tileOffsetY = (scrollY % height); 
			}
		}
		else {
			this._tileOffsetY = scrollY;
		}		

		this._drawTilesX = Math.ceil((this._texture.fullWidth - this._tileOffsetX) / width);
		this._drawTilesY = Math.ceil((this._texture.fullHeight - this._tileOffsetY) / height);
		this._tileOffsetX -= this.volume.initPivotPosX;
		this._tileOffsetY -= this.volume.initPivotPosY;		

		if(this.tileX > 0 && this._drawTilesX > this.tileX) {
			this._drawTilesX = this.tileX;
		}
		if(this.tileY > 0 && this._drawTilesY > this.tileY) {
			this._drawTilesY = this.tileY;
		}	

		this.renderer.needRender = true;	
	},

	updateSize: function()
	{
		if(!this.tileTexture || !this.tileTexture._loaded) { return; }

		var width = 1;
		var height = 1;

		if(this._origWidth > 0) {
			width = this._origWidth;
		}
		else 
		{
			if(this.tileX === 0) {
				width = this.parent.width;
			}
			else {
				width = this.tileTexture.fullWidth * this.tileX;
			}			
		}

		if(this._origHeight > 0) {
			height = this._origHeight;
		}
		else 
		{
			if(this.tileY === 0) {
				height = this.parent.height;
			}
			else {
				height = this.tileTexture.fullHeight * this.tileY;
			}			
		}

		this._texture.resizeSilently(width, height);
		this.volume.resize(width, height);
		this.updateTiling();
	},

	onTextureEvent: function(data, event) 
	{
		if(event === Resource.Event.LOADED) {
			this.tileTexture.unsubscribe(this);
			this.updateSize();
		}
	},

	onResize: function(data, event) {
		this.updateSize();
	},

	scroll: function(x, y) {
		this._scrollX = x;
		this._scrollY = y;
		this.updateTiling();
	},

	//
	tileTexture: null,

	follow: false,
	tileX: 0,
	tileY: 0,

	_scrollX: 0, _scrollY: 0,
	_tileScaleX: 1, _tileScaleY: 1,
	_drawTilesX: 0, _drawTilesY: 0,
	_tileOffsetX: 0, _tileOffsetY: 0,

	_origWidth: 0, _origHeight: 0
});
