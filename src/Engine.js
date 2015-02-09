"use strict";

/**
 * @namespace
 * @property engine {meta.Engine} Instance of the engine object.
 * @property loader {meta.Loader} Instance of the loader object.
 * @property device {meta.Device} Instance of the device object.
 * @property controllers {Array} Added controllers to the engine.
 * @property channel {Object} Dictionary with created channels.
 * @property shader {Object} Dictionary with created shaders.
 * @property element {DOM}
 * @property version {string} Version.
 * @property enablemeta {Boolean} Create default meta tags in DOMs head.
 * @property enableWebGL {Boolean} Enable WebGL acceleration if possible.
 * @property modules {Object} List with installed modules.
 * @property importUrl {String} Default path from where modules are imported from.
 */

meta.channels = {};
meta.loadingView = null;
meta.world = null;

meta.enableAdaptive = true;
meta.tUpdate = 1000 / 60;
meta.unitSize = 1;
meta.unitRatio = 1;
meta.maxUnitSize = 1;
meta.maxUnitRatio = 1;
meta.utils = {};
meta.modules = {};
meta.importUrl = "http://meta.infinite-games.com/store/";


meta.engine = 
{
	/**
	 * @description Initialize engine instance.
	 * @function
	 */
	create: function()
	{
		this._container = document.body;
		this._container.style.cssText = this.elementStyle;

		this._createRenderer();
		this._printInfo();

		if(meta.autoMetaTags) {
			this._addMetaTags();
		}

		meta.camera = new meta.Camera();	

		this.chn = {
			resize: meta.createChannel(meta.Event.RESIZE),
			adapt: meta.createChannel(meta.Event.FULLSCREEN),
			focus: meta.createChannel(meta.Event.FOCUS),
			fullScreen: meta.createChannel(meta.Event.FULLSCREEN),
			debug: meta.createChannel(meta.Event.DEBUG)
		};

		this.sortAdaptions();
		this.onResize();

		meta.world = new meta.World(this.width, this.height);

		//
		var self = this;
		this._onResizeCB = function(event) { console.log("resize2"); self.onResize(); };
		this._onFocusCB = function(event) { self.onFocusChange(true); };
		this._onBlurCB = function(event) { self.onFocusChange(false); };

		window.addEventListener("resize", this._onResizeCB, false);
		window.addEventListener("orientationchange", this._onResizeCB, false);

		// Page Visibility API.
		if(meta.device.hidden) {
			this._onVisibilityChangeCB = function() { self.onVisibilityChange(); };
			document.addEventListener(meta.device.visibilityChange, this._onVisibilityChangeCB);
		}
		else {
			window.addEventListener("focus", this._onFocusCB);
			window.addEventListener("blur", this._onBlurCB);
		}

		// Fullscreen API.
		if(meta.device.support.fullScreen) {
			this._onFullScreenChangeCB = function() { self.onFullScreenChangeCB(); };
			document.addEventListener(meta.device.fullScreenOnChange, this._onFullScreenChangeCB);
		}

		this.tNow = Date.now();
		this.start();
	},

	start: function()
	{
		var cache = meta.cache;

		// Create master view.
		var masterView = new meta.View("master");
		cache.views["master"] = masterView;
		cache.view = masterView;

		// // Create loading view.
		// var loadingView = new meta.View("loading");
		// //loadingView.bgColor = "#000000";
		// loadingView.z = 999999;
		// cache.views["loading"] = loadingView;
		// cache.loadingView = loadingView;	

		var numFuncs = cache.initBuffer.length;
		for(var i = 0; i < numFuncs; i++) {
			cache.initBuffer[i]();
		}

		this._addCorePlugins();
		this.isInited = true;

		console.log(" ");

		this._load();
	},

	_load: function()
	{
		console.log("%c(Loading started)", "background: #eee; font-weight: bold;");

		this.isLoading = true;

		if(!meta._loadAllScripts()) {
			this._continueLoad();
		}
	},

	_continueLoad: function()
	{
		var i;
		var cache = meta.cache;

		var numFuncs = cache.loadBuffer.length;
		for(i = 0; i < numFuncs; i++) {
			cache.loadBuffer[i]();
		}

		var ctrl;
		var numCtrl = this.controllers.length;
		for(i = 0; i < numCtrl; i++) 
		{
			ctrl = this.controllers[i];
			ctrl.load();
			ctrl.isLoaded = true;
		}

		this.isCtrlLoaded = true;
		meta.cache.view.isActive = true;
		this.isLoading = false;

		if(Resource.ctrl.numToLoad === 0) {
			this.onResourcesLoaded();
		}
	},

	update: function()
	{
		this.updateFrameID++;
		this.tNow = Date.now();
		var tDelta = this.tNow - this.tUpdate;

		if(this.pause) { tDelta = 0; }
		if(tDelta > 250) { tDelta = 250; }

		var tDeltaF = tDelta / 1000;

		meta.renderer.update(tDeltaF);

		if(meta.update) {
			meta.update(tDeltaF);
		}

		// Update controllers.
		var numCtrl = this.controllers.length;
		for(var i = 0; i < numCtrl; i++) {
			this.controllers[i].update(tDeltaF);
		}

		// Remove flagged controllers.
		if(this.controllersToRemove.length)
		{
			var ctrlToRemove;
			var numCtrls = this.controllers.length;
			var numCtrlsToRemove = this.controllersToRemove.length;
			for(var n = 0; n < numCtrlsToRemove; n++)
			{
				ctrlToRemove = this.controllersToRemove[n];

				for(i = 0; i < numCtrls; i++)
				{
					if(this.controllers[i] === ctrlToRemove) {
						this.controllers[i] = this.controllers[numCtrls - 1];
						this.controllers.pop();
						break;
					}
				}
			}

			this.controllersToRemove.length = 0;
		}

		this._updateTimers(tDelta);

		this.tUpdate = this.tNow;
		var tSample = Date.now();
		var tSleep = Math.max(0, meta.tUpdate - (tSample - this.tNow));
		window.setTimeout(this._updateLoop, tSleep);
	},

	_updateTimers: function(tDelta)
	{
		var timer, i;
		for(i = 0; i < this._numTimers; i++)
		{
			timer = this._timers[i];
			if(timer.isPaused) { continue; }

			timer.tAccumulator += tDelta;

			while(timer.tAccumulator >= timer.tDelta)
			{
				timer.tAccumulator -= timer.tDelta;

				if(timer.numTimes !== 0) {
					timer.func.call(timer.owner, timer);
				}

				timer.tStart += timer.tDelta;

				if(timer.numTimes !== -1)
				{
					timer.numTimes--;

					if(timer.numTimes <= 0) {
						this._timersToRemove.push(timer);
						break;
					}
				}
			}
		}

		// Remove timers that are listed.
		if(this._timersToRemove.length)
		{
			var timerToRemove;
			var numTimersToRemove = this._timersToRemove.length;
			for(i = 0; i < numTimersToRemove; i++)
			{
				timerToRemove = this._timersToRemove[i];

				for(var n = 0; n < this._numTimers; n++)
				{
					timer = this._timers[n]

					if(timer.id === timerToRemove.id)
					{
						if(timer.onRemove) {
							timer.onRemove();
						}

						this._timers[n] = this._timers[this._numTimers-1];
						this._timers.pop();
						this._numTimers--;
						break;
					}
				}
			}
		}
	},

	render: function()
	{
		this.frameID++;

		var tNow = Date.now();
		var tDelta = tNow - this.tRender;
		if(tDelta > 250) { tDelta = 250; }

		var tDeltaF = tDelta / 1000;

		if(tNow - this.tFPS >= 1000) {
			this.tFPS = tNow;
			this.fps = this._fpsCounter;
			this._fpsCounter = 0;
		}

		meta.renderer.render(tDeltaF);

		if(meta.render) {
			meta.render(tDeltaF);
		}		

		this._fpsCounter++;
		this.tRender = tNow;

		requestAnimationFrame(this._renderLoop);
	},

	sortAdaptions: function()
	{
		var scope = meta;
		var resolutions = scope.cache.resolutions;
		if(!resolutions) { return; }

		var numResolutions = resolutions.length;
		if(numResolutions <= 1) { return; }

		resolutions.sort(function(a, b) {
			var length_a = scope.math.length2(a.width, a.height);
			var length_b = scope.math.length2(b.width, b.height);
			return length_a - length_b;
		});

		var lowestResolution = resolutions[0];
		var reso, prevReso;
		for(var i = 1; i < numResolutions; i++) {
			prevReso = resolutions[i - 1];
			reso = resolutions[i];
			reso.unitSize = (reso.height / lowestResolution.height);
			reso.zoomThreshold = prevReso.unitSize + ((reso.unitSize - prevReso.unitSize) / 100) * 33;
		}

		meta.maxUnitSize = resolutions[numResolutions - 1].unitSize;
		meta.maxUnitRatio = 1.0 / meta.maxUnitSize;

		scope.camera.bounds(lowestResolution.width, lowestResolution.height);		
	},

	adapt: function()
	{
		var scope = meta;
		var resolutions = scope.cache.resolutions;
		if(!resolutions) { return false; }

		var numResolutions = resolutions.length;
		if(numResolutions < 1) { return false; }

		var resolution;
		var newResolution = resolutions[0];
		var zoom = scope.camera.zoom;

		for(var i = numResolutions - 1; i >= 0; i--) 
		{
			resolution = resolutions[i];
			if(zoom >= resolution.zoomThreshold) {
				newResolution = resolution;
				break;
			}
		}		

		if(newResolution === scope.cache.currResolution) {
			return true;
		}

		scope.cache.currResolution = newResolution;
		scope.unitSize = newResolution.unitSize;	
		scope.unitRatio = 1.0 / scope.unitSize;	
		this.chn.adapt.emit(newResolution, meta.Event.ADAPT);

		return true;
	},

	onResourcesLoaded: function()
	{
		this.isLoaded = true;

		console.log("%c(Loading ended)", "background: #eee; font-weight: bold;");

		//
		var numCtrl = this.controllers.length;
		for(var i = 0; i < numCtrl; i++) {
			this.controllers[i].ready();
		}

		this.isReady = true;

		var numFuncs = meta.cache.readyBuffer.length;
		for(var i = 0; i < numFuncs; i++) {
			meta.cache.readyBuffer[i]();
		}

		this._start();
	},

	/* Resizing */
	onResize: function() {
		this._resize(this.meta.cache.width, this.meta.cache.height);
	},

	resize: function(width, height) 
	{
		var cache = this.meta.cache;
		cache.width = width || 0;
		cache.height = height || 0;

		this._resize(cache.width, cache.height);
	},

	_resize: function(width, height)
	{
		var container = this._container;

		if(container === document.body) 
		{
			if(width === 0 || width > window.innerWidth) { 
				width = window.innerWidth; 
			}
			if(height === 0 || height > window.innerHeight) { 
				height = window.innerHeight; 
			}
		}
		else 
		{
			if(width === 0 || width > container.clientWidth) { 
				width = container.clientWidth; 
			}
			if(height === 0 || height > container.clientHeight) { 
				height = container.clientHeight; 
			}
		}

		this.width = width | 0;
		this.height = height | 0;
		this.canvas.width = width;
		this.canvas.height = height;
		this.canvas.style.width = (width * this.scaleX) + "px";
		this.canvas.style.height = (height * this.scaleY) + "px";
		//this.ctx.imageSmoothingEnabled = meta.cache.imageSmoothing;

		// this.ctx.mozImageSmoothingEnabled = false
		// this.ctx.webkitImageSmoothingEnabled = false;		

		this._updateOffset();
		this.chn.resize.emit(this, meta.Event.RESIZE);
		
		meta.renderer.needRender = true;
	},

	scale: function(scaleX, scaleY)
	{
		this.scaleX = scaleX || 1.0;
		this.scaleY = scaleY || this.scaleX;

		this._resize(this.meta.cache.width, this.meta.cache.height);
	},

	onFocusChange: function(value)
	{
		this.isFocus = value;
		if(this.enablePauseOnBlur) {
			this.pause = !value;
		}

		this.chn.focus.emit(value, meta.Event.FOCUS);
	},

	onVisibilityChange: function()
	{
		if(document[meta.device.hidden]) {
			this.onFocusChange(false);
		}
		else {
			this.onFocusChange(true);
		}
	},

	onFullScreenChangeCB: function()
	{
		var isFullScreen = document.fullscreenElement || document.webkitFullscreenElement ||
				document.mozFullScreenElement || document.msFullscreenElement;
		meta.device.isFullScreen = !!isFullScreen;
	},

	onCtxLost: function()
	{
		console.log("(Context lost)");
	},

	onCtxRestored: function()
	{
		console.log("(Context restored)");
	},

	_addMetaTags: function()
	{
		if(meta.cache.metaTagsAdded) { return; }

		var contentType = document.createElement("meta");
		contentType.setAttribute("http-equiv", "Content-Type");
		contentType.setAttribute("content", "text/html; charset=utf-8");
		document.head.appendChild(contentType);

		var encoding = document.createElement("meta");
		encoding.setAttribute("http-equiv", "encoding");
		encoding.setAttribute("content", "utf-8");
		document.head.appendChild(encoding);

		var content = "user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width, height=device-height";
		var viewport = document.createElement("meta");
		viewport.setAttribute("name", "viewport");
		viewport.setAttribute("content", content);
		document.head.appendChild(viewport);

		var appleMobileCapable = document.createElement("meta");
		appleMobileCapable.setAttribute("name", "apple-mobile-web-app-capable");
		appleMobileCapable.setAttribute("content", "yes");
		document.head.appendChild(appleMobileCapable);

		var appleStatusBar = document.createElement("meta");
		appleStatusBar.setAttribute("name", "apple-mobile-web-app-status-bar-style");
		appleStatusBar.setAttribute("content", "black-translucent");
		document.head.appendChild(appleStatusBar);

		meta.cache.metaTagsAdded = true;
	},

	_createRenderer: function()
	{
		this.canvas = document.createElement("canvas");
		this.canvas.setAttribute("id", "meta-canvas");
		this.canvas.style.cssText = this.canvasStyle;

		var container = this.meta.cache.container;
		if(!container) {
			document.body.appendChild(this.canvas);	
		}
		else {
			container.appendChild(this.canvas);	
		}	

		meta.renderer = new meta.CanvasRenderer();	
	},

	_updateOffset: function()
	{
		this.offsetLeft = 0;
		this.offsetTop = 0;

		var element = this._container;
		if(element.offsetParent)
		{
			do {
				this.offsetLeft += element.offsetLeft;
				this.offsetTop += element.offsetTop;
			} while(element = element.offsetParent);
		}

		var rect = this._container.getBoundingClientRect();
		this.offsetLeft += rect.left;
		this.offsetTop += rect.top;
	},

	_addCorePlugins: function()
	{
		meta.register("Resource");
		//meta.register("UI");
		meta.register("Input");
		meta.register("Physics");
	},

	_start: function()
	{
		var self = this;

		this._updateLoop = function() { self.update(); };
		this._renderLoop = function() { self.render(); };

		this.tUpdate = Date.now();
		this.tRender = this.tUpdate;
		this.tFPS = this.tUpdate;

		setTimeout(this._updateLoop);
		requestAnimationFrame(this._renderLoop);
	},

	_printInfo: function()
	{
		if(meta.device.support.consoleCSS)
		{
			console.log("%c META v" + meta.version + " ", 
				"background: #000; color: white; font-size: 12px; padding: 2px 0 1px 0;",
				"http://infinite-games.com ");

			console.log("%cBrowser: %c" + meta.device.name + " " + meta.device.version + "\t",
				"font-weight: bold; padding: 2px 0 1px 0;",
				"padding: 2px 0 1px 0;");

			console.log("%cRenderer: %cCanvas ", 
				"font-weight: bold; padding: 2px 0 2px 0;", 
				"padding: 2px 0 2px 0;");				
		}
		else 
		{
			console.log("META v" + meta.version + " http://infinite-games.com ");
			console.log("Browser: " + meta.device.name + " " + meta.device.version + "\t");
			console.log("Renderer: Canvas ");				
		}		
	},	

	fullscreen: function(value)
	{
		var device = meta.device;
		if(device.isFulScreen === value) { return; }

		if(value) 
		{
			if(!device.support.fullScreen) {
				console.warn("[meta.engine.enterFullScreen]:", "Device does not support fullscreen.");
				return;
			}

			document.documentElement[device.fullScreenRequest](Element.ALLOW_KEYBOARD_INPUT);			
		}
		else {
			document[meta.device.fullScreenExit]();
		}
	},

	toggleFullscreen: function() {
		this.fullscreen(!meta.device.isFullScreen);
	},

	/* Container */
	set container(element) 
	{
		if(this._container === element) { return; }

		if(this._container) {
			this._container.removeChild(this.canvas);
		}

		if(!element) {
			this._container = document.body;
		}
		else {
			this._container = element;
		}

		this._container.appendChild(this.canvas);
		this.onResize();
	},

	get container() { return this._container; },

	/* Image smoothing */
    set imageSmoothing(value) 
    {
    	meta.cache.imageSmoothing = value;
		if(this.isReady) {
			this.onResize();
		}
    },

    get imageSmoothing() {
		return meta.cache.imageSmoothing;
	},

	set cursor(value) {
		meta.element.style.cursor = value;
	},

	get cursor() {
		return meta.element.style.cursor;
	},	


	set bgColor(hex)
	{
		if(meta.engine.isWebGL)
		{
			if(hex.length === 3) {
				hex += hex.substr(1, 3);
			}

			var color = meta.hexToRgb(hex);
			if(color.r > 0) {
				color.r = color.r / 255;
			}
			if(color.g > 0) {
				color.g = color.g / 255;
			}
			if(color.b > 0) {
				color.b = color.b / 255;
			}

			if(this._bgTransparent) {
				meta.ctx.clearColor(0, 0, 0, 0);
			}
			else {
				meta.ctx.clearColor(color.r, color.g, color.b, 1.0);
			}
		}
		else {
			this._bgColor = hex;
		}
	},

	get bgColor() { return this._bgColor; },

	set bgTransparent(value) {
		this._bgTransparent = value;
		this.bgColor = this._bgColor;
	},

	get bgTransparent() { return this._bgTransparent; },


	//
	elementStyle: "padding:0; margin:0;",
	canvasStyle: "position:absolute; overflow:hidden; translateZ(0); " +
		"-webkit-backface-visibility:hidden; -webkit-perspective: 1000; " +
		"-webkit-touch-callout: none; -webkit-user-select: none; zoom: 1;",


	meta: meta,

	_container: null,
	width: 0, height: 0,
	offsetLeft: 0, offsetTop: 0,
	scaleX: 1.0, scaleY: 1.0,

	canvas: null,
	ctx: null,

	chn: null,

	controllers: [],
	controllersToRemove: [],

	_timers: [],
	_timersToRemove: [],
	_numTimers: 0,

	_onResizeCB: null,
	_onVisibilityChangeCB: null,
	_onFullScreenChangeCB: null,
	_onFocusCB: null,
	_onBlurCB: null,
	_onCtxLostCB: null,
	_onCtxRestoredCB: null,

	isFocus: false,
	isWebGL: false,
	isInited: false,
	isLoaded: false,
	isLoading: false,
	isCtrlLoaded: false,
	isReady: false,

	pause: false,

	projection: null,

	_updateLoop: null,
	_renderLoop: null,
	tUpdate: 0,
	tRender: 0,
	tFPS: 0,
	tNow: 0,
	fps: 0,
	_fpsCounter: 0,

	frameID: 0,
	updateFrameID: 0,

	enablePauseOnBlur: true,

	_bgColor: "#ddd",
	_bgTransparent: false		
}

Object.defineProperty(meta, "init", {
    set: function(func) 
    {
		meta.cache.initBuffer.push(func);
		if(meta.engine && meta.engine.isInited) {
			func();
		}
    }
});

Object.defineProperty(meta, "load", {
    set: function(func) 
    {
		meta.cache.loadBuffer.push(func);
		if(meta.engine && meta.engine.isLoaded) {
			func();
		}
    }   
});

Object.defineProperty(meta, "ready", {
    set: function(func) 
    {
		meta.cache.readyBuffer.push(func);
		if(meta.engine && meta.engine.isReady) {
			func();
		}
    }   
});

/**
 * Render function. Called before all controllers.
 * @param tDelta {Number} Delta time between frames.
 */
meta.render = null;

/**
 * Update function. Called before all controllers.
 * @param tDelta {Number} Delta time between frames.
 */
meta.update = null;
