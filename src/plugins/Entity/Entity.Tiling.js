"use strict";

Entity.Tiling = Entity.Geometry.extend
({
	init: function(texture) 
	{
		var volume = meta.camera.volume;
		var newTexture = new Resource.Texture();
		newTexture.resizeSilently(volume.width, volume.height);
		this.texture = newTexture;

		this.tile(texture);
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

		this._texture.clear();

		var numX = this.tileX;
		var numY = this.tileY;

		var cameraVolume = meta.camera.volume;		
		var posX = Math.abs(cameraVolume.x % this.tileTexture.fullWidth - this.tileTexture.fullWidth);
		var posY = Math.abs(cameraVolume.y % this.tileTexture.fullHeight - this.tileTexture.fullHeight);

		var maxTilesX = Math.ceil((this._texture.fullWidth + posX) / this.tileTexture.fullWidth);
		var maxTilesY = Math.ceil((this._texture.fullHeight + posY) / this.tileTexture.fullHeight);

		//console.log(cameraVolume.x, cameraVolume.y);
		//console.log(maxTilesX, maxTilesY);

		numX = maxTilesX;
		numY = maxTilesY;

		var offsetX = posX;
		var offsetY = posY;

		// if(this.follow) {
		// 	var cameraVolume = meta.camera.volume;
		// 	offsetX = -(cameraVolume.x % this.tileTexture.fullWidth) - this.tileTexture.fullWidth;
		// 	offsetY = -(cameraVolume.y % this.tileTexture.fullHeight) - this.tileTexture.fullHeight;
		// }

		var ctx = this._texture.ctx;
		var image = this.tileTexture.canvas;
		var posX = offsetX, 
			posY = offsetY;

		for(var y = 0; y < numY; y++) 
		{
			for(var x = 0; x < numX; x++) {
				ctx.drawImage(image, posX, posY);
				posX += this.tileTexture.width;
			}

			posX = offsetX;
			posY += this.tileTexture.height;
		}

		this._texture.loaded = true;	
	},

	updateScale: function() 
	{
		this._super();

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
		this.updateResolution();
		this.updateTiling();
	},

	//
	tileTexture: null,

	follow: false,
	tileX: 0,
	tileY: 0
});
