"use strict"
;
meta.engine = 
{
	init: function()
	{
		meta.emit("init");

		this.parseFlags();
		this.addMetaTags();
		this.createWebGL();
		this.print();

		this.flags |= this.Flag.INITIALIZED;
		this.setup();	
	},

	setup: function()
	{
		meta.camera = new meta.Camera();
		
		meta.emit("setup");

		this.addListeners();

		var masterLayer = new meta.Layer("master");
		masterLayer.$activate();
		meta.layers.master = masterLayer;
		meta.layer = masterLayer;

		meta.renderer.setup();
		this.updateResolution();

		this.flags |= this.Flag.SETUPED;
		this.preload();
	},

	preload: function()
	{
		meta.emit("preload");

		this.flags |= this.Flag.PRELOADED;

		var self = this;
		this.$renderLoopFunc = function() { self.render(); };
		this.$renderLoopFunc();

		this.load();
	},

	$renderLoopFunc: null,

	load: function()
	{
		meta.emit("load");

		this.flags |= this.Flag.LOADED;
	},

	ready: function()
	{
		meta.emit("ready");

		this.flags |= this.Flag.READY;
	},

	update: function(tDelta)
	{
		meta.emit("update", tDelta);
		//this.$updateTimers(meta.time.delta);
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
			this.fps = this.$fpsCounter;
			this.$fpsCounter = 0;
			meta.emit("fps", this.fps);
		}

		this.update(this.time.deltaF);

		meta.emit("render");
		meta.renderer.render(this.time.deltaF);

		this.$fpsCounter++;
		this.time.current = tNow;

		requestAnimationFrame(this.$renderLoopFunc);
	},

	updateResolution: function()
	{
		var width = meta.cache.width;
		var height = meta.cache.height;

		if(this.container === document.body) {
			width = window.innerWidth;
			height = window.innerHeight;
		}
		else {
			width = this.container.clientWidth;
			height = this.container.clientHeight;
		}

		this.width = Math.ceil(width);
		this.height = Math.ceil(height);
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		this.canvas.style.width = (width * this.scaleX) + "px";
		this.canvas.style.height = (height * this.scaleY) + "px";

		meta.renderer.onResize();
		meta.emit("resize", this);
	},

	$updateOffset: function()
	{
		this.offsetLeft = 0;
		this.offsetTop = 0;

		var element = this.container;
		if(element.offsetParent)
		{
			do {
				this.offsetLeft += element.offsetLeft;
				this.offsetTop += element.offsetTop;
			} while(element = element.offsetParent);
		}

		var rect = this.container.getBoundingClientRect();
		this.offsetLeft += rect.left;
		this.offsetTop += rect.top;

		rect = this.canvas.getBoundingClientRect();
		this.offsetLeft += rect.left;
		this.offsetTop += rect.top;		
	},	

	addMetaTags: function()
	{
		if(this.flags & this.Flag.META_TAGS_ADDED) { return; }

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

		this.flags |= this.Flag.META_TAGS_ADDED;
	},

	parseFlags: function()
	{
		var flag, flagName, flagValue, flagSepIndex;
		var flags = window.location.hash.substr(1).split(",")
		var num = flags.length;

		for(var n = 0; n < num; n++) 
		{
			flag = flags[n];
			flagSepIndex = flag.indexOf("=");
			if(flagSepIndex > 0)
			{
				flagName = flag.substr(0, flagSepIndex).replace(/ /g, "");
				flagValue = eval(flag.substr(flagSepIndex + 1).replace(/ /g, ""));
				meta.flags[flagName] = flagValue;
			}
		}
	},

	createWebGL: function()
	{
		this.canvas = document.createElement("canvas");
		this.canvas.id = "meta-webgl";
		this.canvas.style.cssText = this.canvasStyle;

		var params = {
			alpha: false,
			premultipliedAlpha: false
		};

		var context = this.canvas.getContext("webgl", params) || 
					  this.canvas.getContext("experimental-webgl", params);

		if(window.WebGLDebugUtils) {
			this.gl = WebGLDebugUtils.makeDebugContext(context);
		}
		else {
			this.gl = context;
		}

		if(!this.container) {
			this.container = document.body;
		}

		document.body.style.cssText = this.containerStyle;
		this.container.appendChild(this.canvas);

		this.gl.enable(this.gl.DEPTH_TEST);
		this.gl.depthFunc(this.gl.LEQUAL);	
	},

	addListeners: function()
	{
		var self = this;
		this.cb = {
			resize: function(event) { self.updateResolution(); },
			focus: function(event) { self.handleFocus(true); },
			blur: function(event) { self.handleFocus(false); }
		};

		window.addEventListener("resize", this.cb.resize, false);
		window.addEventListener("orientationchange", this.cb.resize, false);	

		// Page Visibility API:
		if(meta.device.hidden) {
			this.cb.visibilityChange = function() { self.handleVisibilityChange(); };
			document.addEventListener(meta.device.visibilityChange, this.cb.visibilityChange);
		}

		window.addEventListener("focus", this.cb.focus);
		window.addEventListener("blur", this.cb.blur);		

		// Fullscreen API:
		if(meta.device.support.fullScreen) {
			this.cb.fullscreen = function() { self.onFullScreenChangeCB(); };
			document.addEventListener(meta.device.fullScreenOnChange, this.cb.fullscreen);
		}	

		this.canvas.addEventListener("webglcontextlost", function() { self.onCtxLost(); });	
		this.canvas.addEventListener("webglcontextrestored", function() { self.onCtxRestored(); });	
	},

	handleFocus: function(value)
	{
		if(value) {
			this.flags |= this.Flag.FOCUS;
			meta.emit("focus");
		}
		else {
			this.flags &= ~(this.Flag.FOCUS | this.Flag.PAUSED);
			meta.emit("blur");
		}
	},

	handleVisibilityChange: function()
	{
		if(document[meta.device.hidden]) {
			this.handleFocus(false);
		}
		else {
			this.handleFocus(true);
		}
	},

	onFullScreenChangeCB: function()
	{
		var fullscreen = document.fullscreenElement || document.webkitFullscreenElement ||
				document.mozFullScreenElement || document.msFullscreenElement;
		meta.device.fullscreen = !!fullscreen;

		this.onFullscreen.emit(meta.device.fullscreen, meta.Event.FULLSCREEN);
	},

	onCtxLost: function() {
		console.log("(Context lost)");
	},

	onCtxRestored: function() {
		console.log("(Context restored)");
	},

	print: function()
	{
		if(meta.device.support.consoleCSS)
		{
			console.log("%c META2D v" + meta.version + " ", 
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
			console.log("META2D v" + meta.version + " http://meta2d.com ");
			console.log("Browser: " + meta.device.name + " " + meta.device.version + "\t");
			console.log("Renderer: Canvas ");				
		}		
	},	

	get focus() {
		return (this.flags & this.Flag.FOCUS);
	},

	Flag: {
		INITIALIZED: 1 << 0,
		SETUPED: 1 << 1,
		PRELOADED: 1 << 2,
		LOADED: 1 << 3,
		READY: 1 << 4,
		META_TAGS_ADDED: 1 << 5,
		FOCUS: 1 << 6,
		FULLSCREEN: 1 << 7
	},

	//
	container: null,
	canvas: null,
	gl: null,

	flags: null,
	cb: null,

	timers: [],
	timersRemove: [],

	width: 0, 
	height: 0,
	scaleX: 1.0, 
	scaleY: 1.0,
	zoom: 1,
	ratio: 1,
	offsetLeft: 0,
	offsetTop: 0,

	time: meta.time,
	fps: 0,
	$fpsCounter: 0,

	containerStyle: "padding:0; margin:0;",
	canvasStyle: "position:absolute; width: 100%; height: 100%; overflow:hidden; translateZ(0); " +
		"-webkit-backface-visibility:hidden; -webkit-perspective: 1000; " +
		"-webkit-touch-callout: none; -webkit-user-select: none; zoom: 1;"
};
