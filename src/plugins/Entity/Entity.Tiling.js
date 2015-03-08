"use strict";

Entity.Tiling = Entity.Geometry.extend
({
	init: function(texture) 
	{
		var volume = meta.camera.volume;
		var newTexture = new Resource.Texture();
		newTexture.resizeSilently(volume.width, volume.height);
		newTexture.ctx.globalCompositeOperator = "copy";
		this.texture = newTexture;

		this.tile(texture);
	},

	draw: function(ctx)
	{

		var zoom = meta.camera._zoom;

		ctx.setTransform(zoom * this.volume.scaleX, 0, 0, zoom * this.volume.scaleY, 0, 0);		

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
			this.tileTexture = meta.getTexture(texture);
			if(!this.tileTexture) {
				console.warn("(Entity.Tiling.tile) Could not find texture with a name - " + texture);
				return;
			}
		}
		else {
			this.tileTexture = texture;
		}

		if(!this.tileTexture._loaded) {
			this.tileTexture.subscribe(this, this.onTextureEvent);
			return;
		}

		this.updateTiling();
	},

	options: function(opts) 
	{
		this.tileX = opts.tileX || 0;
		this.tileY = opts.tileY || 0;

		var follow = opts.follow || false;
		if(follow !== this.follow) {
			meta.subscribe(this, meta.Event.CAMERA_MOVE, this.onResize);	
		}
		else {
			meta.unsubscribe(this, meta.Event.CAMERA_MOVE);
		}
		this.follow = follow;

		this.updateTiling();
	},

	updateTiling: function() 
	{
		if(!this.tileTexture._loaded) { return; }

		var width = this.tileTexture.fullWidth;
		var height = this.tileTexture.fullHeight;

		var offsetX, offsetY;
		if(this.follow) {
			var cameraVolume = meta.camera.volume;		
			this._tileOffsetX = (-cameraVolume.x * this._tileScaleX + this._scrollX) % width - width;
			this._tileOffsetY = (-cameraVolume.y * this._tileScaleY + this._scrollY) % height - height;
		}
		else {
			this._tileOffsetX = this._scrollX;
			this._tileOffsetY = this._scrollY;
		}

		this._drawTilesX = Math.ceil((this._texture.fullWidth - this._tileOffsetX) / width);
		this._drawTilesY = Math.ceil((this._texture.fullHeight - this._tileOffsetY) / height);

		this.renderer.needRender = true;	
	},

	updateScale: function() 
	{
		this._super();

		this._tileScaleX = (1.0 / this.volume.scaleX);
		this._tileScaleY = (1.0 / this.volume.scaleY);
		this.updateResolution();
		this.updateTiling();
	},

	updateResolution: function()
	{
		var cameraVolume = meta.camera.volume;
		var width = cameraVolume.width / this.volume.scaleX;
		var height = cameraVolume.height / this.volume.scaleY;

		if(this._texture.fullWidth !== width || this._texture.fullHeight !== height) {
			this._texture.resizeSilently(width, height);
		}
	},

	onTextureEvent: function(data, event) 
	{
		if(event === Resource.Event.LOADED) {
			this.tileTexture.unsubscribe(this);
			this.updateTiling();
		}
	},

	onResize: function(data, event) {
		//this.updateResolution();
		this.updateTiling();
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
	_tileOffsetX: 0, _tileOffsetY: 0
});
