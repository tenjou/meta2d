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

		meta.subscribe(this, Resource.Event.LOADING_START, this.onLoadingStart);
		meta.subscribe(this, Resource.Event.LOADING_END, this.onLoadingEnd);

		meta.world = new meta.World(0, 0);
		meta.camera = new meta.Camera();
		meta.resources = new Resource.Manager();
		meta.input = new Input.Manager();
		meta.debugger = new meta.Debugger();

		this.sortAdaptions();
		this.onResize();	

		this._initAll();
	},

	_initAll: function()
	{
		this.time.current = Date.now();

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

		if(!meta._loadAllScripts()) {
			this._continueLoad();
		}
	},

	_continueLoad: function()
	{
		this.loading = true;

		this.meta.renderer.load();

		var cache = meta.cache;
		var numFuncs = cache.loadFuncs.length;
		for(var i = 0; i < numFuncs; i++) {
			cache.loadFuncs[i]();
		}

		this.loadPlugins();
		this.loaded = true;

		if(!this.meta.resources.loading) {
			this.onReady();
		}
	},

	onReady: function()
	{
		this.readyPlugins();

		if(this.ready) { return; }	

		this.ready = true;

		var numFuncs = meta.cache.readyFuncs.length;
		for(var i = 0; i < numFuncs; i++) {
			meta.cache.readyFuncs[i]();
		}

		meta.cache.view.active = true;

		if(meta.device.support.consoleCSS) {
			console.log("%c(Loading ended)", "background: #eee; font-weight: bold;");
		}
		else {
			console.log("(Loading ended)");
		}		

		this._startMainLoop();
	},

	loadPlugins: function() 
	{
		var num = this.plugins.length;
		for(var n = 0; n < num; n++) {
			this.plugins[n].load();
		}
	},

	readyPlugins: function() 
	{
		var num = this.plugins.length;
		for(var n = 0; n < num; n++) {
			this.plugins[n].ready();
		}
	},

	_startMainLoop: function() 
	{
		var self = this;
		//this._updateLoop = function() { self.update(); };
		this._renderLoop = function() { self.render(); };
		//this.update();
		this.render();
	},	

	update: function(tDelta)
	{
		this._updateTimers(meta.time.delta);

		var n;
		var num = this.controllersReady.length;
		if(num > 0 && !this.meta.resources.loading) 
		{
			var controller;
			for(n = 0; n < num; n++) {
				controller = this.controllersReady[n];
				if(controller.flags & controller.Flag.LOADED) {
					controller.ready();
				}
			}

			this.controllersReady.length = 0;
		} 

		num = this.updateFuncs.length;
		for(n = 0; n < num; n++) {
			this.updateFuncs[n](tDelta);
		}

		num = this.controllersUpdate.length;
		if(num > 0) {
			for(n = 0; n < num; n++) {
				this.controllersUpdate[n].update(tDelta);
			}
		}

		this.meta.renderer.update(tDelta);
	},

	render: function()
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
			this.time.delta = tNow - this.time.current;
			if(this.time.delta > this.time.maxDelta) {
				this.time.delta = this.time.maxDelta;
			}

			this.time.delta *= this.time.scale;
			this.time.deltaF = this.time.delta / 1000;

			this.time.accumulator += this.time.delta;			
		}

		// Update FPS:
		if(tNow - this.time.fps >= 1000) {
			this.time.fps = tNow;
			this.fps = this._fpsCounter;
			this._fpsCounter = 0;
		}

		this.update(this.time.deltaF);

		// Process all render functions:
		meta.renderer.render(this.time.deltaF);
		
		var num = this.renderFuncs.length;
		for(var n = 0; n < num; n++) {
			this.renderFuncs[n](tDeltaF);
		}	

		this._fpsCounter++;
		this.time.current = tNow;

		requestAnimationFrame(this._renderLoop);
	},

	_updateTimers: function(tDelta)
	{
		var timer, index, n;
		var numTimers = this.timers.length;
		var numRemove = this.timersRemove.length;

		if(numRemove > 0) 
		{
			var itemsLeft = numTimers - numRemove;
			if(itemsLeft > 0)
			{
				var index;
				for(var n = 0; n < numRemove; n++) 
				{
					index = this.timers.indexOf(this.timersRemove[i]);
					if(index < itemsLeft) {
						this.timers.splice(index, 1);
					}
					else {
						this.timers.pop();
					}
				}
			}
			else {
				this.timers.length = 0;
			}

			numTimers = itemsLeft;
			this.timersRemove.length = 0;
		}		

		for(n = 0; n < numTimers; n++)
		{
			timer = this.timers[n];
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
						numTimers--;
						if(numTimers > 0) {
							this.timersRemove.push(timer);
							timer.__index = -1;
						}
						break;
					}
				}
			}
		}
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

	adaptResolution: function()
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

	onKeyTilde: function(data, event) {
		meta.debug = !meta.cache.debug;
		meta.renderer.needRender = true;
	},

	onLoadingStart: function(data, event) {},

	onLoadingEnd: function(data, event) 
	{
		this.loadingResources = false;
		if(this.loaded) {
			this.onReady();
		}
	},

	onScriptLoadingEnd: function() {
		this._continueLoad();
	},

	updateLoading: function() 
	{
		if(!this.loading && !this.scriptLoading) {
			this._ready();
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

	_resize: function()
	{
		var width = this.meta.cache.width;
		var height = this.meta.cache.height;
		var containerWidth = 0;
		var containerHeight = 0;

		if(this._container === document.body) {
			containerWidth = window.innerWidth;
			containerHeight = window.innerHeight;
		}
		else {
			containerWidth = container.clientWidth;
			containerHeight = container.clientHeight;
		}

		if(width === 0) {
			width = containerWidth;
		} 
		if(height === 0) {
			height = containerHeight;
		}

		if(this._adapt) 
		{
			this.zoom = 1;
			var diffX = containerWidth - width;
			var diffY = containerHeight - height;
			if(diffX < diffY) {
				this.zoom = containerWidth / width;
			}
			else {
				this.zoom = containerHeight / height;
			}

			width *= this.zoom;
			height *= this.zoom;
		}

		width = Math.round(width);
		height = Math.round(height);		

		if(this.width === width && this.height === height && !this._center) { return; }

		var ratio = 1;
		this.width = Math.ceil(width * ratio);
		this.height = Math.ceil(height * ratio);
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		this.canvas.style.width = (width * this.scaleX) + "px";
		this.canvas.style.height = (height * this.scaleY) + "px";

		if(this._center) {
			this.canvas.style.left = Math.floor((window.innerWidth - width) * 0.5) + "px";
			this.canvas.style.top = Math.floor((window.innerHeight - height) * 0.5) + "px";	
		}

		if(this.ctx.imageSmoothingEnabled) {
			this.ctx.imageSmoothingEnabled = meta.cache.imageSmoothing;
		}
		else {
			this.ctx[meta.device.vendor + "ImageSmoothingEnabled"] = meta.cache.imageSmoothing;
		}
		
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

		rect = this.canvas.getBoundingClientRect();
		this.offsetLeft += rect.left;
		this.offsetTop += rect.top;		
	},

	_printInfo: function()
	{
		if(meta.device.support.consoleCSS)
		{
			console.log("%c META v" + meta.version + " ", 
				"background: #000; color: white; font-size: 12px; padding: 2px 0 1px 0;",
				"http://meta2d.com");

			console.log("%cBrowser: %c" + meta.device.name + " " + meta.device.version + "\t",
				"font-weight: bold; padding: 2px 0 1px 0;",
				"padding: 2px 0 1px 0;");

			console.log("%cRenderer: %cCanvas ", 
				"font-weight: bold; padding: 2px 0 2px 0;", 
				"padding: 2px 0 2px 0;");				
		}
		else 
		{
			console.log("META v" + meta.version + " http://meta2d.com ");
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
		this._container.style.cursor = value;
	},

	get cursor() {
		return this._container.style.cursor;
	},

	set center(value) {
		this._center = value;
		this.onResize();
	},

	get center() { return this._center; },

	set adapt(value) {
		this._adapt = value;
		this.onResize();
	},

	get adapt() { return this._adapt; },

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
	zoom: 1,
	ratio: 1,

	canvas: null,
	ctx: null,

	chn: null,
	cb: null,

	autoInit: true,
	autoMetaTags: true,	

	inited: false,
	loading: false,
	loaded: false,
	ready: false,
	focus: false,
	pause: false,
	webgl: false,

	_center: false,
	_adapt: false,

	_updateLoop: null,
	_renderLoop: null,

	updateFuncs: [],
	renderFuncs: [],
	plugins: [],
	controllersReady: [],
	controllersUpdate: [],

	timers: [],
	timersRemove: [],

	fps: 0,
	_fpsCounter: 0,

	enablePauseOnBlur: true,

	enableAdaptive: true,
	unitSize: 1,
	unitRatio: 1,
	maxUnitSize: 1,
	maxUnitRatio: 1		
};
