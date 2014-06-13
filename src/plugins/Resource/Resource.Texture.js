"use strict";

// TODO: Create better bounding volume creation for shapes.
// TODO: Use Image buffer instead of creating new Image in loading.

/**
 * Class for handling Canvas/WebGL textures. Also used for SVG operations.
 * @class Resource.Texture
 * @extends Resource.Basic
 * @property textureType {Resource.TextureType} Texture type.
 * @property image {*} Image object.
 * @property ctx {*} Context of image object.
 * @property bgTexture {Resource.Texture} Texture object to render before this.texture is drawn.
 * @property vbo {WebGLBuffer} Vertex buffer object.
 * @property width {Number} Width of one frame.
 * @property height {Number} Height of one frame.
 * @property fullWidth {Number} Width of texture.
 * @property fullHeight {Number} Height of texture.
 * @property offsetX {Number} <b>Setter/Getter.</b> Offset from left.
 * @property offsetY {Number} <b>Setter/Getter.</b> Offset from top.
 * @property fps {Number} Animation speed - frames per second.
 * @property numFrames {Number} Total number of frames.
 * @property numFramesY {Number} Total number of frames on Y axis.
 * @property numFramesX {Number} Total number of frames on X axis.
 * @memberof! <global>
 */
Resource.Texture = Resource.Basic.extend
( /** @lends Resource.Texture.prototype */ {

	/**
	 * Constructor.
	 * Will generate by default texture based on what rendering is used.
	 * @param param {Object|Resource.TextureType|String=} Parameters, texture type or texture path.
	 * @param path {String=} Texture path.
	 * @function
	 */
	init: function(param, path)
	{
		if(param !== void(0))
		{
			var paramType = typeof(param);

			if(paramType === "object") 
			{
				for(var key in param) {
					this[key] = param[key];
				}
			}
			else if(paramType === "string") {
				this.path = param;
			}
			else {
				this.textureType = param;
				if(path) { this.path = path; }
			}

			// If no wildcard specified, default it to png.
			if(this.path)
			{
				var wildCardIndex = this.path.lastIndexOf(".");
				if(wildCardIndex === -1 || this.path.length - wildCardIndex > 4) {
					this.path += ".png";
				}

				this.path = Resource.ctrl.rootPath + this.path;
			}			
		}

		if(this.textureType === -1)
		{
			if(meta.engine.isWebGL) {
				this.textureType = Resource.TextureType.WEBGL;
			}
			else {
				this.textureType = Resource.TextureType.CANVAS;
			}
		}

		this.generate(this.textureType);
		
		if(!this.path) {
			this._isLoaded = true;
		}
	},

	/**
	 * Generate image object depending from type.
	 * @param type {Resource.TextureType=} Texture type to generate.
	 * @function
	 */
	generate: function(type)
	{
		this.isLoaded = false;

		if(type === Resource.TextureType.WEBGL)
		{
			var gl = meta.ctx;
			this.image = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, this.image);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.bindTexture(gl.TEXTURE_2D, null);

			this._vertices = new Float32Array([
				0.0, 0.0,
				this._width, 0.0,
				0.0, this._height,
				this._width, this._height
			]);

			this.vbo = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
			gl.bufferData(gl.ARRAY_BUFFER, this._vertices, gl.DYNAMIC_DRAW);
		}
		else
		{
			this.image = document.createElement("canvas");
			this.ctx = this.image.getContext("2d");
			this.image.width = this.fullWidth;
			this.image.height = this.fullHeight;

			this.textureType = Resource.TextureType.CANVAS;
		}

		if(this.numFrames > 1) {
			this.numFramesX = this.numFrames;
			this.isAnimated = true;
		}
		else if(this.numFramesX > 1 || this.numFramesY > 1) {
			this.isAnimated = true;
		}		
	},

	/**
	 * Load texture from the source.
	 * @param path {string} Source of texture to load from.
	 * @function
	 */
	load: function(path)
	{
		if(this.isLoading) { return; }

		if(path) {
			this.path = Resource.ctrl.rootPath + path;
		}
		else if(!this.path) {
			return;
		}

		this.isLoaded = false;
		Resource.ctrl.addToLoad(this);

		var self = this;
		var img = new Image();

		if(meta.engine.isWebGL) {
			img.crossOrigin = "anonymous";
		}

		img.onload = function()
		{
			if(!img.complete) {
				console.warn("[Resource.Texture.load]:", "Could not load texture from - " + img.src);
				Resource.ctrl.loadFailed(self);
				return;
			}

			self.createFromImg(img);
			Resource.ctrl.loadSuccess(self);
		};

		img.onerror = function(event) {
			Resource.ctrl.loadFailed(self);
		};

		img.src = this.path;
	},

	/**
	 * Create texture from DOM Image object.
	 * @param img {Image} Image file.
	 * @function
	 */
	createFromImg: function(img)
	{
		if(this._width && this._height) 
		{
			var width = this._width || img.width;
			var height = this._height || img.height;

			this.numFramesX = (img.width / width) | 0;
			this.numFramesY = (img.height / height) | 0;
			this.isAnimated = true;
		}

		this.numFrames = this.numFramesX * this.numFramesY;
		this.resize(img.width, img.height);

		if(this.textureType !== Resource.TextureType.WEBGL) {
			this.ctx.drawImage(img, 0, 0);
		}
		else
		{
			var gl = meta.ctx;
			gl.bindTexture(gl.TEXTURE_2D, this.image);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
		}

		this.isLoaded = true;
	},

	_createCachedImg: function()
	{
		if(this._cachedImg) { return; }

		this._cachedImg = document.createElement("canvas");
		this._cachedImg.width = this.fullWidth;
		this._cachedImg.height = this.fullHeight;
		this._cachedCtx = this._cachedImg.getContext("2d");
	},

	/**
	 * Resize texture.
	 * @param width {Number} Width of texture.
	 * @param height {Number} Height of texture.
	 * @function
	 */
	resize: function(width, height)
	{
		if(this.fullWidth === width && this.fullHeight === height) { return; }

		this.fullWidth = width;
		this.fullHeight = height;

		if(this.isAnimated) {
			this._width = width / this.numFramesX;
			this._height = height / this.numFramesY;
		}
		else {
			this._width = width;
			this._height = height;
		}

		if(!this.textureType)
		{
			if(this._isLoaded)
			{
				if(this.image.width > 0 && this.image.height > 0)
				{
					this._tmpImg.width = this.image.width;
					this._tmpImg.height = this.image.height;
					this._tmpCtx.drawImage(this.image, 0, 0);

					this.image.width = this.fullWidth;
					this.image.height = this.fullHeight;
					this.ctx.drawImage(this._tmpImg, 0, 0);
				}
				else {
					this.image.width = this.fullWidth;
					this.image.height = this.fullHeight;					
				}
			}
			else {
				this.image.width = this.fullWidth;
				this.image.height = this.fullHeight;
			}
		}
		else
		{
			var gl = meta.ctx;

			this._vertices[2] = this._width;
			this._vertices[5] = this._height;
			this._vertices[6] = this._width;
			this._vertices[7] = this._height;

			this._xRatio = 1.0 / this.numFramesX;
			this._yRatio = 1.0 / this.numFramesY;

			if(this.fromAtlas) {
				this._widthRatio = 1.0 / ((this.ptr.fullWidth / this._width) / this.numFramesX);
				this._heightRatio = 1.0 / ((this.ptr.fullHeight / this._height) / this.numFramesY);
			}
			else {
				this._widthRatio = 1.0 / this.numFramesX;
				this._heightRatio = 1.0 / this.numFramesY;				
			}

			gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
			gl.bufferData(gl.ARRAY_BUFFER, this._vertices, gl.DYNAMIC_DRAW);

			if(this._isLoaded && this._cachedImg)
			{
				this._tmpImg.width = this.image.width;
				this._tmpImg.height = this.image.height;
				this._tmpCtx.drawImage(this._cachedImg, 0, 0);

				this._cachedImg.width = this.fullWidth;
				this._cachedImg.height = this.fullHeight;
				this._cachedCtx.drawImage(this._cachedImg, 0, 0);

				gl.bindTexture(gl.TEXTURE_2D, this.image);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
			}
		}

		if(this._isLoaded) {
			this.emit(this, Resource.Event.RESIZE);
		}
	},

	upResize: function(width, height)
	{
		if(width > this.fullWidth)
		{
			if(height > this.fullHeight) {
				this.resize(width, height);
			}
			else {
				this.resize(width, this.fullHeight);
			}
		}
	},

	update: function()
	{
		// If WebGL.
		if(this.textureType) {
			this.resize(this._width, this._height);
		}
	},


	/**
	 * Draw texture onto context.
	 * @param ctx {*} Context to draw on.
	 * @param x {Number} Offset on x axis from left.
	 * @param y {Number} Offset on y axis from top.
	 * @function
	 */
	draw: function(ctx, x, y)
	{
		if(this._bgTexture) {
			this._bgTexture.draw(ctx, x, y);
		}

		if(!this.fromAtlas) {
			ctx.drawImage(this.image, x, y);
		}
		else {
			ctx.drawImage(this.ptr.image, this._x, this._y, this._width, this._height, x, y, this._width, this._height);
		}
	},


	/**
	 * Draw frame from the texture.
	 * @param ctx {*} Context to draw on.
	 * @param x {Number} Offset on x axis from left.
	 * @param y {Number} Offset on y axis from top.
	 * @param frame {Number} Frame to draw.
	 * @param isEmulateReverse {Boolean=} Is emulated animation reversed.
	 * @function
	 */
	drawFrame: function(ctx, x, y, frame, isEmulateReverse)
	{
		if(this._bgTexture) {
			ctx.drawImage(this._bgTexture.image, x, y);
		}

		if(this._anim)
		{
			var theta, cos;

			if(this._anim.type === 1)
			{
				var width = this._anim.fill * frame;
				if(width === 0) { width = 0.01; }
				else if(width > this.fullWidth) { width = this.fullWidth; }

				if(isEmulateReverse)
				{
					ctx.drawImage(this.image, (this.fullWidth - width), 0, width,
						this.fullHeight, (x + this.fullWidth - width), y, width, this.fullHeight);
				}
				else {
					ctx.drawImage(this.image, 0, 0, width, this.fullHeight, x, y, width, this.fullHeight);
				}
			}
			else if(this._anim.type === 2)
			{
				var height = this._anim.fill * frame;
				if(height === 0) { height = 0.01; }
				else if(height > this._height) { width = this._height; }

				if(isEmulateReverse)
				{
					ctx.drawImage(this.image, 0, (this.fullHeight - height), this.fullWidth,
						height, x, (y + this.fullHeight - height), this.fullWidth, height);
				}
				else {
					ctx.drawImage(this.image, 0, 0, this.fullWidth, height, x, y, this.fullWidth, height);
				}
			}
			else if(this._anim.type === 3)
			{

			}
			else if(this._anim.type === 4)
			{
				if(isEmulateReverse)
				{
					theta = this._anim.fill * (-this.numFrames + frame + 1) + Math.PI / 2;
					cos = x + Math.cos(theta) * this._anim.length;

					ctx.save();
					ctx.beginPath();
					ctx.moveTo(x, y);
					ctx.lineTo(cos, y + Math.sin(theta) * this._anim.length);
					ctx.lineTo(cos + this.fullWidth, y);
					ctx.closePath();
					ctx.clip();
				}
				else
				{
					theta = this._anim.fill * (-frame) + Math.PI / 2;
					cos = x + Math.cos(theta) * this._anim.length;

					ctx.save();
					ctx.beginPath();
					ctx.moveTo(x, y);
					ctx.lineTo(cos, y + Math.sin(theta) * this._anim.length);
					ctx.lineTo(cos, y + this.fullHeight);
					ctx.lineTo(x, y + this.fullHeight);
					ctx.closePath();
					ctx.clip();
				}

				ctx.drawImage(this.image, x, y);
				ctx.restore();
			}
			else if(this._anim.type === 5)
			{
				if(isEmulateReverse)
				{
					theta = this._anim.fill * (this.numFrames - frame - 1) + Math.PI / 2;
					cos = x + Math.cos(theta) * this._anim.length + this.fullWidth;

					ctx.save();
					ctx.beginPath();
					ctx.moveTo(x + this.fullWidth, y);
					ctx.lineTo(cos, y + Math.sin(theta) * this._anim.length);
					ctx.lineTo(x, y + this.fullHeight);
					ctx.lineTo(x, y);
					ctx.closePath();
					ctx.clip();
				}
				else
				{
					theta = this._anim.fill * frame + Math.PI / 2;
					cos = x + Math.cos(theta) * this._anim.length + this.fullWidth;

					ctx.save();
					ctx.beginPath();
					ctx.moveTo(x + this.fullWidth, y);
					ctx.lineTo(cos, y + Math.sin(theta) * this._anim.length);
					ctx.lineTo(cos, y + this.fullHeight);
					ctx.lineTo(x + this.fullWidth, y + this.fullHeight);
					ctx.closePath();
					ctx.clip();
				}

				ctx.drawImage(this.image, x, y);
				ctx.restore();
			}
			else if(this._anim.type === 6)
			{
				if(isEmulateReverse)
				{
					theta = this._anim.fill * (-this.numFrames + frame + 1);
					cos = x + Math.cos(theta) * this._anim.length;

					ctx.save();
					ctx.beginPath();
					ctx.moveTo(x, y + this.fullHeight);
					ctx.lineTo(cos, y + Math.sin(theta) * this._anim.length + this.fullHeight);
					ctx.lineTo(x + this.fullWidth, y);
					ctx.lineTo(x, y);
					ctx.closePath();
					ctx.clip();
				}
				else
				{
					theta = this._anim.fill * (-frame);
					cos = x + Math.cos(theta) * this._anim.length;

					ctx.save();
					ctx.beginPath();
					ctx.moveTo(x, y + this.fullHeight);
					ctx.lineTo(cos, y + Math.sin(theta) * this._anim.length + this.fullHeight);
					ctx.lineTo(x + this.fullWidth, y);
					ctx.lineTo(x + this.fullWidth, y + this.fullHeight);
					ctx.closePath();
					ctx.clip();
				}

				ctx.drawImage(this.image, x, y);
				ctx.restore();
			}
			else if(this._anim.type === 7)
			{
				if(isEmulateReverse)
				{
					theta = this._anim.fill * (this.numFrames - 1 - frame) + Math.PI;
					cos = x + Math.cos(theta) * this._anim.length;

					ctx.save();
					ctx.beginPath();
					ctx.moveTo(x + 64, y + this.fullHeight);
					ctx.lineTo(cos + 64, y + Math.sin(theta) * this._anim.length + 64);
					ctx.lineTo(x, y);
					ctx.lineTo(x + 64, y);
					ctx.closePath();
					ctx.clip();
				}
				else
				{
					theta = this._anim.fill * (frame) + Math.PI;
					cos = x + Math.cos(theta) * this._anim.length;

					ctx.save();
					ctx.beginPath();
					ctx.moveTo(x + 64, y + this.fullHeight);
					ctx.lineTo(cos + 64, y + Math.sin(theta) * this._anim.length + 64);
					ctx.lineTo(x, y);
					ctx.lineTo(x, y + 64);
					ctx.closePath();
					ctx.clip();
				}

				ctx.drawImage(this.image, x, y);
				ctx.restore();
			}
		}
		else
		{
			ctx.drawImage(this.image,
				(this._width * (frame % this.numFramesX)),
				(this._height * Math.floor(frame / this.numFramesX)),
				this._width, this._height, x, y, this._width, this._height);
		}
	},


	/**
	 * Clear the texture.
	 * @function
	 */
	clear: function()
	{
		if(this.textureType === Resource.TextureType.WEBGL)
		{
			if(!this._cachedCtx) { return; }

			this._cachedCtx.clearRect(0, 0, this.fullWidth, this.fullHeight);

			var gl = meta.ctx;
			gl.bindTexture(gl.TEXTURE_2D, this.image);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
		}
		else {
			this.ctx.clearRect(0, 0, this.fullWidth, this.fullHeight);
		}

		this.isLoaded = true;
	},

	/**
	 * Clear texture without sending emit.
	 * @function
	 */
	clearSilent: function()
	{
		if(this.textureType === Resource.TextureType.WEBGL)
		{
			this._tmpCtx.clearRect(0, 0, this.fullWidth, this.fullHeight);

			var gl = meta.ctx;
			gl.bindTexture(gl.TEXTURE_2D, this.image);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
		}
		else {
			this.ctx.clearRect(0, 0, this.fullWidth, this.fullHeight);
		}
	},


	/**
	 * Draw over texture
	 */
	drawOver: function(texture) {
		this.ctx.drawImage(texture.image, 0, 0);
	},

	/**
	 * Fill texture with color.
	 * @param params {Object} Parameters.
	 * @param [params.x=0] {Number=} Offset from the left.
	 * @param [params.y=0] {Number=} Offset from the top.
	 * @param [params.width=this.width] {Number=} Width of rect to fill. By default will use current texture width.
	 * @param [params.height=this.height] {Number=} Height of rect to fill. By default will use current texture height.
	 * @param [params.color=#000000] {Hex=} Color of the filled rect.
	 * @param [params.drawOver=false] {Boolean=} Flag - draw over previous texture content.
	 * @function
	 */
	fillRect: function(params)
	{
		if(!params) {
			console.warn("[Resource.Texture.fillRect]:", "No parameters specified.");
			return;
		}

		var ctx = this.ctx;
		params.x = params.x || 0;
		params.y = params.y || 0;
		params.color = params.color || "#000000";
		params.width = params.width || this.fullWidth || 1;
		params.height = params.height || this.fullHeight || 1;

		if(!params.drawOver) {
			this.resize(params.width + params.x, params.height + params.y);
		}

		if(this.textureType) {
			this._createCachedImg();
			ctx = this._cachedCtx;
		}

		ctx.fillStyle = params.color;
		ctx.fillRect(params.x, params.y, params.width, params.height);

		if(this.textureType) {
			var gl = meta.ctx;
			gl.bindTexture(gl.TEXTURE_2D, this.image);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
		}

		this.isLoaded = true;
	},


	/**
	 * Tile source texture on top.
	 * @param data {Object} Parameters.
	 * @param data.texture {Resource.Texture|String} Texture object or name of the texture in resources pool.
	 * @param data.x {Number=} Offset on x axis.
	 * @param data.y {Number=} Offset on y axis.
	 * @param data.width {Number=} Width of area to tile.
	 * @param data.height {Number=} Height of area to tile.
	 */
	tile: function(data)
	{
		if(!data) {
			console.warn("[Resource.Texture.tile]:", "No parameters specified.");
			return;
		}

		if(typeof(data.texture) === "string") {
			data.texture = Resource.ctrl.getTexture(data.texture);
		}

		if(!data.texture) {
			console.warn("[Resource.Texture.tile]:", "Undefined texture.");
			return;
		}

		var texture = data.texture;

		if(texture.textureType === Resource.TextureType.WEBGL) 
		{
			if(texture._canvasCache) {
				texture = texture._canvasCache;
			}
			else
			{
				texture._canvasCache = new Resource.Texture(Resource.TextureType.CANVAS, texture.path);
				texture._canvasCache.load();
				texture = texture._canvasCache;

				this._loadCache = { name: "tile", data: data };
				this.isLoaded = false;
				texture.subscribe(this, this.onTextureCacheEvent);
				return;	
			}		
		}

		// If source texture is not yet loaded. Create chace and wait for it.
		if(!texture._isLoaded) 
		{
			if(!texture._isLoading) {
				texture.load();
			}

			this._loadCache = { name: "tile", data: data };
			this.isLoaded = false;
			texture.subscribe(this, this.onTextureCacheEvent);
			return;
		}

		var ctx = this.ctx;
		data.x = data.x || 0;
		data.y = data.y || 0;
		data.width = data.width || this.fullWidth;
		data.height = data.height || this.fullHeight;

		if(!data.drawOver) {
			this.resize(data.width, data.height);
		}

		if(data.center) {
			data.x += (this.fullWidth & (texture.fullWidth - 1)) / 2;
			data.y += (this.fullHeight & (texture.fullHeight - 1)) / 2;		
		}

		if(this.textureType) {
			this._createCachedImg();
			ctx = this._cachedCtx;
		}

		var posX = data.x;
		var posY = data.y;
		var numX = Math.ceil(this.fullWidth / texture.fullWidth);
		var numY = Math.ceil(this.fullHeight/ texture.fullHeight);

		if(posX > 0) {
			numX += Math.ceil(posX / texture.fullWidth);
			posX -= texture.fullWidth;
		}
		if(posY > 0) {
			numY += Math.ceil(posY / texture.fullHeight);
			posY -= texture.fullHeight;
		}

		var origY = posY;

		for(var x = 0; x < numX; x++)
		{
			for(var y = 0; y < numY; y++) {
				ctx.drawImage(texture.image, posX, posY);
				posY += texture.height;
			}

			posX += texture.width;
			posY = origY;
		}

		if(this.textureType) {
			var gl = meta.ctx;
			gl.bindTexture(gl.TEXTURE_2D, this.image);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
		}

		this.isLoaded = true;
	},

	/**
	 * Stroke/fill lines.
	 * @param params {Object} Parameters.
	 * @param params.buffer {Array} Array with line points.
	 * @param params.color {Hex} Fill color.
	 * @param [params.borderColor=#000000] {Hex=} Border color.
	 * @param params.borderWidth {Number} Thickness of border line.
	 * @param [params.lineCap="butt"] {String=} Type of line endings.
	 * @param params.lineDash {Array} Array with sequence for dashing.
	 * @param params.drawOver {Boolean} Flag - draw over previous texture content.
	 * @param params.addWidth {Number} Add to width.
	 * @param params.addHeight {Number} Add to height.	 
	 */
	stroke: function(params)
	{
		if(!params) {
			console.warn("[Resource.Texture.stroke]:", "No parameters specified.");
			return;
		}

		if(!params.buffer) {
			console.warn("[Resource.Texture.stroke]:", "No buffer defined.");
			return;
		}		

		// Calculate bounds.
		var minX = Number.POSITIVE_INFINITY, minY = minX, maxX = Number.NEGATIVE_INFINITY, maxY = maxX;

		var item, i, x, y;
		var buffer = params.buffer;
		var numItems = buffer.length;
		for(i = 0; i < numItems; i += 2)
		{
			x = buffer[i]; 
			y = buffer[i + 1];

			if(x < minX) { minX = x; }
			if(y < minY) { minY = y; }
			if(x > maxX) { maxX = x; }
			if(y > maxY) { maxY = y; }
		}

		if(minX > 0) { minX = 0; }
		if(minY > 0) { minY = 0; }

		var ctx = this.ctx;
		params.addWidth = params.addWidth || 0;
		params.addHeight = params.addHeight || 0;
		params.borderWidth = params.borderWidth || 1;
		if(!params.color && !params.borderColor) {
			params.borderColor = "#000000"; 
		}

		var halfLineWidth = params.borderWidth / 2;
		var offsetX = -minX + halfLineWidth + (params.addWidth / 2);
		var offsetY = -minY + halfLineWidth + (params.addHeight / 2);
		if(!params.drawOver) 
		{
			this.resize(maxX - minX + params.borderWidth + params.addWidth, 
				maxY - minY + params.borderWidth + params.addHeight);
		}

		if(this.textureType) {
			this._createCachedImg();
			ctx = this._cachedCtx;
		}

		ctx.lineWidth = params.borderWidth;
		if(params.lineCap) {
			ctx.lineCap = params.lineCap;
		}
		if(params.lineDash) {
			ctx.setLineDash(params.lineDash);
		}

		ctx.beginPath();
		ctx.moveTo(buffer[0] + offsetX, buffer[1] + offsetY);
		for(i = 2; i < numItems; i += 2) {
			ctx.lineTo(buffer[i] + offsetX, buffer[i + 1] + offsetY);
		}

		if(params.color) {
			ctx.fillStyle = params.color;
			ctx.closePath();
			ctx.fill();
		}

		if(params.borderColor) {
			ctx.strokeStyle = params.borderColor;
			ctx.stroke();
		}

		if(this.textureType === Resource.TextureType.WEBGL) {
			var gl = meta.ctx;
			gl.bindTexture(gl.TEXTURE_2D, this.image);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
		}

		this.isLoaded = true;
	},

	strokeBorder: function(params)
	{
		if(!params) {
			console.warn("[Resource.Texture.strokeBorder]:", "No parameters specified.");
			return;
		}

		params.width = params.width || this.fullWidth;
		params.height = params.height || this.fullHeight;

		var lineWidth = 1;
		if(params.borderWidth) {
			lineWidth = params.borderWidth;
		}

		params.buffer = [ 0, 0, params.width - lineWidth, 0, params.width - lineWidth, 
			params.height - lineWidth, 0, params.height - lineWidth, 0, 0 ];

		this.stroke(params);
	},

	strokeGrid: function(params)
	{

	},

	/**
	 * Fill texture with arc.
	 * @param params {Object} Parameters.
	 * @param [params.x=0] {Number=} Offset from the left.
	 * @param [params.y=0] {Number=} Offset from the top.
	 * @param params.color {Hex} Color of the filled arc.
	 * @param [params.borderColor="#000000"] {Hex=} Color of the filled rect.
	 * @param params.radius {Number=} Radius of arc.
	 * @param [params.startAngle=0] {Number=} Starting angle from where arch is being drawn from.
	 * @param [params.endAngle=Math.PI*2] {Number=} End angle to where arc form is drawn.
	 * @param [params.borderWidth=1] {Number=} Thickness of the line.
	 * @param [params.drawOver=false] {Boolean=} Flag - draw over previous texture content.
	 */
	arc: function(params)
	{
		if(!params) {
			console.warn("[Resource.Texture.arc]:", "No parameters specified.");
			return;
		}

		var ctx = this.ctx;
		params.x = params.x || 0;
		params.y = params.y || 0;
		params.radius = params.radius || 5;
		params.startAngle = params.startAngle || 0;
		params.endAngle = params.endAngle || (Math.PI * 2);
		params.borderWidth = params.borderWidth || 1;
		if(!params.color && !params.borderColor) {
			params.borderColor = params.borderColor || "#000000";
		}

		var size = params.radius * 2 + params.borderWidth;
		if(!params.drawOver) {
			this.resize(params.x + size, params.y + size);
		}		

		if(this.textureType) {
			this._createCachedImg();
			ctx = this._cachedCtx;
		}

		ctx.lineWidth = params.borderWidth;
		
		ctx.clearRect(0, 0, this.fullWidth, this.fullHeight);
		ctx.beginPath();
		ctx.arc(params.x + params.radius + (params.borderWidth / 2), params.y + params.radius + (params.borderWidth / 2),
			params.radius, params.startAngle, params.endAngle, false);
		ctx.closePath();

		if(params.color) {
			ctx.fillStyle = params.color;
			ctx.fill();
		}

		if(params.borderColor) {
			ctx.strokeStyle = params.borderColor;
			ctx.stroke();
		}		

		if(this.textureType === Resource.TextureType.WEBGL) {
			var gl = meta.ctx;
			gl.bindTexture(gl.TEXTURE_2D, this.image);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
		}

		this.isLoaded = true;
	},

	/**
	 * Draw a rounded rectangle.
	 * @param color {String} The color of stroke. Color should be in hex or css color name.
	 * @param width {Number} The width of the rectangle
	 * @param height {Number} The height of the rectangle
	 * @param radius {Number} The corner radius. Defaults to 5;
	 * @param params {Object} Additional parameters.
	 * @param params.borderWidth {Number=} Line width.
	 * @param params.fill {String=} The color of
	 */
	roundRect: function(color, width, height, radius, params)
	{
		if(!params) {
			params = {};
		}

		radius = radius || 5;
		params.borderWidth = params.borderWidth || 1;

		var x = params.borderWidth / 2;
		var y = params.borderWidth / 2;

		this.upResize(width + params.borderWidth, height + params.borderWidth);

		var ctx = null;
		if(this.textureType === Resource.TextureType.WEBGL)
		{
			this._tmpCanvas.width = this._width;
			this._tmpCanvas.height = this._height;
			ctx = this._tmpCtx;
		}
		else {
			ctx = this.ctx;
		}

		ctx.strokeStyle = color;
		ctx.lineWidth = params.borderWidth;
		ctx.beginPath();
		ctx.moveTo(x + radius, y);
		ctx.lineTo(x + width - radius, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
		ctx.lineTo(x + width, y + height - radius);
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
		ctx.lineTo(x + radius, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
		ctx.lineTo(x, y + radius);
		ctx.quadraticCurveTo(x, y, x + radius, y);
		ctx.closePath();
		ctx.stroke();

		if(params.fill) {
			ctx.fillStyle = params.fill;
			ctx.fill();
		}

		if(this.textureType === Resource.TextureType.WEBGL) {
			var gl = meta.ctx;
			gl.bindTexture(gl.TEXTURE_2D, this.image);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._tmpCanvas);
		}

		this.isLoaded = true;
	},

	bazier: function(color, path, params)
	{
		this.isLoaded = true;
	},


	/**
	 * Emulate(fake) animation dynamically to unaniamted textures.
	 * @param type {Resource.AnimType} Animation type.
	 * @param frames {Number} Number of frames in animation.
	 */
	emulateAnim: function(type, frames)
	{
		if(!this._isLoaded) {
			console.warn("[Resource.Texture.emulateAnim]:", "Texture is not loaded yet.");
			return;
		}

		var animType = Resource.AnimType;

		if(type === animType.NONE) {
			this._anim = null;
		}
		else
		{
			this._anim = {
				type: type
			};

			this.isAnimated = true;
			this.numFrames = frames;

			if(type === animType.LINEAR_H) {
				this._anim.fill = this._width / (frames - 1);
			}
			else if(type === animType.LINEAR_V) {
				this._anim.fill = this._height / (frames - 1);
			}
			else if(type === animType.RADIAL)
			{
				console.log("[Resource.Texture.emulateAnim]:", "RADIAL is currently unsupported type.");
				this._anim.halfWidth = (this.fullWidth / 2);
				this._anim.halfHeight = (this.fullHeight / 2);
				this._anim.fill = (Math.PI * 2 / (frames - 1));
				this._anim.length = Math.sqrt(this._anim.halfWidth * this._anim.halfWidth +
					this._anim.halfHeight * this._anim.halfHeight) + 1 | 0;
			}
			else if(type === animType.RADIAL_TOP_LEFT || type === animType.RADIAL_TOP_RIGHT ||
				type === animType.RADIAL_BOTTOM_LEFT || type === animType.RADIAL_BOTTOM_RIGHT)
			{
				this._anim.fill = (Math.PI * 2 / ((frames - 1) * 4));
				this._anim.length = Math.sqrt(this.fullWidth * this.fullWidth + this.fullHeight * this.fullHeight) + 1 | 0;
			}
		}

		this.isLoaded = true;
	},


	gradient: function(data)
	{
		if(!data) {
			console.warn("[Resource.Texture.gradient]:", "No data specified.");
			return;
		}

		if(!data.colors || !data.colors.length) {
			console.warn("[Resource.Texture.gradient]:", "No data.colors specified.");
			return;
		}

		var ctx = this.ctx;
		data.dirX = data.dirX || 0;
		data.dirY = data.dirY || 0;
		data.width = data.width || this.fullWidth || 1;
		data.height = data.height || this.fullHeight || 1;

		if(!data.drawOver) {
			this.resize(data.width, data.height);
		}

		if(this.textureType) {
			this._createCachedImg();
			ctx = this._cachedCtx;
		}

		var colors = data.colors;
		var numColors = colors.length;

		var x1, x2, y1, y2;
		if(data.dirX < 0) {
			x1 = this.fullWidth
			x2 = 0;
		}
		else {
			x1 = 0;
			x2 = this.fullWidth * data.dirX;
		}
		if(data.dirY < 0) {
			y1 = this.fullHeight;
			y2 = 0;
		}
		else {
			y1 = 0;
			y2 = this.fullHeight * data.dirY;
		}

		var gradient = ctx.createLinearGradient(x1, y1, x2, y2);
		for(var i = 0; i < numColors; i++) {
			gradient.addColorStop(colors[i][0], colors[i][1]);
		}

		ctx.fillStyle = gradient;

		ctx.clearRect(0, 0, this.fullWidth, this.fullHeight);
		ctx.fillRect(0, 0, this.fullWidth, this.fullHeight);

		if(this.textureType) {
			var gl = meta.ctx;
			gl.bindTexture(gl.TEXTURE_2D, this.image);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
		}

		this.isLoaded = true;
	},


	/**
	 * Callback used if ond to another texture.
	 * @param event {*} Event type.
	 * @param data {*} Event data.
	 */
	onTextureEvent: function(event, data)
	{
		if(event === Resource.Event.LOADED) {
			this.tile(data);
			data.unsubscribe(this);
		}
	},


	construct: function(data)
	{
		if(!data) {
			console.warn("[Resource.Texture.buildMatrix]:", "No parameters specified.");
			return;
		}

		this._constructTex(data, "center");
		this._constructTex(data, "left");
		this._constructTex(data, "right");

		data.width = data.width || this.fullWidth;
		data.height = data.height || this.fullHeight;
		this.resize(data.width, data.height);
		console.log(this._width, this._height);

		var left = ((data.width / 2) - (data.center.width / 2)) | 0;
		var top = ((data.height / 2) - (data.center.height / 2)) | 0;
		console.log(left);

		var ctx = this.ctx;

//		// Left.
//		var tex = data.left;
//		var pos = -tex.width + left;
//		var numTex = Math.ceil(left / tex.width);
//		for(var n = 0; n < numTex; n++) {
//			ctx.drawImage(tex, pos, 0);
//			pos += tex.width;
//		}

		// Center.
		ctx.drawImage(data.center, left, top);

//		// Right.
//		tex = data.right;
//		pos = left + data.center.width;
//		numTex = Math.ceil(left / tex.width);
//		console.log(numTex);
//		for(n = 0; n < numTex; n++) {
//			ctx.drawImage(tex, pos, 0);
//			pos += tex.width;
//		}

		if(this.textureType) {
			var gl = meta.ctx;
			gl.bindTexture(gl.TEXTURE_2D, this.image);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
		}

		this.isLoaded = true;
	},

	_constructTex: function(data, texture)
	{
		if(data[texture] && typeof(data[texture]) === "string")
		{
			data[texture] = Resource.ctrl.getTexture(data[texture]);

			if(!data[texture]) {
				console.warn("[Resource.Texture.buildMatrix]:", "Undefined texture for: " + texture);
				return;
			}

			data[texture] = data[texture].image;
		}
	},	


	/**
	 * Generate alpha mask from texture.
	 * @returns {Resource.Texture} Generated alpha mask texture.
	 */
	generateAlphaMask: function()
	{
		if(!this._isLoaded) {
			console.warn("[Resource.Texture.generateMask]:", "Texture is not loaded yet.");
			return;
		}

		if(this.textureType !== 0) {
			console.warn("[Resource.Texture.generateMask]:", "Only canvas textures are supported currently.");
			return;
		}

		var alphaMask = new Resource.Texture(Resource.TextureType.CANVAS);
		alphaMask.resize(this.fullWidth, this.fullHeight);

		var imgData = this.ctx.getImageData(0, 0, this.fullWidth, this.fullHeight);
		var data = imgData.data;
		var numBytes = data.length;

		for(var i = 0; i < numBytes; i += 4) {
			data[i] = 255;
			data[i + 1] = 255;
			data[i + 2] = 255;
		}

		alphaMask.ctx.putImageData(imgData, 0, 0);
		alphaMask.isLoaded = true;

		return alphaMask;
	},


	onTextureCacheEvent: function(data, event)
	{
		if(event === Resource.Event.LOADED) {
			data.unsubscribe(this);
			this[this._loadCache.name](this._loadCache.data);
			this._loadCache = null;
		}
	},


	set x(value) 
	{
		if(!this.ptr) {
			this._x = 0;
			return;
		}

		if(this.textureType) {
			this._xRatio = 1.0 / this.ptr.fullWidth;
			this._x = this._xRatio * value;
		}
		else {
			this._x = value;
		}
	},

	set y(value) 
	{
		if(!this.ptr) {
			this._y = 0;
			return;
		}

		if(this.textureType) {
			this._yRatio = 1.0 / this.ptr.fullHeight;
			this._y = this._yRatio * value;
		}
		else {
			this._y = value;
		}
	},

	get x() { return this._x; },
	get y() { return this._y; },


	set width(value) {
		this._width = value;
		this.update();
	},

	set height(value) {
		this._height = value;
		this.update();
	},

	get width() { return this._width; },
	get height() { return this._height; },


	set offsetX(x)
	{
		this._offsetX = x;
		if(this._isLoaded) {
			this.emit(this, Resource.Event.CHANGED);
		}
	},

	set offsetY(y)
	{
		this._offsetY = y;
		if(this._isLoaded) {
			this.emit(this, Resource.Event.CHANGED);
		}
	},

	get offsetX() { return this._offsetX; },
	get offsetY() { return this._offsetY; },


	set bgTexture(texture)
	{
		if(typeof(texture) === "string")
		{
			var obj = Resource.ctrl.getTexture(texture);
			if(!obj) {
				console.warn("[Resource.Texture.bgTexture]:", "No such texture found: " + texture);
				return;
			}
			texture = obj;
		}

		this._bgTexture = texture;
		this.isLoaded = true;
	},
	get bgTexture() { return this._bgTexture; },


	//
	type: Resource.Type.TEXTURE,
	textureType: Resource.TextureType.UNKNOWN,

	image: null,
	ctx: null,
	_bgTexture: null,

	vbo: null, _vertices: null,

	_x: 0, _y: 0,
	_xRatio: 0.0, _yRatio: 0.0,
	_width: 0, _height: 0,
	fullWidth: 0, fullHeight: 0,
	_widthRatio: 0, _heightRatio: 0,
	_offsetX: 0, _offsetY: 0,

	fps: 0,
	numFrames: 1,
	numFramesX: 1,
	numFramesY: 1,

	isAnimated: false,
	isLoop: false,
	autoPlay: true,
	isAnimReverse: false,
	isEmulateReverse: false,
	fromAtlas: false,

	_tmpImg: null,
	_tmpCtx: null,
	_cachedImg: null,
	_cachedCtx: null,

	_anim: null,
	_frames: null,

	_loadCache: null,
	_canvasCache: null
});