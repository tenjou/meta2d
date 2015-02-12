"use strict";

/**
 * @description Manages client feature support and adds missing functionality.
 * @constructor
 * @property vendors {Array} Buffer with vendors to perform check on.
 * @property support {Object} Dictionary of supported features.
 * @property mobile {Boolean} Flag if it's mobile device.
 * @memberof! <global>
 */
meta.Device = function()
{
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
	this.fullscreen = false;

	this.load();
};

meta.Device.prototype =
{
	/**
	 * @description Load all support related stuff.
	 */
	load: function()
	{
		this.checkBrowser();

		this.mobile = this.isMobileAgent();

		this.checkConsoleCSS();

		this.support.onloadedmetadata = (typeof window.onloadedmetadata === "object");
		this.support.onkeyup = (typeof window.onkeyup === "object");
		this.support.onkeydown = (typeof window.onkeydown === "object");

		this.support.canvas = this.isCanvasSupport();
		this.support.webgl = this.isWebGLSupport();

		this.modernize();
	},

	/**
	 * Check browser name and version.
	 */
	checkBrowser: function()
	{
		var regexps = {
			"Chrome": [ /Chrome\/(\S+)/ ],
			"Firefox": [ /Firefox\/(\S+)/ ],
			"MSIE": [ /MSIE (\S+);/ ],
			"Opera": [
				/OPR\/(\S+)/,
				/Opera\/.*?Version\/(\S+)/,     /* Opera 10 */
				/Opera\/(\S+)/                  /* Opera 9 and older */
			],
			"Safari": [ /Version\/(\S+).*?Safari\// ]
		};

		var userAgent = navigator.userAgent;
		var name, currRegexp, match;
		var numElements = 2;

		for(name in regexps)
		{
			while(currRegexp = regexps[name].shift())
			{
				if(match = userAgent.match(currRegexp))
				{
					this.version = (match[1].match(new RegExp('[^.]+(?:\.[^.]+){0,' + --numElements + '}')))[0];
					this.name = name;

					this.versionBuffer = this.version.split(".");
					var versionBufferLength = this.versionBuffer.length;
					for(var i = 0; i < versionBufferLength; i++) {
						this.versionBuffer[i] = parseInt(this.versionBuffer[i]);
					}

					break;
				}
			}
		}

		if(this.versionBuffer === null || this.name === "unknown") {
			console.warn("[meta.Device.checkBrowser]:", "Could not detect browser.");
		}				
	},

	checkConsoleCSS: function() 
	{
		if(!this.mobile && (this.name === "Chrome" || this.name === "Opera")) {
			this.support.consoleCSS = true;
		}
		else {
			this.support.consoleCSS = false;
		}		
	},

	/**
	 * @description Add support for missing functionality.
	 */
	modernize: function()
	{
		this.supportConsole();
		this.supportPageVisibility();
		this.supportFullScreen();
		this.supportRequestAnimFrame();
		this.supportPerformanceNow();
		this.supportAudioFormats();
		this.supportAudioAPI();
	},


	/**
	 * Test if agent is on mobile device.
	 * @returns {boolean}
	 */
	isMobileAgent: function() {
		return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
	},

	/**
	 * @description Check if client supports Canvas rendering context.
	 * @return {boolean}
	 */
	isCanvasSupport: function() {
		return !!window.CanvasRenderingContext2D;
	},

	/**
	 * @description Check if client supports WebGL rendering context.
	 * @return {boolean}
	 */
	isWebGLSupport: function()
	{
		var canvas = document.createElement("canvas");
		var context = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

		return !!context;
	},


	/**
	 * If console is not supported replace it with empty functions.
	 */
	supportConsole: function()
	{
		if(!window.console) {
			window.console = {};
			window.console.log = meta.emptyFuncParam;
			window.console.warn = meta.emptyFuncParam;
			window.console.error = meta.emptyFuncParam;
		}
	},

	/**
	 * Check if Page Visibility API is available and which prefix to use.
	 */
	supportPageVisibility: function()
	{
		if(document.hidden !== void(0)) {
			this.hidden = "hidden";
			this.visibilityChange = "visibilitychange";
		}
		else if(document.hidden !== void(0)) {
			this.hidden = "webkitHidden";
			this.visibilityChange = "webkitvisibilitychange";
		}
		else if(document.hidden !== void(0)) {
			this.hidden = "mozhidden";
			this.visibilityChange = "mozvisibilitychange";
		}
		else if(document.hidden !== void(0)) {
			this.hidden = "mshidden";
			this.visibilityChange = "msvisibilitychange";
		}
	},

	/**
	 * Check if FullScreen API is available and which prefix to use.
	 */
	supportFullScreen: function()
	{
		this._fullScreenRequest();
		this._fullScreenExit();
		this._fullScreenOnChange();

		this.support.fullScreen = document.fullscreenEnabled || document.mozFullScreenEnabled ||
			document.webkitFullscreenEnabled || document.msFullscreenEnabled;
	},

	_fullScreenRequest: function()
	{
		var element = document.documentElement;
		if(element.requestFullscreen !== void(0)) {
			this.fullScreenRequest = "requestFullscreen";
		}
		else if(element.webkitRequestFullscreen !== void(0)) {
			this.fullScreenRequest = "webkitRequestFullscreen";
		}
		else if(element.mozRequestFullScreen !== void(0)) {
			this.fullScreenRequest = "mozRequestFullScreen";
		}
		else if(element.msRequestFullscreen !== void(0)) {
			this.fullScreenRequest = "msRequestFullscreen";
		}
	},

	_fullScreenExit: function()
	{
		if(document.exitFullscreen !== void(0)) {
			this.fullScreenExit = "exitFullscreen";
		}
		else if(document.webkitExitFullscreen !== void(0)) {
			this.fullScreenExit = "webkitExitFullscreen";
		}
		else if(document.mozCancelFullScreen !== void(0)) {
			this.fullScreenExit = "mozCancelFullScreen";
		}
		else if(document.msExitFullscreen !== void(0)) {
			this.fullScreenExit = "msExitFullscreen";
		}
	},

	_fullScreenOnChange: function()
	{
		if(document.onfullscreenchange !== void(0)) {
			this.fullScreenOnChange = "fullscreenchange";
		}
		else if(document.onwebkitfullscreenchange !== void(0)) {
			this.fullScreenOnChange = "webkitfullscreenchange";
		}
		else if(document.onmozfullscreenchange !== void(0)) {
			this.fullScreenOnChange = "mozfullscreenchange";
		}
		else if(document.onmsfullscreenchange !== void(0)) {
			this.fullScreenOnChange = "msfullscreenchange";
		}
	},

	/**
	 * @description Add support for requestAnimFrame.
	 */
	supportRequestAnimFrame: function()
	{
		if(!window.requestAnimationFrame)
		{
			window.requestAnimationFrame = (function()
			{
				return window.webkitRequestAnimationFrame ||
					window.mozRequestAnimationFrame ||
					window.oRequestAnimationFrame ||
					window.msRequestAnimationFrame ||

					function(callback, element) {
						window.setTimeout( callback, 1000 / 60 );
					};
			})();
		}
	},

	/**
	 * Add support to window.performance.now().
	 */
	supportPerformanceNow: function()
	{
		if(window.performance === void(0)) {
			window.performance = {};
		}

		if(window.performance.now === void(0)) {
			window.performance.now = Date.now;
		}
	},

	/**
	 * Check for supported audio formats.
	 */
	supportAudioFormats: function()
	{
		var audio = document.createElement("audio");
		if(audio.canPlayType('audio/mp4; codecs="mp4a.40.2"').replace(/no/i, '') != '') {
			this.audioFormats.push("m4a");
		}
		if(audio.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, '')) {
			this.audioFormats.push("ogg");
		}
		if(audio.canPlayType('audio/mpeg;').replace(/no/, '')) {
			this.audioFormats.push("mp3");
		}
		if(audio.canPlayType('audio/wav; codecs="1"').replace(/no/, '')) {
			this.audioFormats.push("wav");
		}		
	},

	/**
	 * Check for AudioAPI support.
	 */
	supportAudioAPI: function()
	{
		if(!window.AudioContext) {
			window.AudioContext = window.webkitAudioContext || 
				window.mozAudioContext ||
				window.oAudioContext ||
				window.msAudioContext;
		}

		// if(window.AudioContext) {
		// 	this.isAudioAPI = true;
		// }
	}
};

meta.device = new meta.Device();

