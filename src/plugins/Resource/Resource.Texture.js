"use strict";

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
({
	/**
	 * Constructor.
	 * Will generate by default texture based on what rendering is used.
	 * @param path {String=} Texture path.
	 * @function
	 */
	init: function(data)
	{
		this.generate();

		// If argument is string threat as path:
		var type = typeof(data);
		if(type === "string") {
			this.load(data);
		}
		else if(type === "object") 
		{
			for(var key in data) {
				this[key] = data[key];
			}

			if(this.framesX > 1 || this.framesY > 1) {
				this.frames = this.framesX * this.framesY;
				this.animated = true;
			}

			if(this.path) {
				this.load(this.path);
			}
		}
	},

	remove: function()
	{

	},

	/**
	 * Generate image object depending from type.
	 * @function
	 */
	generate: function()
	{
		this.loaded = true;

		this.canvas = document.createElement("canvas");
		this.canvas.width = this.trueFullWidth;
		this.canvas.height = this.trueFullHeight;

		this.ctx = this.canvas.getContext("2d");
	},

	/**
	 * Load texture from the source.
	 * @param path {string} Source of texture to load from.
	 * @function
	 */
	load: function(path)
	{
		if(this.loading) { return; }
		this.loaded = false;

		if(!path) { return; }
		this.path = path;

		// Check if path is missing it's extension:
		var wildCardIndex = this.path.lastIndexOf(".");
		if(wildCardIndex === -1 || this.path.length - wildCardIndex > 4) {
			this.path += ".png";
		}

		if(meta.cache.currResolution) {
			this.fullPath = Resource.ctrl.rootPath + meta.cache.currResolution.path + this.path;
		}
		else {
			this.fullPath = Resource.ctrl.rootPath + this.path;
		}

		var self = this;
		var img = new Image();

		img.onload = function()
		{
			// Check if still is relevant:
			//if(!self.loading) { return; }

			if(!img.complete) {
				console.warn("(Resource.Texture.load) Could not load texture from - " + img.src);
				Resource.ctrl.loadFailed(self);
				return;
			}

			self.createFromImg(img);
			Resource.ctrl.loadSuccess(self);
		};

		img.onerror = function(event) {
			Resource.ctrl.loadFailed(self);
		};		

		img.src = this.fullPath;

		Resource.ctrl.addToLoad(this);

		// var self = this;
		// var img = new Image();

		// if(meta.engine.isWebGL) {
		// 	img.crossOrigin = "anonymous";
		// }


		// if(this._isLoaded) {
		// 	this._isReloading = true;
		// }

		// img.src = this.fullPath;
	},

	/**
	 * Create texture from DOM Image object.
	 * @param img {Image} Image file.
	 * @function
	 */
	createFromImg: function(img)
	{
		if(this._loaded) {
			this.clear();
		}

		this.resizeSilently(img.width, img.height);
		this.ctx.drawImage(img, 0, 0);
		this.unitRatio = meta.unitRatio;

		this._reloading = false;
		this.loaded = true;
	},

	_createCachedImg: function()
	{
		if(this._cachedImg) { return; }

		this._cachedImg = document.createElement("canvas");
		this._cachedImg.width = this.trueFullWidth;
		this._cachedImg.height = this.trueFullHeight;
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
		this.resizeSilently(width, height);

		this.loaded = true;
	},

	resizeSilently: function(width, height) 
	{
		if(this.trueFullWidth === width && this.trueFullHeight === height) { return; }

		this.trueFullWidth = width;
		this.trueFullHeight = height;

		if(this.animated) {
			this.trueWidth = width / this.framesX;
			this.trueHeight = height / this.framesY;
		}
		else {
			this.trueWidth = width;
			this.trueHeight = height;
		}

		var unitRatio = meta.engine.unitRatio;
		this.width = (this.trueWidth * unitRatio) + 0.5 | 0;
		this.height = (this.trueHeight * unitRatio) + 0.5 | 0;
		this.fullWidth = (this.trueFullWidth * unitRatio) + 0.5 | 0;
		this.fullHeight = (this.trueFullHeight * unitRatio) + 0.5 | 0;	
		this.halfWidth = this.width * 0.5;
		this.halfHeight = this.height * 0.5;	

		if(this._loaded)
		{
			if(this.canvas.width > 1 && this.canvas.height > 1)
			{
				this._tmpImg.width = this.canvas.width;
				this._tmpImg.height = this.canvas.height;
				this._tmpCtx.drawImage(this.canvas, 0, 0);

				this.canvas.width = this.trueFullWidth;
				this.canvas.height = this.trueFullHeight;
				this.ctx.drawImage(this._tmpImg, 0, 0);
			}
			else {
				this.canvas.width = this.trueFullWidth;
				this.canvas.height = this.trueFullHeight;					
			}
		}
		else {
			this.canvas.width = this.trueFullWidth;
			this.canvas.height = this.trueFullHeight;
		}
	},

	upResize: function(width, height)
	{
		if(width < this.trueFullWidth) {
			width = this.trueFullWidth;
		}
		if(height < this.trueFullHeight) {
			height = this.trueFullHeight;
		}

		this.resize(width, height);
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
		if(!this.fromAtlas) {
			ctx.drawImage(this.canvas, x, y);
		}
		else {
			ctx.drawImage(this.ptr.canvas, this._x, this._y, this.trueWidth, this.trueHeight, x, y, this.trueWidth, this.trueHeight);
		}
	},


	/**
	 * Draw frame from the texture.
	 * @param ctx {*} Context to draw on.
	 * @param x {Number} Offset on x axis from left.
	 * @param y {Number} Offset on y axis from top.
	 * @param frame {Number} Frame to draw.
	 * @function
	 */
	drawFrame: function(ctx, x, y, frame)
	{
		ctx.drawImage(this.canvas,
			(this.trueWidth * (frame % this.framesX)),
			(this.trueHeight * Math.floor(frame / this.framesX)),
			this.trueWidth, this.trueHeight, x, y, this.trueWidth, this.trueHeight);
	},

	/**
	 * Clear the texture.
	 * @function
	 */
	clear: function() {
		this.ctx.clearRect(0, 0, this.trueFullWidth, this.trueFullHeight);
	},

	/**
	 * Draw over texture
	 */
	drawOver: function(texture, x, y) 
	{
		if(!texture) {
			console.warn("(Resource.Texture.drawOver) No texture specified.");
			return;
		}

		x = x || 0;
		y = y || 0;

		if(typeof(texture) === "string") 
		{
			var obj = meta.getTexture(texture);
			if(!obj) {
				console.warn("(Resource.Texture.drawOver) No such texture with name - " + texture);
				return;
			}
			texture = obj;	
		}

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

				this._loadCache = { name: "drawOver", texture: texture, x: x, y: y };
				this.isLoaded = false;
				texture.subscribe(this, this.onTextureCacheEvent);
				return;	
			}		
		}

		var ctx = this.ctx;
		if(this.textureType) {
			this._createCachedImg();
			ctx = this._cachedCtx;
		}

		ctx.drawImage(texture.image, x, y);

		if(this.textureType) {
			var gl = meta.ctx;
			gl.bindTexture(gl.TEXTURE_2D, this.image);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
		}

		this.isLoaded = true;		
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
		alphaMask.resize(this.trueFullWidth, this.trueFullHeight);

		var imgData = this.ctx.getImageData(0, 0, this.trueFullWidth, this.trueFullHeight);
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
		if(event === Resource.Event.LOADED) 
		{
			data.unsubscribe(this);
			if(this._loadCache.name === "drawOver") {
				this.drawOver(this._loadCache.texture, this._loadCache.x, this._loadCache.y);
			}
			else {
				this[this._loadCache.name](this._loadCache.data);
			}
			this._loadCache = null;
		}
	},

	set offsetX(x)
	{
		this._offsetX = x;
		if(this._loaded) {
			this.emit(this, Resource.Event.CHANGED);
		}
	},

	set offsetY(y)
	{
		this._offsetY = y;
		if(this._loaded) {
			this.emit(this, Resource.Event.CHANGED);
		}
	},

	get offsetX() { return this._offsetX; },
	get offsetY() { return this._offsetY; },

	getData: function() {
		return this.ctx.getImageData(0, 0, this.trueWidth, this.trueHeight).data;
	},

	getPixelAt: function(x, y) {
		return this.ctx.getImageData(x, y, 1, 1).data;
	},

	applyCanvas: function(canvas) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.resize(canvas.width, canvas.height);
	},

	//
	type: Resource.Type.TEXTURE,

	ptr: null,
	canvas: null,
	ctx: null,

	_x: 0, _y: 0,
	_width: 0, _height: 0,
	fullWidth: 0, fullHeight: 0,
	_widthRatio: 0, _heightRatio: 0,
	_offsetX: 0, _offsetY: 0,
	unitRatio: 1,

	fps: 9,
	frames: 1,
	framesX: 1,
	framesY: 1,
	
	fromAtlas: false,

	reloading: false,

	_tmpImg: null,
	_tmpCtx: null,
	_cachedImg: null,
	_cachedCtx: null,

	_anim: null,
	_frames: null,

	_loadCache: null,
	_canvasCache: null
});
