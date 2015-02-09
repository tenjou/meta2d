"use strict";

var meta = {
    version: "1.2.0",
    device: null,
    renderer: null,
    camera: null,
    autoInit: true,
    autoMetaTags: true,
    cache: {
        width: 0,
        height: 0,
        metaTagsAdded: false,
        timerIndex: 0,
        initBuffer: [],
        loadBuffer: [],
        readyBuffer: [],
        view: null,
        views: {},
        scripts: null,
        pendingScripts: null,
        numScriptsToLoad: 0,
        resolutions: null,
        currResolution: null,
        imageSmoothing: true
    }
};

"use strict";

meta.channels = {};

meta.loadingView = null;

meta.world = null;

meta.enableAdaptive = true;

meta.tUpdate = 1e3 / 60;

meta.unitSize = 1;

meta.unitRatio = 1;

meta.maxUnitSize = 1;

meta.maxUnitRatio = 1;

meta.utils = {};

meta.modules = {};

meta.importUrl = "http://meta.infinite-games.com/store/";

meta.engine = {
    create: function() {
        this._container = document.body;
        this._container.style.cssText = this.elementStyle;
        this._createRenderer();
        this._printInfo();
        if (meta.autoMetaTags) {
            this._addMetaTags();
        }
        meta.camera = new meta.Camera();
        this._chnResize = meta.createChannel(meta.Event.RESIZE);
        this._chnFocus = meta.createChannel(meta.Event.FOCUS);
        this._chnFullScreen = meta.createChannel(meta.Event.FULLSCREEN);
        this._chnAdapt = meta.createChannel(meta.Event.ADAPT);
        this.sortAdaptions();
        this.onResize();
        meta.world = new meta.World(this.width, this.height);
        var self = this;
        this._onResizeCB = function(event) {
            self.onResize();
        };
        this._onFocusCB = function(event) {
            self.onFocusChange(true);
        };
        this._onBlurCB = function(event) {
            self.onFocusChange(false);
        };
        window.addEventListener("resize", this._onResizeCB, false);
        window.addEventListener("orientationchange", this._onResizeCB, false);
        if (meta.device.hidden) {
            this._onVisibilityChangeCB = function() {
                self.onVisibilityChange();
            };
            document.addEventListener(meta.device.visibilityChange, this._onVisibilityChangeCB);
        } else {
            window.addEventListener("focus", this._onFocusCB);
            window.addEventListener("blur", this._onBlurCB);
        }
        if (meta.device.support.fullScreen) {
            this._onFullScreenChangeCB = function() {
                self.onFullScreenChangeCB();
            };
            document.addEventListener(meta.device.fullScreenOnChange, this._onFullScreenChangeCB);
        }
        this.tNow = Date.now();
        this.start();
    },
    start: function() {
        var cache = meta.cache;
        var masterView = new meta.View("master");
        cache.views["master"] = masterView;
        cache.view = masterView;
        var numFuncs = cache.initBuffer.length;
        for (var i = 0; i < numFuncs; i++) {
            cache.initBuffer[i]();
        }
        this._addCorePlugins();
        this.isInited = true;
        console.log(" ");
        this._load();
    },
    _load: function() {
        console.log("%c(Loading started)", "background: #eee; font-weight: bold;");
        this.isLoading = true;
        if (!meta._loadAllScripts()) {
            this._continueLoad();
        }
    },
    _continueLoad: function() {
        var i;
        var cache = meta.cache;
        var numFuncs = cache.loadBuffer.length;
        for (i = 0; i < numFuncs; i++) {
            cache.loadBuffer[i]();
        }
        var ctrl;
        var numCtrl = this.controllers.length;
        for (i = 0; i < numCtrl; i++) {
            ctrl = this.controllers[i];
            ctrl.load();
            ctrl.isLoaded = true;
        }
        this.isCtrlLoaded = true;
        meta.cache.view.isActive = true;
        this.isLoading = false;
        if (Resource.ctrl.numToLoad === 0) {
            this.onResourcesLoaded();
        }
    },
    update: function() {
        this.updateFrameID++;
        this.tNow = Date.now();
        var tDelta = this.tNow - this.tUpdate;
        if (this.pause) {
            tDelta = 0;
        }
        if (tDelta > 250) {
            tDelta = 250;
        }
        var tDeltaF = tDelta / 1e3;
        if (meta.update) {
            meta.update(tDeltaF);
        }
        var numCtrl = this.controllers.length;
        for (var i = 0; i < numCtrl; i++) {
            this.controllers[i].update(tDeltaF);
        }
        if (this.controllersToRemove.length) {
            var ctrlToRemove;
            var numCtrls = this.controllers.length;
            var numCtrlsToRemove = this.controllersToRemove.length;
            for (var n = 0; n < numCtrlsToRemove; n++) {
                ctrlToRemove = this.controllersToRemove[n];
                for (i = 0; i < numCtrls; i++) {
                    if (this.controllers[i] === ctrlToRemove) {
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
    _updateTimers: function(tDelta) {
        var timer, i;
        for (i = 0; i < this._numTimers; i++) {
            timer = this._timers[i];
            if (timer.isPaused) {
                continue;
            }
            timer.tAccumulator += tDelta;
            while (timer.tAccumulator >= timer.tDelta) {
                timer.tAccumulator -= timer.tDelta;
                if (timer.numTimes !== 0) {
                    timer.func.call(timer.owner, timer);
                }
                timer.tStart += timer.tDelta;
                if (timer.numTimes !== -1) {
                    timer.numTimes--;
                    if (timer.numTimes <= 0) {
                        this._timersToRemove.push(timer);
                        break;
                    }
                }
            }
        }
        if (this._timersToRemove.length) {
            var timerToRemove;
            var numTimersToRemove = this._timersToRemove.length;
            for (i = 0; i < numTimersToRemove; i++) {
                timerToRemove = this._timersToRemove[i];
                for (var n = 0; n < this._numTimers; n++) {
                    timer = this._timers[n];
                    if (timer.id === timerToRemove.id) {
                        if (timer.onRemove) {
                            timer.onRemove();
                        }
                        this._timers[n] = this._timers[this._numTimers - 1];
                        this._timers.pop();
                        this._numTimers--;
                        break;
                    }
                }
            }
        }
    },
    render: function() {
        this.frameID++;
        var tNow = Date.now();
        var tDelta = tNow - this.tRender;
        if (tDelta > 250) {
            tDelta = 250;
        }
        var tDeltaF = tDelta / 1e3;
        if (tNow - this.tFPS >= 1e3) {
            this.tFPS = tNow;
            this.fps = this._fpsCounter;
            this._fpsCounter = 0;
        }
        if (meta.render) {
            meta.render(tDeltaF);
        }
        meta.renderer.render(tDeltaF);
        this._fpsCounter++;
        this.tRender = tNow;
        requestAnimationFrame(this._renderLoop);
    },
    sortAdaptions: function() {
        var scope = meta;
        var resolutions = scope.cache.resolutions;
        if (!resolutions) {
            return;
        }
        var numResolutions = resolutions.length;
        if (numResolutions <= 1) {
            return;
        }
        resolutions.sort(function(a, b) {
            var length_a = scope.math.length2(a.width, a.height);
            var length_b = scope.math.length2(b.width, b.height);
            return length_a - length_b;
        });
        var lowestResolution = resolutions[0];
        var reso, prevReso;
        for (var i = 1; i < numResolutions; i++) {
            prevReso = resolutions[i - 1];
            reso = resolutions[i];
            reso.unitSize = reso.height / lowestResolution.height;
            reso.zoomThreshold = prevReso.unitSize + (reso.unitSize - prevReso.unitSize) / 100 * 33;
        }
        meta.maxUnitSize = resolutions[numResolutions - 1].unitSize;
        meta.maxUnitRatio = 1 / meta.maxUnitSize;
        scope.camera.bounds(lowestResolution.width, lowestResolution.height);
    },
    adapt: function() {
        var scope = meta;
        var resolutions = scope.cache.resolutions;
        if (!resolutions) {
            return false;
        }
        var numResolutions = resolutions.length;
        if (numResolutions < 1) {
            return false;
        }
        var resolution;
        var newResolution = resolutions[0];
        var zoom = scope.camera.zoom;
        for (var i = numResolutions - 1; i >= 0; i--) {
            resolution = resolutions[i];
            if (zoom >= resolution.zoomThreshold) {
                newResolution = resolution;
                break;
            }
        }
        if (newResolution === scope.cache.currResolution) {
            return true;
        }
        scope.cache.currResolution = newResolution;
        scope.unitSize = newResolution.unitSize;
        scope.unitRatio = 1 / scope.unitSize;
        this._chnAdapt.emit(newResolution, meta.Event.ADAPT);
        return true;
    },
    onResourcesLoaded: function() {
        this.isLoaded = true;
        console.log("%c(Loading ended)", "background: #eee; font-weight: bold;");
        var numCtrl = this.controllers.length;
        for (var i = 0; i < numCtrl; i++) {
            this.controllers[i].ready();
        }
        this.isReady = true;
        var numFuncs = meta.cache.readyBuffer.length;
        for (var i = 0; i < numFuncs; i++) {
            meta.cache.readyBuffer[i]();
        }
        this._start();
    },
    onResize: function() {
        this._resize(this.meta.cache.width, this.meta.cache.height);
    },
    resize: function(width, height) {
        var cache = this.meta.cache;
        cache.width = width || 0;
        cache.height = height || 0;
        this._resize(cache.width, cache.height);
    },
    _resize: function(width, height) {
        var container = this._container;
        if (container === document.body) {
            if (width === 0 || width > window.innerWidth) {
                width = window.innerWidth;
            }
            if (height === 0 || height > window.innerHeight) {
                height = window.innerHeight;
            }
        } else {
            if (width === 0 || width > container.clientWidth) {
                width = container.clientWidth;
            }
            if (height === 0 || height > container.clientHeight) {
                height = container.clientHeight;
            }
        }
        this.width = width | 0;
        this.height = height | 0;
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.width = width * this.scaleX + "px";
        this.canvas.style.height = height * this.scaleY + "px";
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this._updateOffset();
        this._chnResize.emit(this, meta.Event.RESIZE);
        meta.renderer.needRender = true;
    },
    scale: function(scaleX, scaleY) {
        this.scaleX = scaleX || 1;
        this.scaleY = scaleY || this.scaleX;
        this._resize(this.meta.cache.width, this.meta.cache.height);
    },
    onFocusChange: function(value) {
        this.isFocus = value;
        if (this.enablePauseOnBlur) {
            this.pause = !value;
        }
        this._chnFocus.emit(value, meta.Event.FOCUS);
    },
    onVisibilityChange: function() {
        if (document[meta.device.hidden]) {
            this.onFocusChange(false);
        } else {
            this.onFocusChange(true);
        }
    },
    onFullScreenChangeCB: function() {
        var isFullScreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
        meta.device.isFullScreen = !!isFullScreen;
    },
    onCtxLost: function() {
        console.log("(Context lost)");
    },
    onCtxRestored: function() {
        console.log("(Context restored)");
    },
    _addMetaTags: function() {
        if (meta.cache.metaTagsAdded) {
            return;
        }
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
    _createRenderer: function() {
        this.canvas = document.createElement("canvas");
        this.canvas.setAttribute("id", "meta-canvas");
        this.canvas.style.cssText = this.canvasStyle;
        var container = this.meta.cache.container;
        if (!container) {
            document.body.appendChild(this.canvas);
        } else {
            container.appendChild(this.canvas);
        }
        meta.renderer = new meta.CanvasRenderer();
    },
    _updateOffset: function() {
        this.offsetLeft = 0;
        this.offsetTop = 0;
        var element = this._container;
        if (element.offsetParent) {
            do {
                this.offsetLeft += element.offsetLeft;
                this.offsetTop += element.offsetTop;
            } while (element = element.offsetParent);
        }
        var rect = this._container.getBoundingClientRect();
        this.offsetLeft += rect.left;
        this.offsetTop += rect.top;
    },
    _addCorePlugins: function() {
        meta.register("Resource");
        meta.register("Input");
        meta.register("Physics");
    },
    _start: function() {
        var self = this;
        this._updateLoop = function() {
            self.update();
        };
        this._renderLoop = function() {
            self.render();
        };
        this.tUpdate = Date.now();
        this.tRender = this.tUpdate;
        this.tFPS = this.tUpdate;
        setTimeout(this._updateLoop);
        requestAnimationFrame(this._renderLoop);
    },
    _printInfo: function() {
        if (meta.device.support.consoleCSS) {
            console.log("%c META v" + meta.version + " ", "background: #000; color: white; font-size: 12px; padding: 2px 0 1px 0;", "http://infinite-games.com ");
            console.log("%cBrowser: %c" + meta.device.name + " " + meta.device.version + "	", "font-weight: bold; padding: 2px 0 1px 0;", "padding: 2px 0 1px 0;");
            console.log("%cRenderer: %cCanvas ", "font-weight: bold; padding: 2px 0 2px 0;", "padding: 2px 0 2px 0;");
        } else {
            console.log("META v" + meta.version + " http://infinite-games.com ");
            console.log("Browser: " + meta.device.name + " " + meta.device.version + "	");
            console.log("Renderer: Canvas ");
        }
    },
    fullscreen: function(value) {
        var device = meta.device;
        if (device.isFulScreen === value) {
            return;
        }
        if (value) {
            if (!device.support.fullScreen) {
                console.warn("[meta.engine.enterFullScreen]:", "Device does not support fullscreen.");
                return;
            }
            document.documentElement[device.fullScreenRequest](Element.ALLOW_KEYBOARD_INPUT);
        } else {
            document[meta.device.fullScreenExit]();
        }
    },
    toggleFullscreen: function() {
        this.fullscreen(!meta.device.isFullScreen);
    },
    set container(element) {
        if (this._container === element) {
            return;
        }
        if (this._container) {
            this._container.removeChild(this.canvas);
        }
        if (!element) {
            this._container = document.body;
        } else {
            this._container = element;
        }
        this._container.appendChild(this.canvas);
        this.onResize();
    },
    get container() {
        return this._container;
    },
    set imageSmoothing(value) {
        meta.cache.imageSmoothing = value;
        if (this.isReady) {
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
    set bgColor(hex) {
        if (meta.engine.isWebGL) {
            if (hex.length === 3) {
                hex += hex.substr(1, 3);
            }
            var color = meta.hexToRgb(hex);
            if (color.r > 0) {
                color.r = color.r / 255;
            }
            if (color.g > 0) {
                color.g = color.g / 255;
            }
            if (color.b > 0) {
                color.b = color.b / 255;
            }
            if (this._bgTransparent) {
                meta.ctx.clearColor(0, 0, 0, 0);
            } else {
                meta.ctx.clearColor(color.r, color.g, color.b, 1);
            }
        } else {
            this._bgColor = hex;
        }
    },
    get bgColor() {
        return this._bgColor;
    },
    set bgTransparent(value) {
        this._bgTransparent = value;
        this.bgColor = this._bgColor;
    },
    get bgTransparent() {
        return this._bgTransparent;
    },
    elementStyle: "padding:0; margin:0;",
    canvasStyle: "position:absolute; overflow:hidden; translateZ(0); " + "-webkit-backface-visibility:hidden; -webkit-perspective: 1000; " + "-webkit-touch-callout: none; -webkit-user-select: none; zoom: 1;",
    meta: meta,
    _container: null,
    width: 0,
    height: 0,
    offsetLeft: 0,
    offsetTop: 0,
    scaleX: 1,
    scaleY: 1,
    canvas: null,
    ctx: null,
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
    _chnResize: null,
    _chnFocus: null,
    _chnFullScreen: null,
    _chnAdapt: null,
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
};

Object.defineProperty(meta, "init", {
    set: function(func) {
        meta.cache.initBuffer.push(func);
        if (meta.engine && meta.engine.isInited) {
            func();
        }
    }
});

Object.defineProperty(meta, "load", {
    set: function(func) {
        meta.cache.loadBuffer.push(func);
        if (meta.engine && meta.engine.isLoaded) {
            func();
        }
    }
});

Object.defineProperty(meta, "ready", {
    set: function(func) {
        meta.cache.readyBuffer.push(func);
        if (meta.engine && meta.engine.isReady) {
            func();
        }
    }
});

meta.render = null;

meta.update = null;

"use strict";

meta.Device = function() {
    this.name = "unknown";
    this.version = "0";
    this.versionBuffer = null;
    this.vendors = [ "", "webkit", "moz", "ms", "o" ];
    this.support = {};
    this.audioFormats = [];
    this.mobile = false;
    this.isPortrait = false;
    this.isAudioAPI = false;
    this.hidden = null;
    this.visibilityChange = null;
    this.fullScreenRequest = null;
    this.fullScreenExit = null;
    this.fullScreenOnChange = null;
    this.isFullScreen = false;
    this.load();
};

meta.Device.prototype = {
    load: function() {
        this.checkBrowser();
        this.mobile = this.isMobileAgent();
        this.checkConsoleCSS();
        this.support.onloadedmetadata = typeof window.onloadedmetadata === "object";
        this.support.onkeyup = typeof window.onkeyup === "object";
        this.support.onkeydown = typeof window.onkeydown === "object";
        this.support.canvas = this.isCanvasSupport();
        this.support.webgl = this.isWebGLSupport();
        this.modernize();
    },
    checkBrowser: function() {
        var regexps = {
            Chrome: [ /Chrome\/(\S+)/ ],
            Firefox: [ /Firefox\/(\S+)/ ],
            MSIE: [ /MSIE (\S+);/ ],
            Opera: [ /OPR\/(\S+)/, /Opera\/.*?Version\/(\S+)/, /Opera\/(\S+)/ ],
            Safari: [ /Version\/(\S+).*?Safari\// ]
        };
        var userAgent = navigator.userAgent;
        var name, currRegexp, match;
        var numElements = 2;
        for (name in regexps) {
            while (currRegexp = regexps[name].shift()) {
                if (match = userAgent.match(currRegexp)) {
                    this.version = match[1].match(new RegExp("[^.]+(?:.[^.]+){0," + --numElements + "}"))[0];
                    this.name = name;
                    this.versionBuffer = this.version.split(".");
                    var versionBufferLength = this.versionBuffer.length;
                    for (var i = 0; i < versionBufferLength; i++) {
                        this.versionBuffer[i] = parseInt(this.versionBuffer[i]);
                    }
                    break;
                }
            }
        }
        if (this.versionBuffer === null || this.name === "unknown") {
            console.warn("[meta.Device.checkBrowser]:", "Could not detect browser.");
        }
    },
    checkConsoleCSS: function() {
        if (!this.mobile && (this.name === "Chrome" || this.name === "Opera")) {
            this.support.consoleCSS = true;
        } else {
            this.support.consoleCSS = false;
        }
    },
    modernize: function() {
        this.supportConsole();
        this.supportPageVisibility();
        this.supportFullScreen();
        this.supportRequestAnimFrame();
        this.supportPerformanceNow();
        this.supportAudioFormats();
        this.supportAudioAPI();
    },
    isMobileAgent: function() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    isCanvasSupport: function() {
        return !!window.CanvasRenderingContext2D;
    },
    isWebGLSupport: function() {
        var canvas = document.createElement("canvas");
        var context = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        return !!context;
    },
    supportConsole: function() {
        if (!window.console) {
            window.console = {};
            window.console.log = meta.emptyFuncParam;
            window.console.warn = meta.emptyFuncParam;
            window.console.error = meta.emptyFuncParam;
        }
    },
    supportPageVisibility: function() {
        if (document.hidden !== void 0) {
            this.hidden = "hidden";
            this.visibilityChange = "visibilitychange";
        } else if (document.hidden !== void 0) {
            this.hidden = "webkitHidden";
            this.visibilityChange = "webkitvisibilitychange";
        } else if (document.hidden !== void 0) {
            this.hidden = "mozhidden";
            this.visibilityChange = "mozvisibilitychange";
        } else if (document.hidden !== void 0) {
            this.hidden = "mshidden";
            this.visibilityChange = "msvisibilitychange";
        }
    },
    supportFullScreen: function() {
        this._fullScreenRequest();
        this._fullScreenExit();
        this._fullScreenOnChange();
        this.support.fullScreen = document.fullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled || document.msFullscreenEnabled;
    },
    _fullScreenRequest: function() {
        var element = document.documentElement;
        if (element.requestFullscreen !== void 0) {
            this.fullScreenRequest = "requestFullscreen";
        } else if (element.webkitRequestFullscreen !== void 0) {
            this.fullScreenRequest = "webkitRequestFullscreen";
        } else if (element.mozRequestFullScreen !== void 0) {
            this.fullScreenRequest = "mozRequestFullScreen";
        } else if (element.msRequestFullscreen !== void 0) {
            this.fullScreenRequest = "msRequestFullscreen";
        }
    },
    _fullScreenExit: function() {
        if (document.exitFullscreen !== void 0) {
            this.fullScreenExit = "exitFullscreen";
        } else if (document.webkitExitFullscreen !== void 0) {
            this.fullScreenExit = "webkitExitFullscreen";
        } else if (document.mozCancelFullScreen !== void 0) {
            this.fullScreenExit = "mozCancelFullScreen";
        } else if (document.msExitFullscreen !== void 0) {
            this.fullScreenExit = "msExitFullscreen";
        }
    },
    _fullScreenOnChange: function() {
        if (document.onfullscreenchange !== void 0) {
            this.fullScreenOnChange = "fullscreenchange";
        } else if (document.onwebkitfullscreenchange !== void 0) {
            this.fullScreenOnChange = "webkitfullscreenchange";
        } else if (document.onmozfullscreenchange !== void 0) {
            this.fullScreenOnChange = "mozfullscreenchange";
        } else if (document.onmsfullscreenchange !== void 0) {
            this.fullScreenOnChange = "msfullscreenchange";
        }
    },
    supportRequestAnimFrame: function() {
        if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = function() {
                return window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback, element) {
                    window.setTimeout(callback, 1e3 / 60);
                };
            }();
        }
    },
    supportPerformanceNow: function() {
        if (window.performance === void 0) {
            window.performance = {};
        }
        if (window.performance.now === void 0) {
            window.performance.now = Date.now;
        }
    },
    supportAudioFormats: function() {
        var audio = document.createElement("audio");
        if (audio.canPlayType('audio/mp4; codecs="mp4a.40.2"').replace(/no/i, "") != "") {
            this.audioFormats.push("m4a");
        }
        if (audio.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, "")) {
            this.audioFormats.push("ogg");
        }
        if (audio.canPlayType("audio/mpeg;").replace(/no/, "")) {
            this.audioFormats.push("mp3");
        }
        if (audio.canPlayType('audio/wav; codecs="1"').replace(/no/, "")) {
            this.audioFormats.push("wav");
        }
    },
    supportAudioAPI: function() {
        if (!window.AudioContext) {
            window.AudioContext = window.webkitAudioContext || window.mozAudioContext || window.oAudioContext || window.msAudioContext;
        }
    }
};

meta.device = new meta.Device();

"use strict";

if (meta.device.mobile) {
    window.onerror = function(message, file, lineNumber) {
        alert(file + ": " + lineNumber + " " + message);
    };
}

"use strict";

meta.emptyFunc = function() {};

meta.emptyFuncParam = function(param) {};

meta.loadTexture = function(buffer, folderPath, hd_folderPath) {
    if (!meta._loadResource("Texture", buffer, folderPath, hd_folderPath)) {
        console.warn("[meta.loadTexture]:", "Unsupported parameter was passed.");
    }
};

meta.preloadTexture = function(buffer, folderPath, hd_folderPath) {
    if (!meta._preloadResource("Texture", buffer, folderPath, hd_folderPath)) {
        console.warn("[meta.preloadTexture]:", "Unsupported parameter was passed.");
    }
};

meta.loadSound = function(buffer, folderPath) {
    if (!meta._loadResource("Sound", buffer, folderPath)) {
        console.warn("[meta.loadSound]:", "Unsupported parameter was passed.");
    }
};

meta.preloadSound = function(buffer, folderPath) {
    if (!meta._preloadResource("Sound", buffer, folderPath)) {
        console.warn("[meta.preloadSound]:", "Unsupported parameter was passed.");
    }
};

meta.loadSpriteSheet = function(buffer, folderPath) {
    if (!meta._preloadResource("SpriteSheet", buffer, folderPath)) {
        console.warn("[meta.loadSpriteSheet]:", "Unsupported parameter was passed.");
    }
};

meta.loadFont = function(buffer, folderPath) {
    if (!meta._preloadResource("Font", buffer, folderPath)) {
        console.warn("[meta.loadFont]:", "Unsupported parameter was passed.");
    }
};

meta._loadResource = function(strType, buffer, folderPath) {
    if (folderPath) {
        var slashIndex = folderPath.lastIndexOf("/");
        if (slashIndex <= 0) {
            folderPath += "/";
        }
    } else {
        folderPath = "";
    }
    if (buffer instanceof Array) {
        var numResources = buffer.length;
        for (var i = 0; i < numResources; i++) {
            meta._addResource(strType, buffer[i], folderPath);
        }
    } else if (typeof buffer === "object" || typeof buffer === "string") {
        meta._addResource(strType, buffer, folderPath);
    } else {
        return false;
    }
    return true;
};

meta._preloadResource = function(strType, buffer, folderPath) {
    if (folderPath) {
        var slashIndex = folderPath.lastIndexOf("/");
        if (slashIndex !== folderPath.length - 1) {
            folderPath += "/";
        }
    } else {
        folderPath = "";
    }
    if (buffer instanceof Array) {
        var numResources = buffer.length;
        for (var i = 0; i < numResources; i++) {
            meta._addResource(strType, buffer[i], folderPath).load();
        }
    } else if (typeof buffer === "object" || typeof buffer === "string") {
        meta._addResource(strType, buffer, folderPath).load();
    } else {
        return false;
    }
    return true;
};

meta._addResource = function(strType, data, folderPath) {
    var resource;
    if (typeof data === "object") {
        resource = new Resource[strType](data, folderPath + data.path);
    } else {
        resource = new Resource[strType](folderPath + data);
    }
    Resource.ctrl.add(resource);
    return resource;
};

meta.getTexture = function(name) {
    return Resource.ctrl.getTexture(name);
};

meta.getSound = function(name) {
    return Resource.ctrl.getSound(name);
};

meta.createCtrl = function(ctrlName, view) {
    if (!ctrlName) {
        console.error("(meta.createCtrl)No controller name is defined.");
        return null;
    }
    var parts = ctrlName.split(".");
    if (parts.length > 2) {
        console.error('(meta.createCtrl) Name should be in format "MyScope.Controller".');
        return null;
    }
    var name = parts[0];
    var ctrlScope = window[name];
    if (!ctrlScope) {
        console.error("(meta.createCtrl) No such scope defined: " + name);
        return null;
    }
    if (ctrlScope.ctrl) {
        console.error("(meta.register) Controller (" + ctrl.name + ") is already added in scope.");
        return null;
    }
    var objName;
    if (parts.length === 1) {
        objName = "Controller";
    } else {
        objName = parts[1];
    }
    if (!ctrlScope[objName]) {
        console.error("(meta.createCtrl) No Controller (" + objName + ") found in scope: " + name);
        return null;
    }
    view = view || meta.view;
    var ctrl = new ctrlScope[objName](view);
    ctrlScope.ctrl = ctrl;
    ctrl.name = name;
    ctrl.view = view;
    return ctrl;
};

meta.addCtrl = function(ctrl) {
    if (!ctrl) {
        console.error("[meta.addCtrl]:", "Invalid controller passed.");
        return;
    }
    var ctrlScope = window[ctrl.name];
    ctrlScope.ctrl = ctrl;
    meta.engine.controllers.push(ctrl);
    if (meta.engine.isCtrlLoaded) {
        ctrl.load();
    }
    if (meta.engine.isReady) {
        ctrl.ready();
    }
};

meta.removeCtrl = function(ctrl) {
    if (!ctrl) {
        console.error("[meta.addCtrl]:", "Invalid controller passed.");
        return;
    }
    var ctrlScope = window[ctrl.name];
    if (!ctrlScope.ctrl) {
        console.error("[meta.removeCtrl]:", "No controller added to the scope.");
        return;
    }
    if (ctrlScope.ctrl !== ctrl) {
        console.error("[meta.removeCtrl]:", "Controller (" + ctrl.name + ") is not the same what is already added to the scope.");
        return;
    }
    ctrl.unload();
    ctrl.release();
    meta.engine.controllersToRemove.push(ctrl);
}, meta.register = function(ctrlName, view) {
    var ctrl = meta.createCtrl(ctrlName, view);
    if (!ctrl) {
        return;
    }
    meta.engine.controllers.push(ctrl);
    if (meta.engine.isCtrlLoaded) {
        ctrl.load();
    }
    if (meta.engine.isReady) {
        ctrl.ready();
    }
    return ctrl;
};

meta.unregister = function(ctrlName) {
    if (!ctrlName) {
        console.error("[meta.unregister]:", "No controller name is defined.");
        return;
    }
    var parts = ctrlName.split(".");
    if (parts.length > 2) {
        console.error("[meta.unregister]:", 'Name should be in format "MyScope.Controller".');
        return;
    }
    var name = parts[0];
    var ctrlScope = window[name];
    if (!ctrlScope) {
        console.error("[meta.unregister]:", "No such scope defined: " + name);
        return;
    }
    if (ctrlScope[name]) {
        console.error("[meta.unregister]:", "Controller (" + name + ") is already added in scope.");
        return;
    }
    var objName;
    if (parts.length === 1) {
        objName = "Controller";
    } else {
        objName = parts[1];
    }
    if (!ctrlScope[objName]) {
        console.error("[meta.unregister]:", "No Controller (" + objName + ") found in scope: " + name);
        return;
    }
    var controller = ctrlScope.ctrl;
    if (!controller) {
        console.error("[meta.unregister]:", "No Controller (" + objName + ") found in scope: " + name);
        return;
    }
    controller.unload();
    controller.release();
    meta.engine.controllersToRemove.push(controller);
};

meta.unregisterAll = function() {
    var ctrl;
    var ctrls = meta.engine.controllers;
    var numCtrls = ctrls.length;
    for (var i = 0; i < numCtrls; i++) {
        ctrl = window[ctrls[i].name].ctrl;
        ctrl.unload();
        ctrl.release();
        window[ctrls[i].name].ctrl = null;
    }
    ctrls.length = 0;
};

meta.onDomLoad = function(func) {
    if ((document.readyState === "interactive" || document.readyState === "complete") && document.body && !meta.debug) {
        func();
        return;
    }
    var cbFunc = function(event) {
        func();
        window.removeEventListener("DOMContentLoaded", cbFunc);
    };
    window.addEventListener("DOMContentLoaded", cbFunc);
};

meta.enumToString = function(buffer, value) {
    if (buffer === void 0) {
        return "unknown";
    }
    for (var enumKey in buffer) {
        if (buffer[enumKey] === value) {
            return enumKey;
        }
    }
    return "unknown";
};

meta.hexToRgb = function(hex) {
    if (hex.length < 6) {
        hex += hex.substr(1, 4);
    }
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    };
};

meta.isUrl = function(str) {
    if (str.indexOf("http://") !== -1 || str.indexOf("https://") !== -1) {
        return true;
    }
    return false;
};

meta.toUpperFirstChar = function(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

meta.loadScript = function(src, onLoad) {
    if (!meta.engine || !meta.engine.isLoaded) {
        if (!meta.cache.scripts) {
            meta.cache.scripts = [];
        }
        meta.cache.scripts.push({
            s: src,
            c: onLoad
        });
    } else {
        meta._loadScript({
            s: src,
            c: onLoad
        });
    }
};

meta._loadScript = function(obj) {
    var script = document.createElement("script");
    var firstScript = document.scripts[0];
    if ("async" in firstScript) {
        script.async = false;
        script.onload = obj.c;
        script.src = obj.s;
        document.head.appendChild(script);
    } else if (firstScript.readyState) {
        if (!meta.cache.pendingScripts) {
            meta.cache.pendingScripts = [];
        }
        meta.cache.pendingScripts.push(script);
        script.onreadystatechange = meta._onReadyStateChange;
        script.src = obj.s;
    } else {
        document.write("<script src='" + src + "' defer></script>");
    }
};

meta._onReadyStateChange = function() {
    var pendingScript;
    var pendingScripts = meta.cache.pendingScripts;
    while (pendingScripts[0] && pendingScripts[0].s.readyState === "loaded") {
        pendingScript = pendingScripts.shift();
        pendingScript.s.onreadystatechange = null;
        document.scripts[0].parentNode.insertBefore(pendingScript.s, firstScript);
        if (pendingScript.c) {
            pendingScript.c();
        }
    }
};

meta._loadAllScripts = function() {
    var scripts = meta.cache.scripts;
    if (!scripts) {
        return false;
    }
    var numScripts = scripts.length;
    if (numScripts === 0) {
        return false;
    }
    var callback = function() {
        var cache = meta.cache;
        cache.numScriptsToLoad--;
        var scripts = meta.cache.scripts;
        var numScripts = scripts.length;
        if (numScripts > 0) {
            cache.numScriptsToLoad += numScripts;
            cache.scripts = [];
            var script;
            for (var n = 0; n < numScripts; n++) {
                script = scripts[n];
                script.c = callback;
                meta._loadScript(script);
            }
        }
        if (cache.numScriptsToLoad === 0) {
            cache.scripts = null;
            meta.engine._continueLoad();
        }
    };
    var script;
    var cache = meta.cache;
    cache.numScriptsToLoad += scripts.length;
    cache.scripts = [];
    for (var i = 0; i < numScripts; i++) {
        script = scripts[i];
        script.c = callback;
        meta._loadScript(script);
    }
    return true;
};

meta.import = function(path) {
    if (!path) {
        return;
    }
    var buffer = path.split("/");
    var name = buffer[0];
    var version;
    if (buffer.length === 1) {
        version = "latest";
        path += "/latest";
    } else {
        version = buffer[buffer.length - 1];
    }
    var module = meta.modules[name];
    if (module) {
        if (module.version !== version) {
            console.error("[meta.loadPackage]:", "There is already added module [" + module.name + "] but with different version: " + module.version);
        }
        return;
    }
    module = {
        name: name,
        version: version
    };
    meta.modules[name] = module;
    if (!meta.isUrl(path)) {
        path = meta.importUrl + path + "/module.js";
    }
    meta.loadScript(path, null);
};

meta.serialize = function(obj) {
    var str = [];
    for (var key in obj) {
        str.push(encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]));
    }
    return str.join("&");
};

meta.addDescription = function(text) {
    var msg = new Entity.Text(text);
    msg.color = "#ffffff";
    msg.anchor(.5);
    var texture = new Resource.Texture();
    texture.fillRect({
        width: msg.width + 10,
        height: msg.height + 10,
        color: "#000000"
    });
    var bg = new Entity.Geometry(texture);
    bg.z = 9999;
    bg.anchor(.5, 0);
    bg.positionTop(0, 10);
    bg.isPickable = false;
    bg.ignoreZoom = true;
    bg.disableDebug = true;
    meta.view.attach(bg);
    bg.attach(msg);
};

meta.adaptTo = function(width, height, path) {
    if (meta.engine && meta.engine.isInited) {
        console.warn("[meta.adaptTo]:", "Only usable before engine is initialized.");
        return;
    }
    var resolutions = meta.cache.resolutions;
    if (!resolutions) {
        resolutions = [];
        meta.cache.resolutions = resolutions;
    }
    var lastChar = path.charAt(path.length - 1);
    if (lastChar !== "/") {
        path += "/";
    }
    var newRes = {
        width: width,
        height: height,
        path: path,
        unitSize: 1,
        zoomThreshold: 1
    };
    resolutions.push(newRes);
};

meta.removeFromArray = function(item, array) {
    var numItems = array.length;
    for (var i = 0; i < numItems; i++) {
        if (item === array[i]) {
            array[i] = array[numItems - 1];
            array.pop();
            break;
        }
    }
};

meta.shuffleArray = function(array) {
    var length = array.length;
    var temp, item;
    while (length) {
        item = Math.floor(Math.random() * length--);
        temp = array[length];
        array[length] = array[item];
        array[item] = temp;
    }
    return array;
};

meta.rotateArray = function(array) {
    var tmp = array[0];
    var numItems = array.length - 1;
    for (var i = 0; i < numItems; i++) {
        array[i] = array[i + 1];
    }
    array[numItems] = tmp;
};

meta.nextPowerOfTwo = function(value) {
    value--;
    value |= value >> 1;
    value |= value >> 2;
    value |= value >> 4;
    value |= value >> 8;
    value |= value >> 16;
    value++;
    return value;
};

"use strict";

meta.Channel = function(name) {
    this.name = name;
    this.subs = [];
    this.numSubs = 0;
    this._isEmiting = false;
    this._subsToRemove = null;
};

meta.Channel.prototype = {
    remove: function() {
        meta.channels[this.name] = null;
    },
    emit: function(data, event) {
        this._isEmiting = true;
        var sub;
        for (var i = 0; i < this.numSubs; i++) {
            sub = this.subs[i];
            sub.func.call(sub.owner, data, event);
        }
        this._isEmiting = false;
        if (this._subsToRemove) {
            var numToRemove = this._subsToRemove.length;
            for (var n = 0; n < numToRemove; n++) {
                this.unsubscribe(this._subsToRemove[n]);
            }
            this._subsToRemove = null;
        }
    },
    subscribe: function(owner, func, priority) {
        priority = priority || 0;
        if (!func) {
            console.warn("(meta.Channel.subscribe) No callback function passed.");
            return;
        }
        for (var i = 0; i < this.numSubs; i++) {
            if (this.subs[i].owner === owner) {
                console.warn("(meta.Channel.subscribe) Already subscribed to channel: " + this.name);
                return;
            }
        }
        var newSub = new meta.Subscriber(owner, func, priority);
        this.subs.push(newSub);
        this.numSubs++;
        if (priority) {
            this._havePriority = true;
            this.subs.sort(this._sortFunc);
        } else if (this._havePriority) {
            this.subs.sort(this._sortFunc);
        }
    },
    unsubscribe: function(owner) {
        if (this._isEmiting) {
            if (!this._subsToRemove) {
                this._subsToRemove = [];
            }
            this._subsToRemove.push(owner);
            return;
        }
        var sub;
        for (var i = 0; i < this.numSubs; i++) {
            sub = this.subs[i];
            if (sub.owner === owner) {
                this.subs[i] = this.subs[this.numSubs - 1];
                this.subs.pop();
                this.numSubs--;
                break;
            }
        }
        if (this._havePriority) {
            this.subs.sort(this._sortFunc);
        }
    },
    _sortFunc: function(a, b) {
        return a.priority > b.priority ? -1 : 1;
    },
    _havePriority: false
};

meta.Subscriber = function(owner, func, priority) {
    this.owner = owner;
    this.func = func;
    this.priority = priority;
};

meta.createChannel = function(name) {
    if (!name) {
        console.warn("(meta.createChannel) No name was specified!");
        return null;
    }
    var channel = meta.channels[name];
    if (!channel) {
        channel = new meta.Channel(name);
        meta.channels[name] = channel;
    }
    return channel;
};

meta.releaseChannel = function(name) {
    if (!name) {
        console.warn("(meta.releaseChannel) No name was specified!");
        return;
    }
    if (meta.channels[name]) {
        meta.channels[name] = null;
    }
};

meta.subscribe = function(owner, channel, func, priority) {
    if (typeof owner !== "object") {
        console.warn("(meta.subscribe) No owner passed.");
        return;
    }
    if (!func) {
        console.warn("(meta.subscribe) No callback function passed.");
        return;
    }
    if (typeof channel === "string") {
        var srcChannel = meta.channels[channel];
        if (!srcChannel) {
            channel = meta.createChannel(channel);
            if (!channel) {
                return;
            }
        } else {
            channel = srcChannel;
        }
    } else if (Object.prototype.toString.call(channel) === "[object Array]") {
        var numChannels = channel.length;
        for (var i = 0; i < numChannels; i++) {
            meta.subscribe(owner, channel[i], func, priority);
        }
        return;
    } else {
        console.warn("(meta.subscribe) Wrong type for channel object: " + typeof channel);
        return;
    }
    channel.subscribe(owner, func, priority);
};

meta.unsubscribe = function(owner, channel) {
    if (typeof channel === "string") {
        channel = meta.channels[channel];
        if (!channel) {
            console.warn("(meta.unsubscribe) No name was specified!");
            return;
        }
    } else if (Object.prototype.toString.call(channel) === "[object Array]") {
        var numChannels = channel.length;
        for (var i = 0; i < numChannels; i++) {
            meta.unsubscribe(owner, channel[i]);
        }
        return;
    } else {
        console.warn("(meta.unsubscribe) Wrong type for channel object.");
        return;
    }
    channel.unsubscribe(owner);
};

meta.emit = function(channel, data, event) {
    if (typeof channel === "string") {
        channel = meta.channels[channel];
        if (!channel) {
            console.warn("(meta.emit) No name was specified!");
            return;
        }
    }
    channel.emit(data, event);
};

"use strict";

meta.View = function(name) {
    this.name = name;
    this.entities = [];
    this.views = null;
    this.parentView = null;
    this.numEntities = 0;
    this._x = 0;
    this._y = 0;
    this._z = 0;
    this._tween = null;
    this._isActive = false;
};

meta.View.prototype = {
    remove: function() {
        if (this.name === "master") {
            console.warn("(meta.View.remove) Master view can't be removed");
            return;
        }
        if (this.parentView) {
            this.parentView.detachView(this);
        }
        if (this.views) {
            var numViews = this.views.length;
            for (var i = 0; i < numViews; i++) {
                this.views[i].remove();
            }
        }
        this.isActive = false;
        this._unregisterFromEngine();
        var entity;
        var numEntities = this.entities.length;
        for (var n = 0; n < numEntities; n++) {
            entity = this.entities[n];
            entity._view = null;
            entity.remove();
        }
        this.entities.length = 0;
        this.numEntities = 0;
    },
    attach: function(entity) {
        if (entity.isRemoved) {
            console.warn("(meta.View.attach) Removed entity can not be added to the view.");
            return;
        }
        if (entity._view) {
            if (entity._view === this) {
                console.warn("(meta.View.attach) Entity is already added to this view.");
            } else {
                console.warn("(meta.View.attach) Entity is already added to some other view.");
            }
            return;
        }
        if (this._x !== 0 || this._y !== 0) {
            entity.updatePos();
        }
        this.entities.push(entity);
        this.numEntities++;
        this._attachChildren(entity.children);
        entity._view = this;
        entity._viewNodeID = this.numEntities;
        if (this._z) {
            entity.z = entity._z;
        }
        if (!entity.texture) {
            entity.isLoaded = true;
        }
        if (this._isActive && meta.engine.isReady) {
            meta.renderer.addEntity(entity);
        }
    },
    _attachChildren: function(children) {
        if (!children) {
            return;
        }
        var child;
        var numChildren = children.length;
        for (var i = 0; i < numChildren; i++) {
            child = children[i];
            if (child.isRemoved) {
                continue;
            }
            child._view = this;
            this._attachChildren(child.children);
        }
    },
    detach: function(entity) {
        if (entity.isRemoved) {
            return;
        }
        if (!entity._view) {
            console.warn("(meta.View.detach) Entity does not have view.");
            return;
        }
        if (entity._view !== this) {
            console.warn("(meta.View.detach) Entity is part of other view: " + entity.view.name);
            return;
        }
        if (entity._parent !== entity._entityCtrl) {
            console.warn("(meta.View.detach) Entity children are not part of view.");
            return;
        }
        entity.isRemoved = true;
        entity.removeCore();
        this.numEntities--;
        var replaceEntity = this.entities[this.numEntities];
        replaceEntity.core.viewIndex = this.numEntities;
        this.entities[this.numEntities] = replaceEntity;
        this.entities.pop();
        if (this._isActive) {
            Renderer.ctrl.removeEntities(entity);
        }
    },
    attachView: function(view) {
        if (!view) {
            if (this.parentView) {
                console.warn("(meta.View.attach) No view was passed.");
                return;
            }
            meta.cache.view.attachView(this);
            return;
        }
        if (typeof view === "string") {
            var srcView = meta.cache.views[view];
            if (!srcView) {
                console.warn("(meta.View.attach) No such view found: " + view);
                return;
            }
            view = srcView;
        } else if (!(view instanceof meta.View)) {
            console.warn("(meta.View.attach) Trying to attach invalid view object.");
            return;
        }
        if (view._isActive) {
            console.warn("(meta.View.attach) Can't attach an active view.");
            return;
        }
        if (view.parentView) {
            console.warn("(meta.View.attach) View is already part of other view.");
            return;
        }
        if (!this.views) {
            this.views = [];
        }
        this.views.push(view);
        view.parentView = this;
        if (this._isActive) {
            view.isActive = true;
        }
    },
    detachView: function(view) {
        if (!view) {
            if (!this.parentView) {
                console.warn("(meta.View.detachView) No view was passed.");
                return;
            }
            this.parentView.detachView(this);
            return;
        }
        if (typeof view === "string") {
            var srcView = meta.cache.views[view];
            if (!srcView) {
                console.warn('(meta.View.detachView) No such view found: "' + view + '"');
                return;
            }
            view = srcView;
        }
        if (!view.parentView) {
            console.warn("(meta.View.detachView) View has not parents to detach from");
            return;
        }
        if (view.parentView !== this) {
            console.warn("(meta.View.detachView) Detaching from wrong parent");
            return;
        }
        var numViews = this.views.length;
        for (var i = 0; i < numViews; i++) {
            if (this.views[i] === view) {
                this.views[i] = this.views[numViews - 1];
                this.views.pop();
                break;
            }
        }
        view.isActive = false;
        view.parentView = null;
    },
    detachViews: function() {
        if (!this.views) {
            return;
        }
        var view;
        var numChildren = this.views.length;
        var numViews = this.views.length;
        for (var i = 0; i < numViews; i++) {
            view = this.views[i];
            view.isActive = false;
            view.parentView = null;
        }
        this.views.length = 0;
    },
    register: function(ctrlName) {
        var ctrl = meta.createCtrl(ctrlName, this);
        if (!this.controllers) {
            this.controllers = [ ctrl ];
        } else {
            this.controllers.push(ctrl);
        }
        if (!this._isActive) {
            return;
        }
        if (this.parentView && !this.parentView._isActive) {
            return;
        }
        meta.addCtrl(ctrl);
    },
    unregister: function(ctrlName) {
        var numControllers = this.controllers.length;
        for (var i = 0; i < numControllers; i++) {
            if (this.controllers[i].name === ctrlName) {
                if (this._isActive) {
                    meta.unregister(ctrlName);
                }
                this.controllers[i] = this.controllers[numControllers - 1];
                this.controllers.pop();
            }
        }
    },
    _unregisterFromEngine: function() {
        if (this.controllers) {
            var numControllers = this.controllers.length;
            for (var n = 0; n < numControllers; n++) {
                meta.unregister(this.controllers[n]);
            }
        }
    },
    _makeActive: function() {
        var n;
        if (this.controllers) {
            var numControllers = this.controllers.length;
            for (n = 0; n < numControllers; n++) {
                meta.addCtrl(this.controllers[n]);
            }
        }
        meta.renderer.addEntities(this.entities);
        if (this.views) {
            var numViews = this.views.length;
            for (n = 0; n < numViews; n++) {
                this.views[n].isActive = true;
            }
        }
    },
    _makeInactive: function() {
        var n;
        if (this.controllers) {
            var numControllers = this.controllers.length;
            for (n = 0; n < numControllers; n++) {
                meta.removeCtrl(this.controllers[n]);
            }
        }
        Renderer.ctrl.removeEntities(this.entities);
        if (this.views) {
            var numViews = this.views.length;
            for (n = 0; n < numViews; n++) {
                this.views[n].isActive = false;
            }
        }
    },
    set isActive(value) {
        if (this._isActive === value) {
            return;
        }
        if (value) {
            this._makeActive();
        } else {
            this._makeInactive();
        }
        this._isActive = value;
    },
    get isActive() {
        return this._isActive;
    },
    set x(value) {
        if (this._x === value) {
            return;
        }
        this._x = value;
        var entity;
        var numEntities = this.entities.length;
        for (var i = 0; i < numEntities; i++) {
            entity = this.entities[i];
            entity.forcePosition(entity._x, entity._y);
        }
    },
    set y(value) {
        if (this._y === value) {
            return;
        }
        this._y = value;
        var entity;
        var numEntities = this.entities.length;
        for (var i = 0; i < numEntities; i++) {
            entity = this.entities[i];
            entity.forcePosition(entity._x, entity._y);
        }
    },
    set z(value) {
        this._z = value;
        var numEntities = this.entities.length;
        for (var i = 0; i < numEntities; i++) {
            this.entities[i].z = this.entities[i]._z;
        }
    },
    get x() {
        return this._x;
    },
    get y() {
        return this._y;
    },
    get z() {
        return this._z;
    },
    get tween() {
        if (!this._tween) {
            this._tween = new meta.Tween(this);
        }
        return this._tween;
    },
    controllers: null
};

meta.createView = function(name, ctrls) {
    if (!name || typeof name !== "string") {
        console.error("(meta.createView) Invalid name of the view");
        return;
    }
    var view = meta.cache.views[name];
    if (view) {
        console.error("(meta.createView) View with a name - " + name + ", already exist");
        return;
    }
    view = new meta.View(name);
    meta.cache.views[name] = view;
    if (!ctrls) {
        return;
    }
    if (ctrls instanceof Array) {
        var numCtrls = ctrls.length;
        for (var i = 0; i < numCtrls; i++) {
            view.register(ctrls[i]);
        }
    } else {
        view.register(ctrls);
    }
};

meta.setView = function(view) {
    if (!view) {
        console.error("(meta.setView) No view passed");
        return;
    }
    var cache = meta.cache;
    if (typeof view === "string") {
        var name = view;
        view = cache.views[name];
        if (!view) {
            console.warn("(meta.setView) Creating empty view, could be unintended - " + name);
            view = new meta.View(name);
            cache.views[name] = view;
        }
    }
    if (view.isActive) {
        return;
    }
    cache.view.detachViews();
    cache.view.attachView(view);
};

meta.getView = function(name) {
    if (!name) {
        console.error("(meta.getView) No name specified");
        return null;
    }
    var view = meta.cache.views[name];
    if (!view) {
        view = new meta.View(name);
        meta.cache.views[name] = view;
    }
    return view;
};

meta.attachView = function(view) {
    if (!meta.cache.view) {
        console.warn("(meta.attachView) No current active view");
        return;
    }
    if (typeof view === "string") {
        var srcView = meta.cache.views[view];
        if (!srcView) {
            console.warn("(meta.attachView) No such view found: " + view);
            return;
        }
        view = srcView;
    }
    meta.cache.view.attachView(view);
};

meta.detachView = function(view) {
    if (!meta.cache.view) {
        console.warn("(meta.detachView) No current active view.");
        return;
    }
    if (typeof view === "string") {
        var srcView = meta.cache.views[view];
        if (!view) {
            console.warn("(meta.detachView) No such view found: " + view);
            return;
        }
        view = srcView;
    }
    meta.cache.view.detachView(view);
};

Object.defineProperty(meta, "view", {
    get: function() {
        return meta.cache.view;
    }
});

"use strict";

meta.Camera = function() {
    this._x = 0;
    this._y = 0;
    this.volume = new meta.math.AdvAABB(0, 0, 0, 0);
    this.zoomBounds = null;
    this._zoom = 1;
    this.prevZoom = 1;
    this.zoomRatio = 1;
    this._draggable = false;
    this._isDraggable = false;
    this._isAutoZoom = false;
    this._enableBorderIgnore = true;
    this._enableCentering = false;
    this._enableCenteringX = true;
    this._enableCenteringY = true;
    this._chnMove = null;
    this._chnResize = null;
    this._wasMoved = false;
    this.init();
};

meta.Camera.prototype = {
    init: function() {
        this._chnMove = meta.createChannel(meta.Event.CAMERA_MOVE);
        this._chnResize = meta.createChannel(meta.Event.CAMERA_RESIZE);
        meta.subscribe(this, meta.Event.RESIZE, this._onResize);
        meta.subscribe(this, meta.Event.WORLD_RESIZE, this._onWorldResize);
        this.zoomBounds = {
            width: -1,
            height: -1,
            minWidth: -1,
            minHeight: -1,
            maxWidth: -1,
            maxHeight: -1
        };
    },
    release: function() {
        this._chnMove.release();
        meta.unsubscribe(this, meta.Event.RESIZE);
        meta.unsubscribe(this, meta.Event.WORLD_RESIZE);
    },
    updateView: function() {
        if (this._isAutoZoom) {
            this.updateAutoZoom();
        } else {
            this.updateZoom();
        }
        if (!this._wasMoved) {
            if (this._enableCentering) {
                var world = meta.world;
                if (this._enableCenteringX) {
                    this._x = Math.floor((this.volume.width - world.width) / 2);
                } else {
                    this._x = 0;
                }
                if (this._enableCenteringY) {
                    this._y = Math.floor((this.volume.height - world.height) / 2);
                } else {
                    this._y = 0;
                }
            } else {
                this._x = 0;
                this._y = 0;
            }
            this.volume.move(this._x, this._y);
        }
        this._chnMove.emit(this, meta.Event.CAMERA_MOVE);
    },
    updateZoom: function() {
        if (this.prevZoom !== this._zoom) {
            this.zoomRatio = 1 / this._zoom;
            this.volume.scale(this.zoomRatio, this.zoomRatio);
            this._chnResize.emit(this, meta.Event.CAMERA_RESIZE);
        }
    },
    updateAutoZoom: function() {
        var scope = meta;
        var width = this.zoomBounds.width;
        var height = this.zoomBounds.height;
        var diffX = scope.width / width;
        var diffY = scope.height / height;
        this.prevZoom = this._zoom;
        this._zoom = diffX;
        if (diffY < diffX) {
            this._zoom = diffY;
        }
        if (scope.engine.adapt()) {
            width = this.zoomBounds.width;
            height = this.zoomBounds.height;
            diffX = scope.width / width;
            diffY = scope.height / height;
            this._zoom = diffX;
            if (diffY < diffX) {
                this._zoom = diffY;
            }
            this.volume.resize(scope.width, scope.height);
        }
        this.updateZoom();
    },
    bounds: function(width, height) {
        this._isAutoZoom = true;
        this.zoomBounds.width = width;
        this.zoomBounds.height = height;
        if (this.width !== 0 || this.height !== 0) {
            this.updateView();
        }
    },
    minBounds: function(width, height) {
        this._isAutoZoom = true;
        this.zoomBounds.minWidth = width;
        this.zoomBounds.minHeight = height;
        this.updateView();
    },
    maxBounds: function(width, height) {
        this._isAutoZoom = true;
        this.zoomBounds.maxWidth = width;
        this.zoomBounds.maxHeight = height;
        this.updateView();
    },
    _onInput: function(data, event) {
        var inputEvent = Input.Event;
        if (event === inputEvent.MOVE) {
            this._drag(data);
        } else if (event === inputEvent.DOWN) {
            if (data.keyCode !== 0) {
                return;
            }
            this._startDrag(data);
        } else if (event === inputEvent.UP) {
            if (data.keyCode !== 0) {
                return;
            }
            this._endDrag(data);
        }
    },
    _onResize: function(data, event) {
        this.volume.resize(data.width, data.height);
        this.updateView();
        this._chnResize.emit(this, meta.Event.CAMERA_RESIZE);
    },
    _onWorldResize: function(data, event) {},
    _startDrag: function(data) {
        if (!this._draggable) {
            return;
        }
        this._isDraggable = true;
    },
    _endDrag: function(data) {
        this._isDraggable = false;
    },
    _drag: function(data) {
        if (!this._isDraggable) {
            return;
        }
        var scope = meta;
        var diffX = (data.screenX - data.prevScreenX) * this.zoomRatio;
        var diffY = (data.screenY - data.prevScreenY) * this.zoomRatio;
        this._x += diffX;
        this._y += diffY;
        this.volume.move(-diffX, -diffY);
        this._wasMoved = true;
        if (!this.enableBorderIgnore) {
            if (-this._x < 0) {
                this._x = 0;
            }
            if (-this._y < 0) {
                this._y = 0;
            }
        }
        this._chnMove.emit(this, scope.Event.CAMERA_MOVE);
    },
    set x(value) {
        if (this._x === value) {
            return;
        }
        this._x = value;
        this._wasMoved = true;
        this.updateView();
    },
    set y(value) {
        if (this._y === value) {
            return;
        }
        this._y = value;
        this._wasMoved = true;
        this.updateView();
    },
    get x() {
        return this._x;
    },
    get y() {
        return this._y;
    },
    get width() {
        return this.volume.width;
    },
    get height() {
        return this.volume.height;
    },
    set zoom(value) {
        if (this._zoom === value) {
            return;
        }
        this.prevZoom = this._zoom;
        this._zoom = value;
        this.updateView();
    },
    get zoom() {
        return this._zoom;
    },
    set enableBorderIgnore(value) {
        this._enableBorderIgnore = value;
        this.updateView();
    },
    get enableBorderIgnore() {
        return this._enableBorderIgnore;
    },
    set draggable(value) {
        if (this._draggable === value) {
            return;
        }
        this._draggable = value;
        var events = [ Input.Event.DOWN, Input.Event.UP, Input.Event.MOVE ];
        if (value) {
            meta.subscribe(this, events, this._onInput);
        } else {
            meta.unsubscribe(this, events);
            this._isDraggable = false;
        }
    },
    get draggable() {
        return this._draggable;
    },
    set isAutoZoom(value) {
        if (this._isAutoZoom === value) {
            return;
        }
        this._isAutoZoom = value;
        this.updateView();
    },
    get isAutoZoom() {
        return this._isAutoZoom;
    },
    set enableCentering(value) {
        this._enableCentering = value;
        this.updateView();
    },
    set enableCenteringX(value) {
        this._enableCenteringX = value;
        this.updateView();
    },
    set enableCenteringY(value) {
        this._enableCenteringY = value;
        this.updateView();
    },
    get enableCentering() {
        return this._enableCentering;
    },
    get enableCenteringX() {
        return this._enableCenteringX;
    },
    get enableCenteringY() {
        return this._enableCenteringY;
    }
};

"use strict";

meta.World = function(width, height) {
    this.chn = null;
    this.volume = new meta.math.AdvAABB(0, 0, 0, 0);
    this.minWidth = -1;
    this.minHeight = -1;
    this.maxHeight = -1;
    this.maxHeight = -1;
    this.centerX = 0;
    this.centerY = 0;
    this.gridX = 0;
    this.gridY = 0;
    this.gridWidth = 0;
    this.gridHeight = 0;
    this.numGridX = 0;
    this.numGridY = 0;
    this.haveGrid = false;
    this._discardUnusedSpace = false;
    this.lockGrid = false;
    this.showBounds = false;
    this.init(width, height);
};

meta.World.prototype = {
    init: function(width, height) {
        this.bounds(width, height);
        this.chn = meta.createChannel(meta.Event.WORLD_RESIZE);
        meta.subscribe(this, meta.Event.CAMERA_RESIZE, this.onCameraResize);
    },
    updateVolume: function() {
        var scope = meta;
        var width = scope.camera.width + .5 | 0;
        var height = scope.camera.height + .5 | 0;
        this.centerX = width / 2;
        this.centerY = height / 2;
        this.volume.resize(width, height);
        if (this.chn) {
            this.chn.emit(scope.Event.WORLD_RESIZE, this);
        }
    },
    bounds: function(width, height) {
        this.volume.resize(width, height);
        this.updateVolume();
    },
    minBounds: function(width, height) {
        this.minWidth = width;
        this.minHeight = height;
        this.updateVolume();
    },
    maxBounds: function(width, height) {
        this.maxWidth = width;
        this.maxHeight = height;
        this.updateVolume();
    },
    setGrid: function(obj) {
        obj.x = obj.x || 0;
        obj.y = obj.y || 0;
        obj.width = obj.width || 16;
        obj.height = obj.height || 16;
        obj.sizeX = obj.sizeX || 1;
        obj.sizeY = obj.sizeY || 1;
        this.setGridPosition(obj.x, obj.y);
        this.setGridResolution(obj.width, obj.height);
        this.setGridSize(obj.sizeX, obj.sizeY);
    },
    setGridResolution: function(width, height) {
        this.gridWidth = width;
        this.gridHeight = height;
        this.haveGrid = width || height;
        if (!this.lockGrid) {
            this.numGridX = Math.floor(this.width / width);
            this.numGridY = Math.floor(this.height / height);
        }
        if (this.haveGrid && this._discardUnusedSpace) {
            this.setBounds(this.numGridX * this.gridWidth, this.numGridY * this.gridHeight);
        }
    },
    setGridSize: function(numGridX, numGridY) {
        this.numGridX = numGridX;
        this.numGridY = numGridY;
        this.lockGrid = numGridX || numGridY;
        if (this.haveGrid) {
            var width = this.numGridX * this.gridWidth;
            var height = this.numGridY * this.gridHeight;
            if (this.width > width) {
                width = this.width;
            }
            if (this.height > height) {
                height = this.height;
            }
            this.setBounds(width, height);
            if (!this.lockGrid) {
                this.numGridX = Math.floor(this.width / this.gridWidth);
                this.numGridY = Math.floor(this.height / this.gridHeight);
            }
        }
    },
    setGridPosition: function(x, y) {
        this.gridX = x;
        this.gridY = y;
    },
    getGridPosX: function(x) {
        return this.gridX + this.gridWidth * x;
    },
    getGridPosY: function(y) {
        return this.gridY + this.gridHeight * y;
    },
    getGridFromWorldX: function(x) {
        var gridX = Math.floor((x - this.gridX) / this.gridWidth);
        if (gridX < -1) {
            gridX = -1;
        } else if (gridX >= this.numGridX) {
            gridX = -1;
        }
        return gridX;
    },
    getGridFromWorldY: function(y) {
        var gridY = Math.floor((y - this.gridY) / this.gridHeight);
        if (gridY < -1) {
            gridY = -1;
        } else if (gridY >= this.numGridY) {
            gridY = -1;
        }
        return gridY;
    },
    get randX() {
        return meta.random.number(0, this.volume.width);
    },
    get randY() {
        return meta.random.number(0, this.volume.height);
    },
    onCameraResize: function(data, event) {
        this.updateVolume();
    },
    set discardUnusedSpace(value) {
        this._discardUnusedSpace = value;
        if (value && this.haveGrid) {
            this.setBounds(this.gridX + this.numGridX * this.gridWidth, this.gridY + this.numGridY * this.gridHeight);
        }
    },
    get discardUnusedSpace() {
        return this._discardUnusedSpace;
    },
    get left() {
        return this.volume.minX;
    },
    get right() {
        return this.volume.maxX;
    },
    get top() {
        return this.volume.minY;
    },
    get bottom() {
        return this.volume.maxY;
    },
    get width() {
        return this.volume.width;
    },
    get height() {
        return this.volume.height;
    }
};

"use strict";

(function(scope) {
    var initializing = false, fnTest = /\b_super\b/;
    scope.meta.Class = function() {};
    scope.meta.Class.extend = function(prop) {
        var _super = this.prototype;
        initializing = true;
        var proto = new this();
        initializing = false;
        for (var name in prop) {
            var p = Object.getOwnPropertyDescriptor(prop, name);
            if (p.get || p.set) {
                Object.defineProperty(proto, name, p);
                continue;
            }
            if (typeof prop[name] == "function" && typeof _super[name] == "function" && fnTest.test(prop[name])) {
                proto[name] = function(name, fn) {
                    return function(a, b, c, d, e, f) {
                        var tmp = this._super;
                        this._super = _super[name];
                        this._fn = fn;
                        var ret = this._fn(a, b, c, d, e, f);
                        this._super = tmp;
                        return ret;
                    };
                }(name, prop[name]);
                continue;
            }
            proto[name] = prop[name];
        }
        function Class(a, b, c, d, e, f) {
            if (!initializing) {
                if (this._init) {
                    this._init(a, b, c, d, e, f);
                }
                if (this.init) {
                    this.init(a, b, c, d, e, f);
                }
            }
        }
        Class.prototype = proto;
        Class.prototype.constructor = proto.init;
        Class.extend = this.extend;
        return Class;
    };
    scope.meta["Class"] = scope.meta.Class;
})(typeof window !== void 0 ? window : global);

"use strict";

meta.Controller = meta.Class.extend({
    init: meta.emptyFunc,
    _init: function(view) {
        this.view = view;
    },
    release: meta.emptyFunc,
    load: meta.emptyFunc,
    unload: meta.emptyFunc,
    ready: meta.emptyFunc,
    update: meta.emptyFuncParam,
    view: null,
    name: "unknown",
    isLoaded: false
});

"use strict";

meta.Timer = function(owner, func, tDelta, numTimes) {
    this.owner = owner;
    this.id = meta.cache.timerIndex++;
    this.func = func;
    this.onRemove = null;
    this.tDelta = tDelta;
    this.numTimes = numTimes;
    if (this.numTimes === void 0) {
        this.numTimes = -1;
    }
    this.tAccumulator = 0;
    this.tStart = Date.now();
};

meta.Timer.prototype = {
    remove: function() {
        this.numTimes = 0;
    },
    pause: function() {
        this.isPaused = true;
    },
    resume: function() {
        this.isPaused = false;
        this.tStart = Date.now();
    },
    onRemove: null,
    isPaused: false
};

meta.addTimer = function(owner, func, tDelta, numTimes) {
    if (typeof owner === "function") {
        numTimes = tDelta;
        tDelta = func;
        func = owner;
        owner = window;
    }
    var newTimer = new meta.Timer(owner, func, tDelta, numTimes);
    meta.engine._timers.push(newTimer);
    meta.engine._numTimers++;
    return newTimer;
};

"use strict";

meta.Style = function(params) {
    this.states = {};
    this.setStates(params);
    if (!this.defaultState) {
        this.setState("*", null);
    }
};

meta.Style.prototype = {
    setState: function(name, params) {
        if (name.indexOf(",") !== -1) {
            var items = name.split(/[ ,]+/);
            var numItems = items.length;
            for (var i = 0; i < numItems; i++) {
                this.defineState(items[i], params);
            }
        } else {
            this.defineState(name, params);
        }
    },
    defineState: function(name, params) {
        var state, stateParams, stateName, key;
        var tmpState;
        if (typeof params === "string") {
            params = {
                texture: params
            };
        }
        if (name.charAt(0) === "[") {
            name = name.substr(1, name.length - 2);
            if (!this.childStyle) {
                this.childStyle = new meta.Style();
            }
            this.childStyle.setState(name, params);
            return;
        }
        var actionIndex = name.indexOf(":");
        if (actionIndex !== -1) {
            var actionName = name.substr(actionIndex + 1, name.length - actionIndex - 1);
            name = name.substr(0, actionIndex);
            if (!name) {
                name = "*";
            }
            state = this.states[name];
            if (!state) {
                state = new meta.StyleState(name);
                state.actions = {};
                this.states[name] = state;
            } else if (!state.actions) {
                state.actions = {};
            }
            var tmpAction;
            if (name === "*") {
                this.defaultState = state;
                for (stateName in this.states) {
                    tmpState = this.states[stateName];
                    if (!tmpState.actions) {
                        continue;
                    }
                    tmpAction = tmpState.actions[actionName];
                    if (!tmpAction) {
                        continue;
                    }
                    stateParams = tmpAction.params;
                    for (key in params) {
                        if (stateParams[key]) {
                            continue;
                        }
                        stateParams[key] = params[key];
                    }
                }
            } else if (this.defaultState && this.defaultState.actions) {
                tmpAction = this.defaultState.actions[actionName];
                if (tmpAction) {
                    stateParams = tmpAction.params;
                    for (key in stateParams) {
                        if (params[key]) {
                            continue;
                        }
                        params[key] = stateParams[key];
                    }
                }
            }
            state.actions[actionName] = new meta.StyleState(actionName, params);
            this.haveActions = true;
        } else {
            if (!name) {
                name = "*";
            }
            state = this.states[name];
            if (!state) {
                if (this.defaultState) {
                    stateParams = this.defaultState.params;
                    for (key in stateParams) {
                        if (params[key]) {
                            continue;
                        }
                        params[key] = stateParams[key];
                    }
                }
                state = new meta.StyleState(name, params);
                if (name === "*") {
                    this.defaultState = state;
                    for (stateName in this.states) {
                        stateParams = this.states[stateName].params;
                        for (key in params) {
                            if (stateParams[key]) {
                                continue;
                            }
                            stateParams[key] = params[key];
                        }
                    }
                }
                this.states[name] = state;
            } else {
                stateParams = state.params;
                for (key in stateParams) {
                    if (stateParams[key]) {
                        continue;
                    }
                    stateParams[key] = params[key];
                }
                state._updateTexture();
            }
        }
        return this;
    },
    setStates: function(params) {
        for (var key in params) {
            this.setState(key, params[key]);
        }
    },
    setHiddenState: function(name, texture, params) {
        var state = this.setState(name, texture, params);
        if (state) {
            state.isHidden = true;
        }
        return state;
    },
    removeState: function(name) {
        if (!this.states[name]) {
            console.warn("[meta.Brush.removeState]:", "No such state: " + name);
            return;
        }
        delete this.states[name];
    },
    update: function(entity) {
        entity.isNeedStyle = false;
        if (!this.states) {
            return;
        }
        var styleState = this.states[entity._state];
        if (!styleState) {
            if (!this.defaultState) {
                console.warn("[meta.Style.update]:", "Could not get state from the style: " + entity._state);
                return;
            }
            styleState = this.defaultState;
        }
        if (styleState === entity._styleState) {
            return;
        }
        var key;
        var entityParams = entity._styleParams;
        for (key in entityParams) {
            entity[key] = entityParams[key];
        }
        entityParams = {};
        entity._styleParams = entityParams;
        var params = styleState.params;
        for (key in params) {
            entityParams[key] = entity[key];
            entity[key] = params[key];
        }
        entity._styleState = styleState;
        if (entity._inputFlags) {
            this.updateAction(entity);
        }
    },
    updateAction: function(entity) {
        var entityParams = entity._styleActionParams;
        for (var key in entityParams) {
            entity[key] = entityParams[key];
        }
        entityParams = {};
        entity._styleActionParams = entityParams;
        var action;
        var state = this.states[entity._state];
        if (!state) {
            if (!this.defaultState) {
                return;
            }
            state = this.defaultState;
        }
        if (!state.actions) {
            if (!this.defaultState.actions) {
                return;
            }
            action = this.defaultState.actions[entity._action];
        } else {
            action = state.actions[entity._action];
        }
        if (!action) {
            return;
        }
        var params = action.params;
        for (var key in params) {
            entityParams[key] = entity[key];
            entity[key] = params[key];
        }
    },
    getRandomState: function() {
        if (!this.states) {
            return null;
        }
        var result = null;
        var count = 0;
        for (var key in this.states) {
            if (!this.states[key].isHidden) {
                if (Math.random() < 1 / ++count) {
                    result = key;
                }
            }
        }
        return result;
    },
    states: null,
    defaultState: null,
    haveActions: false,
    childStyle: null
};

meta.StyleState = function(name, params) {
    this.name = name;
    this.params = params;
    this.isHidden = false;
    this._updateTexture();
};

meta.StyleState.prototype = {
    _updateTexture: function() {
        if (this.params && this.params.texture !== void 0) {
            var texture = this.params.texture;
            if (typeof texture !== "string") {
                return;
            }
            var newTexture = meta.getTexture(texture);
            if (!newTexture) {
                console.warn("[meta.StyleState]:", "Could not get texture from texture name: " + texture);
                return;
            }
            this.params.texture = newTexture;
        }
    }
};

meta.createStyle = function(obj, extend) {
    if (!obj) {
        if (!extend) {
            return null;
        }
        return extend;
    }
    extend = extend || null;
    var newStyle = Object.create(extend);
    if (typeof obj === "string" || obj instanceof Resource.Texture) {
        if (!newStyle["*"]) {
            newStyle["*"] = {
                texture: obj
            };
        } else {
            newStyle["*"].texture = obj;
        }
    } else if (typeof obj === "object") {
        var item, itemKey, paramsItem, itemKey;
        var i, key, style, tmpStyle, styleName, styleBuffer, numStyles;
        for (itemKey in obj) {
            item = obj[itemKey];
            if (typeof item === "string") {
                item = {
                    texture: item
                };
            }
            if (itemKey.indexOf(",") !== -1) {
                styleBuffer = itemKey.split(/[ ,]+/);
                numStyles = styleBuffer.length;
                for (i = 0; i < numStyles; i++) {
                    styleName = styleBuffer[i];
                    style = newStyle[styleName];
                    if (!style) {
                        style = {};
                    } else {
                        tmpStyle = {};
                        for (key in style) {
                            tmpStyle[key] = style[key];
                        }
                        style = tmpStyle;
                    }
                    for (key in item) {
                        style[key] = item[key];
                    }
                    newStyle[styleName] = style;
                }
            } else {
                style = newStyle[itemKey];
                if (!style) {
                    style = {};
                } else {
                    tmpStyle = {};
                    for (key in style) {
                        tmpStyle[key] = style[key];
                    }
                    style = tmpStyle;
                }
                for (key in item) {
                    style[key] = item[key];
                }
                newStyle[itemKey] = style;
            }
        }
    }
    return newStyle;
};

"use strict";

meta.Event = {
    RESIZE: "resize",
    WORLD_RESIZE: "world-resize",
    CAMERA_MOVE: "camera-move",
    CAMERA_RESIZE: "camera-resize",
    FOCUS: "focus",
    FULLSCREEN: "fullscreen",
    ADAPT: "adapt"
};

meta.Priority = {
    LOW: 0,
    MEDIUM: 5e3,
    HIGH: 1e4
};

meta.Cursor = {
    ALIAS: "alias",
    ALL_SCROLL: "all-scroll",
    CELL: "cell",
    CONTEXT_MENU: "context-menu",
    COL_RESIZE: "col-resize",
    COPY: "copy",
    CROSSHAIR: "crosshair",
    DEFAULT: "default",
    E_RESIZE: "e-resize",
    EW_RESIZE: "ew-resize",
    GRAB: "grab",
    GRABBING: "grabbing",
    HELP: "help",
    MOVE: "move",
    N_RESIZE: "n-resize",
    NE_RESIZE: "ne-resize",
    NESW_RESIZE: "nesw-resize",
    NS_RESIZE: "ns-reisize",
    NW_RESIZE: "nw-resize",
    NWSE_RESIZE: "nwse-resize",
    NO_DROP: "no-drop",
    NONE: "none",
    NOT_ALLOWED: "not-allowed",
    POINTER: "pointer",
    PROGRESS: "progress",
    ROW_RESIZE: "row-resize",
    S_RESIZE: "s-resize",
    SE_RESIZE: "se-resize",
    SW_RESIZE: "sw-resize",
    TEXT: "text",
    VERTICAL_TEXT: "vertical-text",
    W_RESIZE: "w-resize",
    WAIT: "wait",
    ZOOM_IN: "zoom-in",
    ZOOM_OUT: "zoom-out",
    INITIAL: "initial"
};

"use strict";

meta.getTexture = function(name) {
    return Resource.ctrl.getTexture(name);
};

"use strict";

meta.ajax = function(params) {
    if (params.dataType === "html") {
        params.responseType = "document";
    } else if (params.dataType === "script" || params.dataType === "json") {
        params.responseType = "text";
    } else if (params.dataType === void 0) {
        params.responseType = "GET";
    } else {
        params.responseType = params.dataType;
    }
    if (params.type === void 0) {
        params.type = "GET";
    }
    var data = meta.serialize(params.data);
    var xhr = new XMLHttpRequest();
    xhr.open(params.type, params.url, true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.onload = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            if (params.success !== void 0) {
                if (params.responseType === "document") {
                    params.success(xhr.responseXML);
                } else if (params.dataType === "script") {
                    params.success(eval(xhr.responseText));
                } else if (params.dataType === "json") {
                    params.success(JSON.parse(xhr.responseText));
                } else {
                    params.success(xhr.responseText);
                }
            }
        } else {
            if (params.error !== void 0) {
                params.error();
            }
        }
    };
    xhr.send(data);
    return xhr;
};

"use strict";

meta.utils.LinkedList = function() {
    this.length = 0;
    this.first = new meta.utils.LinkedListNode(null);
    this.last = new meta.utils.LinkedListNode(null);
    this.first.next = this.last;
    this.last.prev = this.first;
};

meta.utils.LinkedList.prototype = {
    push: function(node) {
        this.last.prev.next = node;
        this.last.prev = node;
        node.prev = this.last.prev;
        node.next = this.last;
        this.length++;
    },
    remove: function(node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
        node.prev = null;
        node.next = null;
        this.length--;
    }
};

meta.utils.LinkedListNode = function(data) {
    this.data = data;
    this.prev = null;
    this.next = null;
};

"use strict";

meta.math = {};

meta.math = {
    degToRad: function(degree) {
        return degree * Math.PI / 180;
    },
    radToDeg: function(rad) {
        return rad * 180 / Math.PI;
    },
    radiansToPoint: function(x1, y1, x2, y2) {
        var dx = x2 - x1;
        var dy = y2 - y1;
        return Math.atan(dx / dy);
    },
    clamp: function(num, min, max) {
        return num < min ? min : num > max ? max : num;
    },
    map: function(v, a, b, x, y) {
        return v == a ? x : (v - a) * (y - x) / (b - a) + x;
    },
    length: function(x1, y1, x2, y2) {
        var x = x2 - x1;
        var y = y2 - y1;
        return Math.sqrt(x * x + y * y);
    },
    length2: function(x, y) {
        return Math.sqrt(x * x + y * y);
    },
    limit: function(value, maxValue) {
        if (value > maxValue) {
            return maxValue;
        }
        if (value < -maxValue) {
            return -maxValue;
        }
        return value;
    },
    lerp: function(value1, value2, amount) {
        return value1 + (value2 - value1) * amount;
    },
    lookAt: function(srcX, srcY, targetX, targetY) {
        return Math.atan2(targetX - srcX, srcY - targetY);
    },
    lookAtEntity: function(src, target) {
        return meta.math.lookAt(src.x, src.y, target.x, target.y);
    }
};

"use strict";

meta.math.Vector2 = function(x, y) {
    this.x = x;
    this.y = y;
};

meta.math.Vector2.prototype = {
    reset: function() {
        this.x = 0;
        this.y = 0;
    },
    set: function(x, y) {
        this.x = x;
        this.y = y;
    },
    add: function(value) {
        this.x += value;
        this.y += value;
    },
    sub: function(value) {
        this.x -= value;
        this.y -= value;
    },
    mul: function(value) {
        this.x *= value;
        this.y *= value;
    },
    div: function(value) {
        this.x /= value;
        this.y /= value;
    },
    addVec2: function(vec) {
        this.x += vec.x;
        this.y += vec.y;
    },
    subVec2: function(vec) {
        this.x -= vec.x;
        this.y -= vec.y;
    },
    mulVec2: function(vec) {
        this.x *= vec.x;
        this.y *= vec.y;
    },
    divVec2: function(vec) {
        this.x /= vec.x;
        this.y /= vec.y;
    },
    length: function() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    },
    normalize: function() {
        var length = Math.sqrt(this.x * this.x + this.y * this.y);
        if (length > 0) {
            this.x /= length;
            this.y /= length;
        } else {
            this.x = 0;
            this.y = 0;
        }
    },
    dot: function(vec) {
        return this.x * vec.x + this.y * vec.y;
    },
    truncate: function(max) {
        var length = Math.sqrt(this.x * this.x + this.y * this.y);
        if (length > max) {
            this.x *= max / length;
            this.y *= max / length;
        }
    },
    limit: function(max) {
        if (this.x > max) {
            this.x = max;
        } else if (this.x < -max) {
            this.x = -max;
        }
        if (this.y > max) {
            this.y = max;
        } else if (this.y < -max) {
            this.y = -max;
        }
    },
    lengthSq: function() {
        return this.x * this.x + this.y * this.y;
    },
    heading: function() {
        var angle = Math.atan2(-this.y, this.x);
        return -angle + Math.PI * .5;
    },
    perp: function() {
        var tmpX = this.x;
        this.x = -this.y;
        this.y = tmpX;
    },
    print: function(str) {
        if (str) {
            console.log('[vec "' + str + '"] x: ' + this.x + " y: " + this.y);
        } else {
            console.log("[vec] x: " + this.x + " y: " + this.y);
        }
    }
};

"use strict";

meta.math.AABB = function(x, y, width, height) {
    this.x = x || 0;
    this.y = y || 0;
    this.width = width || 0;
    this.height = height || 0;
    this.minX = this.x;
    this.minY = this.y;
    this.maxX = this.x + this.width;
    this.maxY = this.y + this.height;
};

meta.math.AABB.prototype = {
    set: function(x, y) {
        this.x = x;
        this.y = y;
        this.minX = this.x - this.pivotPosX;
        this.minY = this.y - this.pivotPosY;
        this.maxX = this.minX + this.width;
        this.maxY = this.minY + this.height;
        meta.renderer.needRender = true;
    },
    move: function(x, y) {
        this.minX += x;
        this.minY += y;
        this.maxX += x;
        this.maxY += y;
        meta.renderer.needRender = true;
    },
    resize: function(width, height) {
        this.width = width || 0;
        this.height = height || 0;
        this.updatePivot();
        this.minX = this.x - this.pivotPosX;
        this.minY = this.y - this.pivotPosY;
        this.maxX = this.minX + this.width;
        this.maxY = this.minY + this.height;
        meta.renderer.needRender = true;
    },
    pivot: function(x, y) {
        if (this.pivotX === x && this.pivotY === y) {
            return;
        }
        this.pivotX = x;
        this.pivotY = y;
        this.updatePivot();
        meta.renderer.needRender = true;
    },
    updatePivot: function() {
        if (this.scaleX > 0) {
            this.pivotPosX = this.pivotX * this.width;
        } else {
            this.pivotPosX = (1 - this.pivotX) * this.width;
        }
        if (this.scaleY > 0) {
            this.pivotPosY = this.pivotY * this.height;
        } else {
            this.pivotPosY = (1 - this.pivotY) * this.height;
        }
    },
    vsAABB: function(src) {
        if (this.maxX < src.minX || this.minX > src.maxX) {
            return false;
        }
        if (this.maxY < src.minY || this.minY > src.maxY) {
            return false;
        }
        return true;
    },
    vsBorderAABB: function(src) {
        if (this.maxX <= src.minX || this.minX >= src.maxX) {
            return false;
        }
        if (this.maxY <= src.minY || this.minY >= src.maxY) {
            return false;
        }
        return true;
    },
    vsAABBIntersection: function(src) {
        if (this.maxX < src.minX || this.minX > src.maxX) {
            return 0;
        }
        if (this.maxY < src.minY || this.minY > src.maxY) {
            return 0;
        }
        if (this.minX > src.minX || this.minY > src.minY) {
            return 1;
        }
        if (this.maxX < src.maxX || this.maxY < src.maxY) {
            return 1;
        }
        return 2;
    },
    vsPoint: function(x, y) {
        if (this.minX > x || this.maxX < x) {
            return false;
        }
        if (this.minY > y || this.maxY < y) {
            return false;
        }
        return true;
    },
    vsBorderPoint: function(x, y) {
        if (this.minX >= x || this.maxX <= x) {
            return false;
        }
        if (this.minY >= y || this.maxY <= y) {
            return false;
        }
        return true;
    },
    getSqrDistance: function(x, y) {
        var tmp;
        var sqDist = 0;
        if (x < this.minX) {
            tmp = this.minX - x;
            sqDist += tmp * tmp;
        }
        if (x > this.maxX) {
            tmp = x - this.maxX;
            sqDist += tmp * tmp;
        }
        if (y < this.minY) {
            tmp = this.minY - y;
            sqDist += tmp * tmp;
        }
        if (y > this.maxY) {
            tmp = y - this.maxY;
            sqDist += tmp * tmp;
        }
        return sqDist;
    },
    getDistanceVsAABB: function(aabb) {
        var centerX = this.minX + (this.maxX - this.minX) / 2;
        var centerY = this.minY + (this.maxY - this.minY) / 2;
        var srcCenterX = aabb.minX + (aabb.maxY - aabb.minY) / 2;
        var srcCenterY = aabb.minY + (aabb.maxY - aabb.minY) / 2;
        var diffX = srcCenterX - centerX;
        var diffY = srcCenterY - centerY;
        return Math.sqrt(diffX * diffX + diffY * diffY);
    },
    isUndefined: function() {
        return this.maxY === void 0;
    },
    genCircle: function() {
        var width = this.maxX - this.minX;
        var height = this.maxY - this.minY;
        var radius;
        if (width > height) {
            radius = width / 2;
        } else {
            radius = height / 2;
        }
        return new meta.math.Circle(this.x, this.y, radius);
    },
    print: function(str) {
        if (str) {
            console.log("(AABB) " + str + " minX: " + this.minX + " minY: " + this.minY + " maxX: " + this.maxX + " maxY: " + this.maxY);
        } else {
            console.log("(AABB) minX: " + this.minX + " minY: " + this.minY + " maxX: " + this.maxX + " maxY: " + this.maxY);
        }
    },
    pivotX: 0,
    pivotY: 0,
    pivotPosX: 0,
    pivotPosY: 0,
    scaleX: 0,
    scaleY: 0
};

"use strict";

meta.math.AdvAABB = function(minX, minY, maxX, maxY) {
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
    this.initWidth = maxX - minX;
    this.initHeight = maxY - minY;
    this.initHalfWidth = this.initWidth * .5;
    this.initHalfHeight = this.initHeight * .5;
    this.width = this.initWidth;
    this.height = this.initHeight;
    this.halfWidth = this.initHalfWidth;
    this.halfHeight = this.initHalfHeight;
    this.x = minX + this.halfWidth | 0;
    this.y = minY + this.halfHeight | 0;
    this.scaleX = 1;
    this.scaleY = 1;
};

meta.math.AdvAABB.prototype = {
    move: function(x, y) {
        this.x += x;
        this.y += y;
        this.minX += x;
        this.minY += y;
        this.maxX += x;
        this.maxY += y;
    },
    set: function(x, y) {
        this.x = x;
        this.y = y;
        this.minX = this.x - this.halfWidth;
        this.minY = this.y - this.halfHeight;
        this.maxX = this.x + this.halfWidth;
        this.maxY = this.y + this.halfHeight;
    },
    resize: function(width, height) {
        this.initWidth = width;
        this.initHeight = height;
        this.initHalfWidth = width * .5;
        this.initHalfHeight = height * .5;
        this.width = width * this.scaleX;
        this.height = height * this.scaleY;
        this.halfWidth = this.width * .5;
        this.halfHeight = this.height * .5;
        this.maxX = this.minX + this.width;
        this.maxY = this.minY + this.height;
    },
    scale: function(scaleX, scaleY) {
        this.scaleX = scaleX;
        this.scaleY = scaleY;
        this.width = this.initWidth * this.scaleX;
        this.height = this.initHeight * this.scaleY;
        this.halfWidth = this.width / 2;
        this.halfHeight = this.height / 2;
        this.minX = this.x - this.halfWidth;
        this.minY = this.y - this.halfHeight;
        this.maxX = this.minX + this.width;
        this.maxY = this.minY + this.height;
    },
    scalePivoted: function(scaleX, scaleY, x, y) {
        this.scaleX = scaleX;
        this.scaleY = scaleY;
        this.width = this.initWidth * this.scaleX;
        this.height = this.initHeight * this.scaleY;
        this.halfWidth = this.width / 2;
        this.halfHeight = this.height / 2;
        this.x = x;
        this.y = y;
        this.minX = this.x - this.halfWidth;
        this.minY = this.y - this.halfHeight;
        this.maxX = this.minX + this.width;
        this.maxY = this.minY + this.height;
    },
    vsAABB: function(src) {
        if (this.maxX < src.minX || this.minX > src.maxX) {
            return false;
        }
        if (this.maxY < src.minY || this.minY > src.maxY) {
            return false;
        }
        return true;
    },
    vsBorderAABB: function(src) {
        if (this.maxX <= src.minX || this.minX >= src.maxX) {
            return false;
        }
        if (this.maxY <= src.minY || this.minY >= src.maxY) {
            return false;
        }
        return true;
    },
    vsAABBIntersection: function(src) {
        if (this.maxX < src.minX || this.minX > src.maxX) {
            return 0;
        }
        if (this.maxY < src.minY || this.minY > src.maxY) {
            return 0;
        }
        if (this.minX > src.minX || this.minY > src.minY) {
            return 1;
        }
        if (this.maxX < src.maxX || this.maxY < src.maxY) {
            return 1;
        }
        return 2;
    },
    vsPoint: function(x, y) {
        if (this.minX > x || this.maxX < x) {
            return false;
        }
        if (this.minY > y || this.maxY < y) {
            return false;
        }
        return true;
    },
    vsBorderPoint: function(x, y) {
        if (this.minX >= x || this.maxX <= x) {
            return false;
        }
        if (this.minY >= y || this.maxY <= y) {
            return false;
        }
        return true;
    },
    getSqrDistance: function(x, y) {
        var tmp;
        var sqDist = 0;
        if (x < this.minX) {
            tmp = this.minX - x;
            sqDist += tmp * tmp;
        }
        if (x > this.maxX) {
            tmp = x - this.maxX;
            sqDist += tmp * tmp;
        }
        if (y < this.minY) {
            tmp = this.minY - y;
            sqDist += tmp * tmp;
        }
        if (y > this.maxY) {
            tmp = y - this.maxY;
            sqDist += tmp * tmp;
        }
        return sqDist;
    },
    getDistanceVsAABB: function(aabb) {
        var centerX = this.minX + (this.maxX - this.minX) * .5;
        var centerY = this.minY + (this.maxY - this.minY) * .5;
        var srcCenterX = aabb.minX + (aabb.maxY - aabb.minY) * .5;
        var srcCenterY = aabb.minY + (aabb.maxY - aabb.minY) * .5;
        var diffX = srcCenterX - centerX;
        var diffY = srcCenterY - centerY;
        return Math.sqrt(diffX * diffX + diffY * diffY);
    },
    isUndefined: function() {
        return this.maxY === void 0;
    },
    draw: function(ctx) {
        var unitSize = meta.unitSize;
        var minX, minY, maxX, maxY;
        minX = this.minX | 0;
        minY = this.minY | 0;
        maxX = this.maxX + .5 | 0;
        maxY = this.maxY + .5 | 0;
        ctx.beginPath();
        ctx.moveTo(minX, minY);
        ctx.lineTo(maxX, minY);
        ctx.lineTo(maxX, maxY);
        ctx.lineTo(minX, maxY);
        ctx.lineTo(minX, minY);
        ctx.stroke();
    },
    drawTranslated: function(ctx) {
        var camera = meta.camera;
        this.translate(camera._x, camera._y);
        this.draw(ctx);
        this.translate(-camera._x, -camera._y);
    },
    genCircle: function() {
        var radius;
        if (this.initHalfWidth > this.initHalfHeight) {
            radius = this.initHalfWidth;
        } else {
            radius = this.initHalfHeight;
        }
        return new meta.math.Circle(this.x, this.y, radius);
    },
    print: function(str) {
        if (str) {
            console.log("(AABB) " + str + " minX: " + this.minX + " minY: " + this.minY + " maxX: " + this.maxX + " maxY: " + this.maxY);
        } else {
            console.log("(AABB) minX: " + this.minX + " minY: " + this.minY + " maxX: " + this.maxX + " maxY: " + this.maxY);
        }
    }
};

"use strict";

meta.math.Circle = function(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
};

meta.math.Circle.prototype = {
    vsPoint: function(x, y) {
        return (this.x - x) * 2 + (this.y - y) * 2 <= radius * 2;
    },
    vsCircle: function(circle) {
        var radius2 = this.radius + circle.radius;
        radius2 *= radius2;
        var x2 = this.x + circle.x;
        x2 *= x2;
        var y2 = this.y + circle.y;
        y2 *= y2;
        return radius2 < x2 + y2;
    },
    overlapCircle: function(circle) {
        var distance = Math.sqrt((this.x - circle.x) * (this.y - circle.y));
        if (distance > this.radius + circle.radius) {
            return 0;
        } else if (distance <= Math.abs(this.radius + circle.radius)) {
            return 1;
        }
        return 2;
    },
    genAABB: function() {
        return new meta.math.AABB(this.x - this.radius, this.y - this.radius, this.x + this.radius, this.y + this.radius);
    },
    print: function(str) {
        if (str) {
            console.log("[" + str + "] x:", this.x, "y:", this.y, "raidus:", this.radius);
        } else {
            console.log("x:", this.x, "y:", this.y, "raidus:", this.radius);
        }
    }
};

"use strict";

meta.math.Matrix4 = function() {
    this.m = new Float32Array(16);
    this.m[0] = 1;
    this.m[5] = 1;
    this.m[10] = 1;
    this.m[15] = 1;
};

meta.math.Matrix4.prototype = {
    reset: function() {
        this.m[0] = 1;
        this.m[1] = 0;
        this.m[2] = 0;
        this.m[3] = 0;
        this.m[4] = 0;
        this.m[5] = 1;
        this.m[6] = 0;
        this.m[7] = 0;
        this.m[8] = 0;
        this.m[9] = 0;
        this.m[10] = 1;
        this.m[11] = 0;
        this.m[12] = 0;
        this.m[13] = 0;
        this.m[14] = 0;
        this.m[15] = 1;
    },
    scale: function(x, y, z) {
        this.m[0] = x;
        this.m[5] = y;
        this.m[10] = z;
    },
    ortho: function(left, right, bottom, top, zNear, zFar) {
        this.m[0] = 2 / (right - left);
        this.m[1] = 0;
        this.m[2] = 0;
        this.m[3] = 0;
        this.m[4] = 0;
        this.m[5] = 2 / (top - bottom);
        this.m[6] = 0;
        this.m[7] = 0;
        this.m[8] = 0;
        this.m[9] = 0;
        this.m[10] = -2 / (zFar - zNear);
        this.m[11] = 0;
        this.m[12] = -(right + left) / (right - left);
        this.m[13] = -(top + bottom) / (top - bottom);
        this.m[14] = -(zFar + zNear) / (zFar - zNear);
        this.m[15] = 1;
    }
};

"use strict";

meta.math.Random = function() {
    this.seed = 0;
    this.a = 0;
    this.m = 0;
    this.q = 0;
    this.r = 0;
    this.oneOverM = 0;
    this.init();
};

meta.math.Random.prototype = {
    init: function() {
        this.setSeed(3456789012, true);
    },
    generate: function() {
        var hi = Math.floor(this.seed / this.q);
        var lo = this.seed % this.q;
        var test = this.a * lo - this.r * hi;
        if (test > 0) {
            this.seed = test;
        } else {
            this.seed = test + this.m;
        }
        return this.seed * this.oneOverM;
    },
    number: function(min, max) {
        var number = this.generate();
        return Math.round((max - min) * number + min);
    },
    numberF: function(min, max) {
        var number = this.generate();
        return (max - min) * number + min;
    },
    setSeed: function(seed, useTime) {
        if (useTime !== void 0) {
            useTime = true;
        }
        if (useTime === true) {
            var date = new Date();
            this.seed = seed + date.getSeconds() * 16777215 + date.getMinutes() * 65535;
        } else {
            this.seed = seed;
        }
        this.a = 48271;
        this.m = 2147483647;
        this.q = Math.floor(this.m / this.a);
        this.r = this.m % this.a;
        this.oneOverM = 1 / this.m;
    }
};

meta.random = new meta.math.Random();

"use strict";

meta.Tween = function() {
    this.cache = null;
    this.chain = [];
};

meta.Tween.prototype = {
    play: function() {
        if (!this.cache) {
            this.autoPlay = true;
        } else {
            var cache = this.cache;
            if (!cache.owner) {
                return this;
            }
            if (cache.owner.isRemoved) {
                return this;
            }
            cache.isPaused = false;
            cache.numRepeat = this.numRepeat;
            this.next();
            this._play();
            this.cache = null;
        }
        return this;
    },
    _play: function() {
        if (Renderer.ctrl._addToUpdating(this.cache) && this._group) {
            this._group.activeUsers++;
        }
    },
    stop: function(callCB) {
        this.linkIndex = 0;
        this._stop(callCB);
        if (this.cache) {
            this.autoPlay = false;
            this.cache = null;
        }
        return this;
    },
    _stop: function(callCB) {
        if (Renderer.ctrl._removeFromUpdating(this.cache)) {
            if (callCB) {
                callCB(this.cache.owner);
            }
            if (this.cache.currLink._onDone) {
                this.cache.currLink._onDone.call(this.cache.owner);
            }
            if (this._group) {
                this._group.activeUsers--;
                if (this._group.activeUsers === 0 && this._group.callback) {
                    this._group.callback();
                }
            }
        }
    },
    paused: function(value) {
        if (value === void 0) {
            value = true;
        }
        this.cache.isPaused = value;
        return this;
    },
    resume: function() {
        this.cache.isPaused = false;
        return this;
    },
    clear: function() {
        this.stop();
        this._tStart = 0;
        this.chain.length = 0;
        this.linkIndex = 0;
        this.currLink = null;
        if (this._group) {
            this._group.users--;
            this._group = null;
        }
        return this;
    },
    reset: function() {
        var cache = this.cache;
        cache.linkIndex = 0;
        cache.currLink = this.chain[0];
        if (!cache.currLink) {
            return this;
        }
        for (var key in cache.currLink.startValues) {
            cache.owner[key] = cache.currLink.startValues[key];
        }
        this.stop(false);
        return this;
    },
    next: function() {
        var isRepeating = false;
        var cache = this.cache;
        if (cache.linkIndex === this.chain.length) {
            if (cache.numRepeat === 0) {
                this.stop();
                return this;
            } else {
                cache.linkIndex = 0;
                if (cache.numRepeat !== -1) {
                    cache.numRepeat--;
                    if (cache.numRepeat === 0) {
                        this.stop();
                        return this;
                    }
                }
                isRepeating = true;
            }
        }
        cache._isLinkDone = false;
        var key;
        var link = this.chain[cache.linkIndex++];
        var owner = cache.owner;
        if (!isRepeating) {
            for (key in link.endValues) {
                link.startValues[key] = owner[key];
            }
        } else {
            for (key in link.startValues) {
                owner[key] = link.startValues[key];
            }
        }
        if (link._onStart) {
            link._onStart.call(this);
        }
        cache._tStart = meta.engine.tNow;
        cache.currLink = link;
        return this;
    },
    repeat: function(numRepeat) {
        if (numRepeat === void 0) {
            numRepeat = -1;
        }
        this.numRepeat = numRepeat;
        return this;
    },
    set reverse(value) {
        if (value === void 0) {
            value = true;
        }
        this.cache.isReverse = value;
        return this;
    },
    get reverse() {
        return this.cache.isReverse;
    },
    update: function(tDelta) {
        var cache = this.cache;
        if (!cache.currLink) {
            this.stop(false);
            return;
        }
        var tCurr = meta.engine.tNow;
        var tFrameDelta = tCurr - cache._tFrame;
        if (tFrameDelta < cache.currLink.tFrameDelay) {
            return;
        }
        var tElapsed = (tCurr - cache._tStart) / cache.currLink.duration;
        if (tElapsed > 1) {
            tElapsed = 1;
        }
        if (cache._isLinkDone) {
            if (tFrameDelta < cache.currLink.tDelay) {
                return;
            }
        } else {
            cache._tFrame = tCurr;
            cache.currLink.update(tElapsed);
            if (cache.currLink._onTick) {
                cache.currLink._onTick.call(this);
            }
        }
        if (tElapsed === 1) {
            if (!cache._isLinkDone && cache.currLink.tDelay > 0) {
                cache._isLinkDone = true;
                return;
            }
            this.next();
        }
    },
    to: function(endValues, duration, onDone) {
        var link = new meta.Tween.Link(this, endValues, duration, onDone);
        this.chain.push(link);
        return link;
    },
    wait: function(tDelay) {
        var link = this.to(null, 0, null);
        link.wait(tDelay);
        return link;
    },
    group: function(group) {
        if (!group) {
            console.warn("[meta.Tween.group]:", "No group name specified.");
            return this;
        }
        if (this._group) {
            console.warn("[meta.Tween.group]:", "Tween already is part of a group.");
            return this;
        }
        if (typeof group === "object") {
            this._group = group;
        }
        this._group.users++;
        return this;
    },
    autoPlay: false,
    _group: null,
    _isReversing: false,
    _removeFlag: 0,
    numRepeat: 0
};

meta.Tween.Cache = function(owner) {
    this.owner = owner;
    this.tween = null;
    this.linkIndex = 0;
    this.currLink = null;
    this.numRepeat = 0;
    this._updateNodeID = -1;
    this._isLinkDone = false;
    this._tStart = 0;
    this._tFrame = 0;
};

meta.Tween.Cache.prototype = {
    update: function(tDelta) {
        this.tween.cache = this;
        this.tween.update(tDelta);
        this.tween.cache = null;
    },
    isPaused: false,
    isRemoved: false,
    reverse: false,
    _flags: 0
};

meta.Tween.Group = function(name, callback) {
    if (typeof name === "function") {
        callback = name;
        name = "";
    }
    this.name = name;
    this.users = 0;
    this.activeUsers = 0;
    this.callback = callback || null;
};

"use strict";

meta.Tween.Easing = {
    linear: function(k) {
        return k;
    },
    quadIn: function(k) {
        return k * k;
    },
    quadOut: function(k) {
        return k * (2 - k);
    },
    quadInOut: function(k) {
        if ((k *= 2) < 1) {
            return .5 * k * k;
        }
        return -.5 * (--k * (k - 2) - 1);
    },
    cubicIn: function(k) {
        return k * k * k;
    },
    cubicOut: function(k) {
        return --k * k * k + 1;
    },
    cubicInOut: function(k) {
        if ((k *= 2) < 1) {
            return .5 * k * k * k;
        }
        return .5 * ((k -= 2) * k * k + 2);
    },
    quartIn: function(k) {
        return k * k * k * k;
    },
    quartOut: function(k) {
        return 1 - --k * k * k * k;
    },
    quartInOut: function(k) {
        if ((k *= 2) < 1) {
            return .5 * k * k * k * k;
        }
        return -.5 * ((k -= 2) * k * k * k - 2);
    },
    quintIn: function(k) {
        return k * k * k * k * k;
    },
    quintOut: function(k) {
        return --k * k * k * k * k + 1;
    },
    quintIntOut: function(k) {
        if ((k *= 2) < 1) {
            return .5 * k * k * k * k * k;
        }
        return .5 * ((k -= 2) * k * k * k * k + 2);
    },
    sineIn: function(k) {
        return 1 - Math.cos(k * Math.PI / 2);
    },
    sineOut: function(k) {
        return Math.sin(k * Math.PI / 2);
    },
    sineIntOut: function(k) {
        return .5 * (1 - Math.cos(Math.PI * k));
    },
    expoIn: function(k) {
        if (k === 0) {
            return 0;
        }
        return Math.pow(1024, k - 1);
    },
    expoOut: function(k) {
        if (k === 1) {
            return 1;
        }
        return 1 - Math.pow(2, -10 * k);
    },
    expoInOut: function(k) {
        if (k === 0) {
            return 0;
        }
        if (k === 1) {
            return 1;
        }
        if ((k *= 2) < 1) {
            return .5 * Math.pow(1024, k - 1);
        }
        return .5 * (-Math.pow(2, -10 * (k - 1)) + 2);
    },
    circIn: function(k) {
        return 1 - Math.sqrt(1 - k * k);
    },
    circOut: function(k) {
        return Math.sqrt(1 - --k * k);
    },
    circInOut: function(k) {
        if ((k *= 2) < 1) {
            return -.5 * (Math.sqrt(1 - k * k) - 1);
        }
        return .5 * (Math.sqrt(1 - (k -= 2) * k) + 1);
    },
    elasticIn: function(k) {
        var s;
        var a = .1, p = .4;
        if (k === 0) {
            return 0;
        }
        if (k === 1) {
            return 1;
        }
        if (!a || a < 1) {
            a = 1;
            s = p / 4;
        } else {
            s = p * Math.asin(1 / a) / (2 * Math.PI);
        }
        return -(a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
    },
    elasticOut: function(k) {
        var s;
        var a = .1, p = .4;
        if (k === 0) {
            return 0;
        }
        if (k === 1) {
            return 1;
        }
        if (!a || a < 1) {
            a = 1;
            s = p / 4;
        } else {
            s = p * Math.asin(1 / a) / (2 * Math.PI);
        }
        return a * Math.pow(2, -10 * k) * Math.sin((k - s) * (2 * Math.PI) / p) + 1;
    },
    elasticInOut: function(k) {
        var s;
        var a = .1, p = .4;
        if (k === 0) {
            return 0;
        }
        if (k === 1) {
            return 1;
        }
        if (!a || a < 1) {
            a = 1;
            s = p / 4;
        } else {
            s = p * Math.asin(1 / a) / (2 * Math.PI);
        }
        if ((k *= 2) < 1) {
            return -.5 * (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
        }
        return a * Math.pow(2, -10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p) * .5 + 1;
    },
    backIn: function(k) {
        var s = 1.70158;
        return k * k * ((s + 1) * k - s);
    },
    backOut: function(k) {
        var s = 1.70158;
        return --k * k * ((s + 1) * k + s) + 1;
    },
    backInOut: function(k) {
        var s = 1.70158 * 1.525;
        if ((k *= 2) < 1) {
            return .5 * (k * k * ((s + 1) * k - s));
        }
        return .5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
    },
    bounceIn: function(k) {
        return 1 - meta.Tween.Easing.bounceOut(1 - k);
    },
    bounceOut: function(k) {
        if (k < 1 / 2.75) {
            return 7.5625 * k * k;
        } else if (k < 2 / 2.75) {
            return 7.5625 * (k -= 1.5 / 2.75) * k + .75;
        } else if (k < 2.5 / 2.75) {
            return 7.5625 * (k -= 2.25 / 2.75) * k + .9375;
        }
        return 7.5625 * (k -= 2.625 / 2.75) * k + .984375;
    },
    bounceInOut: function(k) {
        if (k < .5) {
            return meta.Tween.Easing.bounceIn(k * 2) * .5;
        }
        return meta.Tween.Easing.bounceOut(k * 2 - 1) * .5 + .5;
    }
};

"use strict";

meta.Tween.Link = function(tween, endValues, duration, onDone) {
    this.tween = tween;
    this.startValues = {};
    this.endValues = endValues;
    this.duration = duration;
    this._onDone = onDone;
};

meta.Tween.Link.prototype = {
    play: function() {
        this.tween.play();
        return this;
    },
    stop: function() {
        this.tween.stop();
        return this;
    },
    paused: function(value) {
        this.tween.paused(value);
        return this;
    },
    resume: function() {
        this.tween.resume();
        return this;
    },
    clear: function() {
        this.tween.clear();
        return this;
    },
    reset: function() {
        this.tween.reset();
        return this;
    },
    update: function(tElapsed) {
        var value = this._easing(tElapsed);
        var startValue, endValue, result;
        var owner = this.tween.cache.owner;
        for (var key in this.endValues) {
            startValue = this.startValues[key];
            endValue = this.endValues[key];
            if (typeof startValue === "string") {
                endValue = startValue + parseFloat(endValue, 4);
            }
            result = startValue + (endValue - startValue) * value;
            if (this.isRounding) {
                result = Math.round(result);
            }
            owner[key] = result;
        }
    },
    next: function() {
        this.tween.next();
        return this;
    },
    wait: function(tDelay) {
        this.tDelay = tDelay;
        return this;
    },
    frameDelay: function(tFrameDelay) {
        this.tFrameDelay = tFrameDelay;
        return this;
    },
    round: function(value) {
        if (value === void 0) {
            value = true;
        }
        this.isRounding = value;
        return this;
    },
    repeat: function(numRepeat) {
        this.tween.repeat(numRepeat);
        return this;
    },
    reverse: function(value) {
        this.tween.reverse(value);
        return this;
    },
    easing: function(func) {
        if (typeof func === "function") {
            this._easing = func;
        } else {
            this._easing = meta.Tween.Easing[func];
        }
        if (this._easing === void 0) {
            this._easing = meta.Tween.Easing.linear;
        }
        return this;
    },
    onStart: function(func) {
        this._onStart = func;
        return this;
    },
    onDone: function(func) {
        this._onDone = func;
        return this;
    },
    onTick: function(func) {
        this._onTick = func;
        return this;
    },
    to: function(endValues, duration, onDone) {
        return this.tween.to(endValues, duration, onDone);
    },
    group: function(name) {
        return this.tween.group(name);
    },
    _easing: meta.Tween.Easing.linear,
    _onStart: null,
    _onDone: null,
    _onTick: null,
    tDelay: 0,
    tFrameDelay: 0,
    isRounding: false
};

"use strict";

window.Component = {};

"use strict";

var Resource = {};

Resource.Controller = meta.Controller.extend({
    init: function() {
        this.resources = {};
        this.resourcesInUse = {};
        this._chn_added = meta.createChannel(Resource.Event.ADDED);
        this._chn_allLoaded = meta.createChannel(Resource.Event.ALL_LOADED);
        var canvas = document.createElement("canvas");
        Resource.Texture.prototype._tmpImg = canvas;
        Resource.Texture.prototype._tmpCtx = canvas.getContext("2d");
        meta.subscribe(this, meta.Event.ADAPT, this.onAdapt);
        var proto = Resource.Sound.prototype;
        if (meta.device.isAudioAPI) {
            proto._context = new AudioContext();
            console.log("%cAudio: %cWebAudio ", "font-weight: bold; padding: 2px 0 2px 0;", "padding: 2px 0 2px 0;");
        } else {
            proto._loadFromUrl = proto._loadFromUrl_legacy;
            proto._clear = proto._clear_legacy;
            proto._createInstance = proto._createInstance_legacy;
            proto._syncLoading = true;
            console.log("%cAudio: %c<audio> ", "font-weight: bold; padding: 2px 0 1px 0; width: 500px;", "padding: 2px 0 1px 0;");
        }
    },
    add: function(resource) {
        var subBuffer = this.resources[resource.type];
        if (!subBuffer) {
            subBuffer = {};
            this.resources[resource.type] = subBuffer;
        }
        var path = resource.path;
        if (resource.name === "unknown" && path) {
            var wildcardIndex = path.lastIndexOf(".");
            var slashIndex = path.lastIndexOf("/");
            if (wildcardIndex < 0 || path.length - wildcardIndex > 5) {
                resource.name = path.slice(slashIndex + 1);
            } else {
                resource.name = path.slice(slashIndex + 1, wildcardIndex);
            }
        }
        if (subBuffer[resource.name]) {
            console.warn("[Resource.Manager.add]:", "There is already a resource(" + meta.enumToString(Resource.Type, resource.type) + ") added with a name: " + resource.name);
            return null;
        }
        subBuffer[resource.name] = resource;
        this._chn_added.emit(resource, Resource.Event.ADDED);
        return resource;
    },
    remove: function(resource) {
        var subBuffer = this.resources[resource.type];
        if (!subBuffer) {
            console.warn("[Resource.Manager.remove]:", "Resource(" + meta.enumToString(Resource.Type, resource.type) + ")(" + resource.name + ") is not added to the manager.");
            return;
        }
        if (!subBuffer[resource.name]) {
            console.warn("[Resource.Manager.remove]:", "Resource(" + meta.enumToString(Resource.Type, resource.type) + ")(" + resource.name + ") is not added to the manager.");
            return;
        }
        subBuffer[resource.name] = null;
    },
    addToLoad: function(resource) {
        resource.isLoading = true;
        if (!meta.engine.isReady) {
            this.numToLoad++;
        }
    },
    loadSuccess: function(resource) {
        var subBuffer = this.resourcesInUse[resource.type];
        if (!subBuffer) {
            subBuffer = [];
            this.resourcesInUse[resource.type] = subBuffer;
        }
        subBuffer.push(resource);
        resource.isLoading = false;
        resource.inUse = true;
        if (!meta.engine.isReady) {
            this.numToLoad--;
            this.numLoaded++;
            if (this.numToLoad === 0 && !meta.engine.isLoading) {
                meta.engine.onResourcesLoaded();
                this._chn_allLoaded.emit(this, Resource.Event.ALL_LOADED);
            }
        }
    },
    loadFailed: function(resource) {
        resource.isLoading = false;
        if (!meta.engine.isReady) {
            this.numToLoad--;
            if (this.numToLoad === 0 && !meta.engine.isLoading) {
                meta.engine.onResourcesLoaded();
                this._chn_allLoaded.emit(this, Resource.Event.ALL_LOADED);
            }
        }
    },
    getTexture: function(name) {
        if (!name) {
            console.warn("[Resource.Manager.getTexture]:", "No name specified.");
            return null;
        }
        var subBuffer = this.resources[Resource.Type.TEXTURE];
        if (!subBuffer) {
            return null;
        }
        var texture = subBuffer[name];
        if (!texture) {
            return null;
        }
        return texture;
    },
    getSound: function(name) {
        if (!name) {
            console.warn("[Resource.Manager.getSound]:", "No name specified.");
            return null;
        }
        var subBuffer = this.resources[Resource.Type.SOUND];
        if (!subBuffer) {
            return null;
        }
        var sound = subBuffer[name];
        if (!sound) {
            return null;
        }
        return sound;
    },
    addToQueue: function(resource) {
        if (!this._syncQueue) {
            this._syncQueue = [];
        }
        this._syncQueue.push(resource);
    },
    loadNextFromQueue: function() {
        this.isSyncLoading = false;
        if (!this._syncQueue || !this._syncQueue.length) {
            return;
        }
        this._syncQueue[this._syncQueue.length - 1].forceLoad(true);
        this._syncQueue.pop();
    },
    onAdapt: function(data, event) {
        var unitRatio = meta.unitRatio;
        var texture;
        var textures = this.resources[Resource.Type.TEXTURE];
        for (var key in textures) {
            texture = textures[key];
            texture.unitRatio = unitRatio;
            texture.load();
        }
    },
    getUniqueID: function() {
        return ++this._uniqueID;
    },
    resources: null,
    resourcesInUse: null,
    rootPath: "",
    numLoaded: 0,
    numToLoad: 0,
    _syncQueue: null,
    isSyncLoading: false,
    _chn_added: null,
    _chn_allLoaded: null,
    _uniqueID: 0
});

"use strict";

Resource.Event = {
    UNLOADED: "res-unloaded",
    LOADED: "res-loaded",
    RESIZE: "res-resize",
    CHANGED: "res-changed",
    ADDED: "res-added",
    ALL_LOADED: "res-all-loaded"
};

Resource.Type = {
    BASIC: 0,
    TEXTURE: 1,
    SOUND: 2,
    SPRITE_SHEET: 3,
    FONT: 4
};

Resource.TextureType = {
    UNKNOWN: -1,
    CANVAS: 0,
    WEBGL: 1
};

Resource.AnimType = {
    NONE: 0,
    LINEAR_H: 1,
    LINEAR_V: 2,
    RADIAL: 3,
    RADIAL_TOP_LEFT: 4,
    RADIAL_TOP_RIGHT: 5,
    RADIAL_BOTTOM_LEFT: 6,
    RADIAL_BOTTOM_RIGHT: 7
};

"use strict";

Resource.Basic = meta.Class.extend({
    _init: function() {
        this.id = Resource.ctrl.getUniqueID();
    },
    subscribe: function(owner, func) {
        if (!this.chn) {
            this.chn = meta.createChannel("__res" + this.id);
        }
        this.chn.subscribe(owner, func);
    },
    unsubscribe: function(owner) {
        if (!this.chn) {
            return;
        }
        this.chn.unsubscribe(owner);
        if (this.chn.numSubs === 0) {
            this.chn.remove();
            this.chn = null;
        }
    },
    emit: function(data, event) {
        if (this.chn) {
            this.chn.emit(data, event);
        }
    },
    set loaded(value) {
        if (value) {
            if (!this._loaded) {
                this._loaded = value;
                this.emit(this, Resource.Event.LOADED);
            } else {
                this._loaded = value;
                this.emit(this, Resource.Event.CHANGED);
            }
        } else {
            if (this._loaded) {
                this._loaded = value;
                this.emit(this, Resource.Event.UNLOADED);
            }
        }
    },
    get loaded() {
        return this._loaded;
    },
    id: 0,
    type: Resource.Type.BASIC,
    name: "unknown",
    path: "",
    fullPath: "",
    chn: null,
    _loaded: false,
    loading: false,
    used: false
});

"use strict";

Resource.Texture = Resource.Basic.extend({
    init: function(path) {
        this.generate();
        if (path) {
            this.load(path);
        }
    },
    remove: function() {},
    generate: function() {
        this.loaded = true;
        this.canvas = document.createElement("canvas");
        this.canvas.width = this.trueFullWidth;
        this.canvas.height = this.trueFullHeight;
        this.ctx = this.canvas.getContext("2d");
    },
    load: function(path) {
        if (this.loading) {
            return;
        }
        if (!path) {
            return;
        }
        this.path = path;
        var wildCardIndex = this.path.lastIndexOf(".");
        if (wildCardIndex === -1 || this.path.length - wildCardIndex > 4) {
            this.path += ".png";
        }
        if (meta.cache.currResolution) {
            this.fullPath = Resource.ctrl.rootPath + meta.cache.currResolution.path + this.path;
        } else {
            this.fullPath = Resource.ctrl.rootPath + this.path;
        }
        var self = this;
        var img = new Image();
        img.onload = function() {
            if (!img.complete) {
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
    },
    createFromImg: function(img) {
        if (this._loaded) {
            this.clear();
        }
        this.resize(img.width, img.height);
        this.ctx.drawImage(img, 0, 0);
        this.unitRatio = meta.unitRatio;
        console.log("here");
        this._isReloading = false;
        this.isLoaded = true;
    },
    _createCachedImg: function() {
        if (this._cachedImg) {
            return;
        }
        this._cachedImg = document.createElement("canvas");
        this._cachedImg.width = this.trueFullWidth;
        this._cachedImg.height = this.trueFullHeight;
        this._cachedCtx = this._cachedImg.getContext("2d");
    },
    resize: function(width, height) {
        if (this.trueFullWidth === width && this.trueFullHeight === height) {
            return;
        }
        this.trueFullWidth = width;
        this.trueFullHeight = height;
        if (this.isAnimated) {
            this.trueWidth = width / this.numFramesX;
            this.trueHeight = height / this.numFramesY;
        } else {
            this.trueWidth = width;
            this.trueHeight = height;
        }
        var unitRatio = meta.unitRatio;
        this.width = this.trueWidth * unitRatio + .5 | 0;
        this.height = this.trueHeight * unitRatio + .5 | 0;
        this.fullWidth = this.trueFullWidth * unitRatio + .5 | 0;
        this.fullHeight = this.trueFullHeight * unitRatio + .5 | 0;
        this.halfWidth = this.width * .5;
        this.halfHeight = this.height * .5;
        if (this._isLoaded) {
            if (this.canvas.width > 0 && this.canvas.height > 0) {
                this._tmpImg.width = this.canvas.width;
                this._tmpImg.height = this.canvas.height;
                this._tmpCtx.drawImage(this.canvas, 0, 0);
                this.canvas.width = this.trueFullWidth;
                this.canvas.height = this.trueFullHeight;
                this.ctx.drawImage(this._tmpImg, 0, 0);
            } else {
                this.canvas.width = this.trueFullWidth;
                this.canvas.height = this.trueFullHeight;
            }
        } else {
            this.canvas.width = this.trueFullWidth;
            this.canvas.height = this.trueFullHeight;
        }
        if (this._loaded && !this._isReloading) {
            this.emit(this, Resource.Event.RESIZE);
        }
    },
    upResize: function(width, height) {
        if (width < this.trueFullWidth) {
            width = this.trueFullWidth;
        }
        if (height < this.trueFullHeight) {
            height = this.trueFullHeight;
        }
        this.resize(width, height);
    },
    draw: function(ctx, x, y) {
        if (this._bgTexture) {
            this._bgTexture.draw(ctx, x, y);
        }
        if (!this.fromAtlas) {
            ctx.drawImage(this.image, x, y);
        } else {
            ctx.drawImage(this.ptr.image, this._x, this._y, this.trueWidth, this.trueHeight, x, y, this.trueWidth, this.trueHeight);
        }
    },
    drawFrame: function(ctx, x, y, frame, isEmulateReverse) {
        if (this._bgTexture) {
            ctx.drawImage(this._bgTexture.image, x, y);
        }
        if (this._anim) {
            var theta, cos;
            if (this._anim.type === 1) {
                var width = this._anim.fill * frame;
                if (width === 0) {
                    width = .01;
                } else if (width > this.trueFullWidth) {
                    width = this.trueFullWidth;
                }
                if (isEmulateReverse) {
                    ctx.drawImage(this.image, this.trueFullWidth - width, 0, width, this.trueFullHeight, x + this.trueFullWidth - width, y, width, this.trueFullHeight);
                } else {
                    ctx.drawImage(this.image, 0, 0, width, this.trueFullHeight, x, y, width, this.trueFullHeight);
                }
            } else if (this._anim.type === 2) {
                var height = this._anim.fill * frame;
                if (height === 0) {
                    height = .01;
                } else if (height > this.trueHeight) {
                    width = this.trueHeight;
                }
                if (isEmulateReverse) {
                    ctx.drawImage(this.image, 0, this.trueFullHeight - height, this.trueFullWidth, height, x, y + this.trueFullHeight - height, this.trueFullWidth, height);
                } else {
                    ctx.drawImage(this.image, 0, 0, this.trueFullWidth, height, x, y, this.trueFullWidth, height);
                }
            } else if (this._anim.type === 3) {} else if (this._anim.type === 4) {
                if (isEmulateReverse) {
                    theta = this._anim.fill * (-this.numFrames + frame + 1) + Math.PI / 2;
                    cos = x + Math.cos(theta) * this._anim.length;
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(cos, y + Math.sin(theta) * this._anim.length);
                    ctx.lineTo(cos + this.trueFullWidth, y);
                    ctx.closePath();
                    ctx.clip();
                } else {
                    theta = this._anim.fill * -frame + Math.PI / 2;
                    cos = x + Math.cos(theta) * this._anim.length;
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(cos, y + Math.sin(theta) * this._anim.length);
                    ctx.lineTo(cos, y + this.trueFullHeight);
                    ctx.lineTo(x, y + this.trueFullHeight);
                    ctx.closePath();
                    ctx.clip();
                }
                ctx.drawImage(this.image, x, y);
                ctx.restore();
            } else if (this._anim.type === 5) {
                if (isEmulateReverse) {
                    theta = this._anim.fill * (this.numFrames - frame - 1) + Math.PI / 2;
                    cos = x + Math.cos(theta) * this._anim.length + this.trueFullWidth;
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(x + this.trueFullWidth, y);
                    ctx.lineTo(cos, y + Math.sin(theta) * this._anim.length);
                    ctx.lineTo(x, y + this.trueFullHeight);
                    ctx.lineTo(x, y);
                    ctx.closePath();
                    ctx.clip();
                } else {
                    theta = this._anim.fill * frame + Math.PI / 2;
                    cos = x + Math.cos(theta) * this._anim.length + this.trueFullWidth;
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(x + this.trueFullWidth, y);
                    ctx.lineTo(cos, y + Math.sin(theta) * this._anim.length);
                    ctx.lineTo(cos, y + this.trueFullHeight);
                    ctx.lineTo(x + this.trueFullWidth, y + this.trueFullHeight);
                    ctx.closePath();
                    ctx.clip();
                }
                ctx.drawImage(this.image, x, y);
                ctx.restore();
            } else if (this._anim.type === 6) {
                if (isEmulateReverse) {
                    theta = this._anim.fill * (-this.numFrames + frame + 1);
                    cos = x + Math.cos(theta) * this._anim.length;
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(x, y + this.trueFullHeight);
                    ctx.lineTo(cos, y + Math.sin(theta) * this._anim.length + this.trueFullHeight);
                    ctx.lineTo(x + this.trueFullWidth, y);
                    ctx.lineTo(x, y);
                    ctx.closePath();
                    ctx.clip();
                } else {
                    theta = this._anim.fill * -frame;
                    cos = x + Math.cos(theta) * this._anim.length;
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(x, y + this.trueFullHeight);
                    ctx.lineTo(cos, y + Math.sin(theta) * this._anim.length + this.trueFullHeight);
                    ctx.lineTo(x + this.trueFullWidth, y);
                    ctx.lineTo(x + this.trueFullWidth, y + this.trueFullHeight);
                    ctx.closePath();
                    ctx.clip();
                }
                ctx.drawImage(this.image, x, y);
                ctx.restore();
            } else if (this._anim.type === 7) {
                if (isEmulateReverse) {
                    theta = this._anim.fill * (this.numFrames - 1 - frame) + Math.PI;
                    cos = x + Math.cos(theta) * this._anim.length;
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(x + 64, y + this.trueFullHeight);
                    ctx.lineTo(cos + 64, y + Math.sin(theta) * this._anim.length + 64);
                    ctx.lineTo(x, y);
                    ctx.lineTo(x + 64, y);
                    ctx.closePath();
                    ctx.clip();
                } else {
                    theta = this._anim.fill * frame + Math.PI;
                    cos = x + Math.cos(theta) * this._anim.length;
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(x + 64, y + this.trueFullHeight);
                    ctx.lineTo(cos + 64, y + Math.sin(theta) * this._anim.length + 64);
                    ctx.lineTo(x, y);
                    ctx.lineTo(x, y + 64);
                    ctx.closePath();
                    ctx.clip();
                }
                ctx.drawImage(this.image, x, y);
                ctx.restore();
            }
        } else {
            ctx.drawImage(this.image, this.trueWidth * (frame % this.numFramesX), this.trueHeight * Math.floor(frame / this.numFramesX), this.trueWidth, this.trueHeight, x, y, this.trueWidth, this.trueHeight);
        }
    },
    clear: function() {
        if (this.textureType === Resource.TextureType.WEBGL) {
            if (!this._cachedCtx) {
                return;
            }
            this._cachedCtx.clearRect(0, 0, this.trueFullWidth, this.trueFullHeight);
            var gl = meta.ctx;
            gl.bindTexture(gl.TEXTURE_2D, this.image);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
        } else {
            this.ctx.clearRect(0, 0, this.trueFullWidth, this.trueFullHeight);
        }
        if (!this._isReloading) {
            this.isLoaded = true;
        }
    },
    clearSilent: function() {
        if (this.textureType === Resource.TextureType.WEBGL) {
            this._tmpCtx.clearRect(0, 0, this.trueFullWidth, this.trueFullHeight);
            var gl = meta.ctx;
            gl.bindTexture(gl.TEXTURE_2D, this.image);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
        } else {
            this.ctx.clearRect(0, 0, this.trueFullWidth, this.trueFullHeight);
        }
    },
    drawOver: function(texture, x, y) {
        if (!texture) {
            console.warn("[Resource.Texture.drawOver]:", "No texture specified.");
            return;
        }
        x = x || 0;
        y = y || 0;
        if (typeof texture === "string") {
            var obj = meta.getTexture(texture);
            if (!obj) {
                console.warn("[Resource.Texture.drawOver]:", "No such texture with name - " + texture);
                return;
            }
            texture = obj;
        }
        if (texture.textureType === Resource.TextureType.WEBGL) {
            if (texture._canvasCache) {
                texture = texture._canvasCache;
            } else {
                texture._canvasCache = new Resource.Texture(Resource.TextureType.CANVAS, texture.path);
                texture._canvasCache.load();
                texture = texture._canvasCache;
                this._loadCache = {
                    name: "drawOver",
                    texture: texture,
                    x: x,
                    y: y
                };
                this.isLoaded = false;
                texture.subscribe(this, this.onTextureCacheEvent);
                return;
            }
        }
        var ctx = this.ctx;
        if (this.textureType) {
            this._createCachedImg();
            ctx = this._cachedCtx;
        }
        ctx.drawImage(texture.image, x, y);
        if (this.textureType) {
            var gl = meta.ctx;
            gl.bindTexture(gl.TEXTURE_2D, this.image);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
        }
        this.isLoaded = true;
    },
    fillRect: function(params, height, color) {
        if (!params) {
            console.warn("[Resource.Texture.fillRect]:", "No parameters specified.");
            return;
        }
        if (typeof params === "number") {
            this.fillRect({
                width: params,
                height: height,
                color: color
            });
            return;
        }
        var scope = meta;
        var ctx = this.ctx;
        params.x = params.x || 0;
        params.y = params.y || 0;
        var width = (params.width || this.trueFullWidth || 1) + params.x;
        var height = (params.height || this.trueFullHeight || 1) + params.y;
        this.upResize(width, height);
        if (this.textureType) {
            this._createCachedImg();
            ctx = this._cachedCtx;
        }
        ctx.fillStyle = params.color || "#000000";
        ctx.fillRect(params.x, params.y, width, height);
        if (this.textureType) {
            var gl = scope.ctx;
            gl.bindTexture(gl.TEXTURE_2D, this.image);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
        }
        this.isLoaded = true;
    },
    tile: function(params, height, texture) {
        if (typeof params === "number") {
            this.tile({
                width: params,
                height: height,
                texture: texture
            });
            return;
        }
        if (!params) {
            console.warn("[Resource.Texture.tile]:", "No parameters specified.");
            return;
        }
        if (typeof params.texture === "string") {
            params.texture = Resource.ctrl.getTexture(params.texture);
        }
        if (!params.texture) {
            console.warn("[Resource.Texture.tile]:", "Undefined texture.");
            return;
        }
        var texture = params.texture;
        if (texture.textureType === Resource.TextureType.WEBGL) {
            if (texture._canvasCache) {
                texture = texture._canvasCache;
            } else {
                texture._canvasCache = new Resource.Texture(Resource.TextureType.CANVAS, texture.path);
                texture._canvasCache.load();
                texture = texture._canvasCache;
                this._loadCache = {
                    name: "tile",
                    data: params
                };
                this.isLoaded = false;
                texture.subscribe(this, this.onTextureCacheEvent);
                return;
            }
        }
        if (!texture._isLoaded) {
            if (!texture._isLoading) {
                texture.load();
            }
            this._loadCache = {
                name: "tile",
                data: params
            };
            this.isLoaded = false;
            texture.subscribe(this, this.onTextureCacheEvent);
            return;
        }
        var scope = meta;
        params.x = params.x || 0;
        params.y = params.y || 0;
        params.width = params.width || texture.fullWidth;
        params.height = params.height || texture.fullHeight;
        params.width *= scope.unitSize;
        params.height *= scope.unitSize;
        this.resize(params.width, params.height);
        if (params.center) {
            params.x += (this.trueFullWidth & texture.trueFullWidth - 1) / 2;
            params.y += (this.trueFullHeight & texture.trueFullHeight - 1) / 2;
        }
        var ctx = this.ctx;
        if (this.textureType) {
            this._createCachedImg();
            ctx = this._cachedCtx;
        }
        var posX = params.x;
        var posY = params.y;
        var numX = Math.ceil(this.trueFullWidth / texture.trueFullWidth) || 1;
        var numY = Math.ceil(this.trueFullHeight / texture.trueFullHeight) || 1;
        if (posX > 0) {
            numX += Math.ceil(posX / texture.trueFullWidth);
            posX -= texture.trueFullWidth;
        }
        if (posY > 0) {
            numY += Math.ceil(posY / texture.trueFullHeight);
            posY -= texture.trueFullHeight;
        }
        var origY = posY;
        for (var x = 0; x < numX; x++) {
            for (var y = 0; y < numY; y++) {
                ctx.drawImage(texture.image, posX, posY);
                posY += texture.trueHeight;
            }
            posX += texture.trueWidth;
            posY = origY;
        }
        if (this.textureType) {
            var gl = scope.ctx;
            gl.bindTexture(gl.TEXTURE_2D, this.image);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
        }
        this.isLoaded = true;
    },
    stroke: function(params) {
        if (!params) {
            console.warn("[Resource.Texture.stroke]:", "No parameters specified.");
            return;
        }
        if (!params.buffer) {
            console.warn("[Resource.Texture.stroke]:", "No buffer defined.");
            return;
        }
        var scope = meta;
        var unitSize = scope.unitSize;
        var minX = Number.POSITIVE_INFINITY, minY = minX, maxX = Number.NEGATIVE_INFINITY, maxY = maxX;
        var item, i, x, y;
        var buffer = params.buffer;
        var numItems = buffer.length;
        for (i = 0; i < numItems; i += 2) {
            x = buffer[i] * unitSize | 0;
            y = buffer[i + 1] * unitSize | 0;
            if (x < minX) {
                minX = x;
            }
            if (y < minY) {
                minY = y;
            }
            if (x > maxX) {
                maxX = x;
            }
            if (y > maxY) {
                maxY = y;
            }
            buffer[i] = x;
            buffer[i + 1] = y;
        }
        if (minX > 0) {
            minX = 0;
        }
        if (minY > 0) {
            minY = 0;
        }
        var ctx = this.ctx;
        params.addWidth = params.addWidth || 0;
        params.addHeight = params.addHeight || 0;
        params.lineWidth = params.lineWidth || 1;
        if (!params.color && !params.fillColor) {
            params.color = "#000000";
        }
        var halfLineWidth = params.lineWidth / 2;
        var offsetX = -minX + halfLineWidth + params.addWidth * .5;
        var offsetY = -minY + halfLineWidth + params.addHeight * .5;
        this.resize(maxX - minX + params.lineWidth + params.addWidth, maxY - minY + params.lineWidth);
        if (this.textureType) {
            this._createCachedImg();
            ctx = this._cachedCtx;
        }
        ctx.lineWidth = params.lineWidth;
        if (params.lineCap) {
            ctx.lineCap = params.lineCap;
        }
        if (params.lineDash) {
            ctx.setLineDash(params.lineDash);
        }
        ctx.beginPath();
        ctx.moveTo(buffer[0] + offsetX, buffer[1] + offsetY);
        for (i = 2; i < numItems; i += 2) {
            ctx.lineTo(buffer[i] + offsetX, buffer[i + 1] + offsetY);
        }
        if (params.fillColor) {
            ctx.fillStyle = params.fillColor;
            ctx.closePath();
            ctx.fill();
        }
        if (params.color) {
            ctx.strokeStyle = params.color;
            ctx.stroke();
        }
        if (this.textureType === Resource.TextureType.WEBGL) {
            var gl = scope.ctx;
            gl.bindTexture(gl.TEXTURE_2D, this.image);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
        }
        this.isLoaded = true;
    },
    border: function(params) {
        if (!params) {
            console.warn("[Resource.Texture.strokeBorder]:", "No parameters specified.");
            return;
        }
        params.width = params.width || this.trueFullWidth;
        params.height = params.height || this.trueFullHeight;
        var lineWidth = 1;
        if (params.borderWidth) {
            lineWidth = params.borderWidth;
        }
        params.buffer = [ 0, 0, params.width - lineWidth, 0, params.width - lineWidth, params.height - lineWidth, 0, params.height - lineWidth, 0, 0 ];
        this.stroke(params);
    },
    arc: function(params) {
        if (!params) {
            console.warn("[Resource.Texture.arc]:", "No parameters specified.");
            return;
        }
        var ctx = this.ctx;
        params.x = params.x || 0;
        params.y = params.y || 0;
        params.radius = params.radius || 5;
        params.startAngle = params.startAngle || 0;
        params.endAngle = params.endAngle || Math.PI * 2;
        params.borderWidth = params.borderWidth || 1;
        if (!params.color && !params.borderColor) {
            params.borderColor = params.borderColor || "#000000";
        }
        if (params.closePath === void 0) {
            params.closePath = true;
        } else {
            params.closePath = params.closePath;
        }
        var size = params.radius * 2 + params.borderWidth;
        if (!params.drawOver) {
            this.resize(params.x + size + 1, params.y + size + 1);
        }
        if (this.textureType) {
            this._createCachedImg();
            ctx = this._cachedCtx;
        }
        ctx.lineWidth = params.borderWidth;
        ctx.clearRect(0, 0, this.trueFullWidth, this.trueFullHeight);
        if (params.closePath) {
            ctx.beginPath();
            ctx.arc(params.x + params.radius + params.borderWidth / 2 + .5, params.y + params.radius + params.borderWidth / 2 + .5, params.radius, params.startAngle, params.endAngle, false);
            ctx.closePath();
        } else {
            ctx.arc(params.x + params.radius + params.borderWidth / 2, params.y + params.radius + params.borderWidth / 2, params.radius, params.startAngle, params.endAngle, false);
        }
        if (params.color) {
            ctx.fillStyle = params.color;
            ctx.fill();
        }
        if (params.borderColor) {
            ctx.strokeStyle = params.borderColor;
            ctx.stroke();
        }
        if (this.textureType === Resource.TextureType.WEBGL) {
            var gl = meta.ctx;
            gl.bindTexture(gl.TEXTURE_2D, this.image);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
        }
        this.isLoaded = true;
    },
    rect: function(params, height, color, borderWidth) {
        if (typeof params !== "object") {
            this.rect({
                width: params,
                height: height,
                color: color,
                borderWidth: borderWidth
            });
            return;
        }
        if (!params) {
            console.warn("[Resource.Texture.rect]:", "No parameters specified.");
            return;
        }
        var ctx = this.ctx;
        var width = params.width || 1;
        var height = params.height || 1;
        params.color = params.color || "#0000000";
        var borderWidth = params.borderWidth || 1;
        if (!params.drawOver) {
            this.resize(width, height);
        }
        if (this.textureType) {
            this._createCachedImg();
            ctx = this._cachedCtx;
        }
        ctx.strokeStyle = params.color;
        ctx.lineWidth = borderWidth;
        var halfWidth = Math.ceil(borderWidth / 2);
        if (borderWidth % 2 === 1) {
            ctx.save();
            ctx.translate(.5, .5);
            ctx.beginPath();
            ctx.moveTo(halfWidth, halfWidth);
            ctx.lineTo(width - halfWidth - 1, halfWidth);
            ctx.lineTo(width - halfWidth - 1, height - halfWidth - 1);
            ctx.lineTo(halfWidth, height - halfWidth - 1);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        } else {
            ctx.beginPath();
            ctx.moveTo(halfWidth, halfWidth);
            ctx.lineTo(width - halfWidth, halfWidth);
            ctx.lineTo(width - halfWidth, height - halfWidth);
            ctx.lineTo(halfWidth, height - halfWidth);
            ctx.closePath();
            ctx.stroke();
        }
        if (params.fillColor) {
            ctx.fillStyle = params.fillColor;
            ctx.fill();
        }
        if (this.textureType === Resource.TextureType.WEBGL) {
            var gl = meta.ctx;
            gl.bindTexture(gl.TEXTURE_2D, this.image);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
        }
        this.isLoaded = true;
    },
    roundRect: function(params, height, radius, color, borderWidth) {
        if (typeof params !== "object") {
            this.roundRect({
                width: params,
                height: height,
                radius: radius,
                color: color,
                borderWidth: borderWidth
            });
            return;
        }
        if (!params) {
            console.warn("[Resource.Texture.rect]:", "No parameters specified.");
            return;
        }
        var ctx = this.ctx;
        var width = params.width || 1;
        var height = params.height || 1;
        params.color = params.color || "#0000000";
        var radius = params.radius || 1;
        var borderWidth = params.borderWidth || 3;
        if (!params.drawOver) {
            this.resize(width, height);
        }
        if (this.textureType) {
            this._createCachedImg();
            ctx = this._cachedCtx;
        }
        ctx.strokeStyle = params.color;
        ctx.lineWidth = borderWidth;
        var halfWidth = Math.ceil(borderWidth / 2);
        if (borderWidth % 2 === 1) {
            ctx.save();
            ctx.translate(.5, .5);
            ctx.beginPath();
            ctx.moveTo(halfWidth + radius, halfWidth);
            ctx.lineTo(width - halfWidth - radius, halfWidth);
            ctx.quadraticCurveTo(width - halfWidth, halfWidth, width - halfWidth, halfWidth + radius);
            ctx.lineTo(width - halfWidth, height - halfWidth - radius);
            ctx.quadraticCurveTo(width - halfWidth, height - halfWidth, width - halfWidth - radius, height - halfWidth);
            ctx.lineTo(halfWidth + radius, height - halfWidth);
            ctx.quadraticCurveTo(halfWidth, height - halfWidth, halfWidth, height - halfWidth - radius);
            ctx.lineTo(halfWidth, radius + halfWidth);
            ctx.quadraticCurveTo(halfWidth, halfWidth, halfWidth + radius, halfWidth);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        } else {
            ctx.beginPath();
            ctx.moveTo(halfWidth + radius, halfWidth);
            ctx.lineTo(width - halfWidth - radius, halfWidth);
            ctx.quadraticCurveTo(width - halfWidth, halfWidth, width - halfWidth, halfWidth + radius);
            ctx.lineTo(width - halfWidth, height - halfWidth - radius);
            ctx.quadraticCurveTo(width - halfWidth, height - halfWidth, width - halfWidth - radius, height - halfWidth);
            ctx.lineTo(halfWidth + radius, height - halfWidth);
            ctx.quadraticCurveTo(halfWidth, height - halfWidth, halfWidth, height - halfWidth - radius);
            ctx.lineTo(halfWidth, radius + halfWidth);
            ctx.quadraticCurveTo(halfWidth, halfWidth, halfWidth + radius, halfWidth);
            ctx.closePath();
            ctx.stroke();
        }
        if (params.fillColor) {
            ctx.fillStyle = params.fillColor;
            ctx.fill();
        }
        if (this.textureType === Resource.TextureType.WEBGL) {
            var gl = meta.ctx;
            gl.bindTexture(gl.TEXTURE_2D, this.image);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
        }
        this.isLoaded = true;
    },
    bazier: function(color, path, params) {
        this.isLoaded = true;
    },
    emulateAnim: function(type, frames) {
        if (!this._isLoaded) {
            console.warn("[Resource.Texture.emulateAnim]:", "Texture is not loaded yet.");
            return;
        }
        var animType = Resource.AnimType;
        if (type === animType.NONE) {
            this._anim = null;
        } else {
            this._anim = {
                type: type
            };
            this.isAnimated = true;
            this.numFrames = frames;
            if (type === animType.LINEAR_H) {
                this._anim.fill = this.trueWidth / (frames - 1);
            } else if (type === animType.LINEAR_V) {
                this._anim.fill = this.trueHeight / (frames - 1);
            } else if (type === animType.RADIAL) {
                console.log("[Resource.Texture.emulateAnim]:", "RADIAL is currently unsupported type.");
                this._anim.halfWidth = this.trueFullWidth / 2;
                this._anim.halfHeight = this.trueFullHeight / 2;
                this._anim.fill = Math.PI * 2 / (frames - 1);
                this._anim.length = Math.sqrt(this._anim.halfWidth * this._anim.halfWidth + this._anim.halfHeight * this._anim.halfHeight) + 1 | 0;
            } else if (type === animType.RADIAL_TOP_LEFT || type === animType.RADIAL_TOP_RIGHT || type === animType.RADIAL_BOTTOM_LEFT || type === animType.RADIAL_BOTTOM_RIGHT) {
                this._anim.fill = Math.PI * 2 / ((frames - 1) * 4);
                this._anim.length = Math.sqrt(this.trueFullWidth * this.trueFullWidth + this.trueFullHeight * this.trueFullHeight) + 1 | 0;
            }
        }
        this.isLoaded = true;
    },
    gradient: function(data) {
        if (!data) {
            console.warn("[Resource.Texture.gradient]:", "No data specified.");
            return;
        }
        if (!data.colors || !data.colors.length) {
            console.warn("[Resource.Texture.gradient]:", "No data.colors specified.");
            return;
        }
        var ctx = this.ctx;
        data.dirX = data.dirX || 0;
        data.dirY = data.dirY || 0;
        data.width = data.width || this.trueFullWidth || 1;
        data.height = data.height || this.trueFullHeight || 1;
        if (!data.drawOver) {
            this.resize(data.width, data.height);
        }
        if (this.textureType) {
            this._createCachedImg();
            ctx = this._cachedCtx;
        }
        var colors = data.colors;
        var numColors = colors.length;
        var x1, x2, y1, y2;
        if (data.dirX < 0) {
            x1 = this.trueFullWidth;
            x2 = 0;
        } else {
            x1 = 0;
            x2 = this.trueFullWidth * data.dirX;
        }
        if (data.dirY < 0) {
            y1 = this.trueFullHeight;
            y2 = 0;
        } else {
            y1 = 0;
            y2 = this.trueFullHeight * data.dirY;
        }
        var gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        for (var i = 0; i < numColors; i++) {
            gradient.addColorStop(colors[i][0], colors[i][1]);
        }
        ctx.fillStyle = gradient;
        ctx.clearRect(0, 0, this.trueFullWidth, this.trueFullHeight);
        ctx.fillRect(0, 0, this.trueFullWidth, this.trueFullHeight);
        if (this.textureType) {
            var gl = meta.ctx;
            gl.bindTexture(gl.TEXTURE_2D, this.image);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
        }
        this.isLoaded = true;
    },
    grid: function(params, cellHeight, numCellsX, numCellsY) {
        if (typeof params === "number") {
            this.grid({
                cellWidth: params,
                cellHeight: cellHeight,
                numCellsX: numCellsX,
                numCellsY: numCellsY
            });
            return;
        }
        if (!params) {
            console.warn("[Resource.Texture.grid]:", "No params specified.");
            return;
        }
        var cellWidth = params.cellWidth || 1;
        var cellHeight = params.cellHeight || 1;
        var numCellsX = params.numCellsX || 1;
        var numCellsY = params.numCellsY || 1;
        params.x = params.x || 0;
        params.y = params.y || 0;
        params.color = params.color || "#000000";
        params.borderWidth = params.borderWidth || 1;
        params.drawOver = params.drawOver || false;
        var width = params.x + params.cellWidth * params.numCellsX + 1;
        var height = params.y + params.cellHeight * params.numCellsY + 1;
        if (!params.drawOver) {
            this.resize(width, height);
        }
        var ctx = this.ctx;
        if (this.textureType) {
            this._createCachedImg();
            ctx = this._cachedCtx;
        }
        ctx.strokeStyle = params.color;
        ctx.lineWidth = params.borderWidth;
        ctx.save();
        ctx.translate(.5, .5);
        for (var x = 0; x < numCellsX + 1; x++) {
            ctx.moveTo(x * cellHeight, 0);
            ctx.lineTo(x * cellHeight, height);
        }
        for (var y = 0; y < numCellsY + 1; y++) {
            ctx.moveTo(0, y * cellHeight);
            ctx.lineTo(width, y * cellHeight);
        }
        ctx.stroke();
        ctx.restore();
        if (this.textureType) {
            var gl = meta.ctx;
            gl.bindTexture(gl.TEXTURE_2D, this.image);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
        }
        this.isLoaded = true;
    },
    onTextureEvent: function(event, data) {
        if (event === Resource.Event.LOADED) {
            this.tile(data);
            data.unsubscribe(this);
        }
    },
    construct: function(data) {
        if (!data) {
            console.warn("[Resource.Texture.buildMatrix]:", "No parameters specified.");
            return;
        }
        this._constructTex(data, "center");
        this._constructTex(data, "left");
        this._constructTex(data, "right");
        data.width = data.width || this.trueFullWidth;
        data.height = data.height || this.trueFullHeight;
        this.resize(data.width, data.height);
        console.log(this.trueWidth, this.trueHeight);
        var left = data.width / 2 - data.center.width / 2 | 0;
        var top = data.height / 2 - data.center.height / 2 | 0;
        console.log(left);
        var ctx = this.ctx;
        ctx.drawImage(data.center, left, top);
        if (this.textureType) {
            var gl = meta.ctx;
            gl.bindTexture(gl.TEXTURE_2D, this.image);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._cachedImg);
        }
        this.isLoaded = true;
    },
    _constructTex: function(data, texture) {
        if (data[texture] && typeof data[texture] === "string") {
            data[texture] = Resource.ctrl.getTexture(data[texture]);
            if (!data[texture]) {
                console.warn("[Resource.Texture.buildMatrix]:", "Undefined texture for: " + texture);
                return;
            }
            data[texture] = data[texture].image;
        }
    },
    generateAlphaMask: function() {
        if (!this._isLoaded) {
            console.warn("[Resource.Texture.generateMask]:", "Texture is not loaded yet.");
            return;
        }
        if (this.textureType !== 0) {
            console.warn("[Resource.Texture.generateMask]:", "Only canvas textures are supported currently.");
            return;
        }
        var alphaMask = new Resource.Texture(Resource.TextureType.CANVAS);
        alphaMask.resize(this.trueFullWidth, this.trueFullHeight);
        var imgData = this.ctx.getImageData(0, 0, this.trueFullWidth, this.trueFullHeight);
        var data = imgData.data;
        var numBytes = data.length;
        for (var i = 0; i < numBytes; i += 4) {
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
        }
        alphaMask.ctx.putImageData(imgData, 0, 0);
        alphaMask.isLoaded = true;
        return alphaMask;
    },
    onTextureCacheEvent: function(data, event) {
        if (event === Resource.Event.LOADED) {
            data.unsubscribe(this);
            if (this._loadCache.name === "drawOver") {
                this.drawOver(this._loadCache.texture, this._loadCache.x, this._loadCache.y);
            } else {
                this[this._loadCache.name](this._loadCache.data);
            }
            this._loadCache = null;
        }
    },
    set x(value) {
        if (!this.ptr) {
            this._x = 0;
            return;
        }
        if (this.textureType) {
            this._xRatio = 1 / this.ptr.trueFullWidth;
            this._x = this._xRatio * value;
        } else {
            this._x = value;
        }
    },
    set y(value) {
        if (!this.ptr) {
            this._y = 0;
            return;
        }
        if (this.textureType) {
            this._yRatio = 1 / this.ptr.trueFullHeight;
            this._y = this._yRatio * value;
        } else {
            this._y = value;
        }
    },
    get x() {
        return this._x;
    },
    get y() {
        return this._y;
    },
    set offsetX(x) {
        this._offsetX = x;
        if (this._isLoaded) {
            this.emit(this, Resource.Event.CHANGED);
        }
    },
    set offsetY(y) {
        this._offsetY = y;
        if (this._isLoaded) {
            this.emit(this, Resource.Event.CHANGED);
        }
    },
    get offsetX() {
        return this._offsetX;
    },
    get offsetY() {
        return this._offsetY;
    },
    set bgTexture(texture) {
        if (typeof texture === "string") {
            var obj = Resource.ctrl.getTexture(texture);
            if (!obj) {
                console.warn("[Resource.Texture.bgTexture]:", "No such texture found: " + texture);
                return;
            }
            texture = obj;
        }
        this._bgTexture = texture;
        this.isLoaded = true;
    },
    get bgTexture() {
        return this._bgTexture;
    },
    type: Resource.Type.TEXTURE,
    canvas: null,
    ctx: null,
    _bgTexture: null,
    vbo: null,
    _vertices: null,
    _x: 0,
    _y: 0,
    _xRatio: 0,
    _yRatio: 0,
    _width: 0,
    _height: 0,
    fullWidth: 0,
    fullHeight: 0,
    _widthRatio: 0,
    _heightRatio: 0,
    _offsetX: 0,
    _offsetY: 0,
    unitRatio: 1,
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
    isReloading: false,
    _tmpImg: null,
    _tmpCtx: null,
    _cachedImg: null,
    _cachedCtx: null,
    _anim: null,
    _frames: null,
    _loadCache: null,
    _canvasCache: null,
    _maxResCanvasCache: null,
    _maxResCtxCache: null
});

"use strict";

Resource.Sound = Resource.Basic.extend({
    init: function(param, path) {
        if (typeof param === "string") {
            path = param;
            param = void 0;
        }
        if (path) {
            var wildCardIndex = path.lastIndexOf(".");
            if (wildCardIndex !== -1 && path.length - wildCardIndex <= 5) {
                this.format = path.substr(wildCardIndex + 1, path.length - wildCardIndex - 1);
                path = path.substr(0, wildCardIndex);
            }
            this.path = Resource.ctrl.rootPath + path;
        }
        this._instances = [];
        var self = this;
        if (meta.device.isAudioAPI) {
            this._request = new XMLHttpRequest();
            this._request.responseType = "arraybuffer";
            this._request.onreadystatechange = function() {
                self._onStateChange();
            };
        } else {
            this._context = this._getInstance();
            this._context.audio.addEventListener("error", function() {
                if (!self.format) {
                    self._loadNextExtension();
                } else {
                    self._onLoadFailed();
                }
            });
            this._numInstancesUsed = 0;
        }
    },
    load: function() {
        if (this.isLoading) {
            return;
        }
        this.isLoading = true;
        this.isLoaded = false;
        Resource.ctrl.addToLoad(this);
        var resourceCtrl = Resource.ctrl;
        if (!resourceCtrl.isSyncLoading) {
            if (!this.syncLoading) {
                resourceCtrl.isSyncLoading = true;
            }
            this._loadNextExtension();
        } else {
            resourceCtrl.addToQueue(this);
        }
    },
    forceLoad: function() {
        this._loadNextExtension();
    },
    _loadNextExtension: function() {
        var url;
        if (this.format) {
            url = this.path;
        } else {
            var audioFormats = meta.device.audioFormats;
            this._requestFormat++;
            if (this._requestFormat > audioFormats.length) {
                this._onLoadFailed();
                return;
            }
            url = this.path + "." + meta.device.audioFormats[this._requestFormat - 1];
        }
        this._loadFromUrl(url);
    },
    _loadFromUrl: function(url) {
        this._request.open("GET", url, true);
        this._request.send();
    },
    _loadFromUrl_legacy: function(url) {
        this._context.audio.src = url;
        this._context.audio.load();
    },
    _clear: function() {
        this._request.onreadystatechange = null;
        this._request = null;
    },
    _clear_legacy: function() {},
    _onStateChange: function() {
        if (this._request.readyState === 4) {
            if (this._request.status === 200) {
                var self = this;
                this._context.decodeAudioData(this._request.response, function(buffer) {
                    self._onDecodeSuccess(buffer);
                }, function() {
                    self._onDecodeError();
                });
                this._request = null;
            } else {
                if (!this.format) {
                    this._loadNextExtension();
                } else {
                    this._onLoadFailed();
                }
            }
        }
    },
    _onDecodeSuccess: function(buffer) {
        if (!this.format) {
            this.path += "." + meta.device.audioFormats[this._requestFormat - 1];
        }
        this._buffer = buffer;
        this._isLoading = false;
        this._clear();
        this.isLoaded = true;
        Resource.ctrl.loadSuccess(this);
        var numInstances = this._instances.length;
        for (var i = 0; i < numInstances; i++) {
            this._createSource(this._instances[i]);
        }
    },
    _onDecodeError: function() {
        if (!this.format) {
            this.path += "." + meta.device.audioFormats[this._requestFormat - 1];
        }
        console.warn("[Resource.Sound.load]:", "Error decoding file: " + this.path);
        this._isLoading = false;
        this._clear();
        Resource.ctrl.loadFailed(this);
    },
    _onLoadFailed: function() {
        if (!this.format) {
            var format = meta.device.audioFormats[this._requestFormat - 1];
            if (format) {
                this.path += "." + format;
            }
        }
        console.warn("[Resource.Sound.load]:", "Error loading file: " + this.path);
        this._isLoading = false;
        this._clear();
        Resource.ctrl.loadFailed(this);
    },
    play: function(isLoop, time) {
        var instance = this._getInstance();
        instance.isLoop = isLoop || false;
        instance.play(time);
    },
    stop: function() {
        for (var i = 0; i < this._numInstancesUsed; i++) {
            this._instances[i]._stop();
        }
        this._numInstancesUsed = 0;
    },
    pause: function() {
        for (var i = 0; i < this._numInstancesUsed; i++) {
            this._instances[i].pause();
        }
    },
    resume: function() {
        for (var i = 0; i < this._numInstancesUsed; i++) {
            this._instances[i].resume();
        }
    },
    _createSource: function(instance) {
        var gainNode = this._context.createGain();
        gainNode.connect(this._context.destination);
        var source = this._context.createBufferSource();
        source.buffer = this._buffer;
        source.loop = instance._isLoop;
        source.connect(gainNode);
        if (!source.start) {
            source.start = source.noteOn;
        }
        if (!source.stop) {
            source.stop = source.noteOff;
        }
        var self = this;
        source.onended = function() {
            self._clearInstance(instance);
        };
        instance.source = source;
        instance.gainNode = gainNode;
        return source;
    },
    _createInstance: function() {
        return new Resource.AudioInstance();
    },
    _createInstance_legacy: function() {
        return new Resource.AudioInstance_legacy(this);
    },
    _getInstance: function() {
        if (this._instances.length === this._numInstancesUsed) {
            this._instances.length += 1;
            this._instances[this._numInstancesUsed] = this._createInstance();
        }
        var instance = this._instances[this._numInstancesUsed];
        instance.id = this._numInstancesUsed;
        this._numInstancesUsed++;
        return instance;
    },
    _clearInstance: function(instance) {
        this._numInstancesUsed--;
        var lastInstance = this._instances[this._numInstancesUsed];
        lastInstance.id = instance.id;
        this._instances[instance.id] = lastInstance;
    },
    set volume(value) {
        if (this._volume === value) {
            return;
        }
        this._volume = value;
        var numInstances = this._instances.length;
        for (var i = 0; i < numInstances; i++) {
            this._instances[i].volume = value;
        }
    },
    get volume() {
        return this._volume;
    },
    get isPlaying() {
        if (this._numInstancesUsed > 0) {
            return true;
        }
        return false;
    },
    type: Resource.Type.SOUND,
    format: "",
    _instances: null,
    _numInstancesUsed: 0,
    _autoIsLoop: false,
    _autoTime: 0,
    _context: null,
    _buffer: null,
    _request: null,
    _requestFormat: 0,
    _volume: 1,
    _isInQueue: false,
    _syncLoading: false
});

Resource.AudioInstance = function() {
    this.id = -1;
    this.source = null;
    this.gainNode = null;
    this.auto;
    this._volume = 1;
    this._mixedVolume = 1;
};

Resource.AudioInstance.prototype = {
    set volume(value) {
        this._mixedVolume = this._volume * value;
        this.gainNode.gain.value = this._mixedVolume;
    },
    get volume() {
        return this._volume;
    },
    get mixedVolume() {
        return this._mixedVolume;
    }
};

Resource.AudioInstance_legacy = function(parent) {
    this.id = -1;
    this.parent = parent;
    this.isPlaying = false;
    this.isLoop = false;
    this._canPlay = false;
    this._metaLoaded = false;
    this._isLoaded = false;
    this._volume = 1;
    this._mixedVolume = 1;
    this.audio = new Audio();
    this.audio.preload = "auto";
    this._addEvents(parent);
};

Resource.AudioInstance_legacy.prototype = {
    play: function(time) {
        this.isPlaying = true;
        if (this._isLoaded) {
            this.audio.currentTime = time || 0;
            this.audio.play();
        } else {
            this._autoPlay = true;
        }
    },
    stop: function() {
        this.isPlaying = false;
        this.isLoop = false;
        this.audio.pause();
        this.parent._clearInstance(this);
    },
    _stop: function() {
        this.isPlaying = false;
        this.isLoop = false;
        this.audio.pause();
    },
    pause: function() {
        this.isPlaying = false;
        this.audio.pause();
    },
    resume: function() {
        this.isPlaying = true;
        this.audio.play();
    },
    _addEvents: function() {
        var self = this;
        var canPlayFunc = function() {
            self.audio.removeEventListener("canplaythrough", canPlayFunc);
            self._canPlay = true;
            if (meta.device.support.onloadedmetadata && self._metaLoaded) {
                self._onLoaded();
            }
        };
        this.audio.addEventListener("canplaythrough", canPlayFunc, false);
        if (meta.device.support.onloadedmetadata) {
            var metaFunc = function() {
                self.audio.removeEventListener("loadedmetadata", metaFunc);
                self._metaLoaded = true;
                if (self._canPlay) {
                    self._onLoaded();
                }
            };
            this.audio.addEventListener("loadedmetadata", metaFunc, false);
        }
        this.audio.addEventListener("ended", function() {
            self._onEnd();
        }, false);
        if (this.parent._isLoaded) {
            this.audio.src = this.parent.path;
            this.audio.load();
        }
    },
    _onLoaded: function() {
        if (!this.parent._isLoaded) {
            if (!this.parent.format) {
                this.parent.path += "." + meta.device.audioFormats[this.parent._requestFormat - 1];
            }
            this.parent._isLoading = false;
            this.parent.isLoaded = true;
            var instance;
            var instances = this.parent._instances;
            var numInstances = this.parent._instances.length;
            for (var i = 1; i < numInstances; i++) {
                instance = instances[i];
                instance.audio.src = this.parent.path;
                instance.audio.load();
            }
            Resource.ctrl.loadSuccess(parent);
            Resource.ctrl.loadNextFromQueue();
        }
        this._isLoaded = true;
        if (this._autoPlay) {
            this.audio.play();
        }
    },
    _onEnd: function() {
        if (this.isLoop) {
            this.audio.play();
            this.audio.currentTime = 0;
        } else {
            if (this.isPlaying) {
                this.isPlaying = false;
                this.parent._clearInstance(this);
            }
        }
    },
    set currentTime(time) {
        if (!this.isPlaying) {
            this.audio.play();
            this.audio.currentTime = time || 0;
            this.audio.pause();
        } else {
            this.audio.currentTime = time || 0;
        }
    },
    get currentTime() {
        return this.audio.currentTime;
    },
    set volume(value) {
        if (value > 1) {
            value = 1;
        } else if (value < 0) {
            value = 0;
        }
        this._mixedVolume = this._volume * value;
        this.audio.volume = this._mixedVolume;
    },
    get volume() {
        return this._volume;
    },
    get mixedVolume() {
        return this._mixedVolume;
    },
    _autoPlay: false
};

"use strict";

Resource.SpriteSheet = Resource.Basic.extend({
    init: function(param, path) {
        if (typeof param === "string") {
            path = param;
            param = void 0;
        } else {
            for (var key in param) {
                this[key] = param[key];
            }
        }
        if (path) {
            var wildCardIndex = path.lastIndexOf(".");
            if (wildCardIndex !== -1 && path.length - wildCardIndex <= 5) {
                this.format = path.substr(wildCardIndex + 1, path.length - wildCardIndex - 1);
                path = path.substr(0, wildCardIndex);
            }
            this.path = Resource.ctrl.rootPath + path;
            if (!this.format) {
                this.format = "xml";
            }
        }
    },
    load: function() {
        if (this.isLoading) {
            return;
        }
        this.isLoading = true;
        this.isLoaded = false;
        this._isAtlasLoaded = false;
        if (!this.texture) {
            this.texture = new Resource.Texture(this.path);
        } else if (typeof this.texture === "string") {
            this.texture = new Resource.Texture(this.texture);
        }
        if (!this.texture._isLoaded) {
            this.texture.subscribe(this, this._onTextureEvent);
            if (!this.texture._isLoading) {
                this.texture.load();
            }
        }
        var self = this;
        var atlasPath = this.path + "." + this.format;
        this._request = new XMLHttpRequest();
        this._request.open("GET", atlasPath, true);
        this._request.onreadystatechange = function() {
            self._onStateChange();
        };
        this._request.send();
        Resource.ctrl.addToLoad(this);
    },
    loadData: function(data, format) {
        format = format || this.format;
        if (!format) {
            format = "xml";
        }
        this.format = format;
        this.isLoaded = true;
        if (format === "xml") {
            var parser = new DOMParser();
            var xml = parser.parseFromString(data, "text/xml");
            return this.loadXML(xml);
        } else if (format === "json") {
            var json = JSON.parse(data);
            return this.loadJSON(json);
        } else if (format === "plist") {
            var parser = new DOMParser();
            var plist = parser.parseFromString(data, "text/xml");
            return this.loadPlist(plist);
        } else {
            console.warn("[Resource.SpriteSheet.loadData]:", "Trying to load an unsupported format - " + this.format);
        }
        return false;
    },
    loadXML: function(xml) {
        if (!xml) {
            console.warn("[Resource.SpriteSheet.loadXML]:", "Invalid XML file.");
            return false;
        }
        var childNodes = xml.documentElement.childNodes;
        var numNodes = childNodes.length;
        var node;
        for (var i = 0; i < numNodes; i++) {
            node = childNodes[i];
            if (node.nodeName === "SubTexture") {
                this._loadXML_Starling(node);
            } else if (node.nodeName === "sprite") {
                this._loadXML_genericXML(node);
            } else if (node.nodeName === "dict") {
                return this.loadPlist(xml);
            }
        }
        return true;
    },
    _loadXML_Starling: function(node) {
        var texture = new Resource.Texture();
        texture.fromAtlas = true;
        texture.ptr = this.texture;
        texture.name = node.getAttribute("name");
        texture.x = node.getAttribute("x");
        texture.y = node.getAttribute("y");
        texture.resize(node.getAttribute("width"), node.getAttribute("height"));
        texture.isLoaded = true;
        Resource.ctrl.add(texture);
    },
    _loadXML_genericXML: function(node) {
        var texture = new Resource.Texture();
        texture.fromAtlas = true;
        texture.ptr = this.texture;
        texture.name = node.getAttribute("n");
        texture.x = node.getAttribute("x");
        texture.y = node.getAttribute("y");
        texture.resize(node.getAttribute("w"), node.getAttribute("h"));
        texture.isLoaded = true;
        Resource.ctrl.add(texture);
    },
    loadPlist: function(plist) {
        if (!plist) {
            console.warn("[Resource.SpriteSheet.loadPlist]:", "Invalid Plist file.");
            return false;
        }
        var childNodes = plist.documentElement.childNodes;
        var numNodes = childNodes.length;
        var node;
        for (var i = 0; i < numNodes; i++) {
            node = childNodes[i];
            if (node.nodeName === "dict") {
                return this._loadPlist_dict(node);
            }
        }
    },
    _loadPlist_dict: function(node) {
        var nodes = node.childNodes;
        var numNodes = nodes.length;
        var command = "";
        for (var i = 0; i < numNodes; i++) {
            node = nodes[i];
            if (node.nodeName === "key") {
                command = node.textContent;
            } else if (node.nodeName === "dict") {
                if (!command) {
                    continue;
                }
                if (command === "frames") {
                    this._loadPlist_frames(node);
                }
            }
        }
    },
    _loadPlist_frames: function(node) {
        var nodes = node.childNodes;
        var numNodes = nodes.length;
        var name = "";
        for (var i = 0; i < numNodes; i++) {
            node = nodes[i];
            if (node.nodeName === "key") {
                name = node.textContent;
            } else if (node.nodeName === "dict") {
                this._loadPlist_frame(node, name);
            }
        }
    },
    _loadPlist_frame: function(node, name) {
        var texture = new Resource.Texture();
        texture.fromAtlas = true;
        texture.ptr = this.texture;
        texture.name = name;
        var nodes = node.childNodes;
        var numNodes = nodes.length;
        var command = "", data;
        for (var i = 0; i < numNodes; i++) {
            node = nodes[i];
            if (node.nodeName === "key") {
                command = node.textContent;
            } else if (node.nodeName === "string") {
                if (command === "frame") {
                    data = node.textContent.match(/[0-9]+/g);
                    texture.x = parseInt(data[0]);
                    texture.y = parseInt(data[1]);
                    texture.resize(parseInt(data[2]), parseInt(data[3]));
                    texture.isLoaded = true;
                    Resource.ctrl.add(texture);
                    return;
                }
            }
        }
    },
    loadJSON: function(json) {
        if (!json) {
            console.warn("[Resource.SpriteSheet.loadFromJSON]:", "Invalid JSON file.");
            return false;
        }
        if (json.frames instanceof Array) {
            this._loadJSON_array(json);
        } else {
            this._loadJSON_hash(json);
        }
        return true;
    },
    _loadJSON_array: function(json) {
        var frame, texture;
        var frames = json.frames;
        var numFrames = frames.length;
        for (var i = 0; i < numFrames; i++) {
            frame = frames[i];
            texture = new Resource.Texture();
            texture.fromAtlas = true;
            texture.ptr = this.texture;
            texture.name = frame.filename;
            frame = frame.frame;
            texture.x = frame.x;
            texture.y = frame.y;
            texture.resize(frame.w, frame.h);
            texture.isLoaded = true;
            Resource.ctrl.add(texture);
        }
    },
    _loadJSON_hash: function(json) {
        var frame, texture;
        var frames = json.frames;
        for (var key in frames) {
            frame = frames[key].frame;
            texture = new Resource.Texture();
            texture.fromAtlas = true;
            texture.ptr = this.texture;
            texture.name = key;
            texture.x = frame.x;
            texture.y = frame.y;
            texture.resize(frame.w, frame.h);
            texture.isLoaded = true;
            Resource.ctrl.add(texture);
        }
    },
    loadAtlas: function() {
        if (typeof this.atlas !== "object") {
            console.warn("[Resource.SpriteSheet.loadFromAtlas]:", "Incorrect atlas object, expected to be an Array.");
            return false;
        }
        var frames = [];
        var item, texture, name;
        var numItems = this.atlas.length;
        for (var i = 0; i < numItems; i++) {
            item = this.atlas[i];
            name = item.name || this.params;
            if (!name) {
                console.warn("[Resource.SpriteSheet.loadFromAtlas]:", "No name defined for atlas item in " + this.name + " spritesheet.");
                continue;
            }
            item.x = item.x || this.params.x || 0;
            item.y = item.y || this.params.y || 0;
            item.width = item.width || this.params.width || 1;
            item.height = item.height || this.params.height || 1;
            frames.push(item);
            texture = new Resource.Texture();
            texture.fromAtlas = true;
            texture.ptr = this.texture;
            texture.name = name;
            texture.x = item.x;
            texture.y = item.y;
            texture.resize(item.width, item.height);
            texture.numFrames = item.numFrames || this.params.numFrames || 1;
            texture.isLoaded = true;
            Resource.ctrl.add(texture);
        }
        this.texture._frames = frames;
        this.atlas = null;
        this.isLoaded = true;
        return true;
    },
    _onTextureEvent: function(data, event) {
        if (event === Resource.Event.LOADED) {
            this.texture.unsubscribe(this);
            if (this._isAtlasLoaded) {
                this.loadData(this._response, this.format);
                Resource.ctrl.loadSuccess(this);
                this._response = null;
            }
        }
    },
    _onStateChange: function() {
        if (this._request.readyState === 4) {
            if (this._request.status === 200) {
                this._isAtlasLoaded = true;
                this._response = this._request.response;
                this._request = null;
                if (this.texture._isLoaded) {
                    this.loadData(this._response, this.format);
                    Resource.ctrl.loadSuccess(this);
                    this._response = null;
                }
            } else {
                this._isLoading = false;
                this._request.onreadystatechange = null;
                this._request = null;
                Resource.ctrl.loadFailed(this);
            }
        }
    },
    type: Resource.Type.SPRITE_SHEET,
    format: "",
    atlas: null,
    params: null,
    texture: null,
    _request: null,
    _response: null,
    _isAtlasLoaded: false
});

"use strict";

Resource.Font = Resource.Basic.extend({
    init: function(param, path) {
        if (typeof param === "string") {
            path = param;
            param = void 0;
        } else {
            for (var key in param) {
                this[key] = param[key];
            }
        }
        if (path) {
            var wildCardIndex = path.lastIndexOf(".");
            if (wildCardIndex !== -1 && path.length - wildCardIndex <= 5) {
                this.format = path.substr(wildCardIndex + 1, path.length - wildCardIndex - 1);
                path = path.substr(0, wildCardIndex);
            }
            this.path = Resource.ctrl.rootPath + path;
            if (!this.format) {
                this.format = "fnt";
            }
        }
    },
    load: function() {
        console.log("load");
    },
    type: Resource.Type.FONT,
    format: ""
});

"use strict";

window.Entity = {};

Entity.Controller = meta.Controller.extend({
    init: function() {
        var entityProto = Entity.Geometry.prototype;
        entityProto._entityCtrl = this;
        entityProto._parent = this;
        this.InputFlag = entityProto.InputFlag;
        this.entities = [];
        this.entitiesToUpdate = [];
        this.entitiesToRemove = [];
        this.entitiesRemoveUpdate = [];
        this.detachBuffer = [];
        this._centerTex = new Resource.Texture();
        this._centerTex.fillRect({
            color: "#ff0000",
            width: 6,
            height: 6
        });
        var scope = meta;
        this._chnOnDown = scope.createChannel(Entity.Event.INPUT_DOWN);
        this._chnOnUp = scope.createChannel(Entity.Event.INPUT_UP);
        this._chnOnClick = scope.createChannel(Entity.Event.CLICK);
        this._chnOnDbClick = scope.createChannel(Entity.Event.DBCLICK);
        this._chnOnDrag = scope.createChannel(Entity.Event.DRAG);
        this._chnOnDragStart = scope.createChannel(Entity.Event.DRAG_START);
        this._chnOnDragEnd = scope.createChannel(Entity.Event.DRAG_END);
        this._chnOnHover = scope.createChannel(Entity.Event.HOVER);
        this._chnOnHoverEnter = scope.createChannel(Entity.Event.HOVER_ENTER);
        this._chnOnHoverExit = scope.createChannel(Entity.Event.HOVER_EXIT);
        scope.subscribe(this, scope.Event.RESIZE, this.onResize);
        scope.subscribe(this, scope.Event.CAMERA_MOVE, this.onMove);
        scope.subscribe(this, scope.Event.ADAPT, this.onAdapt);
        this.volume = scope.camera.volume;
        this.onMove(scope.camera, null);
    },
    load: function() {
        meta.subscribe(this, [ Input.Event.DOWN, Input.Event.UP ], this.onInput, meta.Priority.HIGH);
        meta.subscribe(this, Input.Event.DBCLICK, this.onInputDbCLick, meta.Priority.HIGH);
        meta.subscribe(this, Input.Event.MOVE, this.onInputMove, meta.Priority.HIGH);
    },
    update: function(tDelta) {
        this.updateFlag |= 0;
        var i, n, entity;
        var children, numChildren;
        if (this._flags & this.Flag.UPDATE_HOVER) {
            this._checkHover(Input.ctrl.getEvent());
            this._flags &= ~this.Flag.UPDATE_HOVER;
        }
        for (i = 0; i < this.numEntitiesToUpdate; i++) {
            entity = this.entitiesToUpdate[i];
            if (entity.isPaused || entity.isRemoved) {
                continue;
            }
            if (entity.update) {
                entity.update(tDelta);
            }
            if (entity.components) {
                entity._updateComponents(tDelta);
            }
        }
        if (this.numDetachItems) {
            for (i = 0; i < this.numDetachItems; i++) {
                entity = this.detachBuffer[i];
                children = entity._parent.children;
                numChildren = children.length;
                if (numChildren === 0) {
                    continue;
                }
                for (n = 0; n < numChildren; n++) {
                    if (children[n] === entity) {
                        children[n] = children[numChildren - 1];
                        children.pop();
                        break;
                    }
                }
            }
            this.detachBuffer.length = 0;
            this.numDetachItems = 0;
        }
        if (this.entitiesToRemove.length) {
            this._removeEntities(this.entitiesToRemove);
            this.entitiesToRemove.length = 0;
        }
        if (this.numEntitiesRemoveUpdate) {
            var tmpEntity;
            for (i = 0; i < this.numEntitiesRemoveUpdate; i++) {
                entity = this.entitiesRemoveUpdate[i];
                this.entitiesRemoveUpdate[i] = null;
                if ((entity._removeFlag & 4) !== 4) {
                    continue;
                }
                this.numEntitiesToUpdate--;
                tmpEntity = this.entitiesToUpdate[this.numEntitiesToUpdate];
                tmpEntity._updateNodeID = entity._updateNodeID;
                this.entitiesToUpdate[entity._updateNodeID] = tmpEntity;
                this.entitiesToUpdate[this.numEntitiesToUpdate] = null;
                entity._removeFlag &= ~4;
                entity._updateNodeID = -1;
            }
            this.numEntitiesRemoveUpdate = 0;
        }
        if (this.needDepthSort) {
            this.entities.sort(this._sortEntities);
            this.needDepthSort = false;
        }
        this.updateFlag &= ~1;
    },
    _addToDrawBounds: function() {
        this.numShowBounds++;
        this.isNeedRender = true;
    },
    _removeToDrawBounds: function() {
        this.numShowBounds--;
        this.isNeedRender = true;
    },
    addEntities: function(entities) {
        if (entities instanceof Array) {
            var numEntities = entities.length;
            this.entities.length += numEntities;
            for (var i = 0; i < numEntities; i++) {
                this._addEntity(entities[i]);
            }
        } else {
            if (entities instanceof Entity.Geometry) {
                this.entities.length++;
                this._addEntity(entities);
            } else {
                console.warn("(Entity.Controller.addEntities) Invalid type for entities");
                return;
            }
        }
        this._flags |= this.Flag.UPDATE_HOVER;
        this.isNeedRender = true;
    },
    _addEntity: function(entity) {
        if (entity.isRemoved) {
            return;
        }
        if (entity._flags & entity.Flag.ADDED) {
            return;
        }
        this.entities[this.numEntities++] = entity;
        entity._flags |= entity.Flag.ADDED;
        if (!entity.texture) {
            entity.isLoaded = true;
        }
        if (entity.update) {
            entity.isUpdating = true;
        }
        if (entity.isNeedStyle) {
            entity._style.update(entity);
        }
        if (entity.totalZ !== 0) {
            this.needDepthSort = true;
        }
        if (entity.isLoaded) {
            entity._onResize(this);
        }
        if (entity.children) {
            var numChildren = entity.children.length;
            for (var i = 0; i < numChildren; i++) {
                this._addEntity(entity.children[i]);
            }
        }
    },
    removeEntities: function(entities) {
        if (entities instanceof Array) {
            if (this.updateFlag) {
                var numEntities = entities.length;
                this.entitiesToRemove.length += numEntities;
                for (var i = 0; i < numEntities; i++) {
                    this.entitiesToRemove.push(entities[i]);
                }
            } else {
                this._removeEntities(entities);
            }
        } else {
            if (entities instanceof Entity.Geometry) {
                if (this.updateFlag) {
                    this.entitiesToRemove.push(entities);
                } else {
                    for (var n = 0; n < this.numEntities; n++) {
                        if (this.entities[n] === entities) {
                            this.numEntities--;
                            this.entities[n] = this.entities[this.numEntities];
                            this.entities.pop();
                            if (entities.children) {
                                this._removeEntities(entities.children);
                            }
                            break;
                        }
                    }
                }
            } else {
                console.warn("(Entity.Controller.removeEntities) Invalid type for entities");
                return;
            }
        }
        this._flags |= this.Flag.UPDATE_HOVER;
        this.isNeedRender = true;
        this.needDepthSort = true;
    },
    _removeEntities: function(buffer) {
        var entity, n;
        var numItems = buffer.length;
        for (var i = 0; i < numItems; i++) {
            entity = buffer[i];
            for (n = 0; n < this.numEntities; n++) {
                if (!(entity._flags & entity.Flag.ADDED)) {
                    continue;
                }
                if (this.entities[n] === entity) {
                    this.numEntities--;
                    this.entities[n] = this.entities[this.numEntities];
                    this.entities.pop();
                    entity &= ~entity.Flag.ADDED;
                    if (entity.children) {
                        this._removeEntities(entity.children);
                    }
                    break;
                }
            }
        }
    },
    _addToUpdating: function(entity) {
        if (!entity) {
            console.warn("(Entity.Controller._addToUpdating) Invalid or object is null.");
            return;
        }
        if ((entity._removeFlag & 4) === 4) {
            entity._removeFlag &= ~4;
            return true;
        } else if (entity._updateNodeID !== -1) {
            return false;
        }
        entity._updateNodeID = this.numEntitiesToUpdate;
        if (this.entitiesToUpdate.length === this.numEntitiesToUpdate) {
            this.entitiesToUpdate.length += 8;
        }
        this.entitiesToUpdate[this.numEntitiesToUpdate] = entity;
        this.numEntitiesToUpdate++;
        return true;
    },
    _removeFromUpdating: function(entity) {
        if (!entity) {
            console.warn("[Entity.Controller._addToUpdating]:", "Invalid or object is null.");
            return;
        }
        if (entity._updateNodeID === -1 || (entity._removeFlag & 4) === 4) {
            return false;
        }
        if (this.entitiesRemoveUpdate.length === this.numEntitiesRemoveUpdate) {
            this.entitiesRemoveUpdate.length += 4;
        }
        entity._removeFlag |= 4;
        this.entitiesRemoveUpdate[this.numEntitiesRemoveUpdate] = entity;
        this.numEntitiesRemoveUpdate++;
        return true;
    },
    _sortEntities: function(a, b) {
        return a.totalZ - b.totalZ;
    },
    getFromVolume: function(volume) {
        var entity;
        var currNode = this.entities.last.prev;
        var lastNode = this.entities.first;
        for (;currNode !== lastNode; currNode = currNode.prev) {
            entity = currNode.entity;
            if (!entity.pickable) {
                continue;
            }
            if (entity.volume === volume) {
                continue;
            }
            if (entity.volume.vsAABB(volume)) {
                return entity;
            }
        }
        return null;
    },
    getFromPoint: function(x, y, exclude) {
        var entity;
        var currNode = this.entities.last.prev;
        var lastNode = this.entities.first;
        for (;currNode !== lastNode; currNode = currNode.prev) {
            entity = currNode.entity;
            if (!entity.pickable) {
                continue;
            }
            if (entity === exclude) {
                continue;
            }
            if (entity.volume.vsPoint(x, y)) {
                return entity;
            }
        }
        return null;
    },
    getFromEntity: function(entity) {
        return this.getFromVolume(entity.volume);
    },
    cacheEntity: meta.emptyFuncParam,
    uncacheEntity: meta.emptyFuncParam,
    onResize: function(data, event) {
        for (var i = 0; i < this.numEntities; i++) {
            this.entities[i]._onResize(this);
        }
        this.isNeedRender = true;
    },
    onMove: function(data, event) {
        var volume = data.volume;
        this.prevStartCellX = this.startCellX;
        this.prevStartCellY = this.startCellY;
        this.prevEndCellX = this.endCellX;
        this.prevEndCellY = this.endCellY;
        this.startCellX = Math.floor(volume.minX / this._cellSizeX);
        this.startCellY = Math.floor(volume.minY / this._cellSizeY);
        this.endCellX = Math.floor(volume.maxX / this._cellSizeX);
        this.endCellY = Math.floor(volume.maxY / this._cellSizeY);
        var loopStartX = Math.min(this.prevStartCellX, this.startCellX);
        var loopStartY = Math.min(this.prevStartCellY, this.startCellY);
        var loopEndX = Math.max(this.prevEndCellX, this.endCellX);
        var loopEndY = Math.max(this.prevEndCellY, this.endCellY);
        var index, cell;
        for (var y = loopStartY; y < loopEndY; y++) {
            for (var x = loopStartX; x < loopEndX; x++) {
                index = x | y << 16;
            }
        }
        this.x = data._x | 0;
        this.y = data._y | 0;
        this.isNeedRender = true;
    },
    onAdapt: function(data, event) {
        for (var i = 0; i < this.numEntities; i++) {
            this.entities[i].adapt();
        }
    },
    onInput: function(data, event) {
        if (!this.enablePicking) {
            return;
        }
        this._checkHover(data);
        var inputEvent = Input.Event;
        if (inputEvent.DOWN === event) {
            if (!this.hoverEntity || !this.hoverEntity.clickable) {
                return;
            }
            data.entity = this.hoverEntity;
            this.pressedEntity = this.hoverEntity;
            this.pressedEntity._inputFlags |= this.InputFlag.PRESSED;
            if (this.pressedEntity._style) {
                this.pressedEntity._onDown.call(this.pressedEntity, data);
            }
            this.pressedEntity.onDown.call(this.pressedEntity, data);
            this._chnOnDown.emit(data, Entity.Event.INPUT_DOWN);
        } else if (inputEvent.UP === event) {
            if (this.pressedEntity && this.pressedEntity.clickable) {
                data.entity = this.hoverEntity;
                this.pressedEntity._inputFlags &= ~this.InputFlag.PRESSED;
                if (this.pressedEntity._style) {
                    this.pressedEntity._onUp.call(this.pressedEntity, event);
                }
                this.pressedEntity.onUp.call(this.pressedEntity, event);
                this._chnOnUp.emit(this.pressedEntity, Entity.Event.INPUT_UP);
                if (this.pressedEntity === this.hoverEntity) {
                    this.pressedEntity._onClick.call(this.pressedEntity, data);
                    this.pressedEntity.onClick.call(this.pressedEntity, data);
                    this._chnOnClick.emit(data, Entity.Event.CLICK);
                }
                if (this.pressedEntity._inputFlags & this.InputFlag.DRAGGED) {
                    data.entity = this.pressedEntity;
                    this.pressedEntity._inputFlags &= ~this.InputFlag.DRAGGED;
                    if (this.pressedEntity._style) {
                        this.pressedEntity._onDragEnd.call(this.pressedEntity, data);
                    }
                    this.pressedEntity.onDragEnd.call(this.pressedEntity, data);
                    this._chnOnDragEnd.emit(data, Entity.Event.DRAG_END);
                    data.entity = this.hoverEntity;
                }
                this.pressedEntity = null;
            }
        }
    },
    onInputDbCLick: function(data, event) {
        if (!this.enablePicking) {
            return;
        }
        this._checkHover(data);
        if (this.hoverEntity) {
            this.hoverEntity._onDbClick.call(this.hoverEntity, data);
            this.hoverEntity.onDbClick.call(this.hoverEntity, data);
            this._chnOnDbClick.emit(data, Entity.Event.DBCLICK);
            data.entity = this.hoverEntity;
        } else {
            data.entity = null;
        }
    },
    _checkHover: function(data) {
        var entity;
        for (var i = this.numEntities - 1; i >= 0; i--) {
            entity = this.entities[i];
            if (!entity.pickable) {
                continue;
            }
            if (entity.isInside(data.x, data.y)) {
                if (this.hoverEntity !== entity) {
                    if (this.hoverEntity) {
                        data.entity = this.hoverEntity;
                        this.hoverEntity._inputFlags &= ~this.InputFlag.HOVER;
                        if (this.hoverEntity._style) {
                            this.hoverEntity._onHoverExit.call(this.hoverEntity, data);
                        }
                        this.hoverEntity.onHoverExit.call(this.hoverEntity, data);
                        this._chnOnHoverExit.emit(data, Entity.Event.HOVER_EXIT);
                    }
                    data.entity = entity;
                    entity._inputFlags |= this.InputFlag.HOVER;
                    if (entity._style) {
                        entity._onHoverEnter.call(entity, data);
                    }
                    entity.onHoverEnter.call(entity, data);
                    this._chnOnHoverEnter.emit(data, Entity.Event.HOVER_ENTER);
                    this.hoverEntity = entity;
                } else {
                    data.entity = entity;
                    entity.onHover.call(entity, data);
                    this._chnOnHover.emit(data, Entity.Event.HOVER);
                }
                data.entity = null;
                return;
            }
        }
        if (this.hoverEntity) {
            data.entity = this.hoverEntity;
            this.hoverEntity._inputFlags &= ~this.InputFlag.HOVER;
            if (this.hoverEntity._style) {
                this.hoverEntity._onHoverExit.call(this.hoverEntity, data);
            }
            this.hoverEntity.onHoverExit.call(this.hoverEntity, data);
            this._chnOnHoverExit.emit(data, Entity.Event.HOVER_EXIT);
        }
        this.hoverEntity = null;
    },
    _checkDrag: function(data) {
        if (this.pressedEntity && this.pressedEntity.clickable) {
            data.entity = this.pressedEntity;
            if (!(this.pressedEntity._inputFlags & this.InputFlag.DRAGGED)) {
                this.pressedEntity._inputFlags |= this.InputFlag.DRAGGED;
                if (this.pressedEntity._style) {
                    this.pressedEntity._onDragStart.call(this.pressedEntity, data);
                }
                this.pressedEntity.onDragStart.call(this.pressedEntity, data);
                this._chnOnDragStart.emit(data, Entity.Event.DRAG_START);
                return false;
            }
            this.pressedEntity.onDrag.call(this.pressedEntity, data);
            this._chnOnDrag.emit(data, Entity.Event.DRAG);
            return false;
        }
        return true;
    },
    onInputMove: function(data, event) {
        if (!this.enablePicking) {
            return;
        }
        this._checkHover(data);
        if (!this._checkDrag(data)) {
            data.entity = this.hoverEntity;
            return;
        }
        data.entity = this.hoverEntity;
    },
    getByID: function(id) {
        var buffer = this.entities.buffer;
        var num = this.entities.length;
        for (var n = 0; n < num; n++) {
            if (id === buffer[n].id) {
                return buffer[n];
            }
        }
    },
    getByName: function(name) {
        var buffer = this.entities.buffer;
        var num = this.entities.length;
        for (var n = 0; n < num; n++) {
            if (name === buffer[n].name) {
                return buffer[n];
            }
        }
    },
    getUniqueID: function() {
        return ++this._uniqueID;
    },
    set cellMagnitue(value) {
        if (this._cellMagnitue === value) {
            return;
        }
        this._cellMagnitue = value;
        this._cellSizeX = 128 * value;
        this._cellSizeY = 128 * value;
        this.isNeedRender = true;
    },
    get cellMagnitue() {
        return this._cellMagnitue;
    },
    Flag: {
        UPDATE_HOVER: 128
    },
    InputFlag: null,
    _x: 0,
    _y: 0,
    totalZ: 0,
    _depthNode: null,
    totalAngleRad: 0,
    totalAlpha: 1,
    totalScaleX: 1,
    totalScaleY: 1,
    volume: null,
    pivotX: 0,
    pivotY: 0,
    _flags: 0,
    cells: null,
    _cellSizeX: 128,
    _cellSizeY: 128,
    _cellMagnitue: 1,
    startCellX: 0,
    startCellY: 0,
    endCellX: 0,
    endCellY: 0,
    prevStartCellX: 0,
    prevStartCellY: 0,
    prevEndCellX: 0,
    prevEndCellY: 0,
    _numCellX: 0,
    _numCellY: 0,
    entities: null,
    numEntities: 0,
    updateFlag: 0,
    entitiesToCheck: null,
    entitiesToRemove: null,
    entitiesToUpdate: null,
    entitiesRemoveUpdate: null,
    detachBuffer: null,
    dynamicEntities: null,
    numEntitiesToCheck: 0,
    numEntitiesToUpdate: 0,
    numEntitiesRemoveUpdate: 0,
    numShowBounds: 0,
    numDetachItems: 0,
    isLoaded: true,
    _parent: null,
    childOffsetX: 0,
    childOffsetY: 0,
    hoverEntity: null,
    pressedEntity: null,
    isNeedRender: true,
    needDepthSort: false,
    enablePicking: true,
    showBounds: false,
    showCells: false,
    _uniqueID: 0,
    _centerTex: null,
    _chnOnDown: null,
    _chnOnUp: null,
    _chnOnClick: null,
    _chnOnDbClick: null,
    _chnOnDrag: null,
    _chnOnDragStart: null,
    _chnOnDragEnd: null,
    _chnOnHover: null,
    _chnOnHoverEnter: null,
    _chnOnHoverExit: null
});

"use strict";

Entity.Event = {
    INPUT_UP: "entityUp",
    INPUT_DOWN: "entityDown",
    CLICK: "entityClick",
    DBCLICK: "entityDbClick",
    DRAG: "drag",
    DRAG_START: "dragStart",
    DRAG_END: "dragEnd",
    HOVER: "hover",
    HOVER_ENTER: "hoverEnter",
    HOVER_EXIT: "hoverExit",
    STATE_CHANGE: "stateChange"
};

Entity.PositionType = {
    CENTER: 0,
    TOP_LEFT: 1,
    TOP_RIGHT: 2,
    BOTTOM_LEFT: 3,
    BOTTOM_RIGHT: 4,
    TOP: 5,
    BOTTOM: 6,
    LEFT: 7,
    RIGHT: 8
};

"use strict";

meta.Renderer = meta.Class.extend({
    addEntity: function(entity) {
        this.entities.push(entity);
        this.needRender = true;
    },
    addEntities: function(entities) {
        var numEntities = entities.length;
        for (var i = 0; i < numEntities; i++) {
            this.entities.push(entities[i]);
        }
        this.needRender = true;
    },
    getUniqueID: function() {
        return this._uniqueID++;
    },
    entities: [],
    needRender: true,
    _uniqueID: 0
});

"use strict";

meta.CanvasRenderer = meta.Renderer.extend({
    init: function() {
        this.engine = meta.engine;
        this.ctx = this.engine.canvas.getContext("2d");
        this.engine.ctx = this.ctx;
    },
    render: function(tDelta) {
        this.clear();
        var numEntities = this.entities.length;
        for (var i = 0; i < numEntities; i++) {
            this.drawEntity(this.entities[i]);
        }
        this.needRender = false;
    },
    clear: function() {
        this.ctx.fillStyle = "#ddd";
        this.ctx.fillRect(0, 0, this.engine.width, this.engine.height);
    },
    drawEntity: function(entity) {
        if (entity.texture.canvas.width === 0) {
            entity.texture.canvas.width = 1;
            entity.texture.canvas.height = 1;
        }
        var volume = entity.volume;
        this.ctx.drawImage(entity.texture.canvas, Math.floor(volume.minX), Math.floor(volume.minY));
    },
    engine: null,
    ctx: null
});

"use strict";

Entity.Geometry = meta.Class.extend({
    _init: function(params) {
        this.volume = new meta.math.AdvAABB(0, 0, 0, 0);
        this._parent = this._entityCtrl;
        this._initParams(params);
    },
    _initParams: function(params) {
        if (params) {
            if (typeof params === "object") {
                if (params instanceof Resource.Texture) {
                    this.texture = params;
                } else if (params instanceof Entity.Geometry) {
                    this.texture = params.texture;
                } else {
                    for (var key in params) {
                        this[key] = params[key];
                    }
                }
            } else if (typeof params === "string") {
                this.texture = params;
            }
        }
    },
    get parent() {
        return this._parent;
    },
    remove: function() {
        if (this._parent === this._entityCtrl) {
            this._view.detach(this);
        } else {
            this.removeCore();
        }
    },
    removeCore: function() {
        if (this.isRemoved) {
            return;
        }
        this.isUpdating = false;
        this.isRemoved = true;
        this._view = null;
        if (this._texture) {
            this._texture.unsubscribe(this);
        }
        if (this._tween) {
            this._tween.clear();
            this._tween.owner = null;
        }
        this.removeChildren();
        this.removeComponents();
    },
    removeChildren: function() {
        if (!this.children) {
            return;
        }
        var numChildren = this.children.length;
        for (var i = 0; i < numChildren; i++) {
            this.children[i].removeCore();
        }
    },
    clone: function() {
        var clone = new Entity.Geometry();
        for (var key in this) {
            if (clone[key] === this[key]) {
                continue;
            }
            clone[key] = this[key];
        }
        clone.id = this._entityCtrl.getUniqueID();
        return clone;
    },
    draw: function(ctx) {
        this._draw(ctx);
    },
    _draw: function(ctx) {
        this._drawDefault(ctx);
    },
    _drawDefault: function(ctx) {
        if (!this._texture) {
            return;
        }
        var unitSize = this.meta.unitSize;
        if (!this._texture.isAnimated) {
            this._texture.draw(ctx, (this.drawX | 0) * unitSize, (this.drawY | 0) * unitSize);
        } else {
            this._texture.drawFrame(ctx, (this.drawX | 0) * unitSize, (this.drawY | 0) * unitSize, this._currFrame, this.isEmulateReverse);
        }
    },
    _drawTransform: function(ctx) {
        if (!this._texture) {
            return;
        }
        ctx.save();
        ctx.globalAlpha = this.totalAlpha;
        var unitSize = this.meta.unitSize;
        var posX = (this.volume.x - this.pivotX) * unitSize;
        var posY = (this.volume.y - this.pivotY) * unitSize;
        if (this.isChild) {
            var parentOffsetX = (this._parent.volume.x - this._parent.pivotX) * unitSize;
            var parentOffsetY = (this._parent.volume.y - this._parent.pivotY) * unitSize;
            ctx.translate(parentOffsetX, parentOffsetY);
            ctx.rotate(this._parent.totalAngleRad);
            ctx.translate(-parentOffsetX, -parentOffsetY);
        }
        ctx.translate(posX, posY);
        ctx.rotate(this._angleRad);
        ctx.scale(this.totalScaleX * this._flipX, this.totalScaleY * this._flipY);
        ctx.translate(-posX, -posY);
        if (!this.texture.isAnimated) {
            this._texture.draw(ctx, (this.drawX | 0) * unitSize, (this.drawY | 0) * unitSize);
        } else {
            this._texture.drawFrame(ctx, (this.drawX | 0) * unitSize, (this.drawY | 0) * unitSize, this._currFrame, this.isEmulateReverse);
        }
        ctx.restore();
    },
    renderBounds: function(ctx) {
        if (isCached !== entity._isCached) {
            if (entity.isCached || entity.isHighlight) {
                ctx.strokeStyle = "#339933";
            } else {
                ctx.strokeStyle = "#ff0000";
            }
            isCached = !isCached;
        }
        ctx.save();
        pivotOffsetX = entity.volume.x - entity.pivotX;
        pivotOffsetY = entity.volume.y - entity.pivotY;
        if (!entity.isChild) {
            parentOffsetX = entity._parent.volume.x - entity._parent.pivotX;
            parentOffsetY = entity._parent.volume.y - entity._parent.pivotY;
            ctx.translate(parentOffsetX, parentOffsetY);
            ctx.rotate(entity._parent.totalAngleRad);
            ctx.scale(this.totalScaleX * this._flipX, this.totalScaleY * this._flipY);
            ctx.translate(-parentOffsetX, -parentOffsetY);
        }
        ctx.translate(pivotOffsetX, pivotOffsetY);
        ctx.rotate(entity._angleRad);
        ctx.scale(this.totalScaleX * this._flipX, this.totalScaleY * this._flipY);
        ctx.translate(-pivotOffsetX, -pivotOffsetY);
        this._centerTex.draw(ctx, pivotOffsetX - 3, pivotOffsetY - 3);
        ctx.restore();
    },
    drawBounds: function(ctx) {
        this.volume.draw(ctx);
    },
    update: null,
    _updateComponents: function(tDelta) {
        var comp;
        var numComponents = this.components.length;
        for (var n = 0; n < numComponents; n++) {
            comp = this.components[n];
            if (comp.update) {
                comp.update(tDelta);
            }
        }
    },
    _updateAnim: function(tDelta) {
        if (this.animSpeed <= 0 || this._texture.numFrames < 2) {
            return;
        }
        var delay = 1 / (this.fps * this.animSpeed);
        this._tAnim += tDelta;
        if (this._tAnim < delay) {
            return;
        }
        this.isNeedDraw = true;
        var numFrames = this._tAnim / delay | 0;
        this._tAnim -= delay * numFrames;
        if (!this._isAnimReverse) {
            this._currFrame += numFrames;
            if (this._currFrame >= this._texture.numFrames) {
                if (this.pauseAtEnd) {
                    this.isAnimating = false;
                    this._currFrame = this._texture.numFrames - 1;
                } else if (!this.isLoop && !this._texture.isLoop) {
                    this.isAnimating = false;
                    this._currFrame = 0;
                } else {
                    this._currFrame = this._currFrame % this._texture.numFrames;
                }
                if (this.onAnimEnd) {
                    this.onAnimEnd();
                }
            }
        } else {
            this._currFrame -= numFrames;
            if (this._currFrame < 0) {
                if (this.pauseAtEnd) {
                    this.isAnimating = false;
                    this._currFrame = 0;
                } else if (!this.isLoop && !this._texture.isLoop) {
                    this.isAnimating = false;
                    this._currFrame = this._texture.numFrames - 1;
                } else {
                    this._currFrame = (this._texture.numFrames + this._currFrame) % this._texture.numFrames;
                }
                if (this.onAnimEnd) {
                    this.onAnimEnd();
                }
            }
        }
    },
    play: function(isLoop, fps) {
        if (!this.texture || !this.texture.isAnimated) {
            return;
        }
        if (isLoop) {
            this.isLoop = true;
        } else {
            this.isLoop = false;
        }
        this.fps = fps || this.texture.fps;
        this.currFrame = 0;
        this.isAnimating = true;
        this.pauseAtEnd = false;
        this._isAnimReverse = false;
    },
    playAndPause: function(fps) {
        this.play(false, fps);
        this.pauseAtEnd = true;
    },
    playReverse: function(isLoop, fps) {
        if (!this.texture) {
            return;
        }
        this.play(isLoop, fps);
        this.currFrame = this.texture.numFrames - 1;
        this._isAnimReverse = true;
    },
    playReverseAndPause: function(fps) {
        this.playReverse(false, fps);
        this.pauseAtEnd = true;
    },
    stop: function() {
        if (this._texture) {
            this.isLoop = this._texture.isLoop;
            if (this._isAnimReverse) {
                this.currFrame = this._texture.numFrames - 1;
            } else {
                this.currFrame = 0;
            }
        } else {
            this.isLoop = false;
            this.currFrame = 0;
        }
        this.isAnimating = false;
    },
    pause: function() {
        this.isAnimating = false;
    },
    resume: function() {
        this.isAnimating = true;
    },
    forcePosition: function(x, y) {
        this._x = x;
        this._y = y;
        this.updatePos();
    },
    updatePos: function() {
        this.drawX = this.core.x;
        this.drawY = this.core.y;
        this.isNeedDraw = true;
    },
    updatePosType: function() {
        if (this.positionType === 0) {
            return;
        }
        if (this.positionType === 1) {
            this._x = this.typeX + this.volume.halfWidth | 0;
            this._y = this.typeY + this.volume.halfHeight | 0;
        } else if (this.positionType === 2) {
            this._x = this.typeX - this.volume.halfWidth | 0;
            this._y = this.typeY + this.volume.halfHeight | 0;
        } else if (this.positionType === 3) {
            this._x = this.typeX + this.volume.halfWidth | 0;
            this._y = this.typeY - this.volume.halfHeight | 0;
        } else if (this.positionType === 4) {
            this._x = this.typeX - this.volume.halfWidth | 0;
            this._y = this.typeY - this.volume.halfHeight | 0;
        } else if (this.positionType === 5) {
            this._y = this.typeY + this.volume.halfHeight | 0;
        } else if (this.positionType === 6) {
            this._y = this.typeY - this.volume.halfHeight | 0;
        } else if (this.positionType === 7) {
            this._x = this.typeX + this.volume.halfWidth | 0;
        } else if (this.positionType === 8) {
            this._x = this.typeX - this.volume.halfWidth | 0;
        }
    },
    updateFromTexture: function() {
        var unitRatio = this.meta.unitRatio;
        this.volume.resize(this._texture.trueWidth * unitRatio, this._texture.trueHeight * unitRatio);
        this.updatePivot();
        this.updatePosType();
        this.updatePos();
        if (this.children) {
            var numChildren = this.children.length;
            for (var i = 0; i < numChildren; i++) {
                var child = this.children[i];
                if (child.positionType) {
                    child.updatePosType();
                }
                child.updateAnchor();
            }
        }
    },
    adapt: function() {
        if (!this._texture) {
            this.volume.unitSize = meta.unitSize;
            this.updatePosType();
            this.updatePos();
        }
    },
    position: function(x, y) {
        this.core.x = x;
        this.core.y = y;
    },
    move: function(deltaX, deltaY) {
        var newX = this._x + deltaX;
        var newY = this._y + deltaY;
        if (this._x === newX && this._y === newY) {
            return;
        }
        this.forcePosition(newX, newY);
    },
    moveForward: function(delta) {
        var newX = this._x + delta * Math.cos(this._angleRad - 1.57079);
        var newY = this._y + delta * Math.sin(this._angleRad - 1.57079);
        if (this._x === newX && this._y === newY) {
            return;
        }
        this.forcePosition(newX, newY);
    },
    moveDirected: function(delta, angleOffset) {
        var newX = this._x + -delta * Math.cos(this._angleRad - 1.57079 + angleOffset);
        var newY = this._y + -delta * Math.sin(this._angleRad - 1.57079 + angleOffset);
        if (this._x === newX && this._y === newY) {
            return;
        }
        this.forcePosition(newX, newY);
    },
    strafe: function(delta) {
        var newX = this._x + -delta * Math.cos(this._angleRad + Math.PI);
        var newY = this._y + -delta * Math.sin(this._angleRad + Math.PI);
        if (this._x === newX && this._y === newY) {
            return;
        }
        this.forcePosition(newX, newY);
    },
    positionTopLeft: function(x, y) {
        if (this._x === x && this._y === y && this.positionType === 1) {
            return;
        }
        this.positionType = 1;
        this.typeX = x;
        this.typeY = y;
        this._x = this.typeX + this.volume.halfWidth | 0;
        this._y = this.typeY + this.volume.halfHeight | 0;
        this.updatePos();
    },
    positionTopRight: function(x, y) {
        if (this._x === x && this._y === y && this.positionType === 2) {
            return;
        }
        this.positionType = 2;
        this.typeX = x;
        this.typeY = y;
        this._x = this.typeX - this.volume.halfWidth | 0;
        this._y = this.typeY + this.volume.halfHeight | 0;
        this.updatePos();
    },
    positionBottomLeft: function(x, y) {
        if (this._x === x && this._y === y && this.positionType === 3) {
            return;
        }
        this.positionType = 3;
        this.typeX = x;
        this.typeY = y;
        this._x = this.typeX + this.volume.halfWidth | 0;
        this._y = this.typeY - this.volume.halfHeight | 0;
        this.updatePos();
    },
    positionBottomRight: function(x, y) {
        if (this._x === x && this._y === y && this.positionType === 4) {
            return;
        }
        this.positionType = 4;
        this.typeX = x;
        this.typeY = y;
        this._x = this.typeX - this.volume.halfWidth | 0;
        this._y = this.typeY - this.volume.halfHeight | 0;
        this.updatePos();
    },
    positionTop: function(x, y) {
        if (this._x === x && this._y === y && this.positionType === 5) {
            return;
        }
        this.positionType = 5;
        this.typeX = x;
        this.typeY = y;
        this._x = x;
        this._y = this.typeY + this.volume.halfHeight | 0;
        this.updatePos();
    },
    positionBottom: function(x, y) {
        if (this._x === x && this._y === y && this.positionType === 6) {
            return;
        }
        this.positionType = 6;
        this.typeX = x;
        this.typeY = y;
        this._x = x;
        this._y = this.typeY - this.volume.halfHeight | 0;
        this.updatePos();
    },
    positionLeft: function(x, y) {
        if (this._x === x && this._y === y && this.positionType === 7) {
            return;
        }
        this.positionType = 7;
        this.typeX = x;
        this.typeY = y;
        this._x = this.typeX + this.volume.halfWidth | 0;
        this._y = y;
        this.updatePos();
    },
    positionRight: function(x, y) {
        if (this._x === x && this._y === y && this.positionType === 8) {
            return;
        }
        this.positionType = 8;
        this.typeX = x;
        this.typeY = y;
        this._x = this.typeX - this.volume.halfWidth | 0;
        this._y = y;
        this.updatePos();
    },
    topLeft: function(x, y) {
        if (this._x === x && this._y === y && this.positionType === 1) {
            return;
        }
        this.positionType = 1;
        this.typeX = x;
        this.typeY = y;
        this._x = this.typeX + this.volume.halfWidth | 0;
        this._y = this.typeY + this.volume.halfHeight | 0;
        this.updatePos();
    },
    topRight: function(x, y) {
        if (this._x === x && this._y === y && this.positionType === 2) {
            return;
        }
        this.positionType = 2;
        this.typeX = x;
        this.typeY = y;
        this._x = this.typeX - this.volume.halfWidth | 0;
        this._y = this.typeY + this.volume.halfHeight | 0;
        this.updatePos();
    },
    bottomLeft: function(x, y) {
        if (this._x === x && this._y === y && this.positionType === 3) {
            return;
        }
        this.positionType = 3;
        this.typeX = x;
        this.typeY = y;
        this._x = this.typeX + this.volume.halfWidth | 0;
        this._y = this.typeY - this.volume.halfHeight | 0;
        this.updatePos();
    },
    bottomRight: function(x, y) {
        if (this._x === x && this._y === y && this.positionType === 4) {
            return;
        }
        this.positionType = 4;
        this.typeX = x;
        this.typeY = y;
        this._x = this.typeX - this.volume.halfWidth | 0;
        this._y = this.typeY - this.volume.halfHeight | 0;
        this.updatePos();
    },
    set top(y) {
        this.positionTop(this._x, y);
    },
    set bottom(y) {
        this.positionBottom(this._x, y);
    },
    set left(x) {
        this.positionLeft(x, this._y);
    },
    set right(x) {
        this.positionRight(x, this._y);
    },
    get top() {
        return this.volume.minY;
    },
    get bottom() {
        return this.volume.maxY;
    },
    get left() {
        return this.volume.minX;
    },
    get right() {
        return this.volume.maxX;
    },
    pivot: function(x, y) {
        if (y === void 0) {
            y = x;
        }
        this.pivotRatioX = x;
        this.pivotRatioY = y;
        this.updatePivot();
        this.updatePos();
    },
    updatePivot: function() {
        this.pivotSrcX = -this.pivotRatioX * this._flipX * this.volume.initHalfWidth;
        this.pivotSrcY = -this.pivotRatioY * this._flipY * this.volume.initHalfHeight;
        this.pivotX = this.pivotSrcX * this._scaleX;
        this.pivotY = this.pivotSrcY * this._scaleY;
        if (this.children) {
            this.childPivotX = (-this.pivotRatioX - 1) * this.volume.halfWidth;
            this.childPivotY = (-this.pivotRatioY - 1) * this.volume.halfHeight;
        }
    },
    pivotPx: function(x, y) {
        if (y === void 0) {
            y = x;
        }
        this.pivotX = x;
        this.pivotY = y;
        if (this.children) {
            this.childOffsetX = this._x + pivotX + this._anchorPosX;
            this.childOffsetY = this._y + pivotY + this._anchorPosY;
        }
        this.updatePos();
    },
    pivotCenter: function(x, y) {
        if (this.pivotRatioX !== 0 || this.pivotRatioY !== 0) {
            this._x = x;
            this._y = y;
            this.pivot(0, 0);
            return;
        }
        if (this._x === x && this._y === y) {
            return;
        }
        this.forcePosition(x, y);
    },
    pivotTopLeft: function(x, y) {
        if (this.pivotRatioX !== -1 || this.pivotRatioY !== -1) {
            this._x = x;
            this._y = y;
            this.pivot(-1, -1);
            return;
        }
        if (this._x === x && this._y === y) {
            return;
        }
        this.forcePosition(x, y);
    },
    pivotTopRight: function(x, y) {
        if (this.pivotRatioX !== 1 || this.pivotRatioY !== -1) {
            this._x = x;
            this._y = y;
            this.pivot(1, -1);
            return;
        }
        if (this._x === x && this._y === y) {
            return;
        }
        this.forcePosition(x, y);
    },
    pivotBottomLeft: function(x, y) {
        if (this.pivotRatioX !== -1 || this.pivotRatioY !== 1) {
            this._x = x;
            this._y = y;
            this.pivot(-1, 1);
            return;
        }
        if (this._x === x && this._y === y) {
            return;
        }
        this.forcePosition(x, y);
    },
    pivotBottomRight: function(x, y) {
        if (this.pivotRatioX !== 1 || this.pivotRatioY !== 1) {
            this._x = x;
            this._y = y;
            this.pivot(1, 1);
            return;
        }
        if (this._x === x && this._y === y) {
            return;
        }
        this.forcePosition(x, y);
    },
    pivotTop: function(x, y) {
        if (this.pivotRatioX !== 0 || this.pivotRatioY !== -1) {
            this._x = x;
            this._y = y;
            this.pivot(0, -1);
            return;
        }
        if (this._x === x && this._y === y) {
            return;
        }
        this.forcePosition(x, y);
    },
    pivotBottom: function(x, y) {
        if (this.pivotRatioX !== 0 || this.pivotRatioY !== 1) {
            this._x = x;
            this._y = y;
            this.pivot(0, 1);
            return;
        }
        if (this._x === x && this._y === y) {
            return;
        }
        this.forcePosition(x, y);
    },
    pivotLeft: function(x, y) {
        if (this.pivotRatioX !== -1 || this.pivotRatioY !== 0) {
            this._x = x;
            this._y = y;
            this.pivot(-1, 0);
            return;
        }
        if (this._x === x && this._y === y) {
            return;
        }
        this.forcePosition(x, y);
    },
    pivotRight: function(x, y) {
        if (this.pivotRatioX !== 1 || this.pivotRatioY !== 0) {
            this._x = x;
            this._y = y;
            this.pivot(1, 0);
            return;
        }
        if (this._x === x && this._y === y) {
            return;
        }
        this.forcePosition(x, y);
    },
    anchor: function(x, y) {
        if (y === void 0) {
            y = x;
        }
        if (this._anchorX === x && this._anchorY === y) {
            return;
        }
        this._anchorX = x;
        this._anchorY = y;
        this._flags |= this.Flag.ANCHOR;
        this.updateAnchor();
    },
    updateAnchor: function() {
        if (this._flags & this.Flag.IGNORE_ZOOM) {
            this._anchorPosX = this._parent.volume.width * (1 / this._parent.volume.scaleX) * this._anchorX + .5 | 0;
            this._anchorPosY = this._parent.volume.height * (1 / this._parent.volume.scaleY) * this._anchorY + .5 | 0;
        } else {
            this._anchorPosX = this._parent.volume.width * this._anchorX + .5 | 0;
            this._anchorPosY = this._parent.volume.height * this._anchorY + .5 | 0;
        }
        this.updatePos();
    },
    dragStart: function(x, y) {
        this._dragOffsetX = this._x + this._anchorPosX - x;
        this._dragOffsetY = this._y + this._anchorPosY - y;
    },
    dragEnd: function() {
        this._dragOffsetX = 0;
        this._dragOffsetY = 0;
    },
    dragTo: function(x, y) {
        x -= this._anchorPosX - this._dragOffsetX;
        y -= this._anchorPosY - this._dragOffsetY;
        if (this._x === x && this._y === y) {
            return;
        }
        this.forcePosition(x, y);
    },
    isInside: function(x, y) {
        return this.volume.vsBorderPoint(x - this.offsetX, y - this.offsetY);
    },
    _isInsideDefault: function(x, y) {
        return this.volume.vsBorderPoint(x - this.offsetX, y - this.offsetY);
    },
    _isInsideTransform: function(x, y) {
        var centerX = this._anchorPosX + this._parent.childOffsetX;
        var centerY = this._anchorPosY + this._parent.childOffsetY;
        if (!this.isChild) {
            centerX += this._x;
            centerY += this._y;
        }
        var offsetX = x - centerX;
        var offsetY = y - centerY;
        var sin = Math.sin(-this._angleRad);
        var cos = Math.cos(-this._angleRad);
        var newX = offsetX * cos - offsetY * sin + centerX;
        var newY = offsetY * cos + offsetX * sin + centerY;
        return this.volume.vsBorderPoint(newX, newY);
    },
    vsEntity: function(entity) {
        return this.volume.vsAABB(entity.volume);
    },
    resize: function(width, height) {
        if (height === void 0) {
            height = this.volume.height;
        }
        this.volume.resize(width, height);
        if (this.children) {
            var numChildren = this.children.length;
            for (var i = 0; i < numChildren; i++) {
                this.children[i]._onResize(this);
            }
        }
    },
    _onTextureEvent: function(data, event) {
        var resEvent = Resource.Event;
        if (event === resEvent.LOADED) {
            this.updateFromTexture();
            this.isLoaded = true;
        } else if (event === resEvent.UNLOADED) {
            this.isLoaded = false;
        } else if (event === resEvent.RESIZE) {
            this.updateFromTexture();
        } else if (event === resEvent.CHANGED) {
            this.updateFromTexture();
        }
        this.isNeedDraw = true;
    },
    _onResAllLoaded: function(data, event) {
        if (typeof this._texture === "string") {
            var texture = meta.getTexture(this._texture);
            if (!texture) {
                console.warn("[Entity.Geometry._onResAllLoaded]:", "Could not find texture with a name: " + this._texture);
                this._texture = null;
            } else {
                this.texture = texture;
            }
            meta.unsubscribe(this, Resource.Event.ALL_LOADED);
        }
    },
    attach: function(entity, isRelative) {
        if (!entity) {
            console.error("(Entity.Geometry.attach) Invalid child object passed.");
            return;
        }
        if (entity.isChild) {
            console.error("(Entity.Geometry.attach) Entity is already a child of someone else.");
            return;
        }
        if (entity.isRemoved) {
            console.error("(Entity.Geometry.attach) Entity is marked as removed ro to be removed.");
            return;
        }
        if (entity._view && (entity._view !== this._view || !entity.isChild)) {
            entity._view._removeFromBuffer(entity);
        }
        if (isRelative) {
            entity.move(-this._x - this._anchorPosX - this.pivotX + this.volume.halfWidth, -this._y - this._anchorPosY - this.pivotY + this.volume.halfHeight);
        }
        entity._parent = this;
        entity.isChild = true;
        entity.ignoreZoom = this.ignoreZoom;
        entity.disableDebug = this.disableDebug;
        entity._view = this._view;
        if (this.clipVolume && !entity.clipVolume) {
            entity.clip(this.clipVolume);
        }
        if (!this.pickable) {
            entity.pickable = false;
        }
        if (!this.clickable) {
            entity.clickable = false;
        }
        entity.updateAngle();
        entity.updateAlpha();
        if (this.totalScaleX !== 1 || this.totalScaleY !== 1) {
            entity.updateScale();
        }
        entity.updateZ();
        if (!this.children) {
            this.children = [ entity ];
            this.childPivotX = (-this.pivotRatioX - 1) * this.volume.halfWidth;
            this.childPivotY = (-this.pivotRatioY - 1) * this.volume.halfHeight;
            this.childOffsetX = this._x + this.childPivotX + this._anchorPosX;
            this.childOffsetY = this._y + this.childPivotY + this._anchorPosY;
            var parent = this._parent;
            while (parent) {
                this.childOffsetX += parent.childOffsetX;
                this.childOffsetY += parent.childOffsetY;
                parent = parent._parent;
            }
            this.updatePos();
        } else {
            this.children.push(entity);
        }
        if (entity._flags & this.Flag.ANCHOR) {
            entity.updateAnchor();
        }
        if (this._flags & this.Flag.IGNORE_ZOOM) {
            entity.ignoreZoom = this.ignoreZoom;
        }
        entity.updatePos();
        if (this._view && this._view._isActive) {
            this._entityCtrl.addEntities(entity);
        }
        this.onChildAdded(entity);
        entity.onParentAdded(this);
    },
    detach: function(entity) {
        if (entity) {
            if (!this.children) {
                return;
            }
            var child;
            var numChildren = this.children.length;
            for (var i = 0; i < numChildren; i++) {
                child = this.children[i];
                if (child.isRemoved) {
                    continue;
                }
                if (child === entity) {
                    child._parent = this._entityCtrl;
                    child._view = null;
                    child.isChild = false;
                    this._view.add(child);
                    child.move(this._x + this._anchorPosX + this.pivotX - this.volume.halfWidth, this._y + this._anchorPosY + this.pivotY - this.volume.halfHeight);
                    this.onChildRemoved(child);
                    child.onParentRemoved(this);
                    return;
                }
            }
        } else {
            if (!this.isChild) {
                return;
            }
            this._parent.detach(this);
        }
    },
    detachChildren: function() {
        if (!this.children) {
            return;
        }
        var i;
        var child;
        var numChildren = this.children.length;
        for (i = 0; i < numChildren; i++) {
            child = this.children[i];
            if (child.isRemoved) {
                continue;
            }
            child._parent = this._entityCtrl;
            child._view = null;
            child.isChild = false;
            this._view.add(child);
            child.move(this._x + this._anchorPosX + this.pivotX - this.volume.halfWidth, this._y + this._anchorPosY + this.pivotY - this.volume.halfHeight);
            this.onChildRemoved(child);
            child.onParentRemoved(this);
        }
        this.children.length = 0;
    },
    detachExact: function() {
        var child;
        var numChildren = this.children.length;
        for (var i = 0; i < numChildren; i++) {
            child = this.children[i];
            if (child.isRemoved) {
                continue;
            }
            child._x += this.childOffsetX;
            child._y += this.childOffsetY;
            child._parent = this._entityCtrl;
            child._view = null;
            child.isChild = false;
            this._view.add(child);
            child.forcePosition(child._x, child._y);
            this.onChildRemoved(child);
            child.onParentRemoved(this);
        }
        this.children.length = 0;
    },
    clip: function(minX, minY, maxX, maxY) {
        if (typeof minX === "object") {
            if (minX instanceof meta.math.AdvAABB || minX instanceof meta.math.AABB) {
                this.clipVolume = minX;
            } else {
                this.clipVolume = minX.volume;
            }
        } else {
            this.clipVolume = new meta.math.AdvAABB(minX, minY, maxX, maxY);
        }
        if (this.children) {
            var numChildren = this.children.length;
            for (var i = 0; i < numChildren; i++) {
                this.children[i].clip(this.clipVolume);
            }
        }
        this.isNeedDraw = true;
        return this.clipVolume;
    },
    _onClick: meta.emptyFuncParam,
    _onDbClick: meta.emptyFuncParam,
    _onDown: function(param) {
        this._action = "pressed";
        this._style.updateAction(this);
    },
    _onUp: function(param) {
        if (this._inputFlags > 0) {
            if (this._inputFlags & this.InputFlag.DRAGGED) {
                this._action = "drag";
            } else if (this._inputFlags & this.InputFlag.HOVER) {
                this._action = "hover";
            } else {
                console.warn("[Entity.Geometry._onAction_hoverExit]:", "Unhandled action caught: " + this._inputFlags);
                this._action = "";
            }
        } else {
            this._action = "";
        }
        this._style.updateAction(this);
    },
    _onDragStart: function() {
        this._action = "drag";
        this._style.updateAction(this);
    },
    _onDragEnd: function() {
        if (this._inputFlags > 0) {
            if (this._inputFlags & this.InputFlag.PRESSED) {
                this._action = "pressed";
            } else if (this._inputFlags & this.InputFlag.HOVER) {
                this._action = "hover";
            } else {
                console.warn("[Entity.Geometry._onAction_hoverExit]:", "Unhandled action caught: " + this._inputFlags);
                this._action = "";
            }
        } else {
            this._action = "";
        }
        this._style.updateAction(this);
    },
    _onHoverEnter: function() {
        this._action = "hover";
        this._style.updateAction(this);
    },
    _onHoverExit: function() {
        if (this._inputFlags > 0) {
            if (this._inputFlags & this.InputFlag.DRAGGED) {
                this._action = "drag";
            } else if (this._inputFlags & this.InputFlag.PRESSED) {
                this._action = "pressed";
            } else {
                console.warn("[Entity.Geometry._onAction_hoverExit]:", "Unhandled action caught: " + this._inputFlags);
                this._action = "";
            }
        } else {
            this._action = "";
        }
        this._style.updateAction(this);
    },
    onDown: meta.emptyFuncParam,
    onUp: meta.emptyFuncParam,
    onClick: meta.emptyFuncParam,
    onDbClick: meta.emptyFuncParam,
    onDrag: meta.emptyFuncParam,
    onDragStart: meta.emptyFuncParam,
    onDragEnd: meta.emptyFuncParam,
    onHover: meta.emptyFuncParam,
    onHoverEnter: meta.emptyFuncParam,
    onHoverExit: meta.emptyFuncParam,
    onAnimEnd: null,
    onChildAdded: meta.emptyFuncParam,
    onChildRemoved: meta.emptyFuncParam,
    onParentAdded: meta.emptyFuncParam,
    onParentRemoved: meta.emptyFuncParam,
    _onChange: meta.emptyFunc,
    onChange: meta.emptyFunc,
    addComponent: function(name, comp, params) {
        if (!comp && typeof comp !== "Object") {
            console.warn("[Entity.Geometry.addComponent]:", "No component specified.");
            return null;
        }
        var newComp = new comp();
        newComp.owner = this;
        this[name] = newComp;
        if (params) {
            for (key in params) {
                newComp[key] = params[key];
            }
        }
        if (!this.components) {
            this.components = [ newComp ];
        } else {
            this.components.push(newComp);
        }
        if (newComp.load) {
            newComp.load();
        }
        if (newComp.update && !this._isUpdating) {
            this.isUpdating = true;
        }
        return newComp;
    },
    removeComponent: function(comp) {
        if (!comp) {
            console.warn("[Entity.Geometry.removeComponent]:", "No component specified.");
            return;
        }
        if (!this.components) {
            console.warn("[Entity.Geometry.removeComponent]:", "No such component found:", comp);
            return;
        }
        var entityComp = this[comp];
        this[comp] = null;
        if (!entityComp) {
            console.warn("[Entity.Geometry.removeComponent]:", "No such component found:", comp);
            return;
        }
        if (entityComp.unload) {
            entityComp.unload();
        }
        var numComponents = this.components.length;
        for (var i = 0; i < numComponents; i++) {
            if (this.components[i] === entityComp) {
                this.components[i] = this.components[numComponents - 1];
                this.components.pop();
                break;
            }
        }
    },
    removeComponents: function() {
        if (!this.components) {
            return;
        }
        var component;
        var numComponents = this.components.length;
        for (var n = 0; n < numComponents; n++) {
            component = this.components[n];
            if (component.unload) {
                component.unload();
            }
        }
        this.components.length = 0;
    },
    distanceToEntity: function(entity) {
        var x = entity.volume.x - this.volume.x;
        var y = entity.volume.y - this.volume.y;
        return Math.sqrt(x * x + y * y);
    },
    lookAt: function(x, y) {
        this.angleRad = -Math.atan2(x - (this.volume.x + this.pivotX), y - (this.volume.y - this.pivotY)) + Math.PI;
    },
    lookAtEntity: function(entity) {
        this.lookAt(entity.volume.x, entity.volume.y);
    },
    getLookAt: function(x, y) {
        return -Math.atan2(x - (this.volume.x + this.pivotX), y - (this.volume.y - this.pivotY)) + Math.PI;
    },
    subscribe: function(owner, func) {
        if (!this.chn) {
            this.chn = meta.createChannel("__ent" + this.id);
        }
        this.chn.subscribe(owner, func);
    },
    unsubscribe: function(owner) {
        if (!this.chn) {
            return;
        }
        this.chn.unsubscribe(owner);
        if (this.chn.numSubs === 0) {
            this.chn.remove();
            this.chn = null;
        }
    },
    emit: function(data, event) {
        if (this.chn) {
            this.chn.emit(data, event);
        }
    },
    print: function(str) {
        str = str || "";
        console.log("[Entity", this.name + ":" + this.id + "]", str);
    },
    get view() {
        return this._view;
    },
    get absX() {
        return this.volume.x;
    },
    get absY() {
        return this.volume.y;
    },
    get width() {
        return this.volume.width;
    },
    get height() {
        return this.volume.height;
    },
    set anchorX(x) {
        this.anchor(x, this._anchorY);
    },
    set anchorY(y) {
        this.anchor(this._anchorX, y);
    },
    get anchorX() {
        return this._anchorX;
    },
    get anchorY() {
        return this._anchorY;
    },
    offset: function(x, y) {
        if (this._offsetX === x && this._offsetY === y) {
            return;
        }
        this._offsetX = x;
        this._offsetY = y;
        this.updatePos();
    },
    set offsetX(value) {
        if (this._offsetX === value) {
            return;
        }
        this._offsetX = value;
        this.updatePos();
    },
    set offsetY(value) {
        if (this._offsetY === value) {
            return;
        }
        this._offsetY = value;
        this.updatePos();
    },
    get offsetX() {
        return this._offsetX;
    },
    get offsetY() {
        return this._offsetY;
    },
    set isAnchor(value) {
        if ((this._flags & this.Flag.ANCHOR) === value) {
            return;
        }
        if (!value) {
            this._anchorX = 0;
            this._anchorY = 0;
            this._anchorPosX = 0;
            this._anchorPosY = 0;
            this._flags ^= this.Flag.ANCHOR;
        } else {
            this._flags |= this.Flag.ANCHOR;
        }
        this.isNeedDraw = true;
    },
    get isAnchor() {
        return this._flags & this.Flag.ANCHOR;
    },
    get centerX() {
        return this._x + this._parent.childOffsetX + this.textureOffsetX;
    },
    get centerY() {
        return this._y + this._parent.childOffsetY + this.textureOffsetY;
    },
    set z(value) {
        this._z = value;
        this.updateZ();
        if (this._view) {
            this._entityCtrl.needDepthSort = true;
        }
    },
    get z() {
        return this._z;
    },
    updateZ: function() {
        var newZ = this._parent.totalZ + this._z + 1;
        if (this._view) {
            newZ += this._view._z;
        }
        if (this.totalZ === newZ) {
            return;
        }
        this.totalZ = newZ;
        if (this.children) {
            var numChildren = this.children.length;
            for (var i = 0; i < numChildren; i++) {
                this.children[i].updateZ();
            }
        }
    },
    set texture(texture) {
        if (typeof texture === "string") {
            if (this._texture && this._texture.name === texture) {
                return;
            }
            var textureName = texture;
            texture = meta.getTexture(textureName);
            if (!texture) {
                this._texture = textureName;
                meta.subscribe(this, Resource.Event.ALL_LOADED, this._onResAllLoaded);
                return;
            }
        } else if (this._texture === texture) {
            return;
        }
        if (this._texture instanceof Resource.Texture) {
            this._texture.unsubscribe(this);
        }
        if (texture) {
            if (!(texture instanceof Resource.Texture)) {
                console.warn("[Entity.Geometry.texture]:", "Texture should extend Resource.Texture class.");
                return null;
            }
            this._texture = texture;
            this._texture.subscribe(this, this._onTextureEvent);
            this.textureOffsetX = this._texture._offsetX;
            this.textureOffsetY = this._texture._offsetY;
            if (!this._texture._isLoaded) {
                this.isLoaded = false;
                if (!this._texture.isLoading) {
                    this._texture.load();
                }
            } else {
                this.isLoaded = true;
                this.updateFromTexture();
            }
            if (texture.isAnimated) {
                if (!this.isAnimating) {
                    this.isAnimating = texture.autoPlay;
                }
                if (texture.isEmulateReverse) {
                    this.isEmulateReverse = true;
                }
                this.isAnimReverse = texture.isAnimReverse;
            }
            return texture;
        } else {
            this._texture = null;
            this.isLoaded = false;
        }
    },
    get texture() {
        return this._texture;
    },
    set isNeedDraw(value) {
        if (!this._isLoaded) {
            return;
        }
        this._isNeedDraw = value;
        this._tChange = Date.now();
        meta.renderer.needRender = true;
    },
    get isNeedDraw() {
        return this._isNeedDraw;
    },
    updateStyle: function() {
        if (!this._style) {
            return;
        }
        this._style.update(this);
    },
    setState: function(name, texture, params) {
        if (texture) {
            if (!params) {
                params = {
                    texture: texture
                };
            }
        }
        if (!this._style) {
            name = "*";
            this._style = new meta.Style();
            this._styleParams = {};
        }
        this._style.setState(name, texture);
    },
    set style(style) {
        if (this._style) {
            for (var key in this._styleParams) {
                this[key] = this._styleParams[key];
            }
        }
        if (style instanceof meta.Style) {
            this._style = style;
        } else {
            this._style = new meta.Style(style);
        }
        if (style) {
            this.isNeedStyle = true;
        } else {
            this.isNeedStyle = false;
        }
    },
    get style() {
        return this._style;
    },
    set state(value) {
        if (!value) {
            value = "*";
        }
        if (this._state === value) {
            return;
        }
        this._state = value;
        this._onChange();
        this.onChange();
        if (this.chn) {
            this.chn.emit(Entity.Event.STATE_CHANGE, this);
        }
        if (this._style) {
            if (value === null) {
                this._styleState = null;
                this._styleAction = null;
                this.isNeedStyle = false;
                this.texture = null;
            } else {
                this.isNeedStyle = true;
            }
        }
    },
    set action(value) {
        if (this._action === value) {
            return;
        }
        this._action = value;
        if (this._style) {
            this._style.updateAction(this);
        }
    },
    get state() {
        return this._state;
    },
    get action() {
        return this._action;
    },
    updateAlpha: function() {
        var alpha;
        if (this._flags & this.Flag.IGNORE_PARENT_ALPHA) {
            alpha = this._alpha;
        } else {
            alpha = this._alpha * this._parent.totalAlpha;
        }
        if (this.totalAlpha === alpha) {
            return;
        }
        this.totalAlpha = alpha;
        if (this.children) {
            var numChildren = this.children.length;
            for (var i = 0; i < numChildren; i++) {
                var child = this.children[i];
                if (child._flag & this.Flag.IGNORE_PARENT_ALPHA) {
                    return;
                }
                child.updateAlpha();
            }
        }
        this._draw = this._drawTransform;
        this.isNeedDraw = true;
    },
    set alpha(value) {
        if (this._alpha === value) {
            return;
        }
        this._alpha = value;
        this.updateAlpha();
    },
    get alpha() {
        return this._alpha;
    },
    set ignoreParentAlpha(value) {
        this._flags |= this.Flag.IGNORE_PARENT_ALPHA;
    },
    get ignoreParentAlpha() {
        return this._flags & this.Flag.IGNORE_PARENT_ALPHA;
    },
    updateAngle: function() {
        var angleRad;
        if (this._flags & this.Flag.IGNORE_PARENT_ANGLE) {
            angleRad = this._angleRad;
        } else {
            angleRad = this._angleRad + this._parent.totalAngleRad;
        }
        if (angleRad === this.totalAngleRad) {
            return;
        }
        this.totalAngleRad = angleRad;
        if (this.children) {
            var numChildren = this.children.length;
            for (var i = 0; i < numChildren; i++) {
                var child = this.children[i];
                if (child._flags & this.Flag.IGNORE_PARENT_ANGLE) {
                    continue;
                }
                child.updateAngle();
            }
        }
        this._draw = this._drawTransform;
        this.isInside = this._isInsideTransform;
        this.isNeedDraw = true;
    },
    set angle(value) {
        value = meta.math.degToRad(value);
        if (this._angleRad === value) {
            return;
        }
        this._angleRad = value;
        this.updateAngle();
    },
    get angle() {
        return meta.math.radToDeg(this._angleRad);
    },
    set angleRad(value) {
        if (this._angleRad === value) {
            return;
        }
        this._angleRad = value;
        this.updateAngle();
    },
    get angleRad() {
        return this._angleRad;
    },
    set ignoreParentAngle(value) {
        this._flags |= this.Flag.IGNORE_PARENT_ANGLE;
    },
    get ignoreParentAngle() {
        return this._flags & this.Flag.IGNORE_PARENT_ANGLE;
    },
    updateScale: function() {
        var scaleX, scaleY;
        if (this._flags & this.Flag.IGNORE_PARENT_SCALE) {
            scaleX = this._scaleX;
            scaleY = this._scaleY;
        } else {
            scaleX = this._scaleX * this._parent.totalScaleX;
            scaleY = this._scaleY * this._parent.totalScaleY;
        }
        if (scaleX === this.totalScaleX && scaleY === this.totalScaleY) {
            return;
        }
        this.totalScaleX = scaleX;
        this.totalScaleY = scaleY;
        this.pivotX = this.pivotSrcX * scaleX;
        this.pivotY = this.pivotSrcY * scaleY;
        this.volume.scalePivoted(this.totalScaleX, this.totalScaleY, this.drawSrcX + this.pivotX, this.drawSrcY + this.pivotY);
        if (this.children) {
            var child;
            var numChildren = this.children.length;
            for (var i = 0; i < numChildren; i++) {
                child = this.children[i];
                if (child._flag & this.Flag.IGNORE_PARENT_SCALE) {
                    continue;
                }
                child.updateScale();
            }
        }
        this.updatePivot();
        this._draw = this._drawTransform;
        this.isInside = this._isInsideTransform;
        this.isNeedDraw = true;
    },
    scale: function(x, y) {
        y = y || x;
        this._scaleX = x;
        this._scaleY = y;
        this.updateScale();
        this.updatePos();
    },
    set scaleX(value) {
        this._scaleX = value;
        this.updateScale();
        this.updatePos();
    },
    set scaleY(value) {
        this._scaleY = value;
        this.updateScale();
        this.updatePos();
    },
    get scaleX() {
        return this._scaleX;
    },
    get scaleY() {
        return this._scaleY;
    },
    set ignoreParentScale(value) {
        this._flags |= this.Flag.IGNORE_PARENT_SCALE;
    },
    get ignoreParentScale() {
        return this._flags & this.Flag.IGNORE_PARENT_SCALE;
    },
    flip: function(x, y) {
        if (x === void 0 && y === void 0) {
            x = -this._flipX;
            y = this._flipY;
        } else {
            x = x !== void 0 ? x : 1;
            y = y !== void 0 ? y : 1;
        }
        x = x | 0;
        y = y | 0;
        if (x > 1) {
            x = 1;
        } else if (x < -1) {
            x = -1;
        } else if (x === 0) {
            x = 1;
        }
        if (y > 1) {
            y = 1;
        } else if (y < -1) {
            y = -1;
        } else if (y === 0) {
            y = 1;
        }
        if (x === this._flipX && y === this._flipY) {
            return;
        }
        this._flipX = x;
        this._flipY = y;
        this._draw = this._drawTransform;
        this.isInside = this._isInsideTransform;
        this.isNeedDraw = true;
    },
    set flipX(x) {
        this.flip(x, this._flipY);
    },
    set flipY(y) {
        this.flip(this._flipX, y);
    },
    get flipX() {
        return this._flipX;
    },
    get flipY() {
        return this._flipY;
    },
    set visible(value) {
        if (this.isVisible === value) {
            return;
        }
        this.isVisible = value;
        this._entityCtrl.isNeedRender = true;
        if (this.children) {
            var numChildren = this.children.length;
            for (var i = 0; i < numChildren; i++) {
                this.children[i].visible = value;
            }
        }
    },
    get visible() {
        return this.isVisible;
    },
    set isLoaded(value) {
        if (this._isLoaded === value) {
            return;
        }
        this._isLoaded = value;
        if (value) {
            if (this.ready) {
                this.ready();
            }
            var i, num;
            if (this.components) {
                var comp;
                num = this.components.length;
                for (i = 0; i < num; i++) {
                    comp = this.components[i];
                    if (comp.ready) {
                        comp.ready();
                    }
                }
            }
            if (this.children) {
                num = this.children.length;
                for (i = 0; i < num; i++) {
                    this.children[i]._onResize(this);
                }
            }
        }
    },
    get isLoaded() {
        return this._isLoaded;
    },
    set isUpdating(value) {
        if (this._isUpdating === value) {
            return;
        }
        this._isUpdating = value;
        if (value) {
            this._entityCtrl._addToUpdating(this);
        } else {
            this._entityCtrl._removeFromUpdating(this);
        }
    },
    get isUpdating() {
        return this._isUpdating;
    },
    set currFrame(index) {
        if (!this._texture) {
            this._currFrame = index;
        } else {
            var frame = index % this._texture.numFrames;
            if (frame === this._currFrame) {
                return;
            }
            this._currFrame = frame;
            this.isNeedDraw = true;
        }
    },
    get currFrame() {
        return this._currFrame;
    },
    set isAnimReverse(value) {
        this._isAnimReverse = value;
        if (value && this._texture) {
            this.currFrame = this._texture.numFrames - 1;
        } else {
            this.currFrame = 0;
        }
    },
    get isAnimReverse() {
        return this._isAnimReverse;
    },
    set tween(obj) {
        if (!this._tweenCache) {
            this._tweenCache = new meta.Tween.Cache(this);
        }
        if (obj instanceof meta.Tween.Link) {
            this._tweenCache.tween = obj.tween;
        } else if (obj instanceof meta.Tween) {
            this._tweenCache.tween = obj;
        } else {
            console.warn("[Entity.Geometry.set::tween]:", "Ivalid object! Should be meta.Tween or meta.Tween.Link object.");
            return;
        }
        var tween = this._tweenCache.tween;
        if (tween.autoPlay) {
            tween.cache = this._tweenCache;
            tween.play();
        }
    },
    get tween() {
        if (!this._tweenCache) {
            this._tweenCache = new meta.Tween.Cache(this);
            this._tweenCache.tween = new meta.Tween();
        }
        this._tweenCache.tween.cache = this._tweenCache;
        return this._tweenCache.tween;
    },
    _onResize: function(data) {
        if (this.onResize) {
            this.onResize(data);
        }
        if (this._flags & this.Flag.ANCHOR) {
            this._onResize_anchor(data);
        }
    },
    onResize: null,
    _onResize_anchor: function() {
        this.updateAnchor();
    },
    set isCached(value) {
        if (this._isCached === value) {
            return;
        }
    },
    get isCached() {
        return this._isCached;
    },
    click: function() {
        var inputEvent = Input.ctrl.getEvent();
        this._onClick(inputEvent);
        this.onClick(inputEvent);
    },
    set hover(value) {
        var inputEvent = Input.ctrl.getEvent();
        if (value) {
            if ((this._inputFlags & this.InputFlag.HOVER) === 0) {
                this._inputFlags |= this.InputFlag.HOVER;
                this._onHoverEnter(inputEvent);
                this.onHoverEnter(inputEvent);
            } else {
                this._onHover(inputEvent);
                this.onHover(inputEvent);
            }
        } else {
            this._inputFlags &= ~this.InputFlag.HOVER;
            this._onHoverExit(inputEvent);
            this.onHoverExit(inputEvent);
        }
    },
    set pressed(value) {
        if (!!(this._inputFlags & this.InputFlag.PRESSED) === value) {
            return;
        }
        var inputEvent = Input.ctrl.getEvent();
        if (value) {
            this._inputFlags |= this.InputFlag.PRESSED;
            this._onDown(inputEvent);
            this.onDown(inputEvent);
        } else {
            this._inputFlags &= ~this.InputFlag.PRESSED;
            this._onUp(inputEvent);
            this.onUp(inputEvent);
        }
    },
    set dragged(value) {
        var inputEvent = Input.ctrl.getEvent();
        if (value) {
            if ((this._inputFlags & this.InputFlag.DRAGGED) === 0) {
                this._inputFlags |= this.InputFlag.DRAGGED;
                this._onDragStart(inputEvent);
                this.onDragStart(inputEvent);
            } else {
                this._onDrag(inputEvent);
                this.onDrag(inputEvent);
            }
        } else {
            this._inputFlags &= ~this.InputFlag.DRAGGED;
            this._onDragEnd(inputEvent);
            this.onDragEnd(inputEvent);
        }
    },
    get hover() {
        return !!(this._inputFlags & this.InputFlag.HOVER);
    },
    get pressed() {
        return !!(this._inputFlags & this.InputFlag.PRESSED);
    },
    get dragged() {
        return !!(this._inputFlags & this.InputFlag.DRAGGED);
    },
    set ignoreZoom(value) {
        if (!!(this._flags & this.Flag.IGNORE_ZOOM) === value) {
            return;
        }
        if (this._flags & this.Flag.ANCHOR) {
            this.updateAnchor();
        }
        if (value) {
            this._flags |= this.Flag.IGNORE_ZOOM;
        } else {
            this._flags &= ~this.Flag.IGNORE_ZOOM;
        }
        this.isNeedDraw = true;
    },
    get ignoreZoom() {
        return !!(this._flags & this.Flag.IGNORE_ZOOM);
    },
    set showBounds(value) {
        if (!!(this._flags & this.Flag.SHOW_BOUNDS) === value) {
            return;
        }
        if (value) {
            this._flags |= this.Flag.SHOW_BOUNDS;
            this._entityCtrl._addToDrawBounds();
        } else {
            this._flags &= ~this.Flag.SHOW_BOUNDS;
            this._entityCtrl._removeToDrawBounds();
        }
    },
    get showBounds() {
        return !!(this._flags & this.Flag.SHOW_BOUNDS);
    },
    set disableDebug(value) {
        if (!!(this._flags & this.Flag.DISABLE_DEBUG) === value) {
            return;
        }
        if (value) {
            this._flags |= this.Flag.DISABLE_DEBUG;
        } else {
            this._flags &= ~this.Flag.DISABLE_DEBUG;
        }
        this.isNeedDraw = true;
    },
    get disableDebug() {
        return !!(this._flags & this.Flag.DISABLE_DEBUG);
    },
    set cursor(value) {
        meta.engine.cursor = value;
    },
    get cursor() {
        return meta.engine.cursor;
    },
    Flag: {
        ADDED: 2,
        REMOVED: 4,
        ANCHOR: 128,
        IGNORE_ZOOM: 256,
        IGNORE_PARENT_ANGLE: 512,
        IGNORE_PARENT_SCALE: 1024,
        IGNORE_PARENT_ALPHA: 2048,
        SHOW_BOUNDS: 4096,
        DISABLE_DEBUG: 16384
    },
    InputFlag: {
        HOVER: 1,
        PRESSED: 2,
        DRAGGED: 4
    },
    Core: function() {
        this.viewIndex = -1;
    },
    meta: meta,
    core: null,
    x: 0,
    y: 0,
    _entityCtrl: null,
    _tmpX: 0,
    _tmpY: 0,
    id: -1,
    type: 0,
    name: "unknown",
    _parent: null,
    _view: null,
    _checkID: -1,
    _updateNodeID: -1,
    _updateAnimNodeID: -1,
    _removeFlag: 0,
    _flags: 0,
    _inputFlags: 0,
    chn: null,
    _z: 0,
    totalZ: 0,
    typeX: 0,
    typeY: 0,
    _anchorX: 0,
    _anchorY: 0,
    _anchorPosX: 0,
    _anchorPosY: 0,
    _dragOffsetX: 0,
    _dragOffsetY: 0,
    drawX: 0,
    drawY: 0,
    drawSrcX: 0,
    drawSrcY: 0,
    _offsetX: 0,
    _offsetY: 0,
    textureOffsetX: 0,
    textureOffsetY: 0,
    pivotX: 0,
    pivotY: 0,
    pivotRatioX: 0,
    pivotRatioY: 0,
    pivotSrcX: 0,
    pivotSrcY: 0,
    childOffsetX: 0,
    childOffsetY: 0,
    childPivotX: 0,
    childPivotY: 0,
    _cellIndex: 0,
    _style: null,
    _styleState: null,
    _styleAction: null,
    _styleParams: null,
    _styleActionParams: null,
    _state: "*",
    _action: "",
    _tweenCache: null,
    volume: null,
    clipVolume: null,
    positionType: 0,
    _angleRad: 0,
    _scaleX: 1,
    _scaleY: 1,
    _flipX: 1,
    _flipY: 1,
    _alpha: 1,
    totalAngleRad: 0,
    totalScaleX: 1,
    totalScaleY: 1,
    totalAlpha: 1,
    _texture: null,
    vbo: null,
    vertices: null,
    components: null,
    children: null,
    pickable: true,
    clickable: true,
    fps: 0,
    animSpeed: 1,
    _currFrame: 0,
    isAnimating: false,
    isLoop: false,
    _isAnimReverse: false,
    isEmulateReverse: false,
    _tAnim: 0,
    pauseAtEnd: false,
    _tChange: 0,
    isAdded: false,
    _isLoaded: false,
    isVisible: true,
    isPaused: false,
    isChild: false,
    isRemoved: false,
    _isUpdating: false,
    _isNeedDraw: false,
    isNeedStyle: false,
    _isNeedOffset: false,
    _cacheIndex: -1,
    _isHighlight: false,
    __transformed: false,
    body: null
});

Entity.New = meta.Class.extend({
    init: function(texture) {
        this.volume = new meta.math.AABB(0, 0, 0, 0);
        this.texture = texture;
    },
    position: function(x, y) {
        this.volume.set(x, y);
    },
    move: function(x, y) {
        this.volume.set(this.volume.x + x, this.volume.y + y);
    },
    set x(x) {
        this.volume.set(x, this.volume.y);
    },
    set y(y) {
        this.volume.set(this.volume.x, y);
    },
    get x() {
        return this.volume.x;
    },
    get y() {
        return this.volume.y;
    },
    get left() {
        return this.volume.minX;
    },
    get right() {
        return this.volume.maxY;
    },
    get top() {
        return this.volume.minY;
    },
    get bottom() {
        return this.volume.maxY;
    },
    pivot: function(x, y) {
        this.volume.pivot(x, y);
    },
    set pivotX(x) {
        this.volume.pivot(x, this._pivotY);
    },
    set pivotY(y) {
        this.volume.pivot(this._pivotX, y);
    },
    get pivotX() {
        return this.volume.pivotX;
    },
    get pivotY() {
        return this.volume.pivotY;
    },
    onTextureEvent: function(data, event) {
        var resEvent = Resource.Event;
        if (event === resEvent.LOADED) {
            this.loaded = true;
        } else if (event === resEvent.UNLOADED) {
            this.loaded = false;
        }
        this.updateFromTexture();
    },
    updateFromTexture: function() {
        if (this._texture) {
            this.volume.resize(this._texture.width, this._texture.height);
        } else {
            this.volume.resize(0, 0);
        }
    },
    set texture(tex) {
        if (this._texture) {
            this._texture.unsubscribe(this);
        }
        this._texture = tex;
        if (tex) {
            tex.subscribe(this, this.onTextureEvent);
            if (tex._loaded) {
                this.updateFromTexture();
                this.loaded = true;
            }
        } else {
            this.loaded = false;
        }
    },
    get texture() {
        return this._texture;
    },
    set needRender(value) {
        this._needRender = value;
        if (value) {
            meta.renderer.needRender = true;
        }
    },
    get needRender() {
        return this._needRender;
    },
    _x: 0,
    _y: 0,
    _scaleX: 1,
    _scaleY: 1,
    _texture: null,
    loaded: true,
    _body: null,
    __type: 0
});

"use strict";

Entity.Text = Entity.Geometry.extend({
    init: function(params) {
        this.texture = new Resource.Texture();
        this._texture.resize(this._fontSize, this._fontSize);
        var type = typeof params;
        if (type === "string" || type === "number") {
            this.setText(params);
        } else {
            this.setText("");
        }
    },
    _initParams: function(params) {},
    setText: function(text) {
        this._text = text;
        var ctx;
        if (this._texture.textureType === Resource.TextureType.WEBGL) {
            ctx = this._texture._tmpCtx;
        } else {
            ctx = this._texture.ctx;
        }
        ctx.font = this._style + " " + this._fontSizePx + " " + this._font;
        var metrics = ctx.measureText(this._text);
        var width = metrics.width + this.outlineWidth * 2;
        this.resize(width, this._fontSize * 1.2);
        if (this._texture.textureType === Resource.TextureType.WEBGL) {
            this._texture._tmpImg.width = width;
            this._texture._tmpImg.height = this._fontSize * 1.2;
        }
        ctx.clearRect(0, 0, this.volume.width, this.volume.height);
        ctx.font = this._style + " " + this._fontSizePx + " " + this._font;
        ctx.fillStyle = this._color;
        ctx.textBaseline = "top";
        ctx.fillText(text, this.outlineWidth, 0);
        if (this.isOutline) {
            ctx.lineWidth = this._outlineWidth;
            ctx.strokeStyle = this._outlineColor;
            ctx.strokeText(text, this.outlineWidth, 0);
        }
        if (this._texture.textureType === Resource.TextureType.WEBGL) {
            var gl = meta.ctx;
            gl.bindTexture(gl.TEXTURE_2D, this._texture.image);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._texture._tmpImg);
        }
        if (!this._texture._isLoaded) {
            this._texture.isLoaded = true;
        }
        this.isNeedDraw = true;
    },
    resize: function(width, height) {
        width = width || 1;
        height = height || this.volume.height;
        this._texture.resize(width, height);
    },
    setFont: function(font) {
        this._font = font;
        this.setText(this._text);
    },
    setSize: function(size) {
        this._fontSize = size;
        this._fontSizePx = size + "px";
        this.setText(this._text);
    },
    setColor: function(color) {
        this._color = color;
        this.setText(this._text);
    },
    setOutlineColor: function(color) {
        this._outlineColor = color;
        this.isOutline = true;
    },
    setOutlineWidth: function(width) {
        this._outlineWidth = width;
        if (this._isOutline) {
            this.setText(this._text);
        }
    },
    setStyle: function(style) {
        this._style = style;
        this.setText(this._text);
    },
    set text(text) {
        this.setText(text);
    },
    get text() {
        return this._text;
    },
    set font(font) {
        this.setFont(font);
    },
    get font() {
        return this._font;
    },
    set size(size) {
        this.setSize(size);
    },
    get size() {
        return this._fontSize;
    },
    set color(color) {
        this.setColor(color);
    },
    get color() {
        return this._color;
    },
    set outlineColor(color) {
        this.setOutlineColor(color);
    },
    get outlineColor() {
        return this._outlineColor;
    },
    set outlineWidth(width) {
        this.setOutlineWidth(width);
    },
    get outlineWidth() {
        return this._outlineWidth;
    },
    set style(style) {
        this.setStyle(style);
    },
    get style() {
        return this._style;
    },
    set isOutline(value) {
        if (this._isOutline === value) {
            return;
        }
        this._isOutline = value;
        this.setText(this._text);
    },
    get isOutline() {
        return this._isOutline;
    },
    _text: "",
    _font: "Verdana",
    _fontSize: 14,
    _fontSizePx: "14px",
    _color: "#000000",
    _outlineColor: "#ffffff",
    _outlineWidth: 1,
    _style: "",
    _isOutline: false
});

"use strict";

window.Input = {};

Input.Controller = meta.Controller.extend({
    init: function() {
        this.engine = meta.engine;
        this.keys = new Array(this.numKeys);
        this.inputs = new Array(this.numInputs);
        this.touches = [];
        this._event = {
            event: null,
            x: 0,
            y: 0,
            prevScreenX: 0,
            prevScreenY: 0,
            screenX: 0,
            screenY: 0,
            keyCode: 0,
            entity: null
        };
        this.addEventListeners();
        this._loadIgnoreKeys();
        meta.subscribe(this, meta.Event.FOCUS, this.onFocus);
    },
    release: function() {
        this.removeEventListeners();
        meta.unsubscribe(this, meta.Event.FOCUS, this.onFocus);
    },
    onKeyDown: function(event) {
        if (window.top && this._iFrameKeys[event.keyCode]) {
            event.preventDefault();
        }
        if (this._cmdKeys[event.keyCode] !== void 0) {
            this._numCmdKeys++;
        }
        if (this._ignoreKeys[event.keyCode] !== void 0 && this._numCmdKeys <= 0) {
            event.preventDefault();
        }
        if (this.blockInput) {
            return;
        }
        if (this.isStickyKeys && this.keys[event.keyCode]) {
            return;
        }
        this.keys[event.keyCode] = true;
        this._event.event = event;
        this._event.prevScreenX = 0;
        this._event.prevScreenY = 0;
        this._event.screenX = 0;
        this._event.screenY = 0;
        this._event.x = 0;
        this._event.y = 0;
        this._event.keyCode = event.keyCode;
        this._chnKeyDown.emit(this._event, Input.Event.KEY_DOWN);
        if (this._callbacks && this._callbacks[event.keyCode]) {
            var cbs = this._callbacks[event.keyCode];
            var numCbs = cbs.length;
            for (var i = 0; i < numCbs; i++) {
                cbs[i]();
            }
        }
        if (this.keyRepeat) {
            if (!this._inputTimer) {
                var self = this;
                this._inputTimer = meta.addTimer(this, function() {
                    self._event.keyCode = self._repeatKey;
                    self._chnKeyDown.emit(self._event, Input.Event.KEY_DOWN);
                }, this.keyRepeat);
            }
            this._repeatKey = event.keyCode;
            this._inputTimer.resume();
            this._inputTimer.tAccumulator = 0;
        }
    },
    onKeyUp: function(event) {
        if (window.top && this._iFrameKeys[event.keyCode]) {
            event.preventDefault();
        }
        if (this._cmdKeys[event.keyCode] !== void 0 && this.keys[event.keyCode]) {
            this._numCmdKeys--;
        }
        if (this._ignoreKeys[event.keyCode] === void 0 && this._numCmdKeys <= 0) {
            event.preventDefault();
        }
        if (this.blockInput) {
            return;
        }
        this.keys[event.keyCode] = false;
        this._event.event = event;
        this._event.prevScreenX = 0;
        this._event.prevScreenY = 0;
        this._event.prevX = 0;
        this._event.prevY = 0;
        this._event.x = 0;
        this._event.y = 0;
        this._event.keyCode = event.keyCode;
        this._chnKeyUp.emit(this._event, Input.Event.KEY_UP);
        if (this.keyRepeat && this._inputTimer) {
            this._inputTimer.pause();
        }
    },
    onMouseDown: function(event) {
        if (this.blockInput) {
            return;
        }
        this.inputs[event.button] = true;
        var scope = meta;
        var camera = scope.camera;
        var screenX = (event.pageX - this.engine.offsetLeft) * this.engine.scaleX * window.devicePixelRatio;
        var screenY = (event.pageY - this.engine.offsetTop) * this.engine.scaleY * window.devicePixelRatio;
        var x = screenX * camera.zoomRatio - camera._x | 0;
        var y = screenY * camera.zoomRatio - camera._y | 0;
        this._event.event = event;
        this._event.prevScreenX = screenX;
        this._event.prevScreenY = screenY;
        this._event.screenX = screenX;
        this._event.screenY = screenY;
        this._event.x = x;
        this._event.y = y;
        this._event.keyCode = event.button;
        this._chnInputDown.emit(this._event, Input.Event.DOWN);
        this._event.entity = null;
    },
    onMouseUp: function(event) {
        if (this.blockInput) {
            return;
        }
        this.inputs[event.button] = false;
        var scope = meta;
        var camera = scope.camera;
        var screenX = (event.pageX - this.engine.offsetLeft) * this.engine.scaleX * window.devicePixelRatio;
        var screenY = (event.pageY - this.engine.offsetTop) * this.engine.scaleY * window.devicePixelRatio;
        var x = screenX * camera.zoomRatio - camera._x | 0;
        var y = screenY * camera.zoomRatio - camera._y | 0;
        this._event.event = event;
        this._event.prevScreenX = this._event.screenX;
        this._event.prevScreenY = this._event.screenY;
        this._event.screenX = screenX;
        this._event.screenY = screenY;
        this._event.x = x;
        this._event.y = y;
        this._event.keyCode = event.button;
        this._chnInputUp.emit(this._event, Input.Event.UP);
        this._chnInputClick.emit(this._event, Input.Event.CLICK);
        this._event.entity = null;
    },
    onMouseMove: function(event) {
        event.preventDefault();
        if (this.blockInput) {
            return;
        }
        var scope = meta;
        var camera = scope.camera;
        var screenX = (event.pageX - this.engine.offsetLeft) * this.engine.scaleX * window.devicePixelRatio;
        var screenY = (event.pageY - this.engine.offsetTop) * this.engine.scaleY * window.devicePixelRatio;
        var x = screenX * camera.zoomRatio - camera._x | 0;
        var y = screenY * camera.zoomRatio - camera._y | 0;
        this._event.event = event;
        this._event.prevScreenX = this._event.screenX;
        this._event.prevScreenY = this._event.screenY;
        this._event.screenX = screenX;
        this._event.screenY = screenY;
        this._event.x = x;
        this._event.y = y;
        this._event.keyCode = -1;
        this.inputX = x;
        this.inputY = y;
        this._chnInputMove.emit(this._event, Input.Event.MOVE);
        this._event.entity = null;
    },
    onMouseDbClick: function(event) {
        if (this.blockInput) {
            return;
        }
        this.inputs[event.button] = false;
        var scope = meta;
        var camera = scope.camera;
        var screenX = (event.pageX - this.engine.offsetLeft) * this.engine.scaleX * window.devicePixelRatio;
        var screenY = (event.pageY - this.engine.offsetTop) * this.engine.scaleY * window.devicePixelRatio;
        var x = screenX * camera.zoomRatio - camera._x | 0;
        var y = screenY * camera.zoomRatio - camera._y | 0;
        this._event.event = event;
        this._event.prevScreenX = this._event.screenX;
        this._event.prevScreenY = this._event.screenY;
        this._event.screenX = screenX;
        this._event.screenY = screenY;
        this._event.x = x;
        this._event.y = y;
        this._event.keyCode = event.button;
        this._chnInputDbClick.emit(this._event, Input.Event.DBCLICK);
        this._event.entity = null;
    },
    onTouchDown: function(event) {
        event.preventDefault();
        var scope = meta;
        var camera = scope.camera;
        var touch, screenX, screenY, x, y;
        var changedTouches = event.changedTouches;
        var numTouches = changedTouches.length;
        for (var i = 0; i < numTouches; i++) {
            touch = event.changedTouches[i];
            this.touches.push(touch.identifier);
            this.numTouches++;
            screenX = (touch.pageX - this.engine.offsetLeft) * this.engine.scaleX * window.devicePixelRatio;
            screenY = (touch.pageY - this.engine.offsetTop) * this.engine.scaleY * window.devicePixelRatio;
            x = screenX * camera.zoomRatio - camera._x | 0;
            y = screenY * camera.zoomRatio - camera._y | 0;
            this._event.event = event;
            this._event.prevScreenX = screenX;
            this._event.prevScreenY = screenY;
            this._event.screenX = screenX;
            this._event.screenY = screenY;
            this._event.x = x;
            this._event.y = y;
            this._event.keyCode = this.numTouches - 1;
            this._chnInputDown.emit(this._event, Input.Event.DOWN);
            this._event.entity = null;
        }
    },
    onTouchUp: function(event) {
        event.preventDefault();
        var scope = meta;
        var camera = scope.camera;
        var touch, id, screenX, screenY, x, y;
        var changedTouches = event.changedTouches;
        var numTouches = changedTouches.length;
        for (var i = 0; i < numTouches; i++) {
            touch = event.changedTouches[i];
            id = this._getTouchID(touch.identifier);
            if (id === -1) {
                continue;
            }
            this.touches.splice(id, 1);
            this.numTouches--;
            screenX = (touch.pageX - this.engine.offsetLeft) * this.engine.scaleX * window.devicePixelRatio;
            screenY = (touch.pageY - this.engine.offsetTop) * this.engine.scaleY * window.devicePixelRatio;
            x = screenX * camera.zoomRatio - camera._x | 0;
            y = screenY * camera.zoomRatio - camera._y | 0;
            this._event.event = event;
            if (id === 0) {
                this._event.prevScreenX = this._event.screenX;
                this._event.prevScreenY = this._event.screenY;
            } else {
                this._event.prevScreenX = screenX;
                this._event.prevScreenY = screenY;
            }
            this._event.screenX = screenX;
            this._event.screenY = screenY;
            this._event.x = x;
            this._event.y = y;
            this._event.keyCode = id;
            this._chnInputDown.emit(this._event, Input.Event.UP);
            this._chnInputClick.emit(this._event, Input.Event.CLICK);
            this._event.entity = null;
        }
    },
    onTouchMove: function(event) {
        event.preventDefault();
        var scope = meta;
        var camera = scope.camera;
        var touch, id, screenX, screenY, x, y;
        var changedTouches = event.changedTouches;
        var numTouches = changedTouches.length;
        for (var i = 0; i < numTouches; i++) {
            touch = event.changedTouches[i];
            id = this._getTouchID(touch.identifier);
            if (id === -1) {
                continue;
            }
            screenX = (touch.pageX - this.engine.offsetLeft) * this.engine.scaleX * window.devicePixelRatio;
            screenY = (touch.pageY - this.engine.offsetTop) * this.engine.scaleY * window.devicePixelRatio;
            x = screenX * camera.zoomRatio - camera._x | 0;
            y = screenY * camera.zoomRatio - camera._y | 0;
            this._event.event = event;
            if (id === 0) {
                this._event.prevScreenX = this._event.screenX;
                this._event.prevScreenY = this._event.screenY;
                this.inputX = x;
                this.inputY = y;
            } else {
                this._event.prevScreenX = screenX;
                this._event.prevScreenY = screenY;
            }
            this._event.screenX = screenX;
            this._event.screenY = screenY;
            this._event.x = x;
            this._event.y = y;
            this._event.keyCode = id;
            this._chnInputMove.emit(this._event, Input.Event.MOVE);
            this._event.entity = null;
        }
    },
    onFocus: function(event, data) {
        if (data === false) {
            this.resetInput();
        }
    },
    isDown: function(keyCode) {
        return this.keys[keyCode];
    },
    isInputDown: function(keyCode) {
        return this.inputs[keyCode];
    },
    addEventListeners: function() {
        var self = this;
        this._chnKeyDown = meta.createChannel(Input.Event.KEY_DOWN);
        this._chnKeyUp = meta.createChannel(Input.Event.KEY_UP);
        this._chnInputDown = meta.createChannel(Input.Event.DOWN);
        this._chnInputUp = meta.createChannel(Input.Event.UP);
        this._chnInputMove = meta.createChannel(Input.Event.MOVE);
        this._chnInputClick = meta.createChannel(Input.Event.CLICK);
        this._chnInputDbClick = meta.createChannel(Input.Event.DBCLICK);
        this._onKeyDown = function(event) {
            self.onKeyDown(event);
        };
        this._onKeyUp = function(event) {
            self.onKeyUp(event);
        };
        this._onMouseDown = function(event) {
            self.onMouseDown(event);
        };
        this._onMouseUp = function(event) {
            self.onMouseUp(event);
        };
        this._onMouseDbClick = function(event) {
            self.onMouseDbClick(event);
        };
        this._onMouseMove = function(event) {
            self.onMouseMove(event);
        };
        this._onTouchDown = function(event) {
            self.onTouchDown(event);
        };
        this._onTouchUp = function(event) {
            self.onTouchUp(event);
        };
        this._onTouchMove = function(event) {
            self.onTouchMove(event);
        };
        this._onTouchCancel = function(event) {
            self.onTouchCancel(event);
        };
        window.addEventListener("mousedown", this._onMouseDown);
        window.addEventListener("mouseup", this._onMouseUp);
        window.addEventListener("mousemove", this._onMouseMove);
        window.addEventListener("dblclick", this._onMouseDbClick);
        window.addEventListener("touchstart", this._onTouchDown);
        window.addEventListener("touchend", this._onTouchUp);
        window.addEventListener("touchmove", this._onTouchMove);
        window.addEventListener("touchcancel", this._onTouchUp);
        window.addEventListener("touchleave", this._onTouchUp);
        if (meta.device.support.onkeydown) {
            window.addEventListener("keydown", this._onKeyDown);
        }
        if (meta.device.support.onkeyup) {
            window.addEventListener("keyup", this._onKeyUp);
        }
    },
    removeEventListeners: function() {
        window.removeEventListener("mousedown", this._onMouseDown);
        window.removeEventListener("mouseup", this._onMouseUp);
        window.removeEventListener("mousemove", this._onMouseMove);
        window.removeEventListener("dblclick", this._onMouseDbClick);
        window.removeEventListener("touchstart", this._onTouchDown);
        window.removeEventListener("touchend", this._onTouchUp);
        window.removeEventListener("touchmove", this._onTouchMove);
        window.removeEventListener("touchcancel", this._onTouchUp);
        window.removeEventListener("touchleave", this._onTouchUp);
        if (meta.device.support.onkeydown) {
            window.removeEventListener("keydown", this._onKeyDown);
        }
        if (meta.device.support.onkeyup) {
            window.removeEventListener("keyup", this._onKeyUp);
        }
    },
    resetInput: function() {
        var i;
        this._event.event = null;
        this._event.prevX = 0;
        this._event.prevY = 0;
        this._event.x = 0;
        this._event.y = 0;
        this._event.keyCode = 0;
        for (i = 0; i < this.numKeys; i++) {
            if (this.keys[i]) {
                this.keys[i] = false;
                this._event.keyCode = i;
                this._chnKeyUp.emit(this._event, Input.Event.KEYUP);
            }
        }
        for (i = 0; i < this.numInputs; i++) {
            if (this.inputs[i]) {
                this.inputs[i] = false;
                this._event.keyCode = i;
                this._chnInputUp.emit(this._event, Input.Event.UP);
            }
        }
        this._numCmdKeys = 0;
        if (this.numTouches) {
            for (i = 0; i < this.numTouches; i++) {
                this._event.keyCode = i;
                this._chnInputUp.emit(this._event, Input.Event.UP);
            }
            this.touches.length = 0;
            this.numTouches = 0;
        }
    },
    onKey: function(key, cb) {
        if (!this._callbacks) {
            this._callbacks = {};
            this._callbacks[key] = [ cb ];
        } else {
            if (!this._callbacks[key]) {
                this._callbacks[key] = [ cb ];
            } else {
                this._callbacks[key].push(cb);
            }
        }
    },
    getEvent: function() {
        this._event.event = null;
        this._event.prevScreenX = this._event.screenX;
        this._event.prevScreenY = this._event.screenY;
        this._event.screenX = this.screenX;
        this._event.screenY = this.screenY;
        this._event.x = this.inputX;
        this._event.y = this.inputY;
        this._event.keyCode = -1;
        return this._event;
    },
    _loadIgnoreKeys: function() {
        this._ignoreKeys = [];
        this._ignoreKeys[8] = 1;
        this._ignoreKeys[9] = 1;
        this._ignoreKeys[13] = 1;
        this._ignoreKeys[17] = 1;
        this._ignoreKeys[91] = 1;
        this._ignoreKeys[38] = 1;
        this._ignoreKeys[39] = 1;
        this._ignoreKeys[40] = 1;
        this._ignoreKeys[37] = 1;
        this._ignoreKeys[112] = 1;
        this._ignoreKeys[113] = 1;
        this._ignoreKeys[114] = 1;
        this._ignoreKeys[115] = 1;
        this._ignoreKeys[116] = 1;
        this._ignoreKeys[117] = 1;
        this._ignoreKeys[118] = 1;
        this._ignoreKeys[119] = 1;
        this._ignoreKeys[120] = 1;
        this._ignoreKeys[121] = 1;
        this._ignoreKeys[122] = 1;
        this._ignoreKeys[123] = 1;
        this._ignoreKeys[124] = 1;
        this._ignoreKeys[125] = 1;
        this._ignoreKeys[126] = 1;
        this._cmdKeys = [];
        this._cmdKeys[91] = 1;
        this._cmdKeys[17] = 1;
        this._iFrameKeys = [];
        this._iFrameKeys[37] = 1;
        this._iFrameKeys[38] = 1;
        this._iFrameKeys[39] = 1;
        this._iFrameKeys[40] = 1;
    },
    _getTouchID: function(eventTouchID) {
        for (var i = 0; i < this.numTouches; i++) {
            if (this.touches[i] === eventTouchID) {
                return i;
            }
        }
        return -1;
    },
    engine: null,
    keys: null,
    inputs: null,
    touches: null,
    blockInput: false,
    isStickyKeys: true,
    keyRepeat: 0,
    _inputTimer: null,
    _repeatKey: 0,
    numKeys: 256,
    numInputs: 10,
    numTouches: 0,
    inputX: 0,
    inputY: 0,
    _event: null,
    _onKeyDown: null,
    _onKeyUp: null,
    _onMouseDown: null,
    _onMouseUp: null,
    _onMouseMove: null,
    _onMouseDbClick: null,
    _onTouchDown: null,
    _onTouchUp: null,
    _onTouchMove: null,
    _onTouchCancel: null,
    _chnKeyDown: null,
    _chnKeyUp: null,
    _chnInputDown: null,
    _chnInputUp: null,
    _chnInputMove: null,
    _chnInputDbClick: null,
    _ignoreKeys: null,
    _cmdKeys: null,
    _iFrameKeys: null,
    _numCmdKeys: 0,
    _callbacks: null
});

"use strict";

Input.Event = {
    KEY_DOWN: "keydown",
    KEY_UP: "keyup",
    DOWN: "down",
    UP: "up",
    MOVE: "move",
    CLICK: "click",
    DBCLICK: "dbclick"
};

Input.Key = {
    A: 65,
    B: 66,
    C: 67,
    D: 68,
    E: 69,
    F: 70,
    G: 71,
    H: 72,
    I: 73,
    J: 74,
    K: 75,
    L: 76,
    M: 77,
    N: 78,
    O: 79,
    P: 80,
    Q: 81,
    R: 82,
    S: 83,
    T: 84,
    U: 85,
    V: 86,
    W: 87,
    X: 88,
    Y: 89,
    Z: 90,
    "[": 91,
    BACKSPACE: 8,
    TAB: 9,
    ENTER: 13,
    SHIFT: 16,
    ESC: 27,
    SPACE: 32,
    NUM_0: 48,
    NUM_1: 49,
    NUM_2: 50,
    NUM_3: 51,
    NUM_4: 52,
    NUM_5: 53,
    NUM_6: 54,
    NUM_7: 55,
    NUM_8: 56,
    NUM_9: 57,
    DELETE: 127,
    PLUS: 187,
    MINUS: 189,
    ARROW_LEFT: 37,
    ARROW_UP: 38,
    ARROW_RIGHT: 39,
    ARROW_DOWN: 40,
    BUTTON_LEFT: 0,
    BUTTON_MIDDLE: 1,
    BUTTON_RIGHT: 2
};

"use strict";

var Physics = {};

Physics.Manifold = function() {
    this.a = null;
    this.b = null;
    this.normal = new meta.math.Vector2(0, 0);
    this.penetration = 0;
};

Physics.Controller = meta.Controller.extend({
    update: function(tDelta) {
        var item, item2, n, result;
        var numItems = this.items.length;
        for (var i = 0; i < numItems; i++) {
            item = this.items[i];
            item.updateItem(tDelta, this.manifold);
            if (!item.owner.visible) {
                continue;
            }
            for (n = i + 1; n < numItems; n++) {
                item2 = this.items[n];
                if (!item2.owner.visible) {
                    continue;
                }
                if (item.flag === item2.flag) {
                    continue;
                }
                result = this.overlapAABB(item.volume, item2.volume);
                if (result) {
                    if (item.owner.onCollision) {
                        this.manifold.a = item.owner;
                        this.manifold.b = item2.owner;
                        item.owner.onCollision(this.manifold);
                    }
                    if (item2.owner.onCollision) {
                        this.manifold.a = item2.owner;
                        this.manifold.b = item.owner;
                        item2.owner.onCollision(this.manifold);
                    }
                }
            }
        }
    },
    overlapAABB: function(a, b) {
        var diffX = b.minX - a.minX;
        var diffY = b.minY - a.minY;
        var extentA = (a.maxX - a.minX) / 2;
        var extentB = (b.maxX - b.minX) / 2;
        var overlapX = extentA + extentB - Math.abs(diffX);
        if (overlapX > 0) {
            extentA = (a.maxY - a.minY) / 2;
            extentB = (b.maxY - b.minY) / 2;
            var overlapY = extentA + extentB - Math.abs(diffY);
            if (overlapY > 0) {
                if (overlapX < overlapY) {
                    if (diffX < 0) {
                        this.manifold.normal.set(-1, 0);
                    } else {
                        this.manifold.normal.set(1, 0);
                    }
                    this.manifold.penetration = overlapX;
                    return true;
                } else {
                    if (diffY < 0) {
                        this.manifold.normal.set(0, -1);
                    } else {
                        this.manifold.normal.set(0, 1);
                    }
                    this.manifold.penetration = overlapY;
                    return true;
                }
            }
        }
        return false;
    },
    add: function(entity) {
        if (!(entity instanceof Entity.Geometry)) {
            console.warn("(Physics.Controller.add) Object should be a part of Entity.Geometry:", entity);
            return;
        }
        this.items.push(entity.addComponent("body", Physics.Body));
    },
    items: [],
    manifold: new Physics.Manifold(),
    _relativeVel: new meta.math.Vector2(0, 0),
    _impulseX: 0,
    _impulseY: 0,
    _percent: .8,
    _slop: .01
});

"use strict";

Physics.Body = function() {
    this._mass = 100;
    this.invMass = .01;
    this.restitution = .6;
    this.velocity = new meta.math.Vector2(0, 0);
};

Physics.Body.prototype = {
    load: function() {
        this.volume = this.owner.volume;
    },
    updateVolume: function() {},
    updateItem: function(tDelta, manifold) {
        this.speed += this.acceleration * tDelta;
        if (this.speed > this.maxSpeed) {
            this.speed = this.maxSpeed;
        }
        var volume = this.owner.volume;
        if (this.haveTarget) {
            var distance = meta.math.length(volume.x, volume.y, this.targetX, this.targetY);
            if (distance <= this.speed * tDelta) {
                this.owner.position(this.targetX, this.targetY);
                this.stop();
            } else {
                this._helperVec.x = this.targetX - volume.x;
                this._helperVec.y = this.targetY - volume.y;
                this._helperVec.normalize();
                this.velocity.x = this._helperVec.x * this.speed;
                this.velocity.y = this._helperVec.y * this.speed;
            }
        }
        this.owner.move(this.velocity.x * tDelta, this.velocity.y * tDelta);
        this.volume.set(volume.x, volume.y);
        if (this.enableWorldBounds) {
            var newX = volume.x;
            var newY = volume.y;
            if (this.volume.minX < 0) {
                newX = this.volume.x - this.volume.minX;
                this.velocity.x = -this.velocity.x;
                manifold.normal.set(1, 0);
            } else if (this.volume.maxX > meta.world.width) {
                newX += meta.world.width - this.volume.maxX;
                this.velocity.x = -this.velocity.x;
                manifold.normal.set(-1, 0);
            }
            if (this.volume.minY < 0) {
                newY = this.volume.y - this.volume.minY;
                this.velocity.y = -this.velocity.y;
                manifold.normal.set(0, 1);
            } else if (this.volume.maxY > meta.world.height) {
                newY += meta.world.height - this.volume.maxY;
                this.velocity.y = -this.velocity.y;
                manifold.normal.set(0, -1);
            }
            this.owner.position(newX, newY);
            this.volume.set(newX, newY);
        }
    },
    moveTo: function(x, y, speed, moveToCB) {
        this.targetX = x;
        this.targetY = y;
        this.haveTarget = true;
        this.speed = speed || 600;
        this.moveToCB = moveToCB || null;
    },
    stop: function() {
        this.speed = 0;
        this.acceleration = 0;
        this.velocity.x = 0;
        this.velocity.y = 0;
        if (this.haveTarget) {
            if (this.moveToCB) {
                this.moveToCB.call(this.owner);
                this.moveToCB = null;
            }
            this.haveTarget = false;
        }
    },
    set mass(value) {
        this._mass = value;
        if (value === 0) {
            this.invMass = 0;
        } else {
            this.invMass = 1 / value;
        }
    },
    get mass() {
        return this._mass;
    },
    enableWorldBounds: false,
    ghost: false,
    targetX: 0,
    targetY: 0,
    haveTarget: false,
    moveToCB: null,
    maxSpeed: Number.MAX_VALUE,
    acceleration: 0,
    onCollision: null,
    _helperVec: new meta.math.Vector2(0, 0)
};

"use strict";

var UI = {};

UI.Controller = meta.Controller.extend({
    init: function() {
        var buttonTex = new Resource.Texture();
        buttonTex.fillRect({
            color: "#111",
            width: 120,
            height: 30
        });
        var buttonOnHoverTex = new Resource.Texture();
        buttonOnHoverTex.fillRect({
            color: "#ff0000",
            width: 120,
            height: 30
        });
        this.coreStyle = {
            button: {
                "*:hover": {
                    cursor: "pointer"
                },
                "*:pressed, *:drag": {
                    cursor: "pointer",
                    offsetX: 1,
                    offsetY: 1
                }
            },
            checkbox: {
                "*:hover": {
                    cursor: "pointer"
                },
                "*:pressed, *:drag": {
                    cursor: "pointer",
                    offsetX: 1,
                    offsetY: 1
                }
            }
        };
        this.style = {
            button: {
                "*": {
                    texture: buttonTex
                },
                "*:hover": {
                    texture: buttonOnHoverTex,
                    cursor: "pointer"
                },
                "*:pressed": {
                    texture: buttonOnHoverTex,
                    cursor: "pointer",
                    offsetX: 1,
                    offsetY: 1
                }
            },
            checkbox: {
                "*": {
                    texture: buttonTex
                },
                "*:hover": {
                    texture: buttonOnHoverTex,
                    cursor: "pointer"
                },
                "*:pressed": {
                    texture: buttonOnHoverTex,
                    cursor: "pointer",
                    offsetX: 1,
                    offsetY: 1
                },
                "[off]": {
                    texture: buttonTex
                },
                "[on]": {
                    texture: buttonOnHoverTex
                }
            }
        };
    },
    coreStyle: null,
    style: null
});

"use strict";

UI.Button = Entity.Geometry.extend({
    _initParams: function(params) {
        if (params) {
            this.style = meta.createStyle(params, UI.ctrl.coreStyle.button);
        } else {
            this.style = UI.ctrl.style.button;
        }
    },
    set text(str) {
        if (!this._text) {
            this._text = new Entity.Text(str);
            this._text.size = 12;
            this._text.color = "#ffffff";
            this.attach(this._text);
            this._text.anchor(.5);
            this._text.pickable = false;
        } else {
            this._text.setText(str);
        }
    },
    get text() {
        if (!this._text) {
            return "";
        }
        return this._text._text;
    },
    _text: null
});

"use strict";

UI.Checkbox = Entity.Geometry.extend({
    _initParams: function(params) {
        if (params) {
            this.style = meta.createStyle(params, UI.ctrl.coreStyle.checkbox);
        } else {
            this.style = UI.ctrl.style.checkbox;
        }
        var self = this;
        var entity = new Entity.Geometry();
        entity.style = this._style.childStyle;
        entity.anchor(.5);
        entity.pickable = false;
        entity.onChange = function() {
            self._onChildChange(this);
        };
        this.attach(entity);
        this.state = "off";
        this._onClick = this.toggle;
    },
    toggle: function() {
        var child = this.children[0];
        if (this.group) {
            child.state = "on";
        } else {
            if (child.state === "on") {
                child.state = "off";
            } else {
                child.state = "on";
            }
        }
    },
    _onChange: function() {
        this.children[0].state = this._state;
        if (this.group && this._state === "on") {
            this.group._onStateChange(this);
        }
    },
    _onChildChange: function(child) {
        this.state = this.children[0]._state;
    },
    set checked(value) {
        this.state = value ? "on" : "off";
    },
    get checked() {
        return this._state === "on";
    },
    set text(str) {
        if (!this._text) {
            this._text = new Entity.Text(str);
            this._text.size = 12;
            this._text.color = "#ffffff";
            this.attach(this._text);
            this._text.anchor(.5);
            this._text.pickable = false;
        } else {
            this._text.setText(str);
        }
    },
    get text() {
        if (!this._text) {
            return "";
        }
        return this._text._text;
    },
    _text: null,
    group: null,
    value: ""
});

"use strict";

UI.ProgressBar = Entity.Geometry.extend({
    init: function() {
        this.texture = new Resource.Texture();
        this.volume.resize(300, 30);
        this.buildElement();
    },
    buildElement: function() {
        this.texture.fillRect({
            width: this.width,
            height: this.height,
            color: "white"
        });
    },
    updateElement: function() {},
    set min(value) {
        if (this._min === value) {
            return;
        }
        this._min = value;
        this.updateElement();
    },
    set max(value) {
        if (this._max === value) {
            return;
        }
        this._max = value;
        this.updateElement();
    },
    set value(value) {
        if (this._value === value) {
            return;
        }
        this._value = value;
        this.updateElement();
    },
    get min() {
        return this._min;
    },
    get max() {
        return this._max;
    },
    get value() {
        return this._value;
    },
    _min: 0,
    _max: 100,
    _value: 0
});

"use strict";

UI.Group = Entity.Geometry.extend({
    add: function(entity) {
        if (entity.group) {
            entity.detach();
        }
        if (!this.children) {
            entity.state = "on";
            this._value = entity.value;
        }
        this.attach(entity);
        entity.group = this;
    },
    _onStateChange: function(entity) {
        this.prevValue = this._value;
        this._value = entity.value;
        var child;
        var numChildren = this.children.length;
        for (var i = 0; i < numChildren; i++) {
            child = this.children[i];
            if (child === entity) {
                continue;
            }
            this.children[i].state = "off";
        }
        this.onChange(this);
    },
    set value(_value) {
        if (this.children) {
            var numChildren = this.children.length;
            for (var n = 0; n < numChildren; n++) {
                if (this.children[n].value === _value) {
                    this.children[n].state = "on";
                    break;
                }
            }
        }
    },
    get value() {
        return this._value;
    },
    prevValue: "",
    _value: ""
});

"use strict";

meta.createEngine = function() {
    meta.onDomLoad(function() {
        meta.engine.create();
    });
};

(function() {
    if (!meta.autoInit) {
        return;
    }
    meta.createEngine();
})();