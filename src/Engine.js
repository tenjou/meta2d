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

var meta = {};

meta.engine = null;
meta.device = null;
meta.element = null;
meta.elementId = "";
meta.canvas = null;
meta.ctx = null;
meta.width = 0;
meta.height = 0;
meta.channels = {};
meta.shaders = null;
meta.view = null;
meta.world = null;
meta.camera = null;
meta.shader = null;
meta.version = "1.1";
meta.enableDefault = true;
meta.enablemeta = true;
meta.enableWebGL = true;
meta.tUpdate = 1000 / 60;
meta.utils = {};
meta.modules = {};
meta.importUrl = "http://infinite-games.com/store/modules/";
meta._cache = {
	ismetaAdded: false,
	init: null,
	load: null,
	ready: null,
	scripts: null,
	pendingScripts: null, // IE<10
	numScriptsToLoad: 0
};

/**
 * @description The meta core.
 * @constructor
 * @property elementStyle {String} Style that is applied to parent element.
 * @memberof! <global>
 */
meta.Engine = function()
{
	this.controllers = [];
	this.controllersToRemove = [];

	this._timers = [];
	this._timersToRemove = [];
	this._numTimers = 0;

	this.unsubscribesetLeft = 0;
	this.unsubscribesetTop = 0;

	this._onResizeCB = null;
	this._onVisibilityChangeCB = null;
	this._onFullScreenChangeCB = null;
	this._onFocusCB = null;
	this._onBlurCB = null;
	this._onCtxLostCB = null;
	this._onCtxRestoredCB = null;

	this._chnResize = null;
	this._chnFocus = null;
	this._chnFullScreen = null;

	this.isCreated = false;
	this.isFocus = false;
	this.isWebGL = false;
	this.isInited = false;
	this.isLoaded = false;
	this.isLoading = false;
	this.isCtrlLoaded = false;
	this.isReady = false;

	this.pause = false;

	this.projection = null;

	this._updateLoop = null;
	this._renderLoop = null;
	this.tUpdate = 0;
	this.tRender = 0;
	this.tFPS = 0;
	this.tNow = 0;
	this.fps = 0;
	this._fpsCounter = 0;

	this.frameID = 0;
	this.updateFrameID = 0;

	this.enablePauseOnBlur = true;
};

