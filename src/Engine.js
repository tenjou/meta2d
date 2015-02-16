"use strict";

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

		if(this.autoMetaTags) {
			this._addMetaTags();
		}

		// Channels:
		this.chn = {
			resize: meta.createChannel(meta.Event.RESIZE),
			adapt: meta.createChannel(meta.Event.FULLSCREEN),
			focus: meta.createChannel(meta.Event.FOCUS),
			fullScreen: meta.createChannel(meta.Event.FULLSCREEN),
			debug: meta.createChannel(meta.Event.DEBUG)
		};

		// Callbacks:
		var self = this;
		this.cb = {
			resize: function(event) { self.onResize(); },
			focus: function(event) { self.onFocusChange(true); },
			blur: function(event) { self.onFocusChange(false); }
		};

		window.addEventListener("resize", this.cb.resize, false);
		window.addEventListener("orientationchange", this.cb.resize, false);	

		// Page Visibility API:
		if(meta.device.hidden) {
			this.cb.visibilityChange = function() { self.onVisibilityChange(); };
			document.addEventListener(meta.device.visibilityChange, this.cb.visibilityChange);
		}
		else {
			window.addEventListener("focus", this.cb.focus);
			window.addEventListener("blur", this.cb.blur);
		}	

		// Fullscreen API:
		if(meta.device.support.fullScreen) {
			this.cb.fullscreen = function() { self.cb.fullscreen(); };
			document.addEventListener(meta.device.fullScreenOnChange, this.cb.fullscreen);
		}

		meta.subscribe(this, Input.Event.KEY_DOWN, this.onKeyDown);

		meta.camera = new meta.Camera();

		this.sortAdaptions();
		this.onResize();
		
		meta.world = new meta.World(this.width, this.height);		

		this._initAll();
	},

	_initAll: function()
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

		var numFuncs = cache.initFuncs.length;
		for(var i = 0; i < numFuncs; i++) {
			cache.initFuncs[i]();
		}

		this._addCorePlugins();
		this.inited = true;

		console.log(" ");

		this._loadAll();
	},

	_loadAll: function()
	{
		if(meta.device.support.consoleCSS) {
			console.log("%c(Loading started)", "background: #eee; font-weight: bold;");
		}
		else {
			console.log("(Loading started)");
		}

		this.loading = true;

		if(!meta._loadAllScripts()) {
			this._continueLoad();
		}
	},

	_continueLoad: function()
	{
		var cache = meta.cache;

		var numFuncs = cache.loadFuncs.length;
		for(var i = 0; i < numFuncs; i++) {
			cache.loadFuncs[i]();
		}

		var ctrl;
		var numCtrl = this.controllers.length;
		for(i = 0; i < numCtrl; i++) {
			ctrl = this.controllers[i];
			ctrl.load();
			ctrl.loaded = true;
		}

		this.loadedCtrls = true;
		this.loading = false;
		meta.cache.view.active = true;
		meta.renderer.load();

		if(Resource.ctrl.numToLoad === 0) {
			this.onReady();
		}
	},

	onReady: function()
	{
		this.loaded = true;

		if(meta.device.support.consoleCSS) {
			console.log("%c(Loading ended)", "background: #eee; font-weight: bold;");
		}
		else {
			console.log("(Loading ended)");
		}

		//
		var numCtrl = this.controllers.length;
		for(var i = 0; i < numCtrl; i++) {
			this.controllers[i].ready();
		}

		this.ready = true;

		var numFuncs = meta.cache.readyFuncs.length;
		for(var i = 0; i < numFuncs; i++) {
			meta.cache.readyFuncs[i]();
		}

		this._startMainLoop();
	},

	_startMainLoop: function()
	{
		this.time.update = Date.now();

		var self = this;
		this._renderLoop = function() { self.render(); };
		this._updateLoop = function() { self.update(); };
		this.update();
		this.render();
	},	

	update: function()
	{
		this.time.frameIndex++;
		var tNow = Date.now();

		// Calculate tDelta:
		if(this.time.pause) {
			this.time.delta = 0;
			this.time.deltaF = 0;
		}
		else 
		{
			this.time.delta = tNow - this.time.update;
			if(this.time.delta > this.time.maxDelta) {
				this.time.delta = this.time.maxDelta;
			}

			this.time.delta *= this.time.scale;
			this.time.deltaF = this.time.delta / 1000;
		}

		var tDelta = this.time.deltaF;
		
		// Process all update functions:
		var funcs = this.meta.cache.updateFuncs;
		var numFuncs = funcs.length;
		for(var i = 0; i < numFuncs; i++) {
			funcs[i](tDelta);
		}

		// // Process all controller update functions:
		// var ctrls = this.meta.cache.ctrlUpdateFuncs;
		// var numCtrls = ctrls.length;
		// for(i = 0; i < numCtrls; i++) {
		// 	ctrls[i].update(tDelta);
		// }	

		this.meta.renderer.update(tDelta);

		this._updateTimers(this.time.delta);

		this.time.update = tNow;
		var tElapsed = Date.now();
		var tSleep = Math.max(0, this.time.updateFreq - (tElapsed - tNow));
		window.setTimeout(this._updateLoop, tSleep);	
	},

	_updateTimers: function(tDelta)
	{
		var timer;
		var removed = false;
		var numTimers = this.timers.length;
		for(var i = numTimers - 1; i > -1; i--)
		{
			timer = this.timers[i];
			if(timer.paused) { continue; }

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

					if(timer.numTimes <= 0) 
					{
						removed = true;
						numTimers--;
						if(numTimers > 0) {
							this.timers[timer.__index] = this.timers[numTimers];
							this.timers[timer.__index].__index = timer.__index;
							i--;
						}
						break;
					}
				}
			}
		}

		if(removed) {
			this.timers.length = numTimers;
		}
	},

	render: function()
	{
		var tNow = Date.now();
		var tDelta = tNow - this.time.render;
		var tDeltaF = tDelta / 1000;

		if(tNow - this.time.fps >= 1000) {
			this.time.fps = tNow;
			this.fps = this._fpsCounter;
			this._fpsCounter = 0;
		}

		meta.renderer.render(tDeltaF);

		// Process all render functions:
		var funcs = this.meta.cache.renderFuncs;
		var numFuncs = funcs.length;
		for(var i = 0; i < numFuncs; i++) {
			funcs[i](tDeltaF);
		}	

		this._fpsCounter++;
		this.time.render = tNow;

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

	onKeyDown: function(data, event) 
	{
		if(data.keyCode === Input.Key.TILDE) {
			meta.debug = !meta.cache.debug;
			meta.renderer.needRender = true;
		}
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
		this.focus = value;
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
		var fullscreen = document.fullscreenElement || document.webkitFullscreenElement ||
				document.mozFullScreenElement || document.msFullscreenElement;
		meta.device.fullscreen = !!fullscreen;
	},

	onCtxLost: function() {
		console.log("(Context lost)");
	},

	onCtxRestored: function() {
		console.log("(Context restored)");
	},

	_addMetaTags: function()
	{
		if(this.metaTagsAdded) { return; }

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

		this.metaTagsAdded = true;
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

	/* Fullscreen */
	fullscreen: function(value)
	{
		var device = meta.device;
		if(device.fullscreen === value) { return; }

		if(value) 
		{
			if(!device.support.fullScreen) {
				console.warn("(meta.engine.enterFullScreen): Device does not support fullscreen mode");
				return;
			}

			document.documentElement[device.fullScreenRequest](Element.ALLOW_KEYBOARD_INPUT);			
		}
		else {
			document[meta.device.fullScreenExit]();
		}
	},

	toggleFullscreen: function() {
		this.fullscreen(!meta.device.fullscreen);
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
		if(this.inited) {
			this.onResize();
		}
    },

    get imageSmoothing() {
		return meta.cache.imageSmoothing;
	},

	/* Cursor */
	set cursor(value) {
		meta.element.style.cursor = value;
	},

	get cursor() {
		return meta.element.style.cursor;
	},

	//
	elementStyle: "padding:0; margin:0;",
	canvasStyle: "position:absolute; overflow:hidden; translateZ(0); " +
		"-webkit-backface-visibility:hidden; -webkit-perspective: 1000; " +
		"-webkit-touch-callout: none; -webkit-user-select: none; zoom: 1;",

	meta: meta,
	time: meta.time,

	_container: null,
	width: 0, height: 0,
	offsetLeft: 0, offsetTop: 0,
	scaleX: 1.0, scaleY: 1.0,

	canvas: null,
	ctx: null,

	chn: null,
	cb: null,

	autoInit: true,
	autoMetaTags: true,	

	inited: false,
	loading: false,
	loaded: false,
	loadedCtrls: false,
	ready: false,
	focus: false,
	pause: false,
	webgl: false,

	_updateLoop: null,
	_renderLoop: null,

	controllers: [],
	controllersToRemove: [],	

	timers: [],

	fps: 0,
	_fpsCounter: 0,

	enablePauseOnBlur: true,

	enableAdaptive: true,
	unitSize: 1,
	unitRatio: 1,
	maxUnitSize: 1,
	maxUnitRatio: 1		
};
