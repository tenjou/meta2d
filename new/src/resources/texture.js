"use strict";

meta.class("meta.Texture", "meta.Resource",
{
	setup: function()
	{
		this.instance = meta.engine.gl.createTexture();
	},

	loadParams: function(params)
	{
		if(params instanceof HTMLCanvasElement) {
			this.createFromImage(params);
		}
		else
		{
			if(typeof params === "string") {
				this.path = params;
			}
			else if(params instanceof Object)
			{
				for(var key in params) {
					this[key] = params[key];
				}
			}
		}
	},

	cleanup: function() 
	{	
		meta.engine.gl.deleteTexture(this.instance);
		this.instance = null;
		this.image = null;
		this.width = 0;
		this.height = 0;
	},

	load: function(path)
	{
		if(this.loading) { return; }
		this.loading = true;

		if(!this.image)
		{
			var self = this;

			this.image = new Image();
			this.image.onload = function() {
				self.createFromImage(self.image);
			};
		}

		if(!path) 
		{
			this.ext = null;
			this.$path = null;
			this.image.src = "";
			this.createFromImage(this.image);
		}
		else 
		{
			this.ext = meta.getExtFromPath(path);
			this.$path = path;
			this.image.src = meta.resources.rootPath + path;
		}
	},

	createFromImage: function(img)
	{
		this.image = img;
		this.width = this.image.width;
		this.height = this.image.height;

		var gl = meta.engine.gl;

		gl.bindTexture(gl.TEXTURE_2D, this.instance);

		if(this.isPowTwo()) 
		{
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.generateMipmap(gl.TEXTURE_2D);
		}
		else
		{
			if(meta.flags.autoPowTwo) 
			{
				this.resizePowTwo();
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
				gl.generateMipmap(gl.TEXTURE_2D);
			}
			else
			{
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
				// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			}
		}

				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);		

		this.image.src = null;

		if(this.$anisotropy) 
		{
			var ext = meta.getExt("EXT_texture_filter_anisotropic");
			if(ext) 
			{
				gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, 
					meta.getExtParam(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT));
			}
		}

		gl.bindTexture(gl.TEXTURE_2D, null);

		this.loading = false;
	},

	resizePowTwo: function() 
	{
		var canvas = document.createElement("canvas");
		canvas.imageSmoothingEnabled = false;
		canvas.width = meta.upperPowerOfTwo(this.width);
		canvas.height = meta.upperPowerOfTwo(this.height);

		var context = canvas.getContext("2d");
		context.drawImage(this.image, 0, 0, canvas.width, canvas.height);

		console.warn("(meta.Texture.resizePowTwo) Resized image `" + this.id + "` from (" + 
			this.width + "x" + this.height + ") to (" + canvas.width + "x" + canvas.height + ")");

		this.fullWidth = canvas.width;
		this.fullHeight = canvas.height;
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

	set path(path) 
	{
		if(this.$path === path) { return; }
		this.$path = path;

		if(path) {
			this.load(path);
		}
	},

	get path() {
		return this.$path;
	},

	set anisotropy(value) 
	{
		if(this.$anisotropy === value) { return; }
		this.$anisotropy = value;

		if(this.instance)
		{
			var ext = meta.getExt("EXT_texture_filter_anisotropic");
			if(!ext) { return; }

			var gl = meta.engine.gl;
			gl.bindTexture(gl.TEXTURE_2D, this.instance);

			if(value) 
			{
				gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, 
					meta.getExtParam(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT));
			}
			else 
			{
				gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, 1);			
			}
		}
	},

	get anisotropy() {
		return this.$anisotropy;
	},

	//
	type: "texture",

	instance: null,
	image: null,

	width: 0,
	height: 0,
	fullWidth: 0,
	fullHeight: 0,
	ext: null,
	$path: null,
	$anisotropy: true
});