meta.Engine.prototype =
{
	/**
	 * @description Initialize engine instance.
	 * @function
	 */
	create: function()
	{
		if(this.isCreated) {
			console.error("[meta.Engine.create]:", "Engine instance is already created.");
			return;
		}

		console.log("%c META v" + meta.version + " ", 
			"background: #000; color: white; font-size: 12px; padding: 2px 0 1px 0;");

		console.log("%cBrowser: %c" + meta.device.name + " " + meta.device.version + "\t",
			"font-weight: bold; padding: 2px 0 1px 0;",
			"padding: 2px 0 1px 0;");

		if(meta.enablemeta) {
			this._createmeta();
		}

		meta.shaders = {};
		meta.views = {};

		this._chnResize = meta.createChannel(meta.Event.RESIZE);
		this._chnFocus = meta.createChannel(meta.Event.FOCUS);
		this._chnFullScreen = meta.createChannel(meta.Event.FULLSCREEN);

		meta.View.prototype._chnAddedToView = meta.createChannel(meta.Event.ADDED_TO_VIEW);
		meta.View.prototype._chnRemovedFromView = meta.createChannel(meta.Event.REMOVED_FROM_VIEW);

		this._resolveElement();
		this._createCanvas();
		this.onResize();

		meta.camera = new meta.Camera();
		meta.world = new meta.World(this.width, this.height);

		//
		var self = this;
		this._onResizeCB = function(event) { self.onResize(); };
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
		this.isCreated = true;
	},

	/**
	 * @description Release the engine instance.
	 * @function
	 */
	release: function()
	{
		if(!this.isCreated)	{
			console.error("[meta.Engine.release]:", "Can't release uninitialized engine instance.");
			return;
		}

		this._chnFocus.remove();
		this._chnResize.remove();
		this._chnFullScreen.remove();

		window.removeEventListener("resize", this._onResizeCB);
		window.removeEventListener("orientationchange", this._onResizeCB);

		if(meta.device.hidden) {
			document.removeEventListener(meta.device.visibilityChange, this._onVisibilityChangeCB);
		}
		else {
			window.removeEventListener("focus", this._onFocusCB);
			window.removeEventListener("blur", this._onBlurCB);
		}

		if(meta.device.support.fullScreen) {
			document.removeEventListener(meta.device.visibilityChange, this._onVisibilityChangeCB);
		}

		if(this.isWebGL) {
			window.removeEventListener("webglcontextlost", this._onCtxLostCB);
			window.removeEventListener("webglcontextrestored", this._onCtxRestoredCB);
		}

		meta.removeAllControllers();
		meta.channels = null;
		meta.shaders = null;
		meta.views = null;
		meta.view = null;
		meta.world = null;
		meta.shader = null;

		this.isCreated = false;
	},

	start: function()
	{
		// Create master view.
		var masterView = new meta.View("master");
		meta.views["master"] = masterView;
		meta.view = masterView;

		if(meta._cache.init && typeof(meta._cache.init) === "function") {
			meta._cache.init();
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
		if(meta._cache.load && typeof(meta._cache.load) === "function") {
			meta._cache.load();
		}

		var ctrl;
		var numCtrl = this.controllers.length;
		for(var i = 0; i < numCtrl; i++) 
		{
			ctrl = this.controllers[i];
			ctrl.load();
			ctrl.isLoaded = true;
		}

		this.isCtrlLoaded = true;
		meta.view.isActive = true;
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

		if(meta.update) {
			meta.update(tDeltaF);
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

		Entity.ctrl.render(tDeltaF);
		if(meta.render) {
			meta.render(tDeltaF);
		}

		this._fpsCounter++;
		this.tRender = tNow;

		//window.setTimeout(this._renderLoop, 16.6);
		requestAnimationFrame(this._renderLoop);
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

		if(meta._cache.ready && typeof(meta._cache.ready) === "function") {
			meta._cache.ready();
		}

		this._start();
	},

	onResize: function()
	{
		var width, height;
		if(meta.element === document.body) {
			width = window.innerWidth;
			height = window.innerHeight;
		}
		else {
			width = meta.element.clientWidth;
			height = meta.element.clientHeight;
		}

		var ratio = window.devicePixelRatio;
		this.width = (width * ratio) | 0;
		this.height = (height * ratio) | 0;
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		this.canvas.style.width = width + "px";
		this.canvas.style.height = height + "px";
		meta.width = this.width;
		meta.height = this.height;

		if(this.isWebGL)
		{
			this.projection.ortho(0, this.width, this.height, 0, 0, 100);
			meta.shader.uniformMatrix("projection", this.projection);

			this.ctx.viewport(0, 0, this.width, this.height);
		}

		this._updateOffset();

		this._chnResize.emit(this, meta.Event.RESIZE);
	},

	onFocusChange: function(value)
	{
		this.isFocus = value;
		if(this.enablePauseOnBlur) {
			this.pause = !value;
		}

		this._chnFocus.emit(value, meta.Event.FOCUS);
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


	_resolveElement: function()
	{
		if(meta.elementId)
		{
			this.element = document.getElementById(meta.elementId);
			if(!this.element) {
				console.warn("[meta.engine.create]:", "Could not find element with id - " + meta.elementId);
				this.element = document.body;
			}
		}
		else {
			this.element = document.body;
		}

		this.element.style.cssText += this.elementStyle;
		meta.element = this.element;
	},

	_createmeta: function()
	{
		if(meta._cache.ismetaAdded) { return; }

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

		meta._cache.ismetaAdded = true;
	},

	_createCanvas: function()
	{
		this.canvas = document.createElement("canvas");
		this.canvas.setAttribute("id", "meta-canvas");
		this.canvas.style.cssText = this.canvasStyle;
		this.element.appendChild(this.canvas);
		meta.canvas = this.canvas;

		var params = {
		//	alpha: false,
		};

		if(meta.enableWebGL && meta.device.support.webgl)
		{
			//params.antialias = false;
			params.stencil = true;
			params.preserveDrawingBuffer = false;

			this.ctx = this.canvas.getContext("experimental-webgl", params);
			meta.ctx = this.ctx;
			this.ctx.imageSmoothingEnabled = false;
			this.ctx.webkitImageSmoothingEnabled = false;
			this.ctx.mozImageSmoothingEnabled = false;

			var self = this;
			this._onCtxLostCB = function(event) { self.onCtxLost(); };
			this._onCtxRestoredCB = function(event) { self.onCtxRestored(); };
			window.addEventListener("webglcontextlost", this._onCtxLostCB);
			window.addEventListener("webglcontextrestored", this._onCtxRestoredCB);

			this._initShaders();

			this.isWebGL = true;

			console.log("%cRenderer: %cWebGL ", 
				"font-weight: bold; padding: 2px 0 2px 0;", 
				"padding: 2px 0 2px 0;");
		}
		else 
		{
			this.ctx = this.canvas.getContext("2d", params);
			meta.ctx = this.ctx;

			console.log("%cRenderer: %cCanvas ", 
				"font-weight: bold; padding: 2px 0 2px 0;", 
				"padding: 2px 0 2px 0;");			
		}
	},

	_initShaders: function()
	{
		this.projection = new meta.math.Matrix4();

		var shader = new meta.Shader();
		shader.vertexShader =
			"precision mediump float; " +
			"attribute vec2 vertexPos; " +
			"attribute vec2 texCoord; " +
			"uniform vec2 cameraPos; " +
			"uniform float zoom; " +
			"uniform vec2 pos; " +
			"uniform vec2 center; " +
			"uniform vec2 scale; " +
			"uniform vec4 frameCoord; " +
			"uniform float angle; " +
			"uniform mat4 projection; " +
			"varying highp vec2 frameTexCoord; " +

			"void main(void) " +
			"{ " +
				"float rotX = sin(-angle);" +
				"float rotY = cos(-angle);" +
				"vec2 scaled = floor(vertexPos * scale);" +
				"vec2 origin = vec2(scaled.x + floor(pos.x) - floor(center.x), scaled.y + floor(pos.y) - floor(center.y));" +
				"vec2 newPos = vec2(origin.x * rotY + origin.y * rotX, origin.y * rotY - origin.x * rotX) + floor(center) + cameraPos;" +
				"newPos *= zoom;" +

				"gl_Position = projection * vec4(newPos, 0.0, 1.0);" +
				"frameTexCoord = vec2(frameCoord.x + (texCoord.x * frameCoord.z), frameCoord.y + (texCoord.y * frameCoord.w)); " +
			"}";

		shader.fragmentShader = 
			"precision mediump float; " +
			"uniform sampler2D sampler; " +
			"uniform float alpha; " +
			"varying highp vec2 frameTexCoord; " +

			"void main(void) " +
			"{ " +
				"vec4 color = texture2D(sampler, frameTexCoord); " +
				"color.a *= alpha; gl_FragColor = color; " + 
			"}";
		meta.shaders.default = shader;

		if(shader.compile()) {
			meta.setShader("default");
		}
		else {
			console.error("[meta.Engine._initShaders]:", "Could not compile shaders.");
			return;
		}

		shader.bindAttrib("vertexPos");
		shader.bindAttrib("texCoord");
	},

	_updateOffset: function()
	{
		this.unsubscribesetLeft = 0;
		this.unsubscribesetTop = 0;

		var element = meta.element;
		if(element.unsubscribesetParent)
		{
			do {
				this.unsubscribesetLeft += element.unsubscribesetLeft;
				this.unsubscribesetTop += element.unsubscribesetTop;
			} while(element = element.unsubscribesetParent);
		}

		var rect = meta.element.getBoundingClientRect();
		this.unsubscribesetLeft += rect.left;
		this.unsubscribesetTop += rect.top;
	},

	_addCorePlugins: function()
	{
		meta.register("Resource");
		meta.register("UI");

		if(this.isWebGL) {
			meta.register("Entity.WebGLRenderer");
		}
		else {
			meta.register("Entity.CanvasRenderer");
		}

		meta.register("Input");
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


	enterFullScreen: function()
	{
		var device = meta.device;
		if(device.isFullScreen) { return; }

		if(!device.support.fullScreen) {
			console.warn("[meta.engine.enterFullScreen]:", "Device does not support fullscreen.");
			return;
		}

		document.documentElement[device.fullScreenRequest](Element.ALLOW_KEYBOARD_INPUT);
	},

	exitFullScreen: function()
	{
		if(!meta.device.isFullScreen) { return; }

		document[meta.device.fullScreenExit]();
	},


	//
	elementStyle: "padding:0; margin:0;",
	canvasStyle: "position:absolute; overflow:hidden; translateZ(0); " +
		"-webkit-backface-visibility:hidden; -webkit-perspective: 1000; " +
		"-webkit-touch-callout: none; -webkit-user-select: none;"
}

meta.__defineSetter__("init", function(func)
{
	meta._cache.init = func;
	if(meta.engine && meta.engine.isInited) {
		func();
	}
});

meta.__defineSetter__("load", function(func)
{
	meta._cache.load = func;
	if(meta.engine && meta.engine.isLoaded) {
		func();
	}
});

meta.__defineSetter__("ready", function(func)
{
	meta._cache.ready = func;
	if(meta.engine && meta.engine.isReady) {
		func();
	}
});

meta.__defineGetter__("init", function() {
	return meta._cache.init;
});

meta.__defineGetter__("load", function() {
	return meta._cache.load;
});

meta.__defineGetter__("ready", function() {
	return meta._cache.ready;
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