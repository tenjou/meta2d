"use strict";

meta.class("meta.Texture", "meta.Resource",
{
	onRemove: function() 
	{
		this.emit("removed");
		
		meta.engine.gl.deleteTexture(this.instance);
		this.instance = null;
		this.image = null;
		this.width = 0;
		this.height = 0;
	},

	load: function(params)
	{
		if(!params) { return; }

		// Resolve path, ext and id:
		var path;
		if(typeof params === "string") {
			path = params;
			this.id = meta.getNameFromPath(params);
		}
		else 
		{
			if(!params.path) { return; }

			path = params.path;
			this.id = params.id || meta.getNameFromPath(path);
		}

		this.ext = meta.getExtFromPath(params);
		if(this.ext) {
			this.$path = params;
		}
		else {
			this.ext = "png";
			this.$path = params + ".png";
		}	

		// Create instance if there is no one already:
		if(!this.instance) 
		{ 
			var self = this;

			this.instance = meta.engine.gl.createTexture();
			this.image = new Image();
			this.image.onload = function() {
				self.onLoad();
			};
		}

		this.image.src = path;		
	},

	onLoad: function()
	{
		if(!this.instance) { return; }

		this.width = this.image.width;
		this.height = this.image.height;

		var gl = meta.engine.gl;

		gl.bindTexture(gl.TEXTURE_2D, this.instance);

		if(this.isPowTwo()) 
		{
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
			gl.generateMipmap(gl.TEXTURE_2D);	
		}
		else
		{
			if(meta.flags.autoPowTwo) 
			{
				this.resizePowTwo();
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
				gl.generateMipmap(gl.TEXTURE_2D);	
			}
			else
			{
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			}
		}

		var ext = meta.getExt("EXT_texture_filter_anisotropic");
		if(ext) 
		{
			gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, 
				meta.getExtParam(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT));
		}

		gl.bindTexture(gl.TEXTURE_2D, null);

		this.flags |= this.Flag.LOADED;
		this.emit("loaded");
	},

	resizePowTwo: function() 
	{
		var canvas = document.createElement("canvas");
		canvas.width = meta.math.nearestPowerOfTwo(this.width);
		canvas.height = meta.math.nearestPowerOfTwo(this.height);

		var context = canvas.getContext("2d");
		context.drawImage(this.image, 0, 0, canvas.width, canvas.height);

		console.warn("(meta.Texture.resizePowTwo) Resized image[" + this.id + "] from (" + 
			this.width + "x" + this.height + ") to (" + canvas.width + "x" + canvas.height + ")");

		this.width = canvas.width;
		this.height = canvas.height;
		this.image = canvas;
	},

	isPowTwo: function()
	{
		var isWidth = ((this.width != 0) && ((this.width & (~this.width + 1)) === this.width));
		if(!isWidth) {
			return false;
		}

		var isHeight = ((this.height != 0) && ((this.height & (~this.height + 1)) === this.height));
		if(!isHeight) {
			return false;
		}

		return true;
	},

	//
	type: "texture",

	instance: null,
	image: null,

	width: 0,
	height: 0,
	path: null
});
