"use strict";

meta.device =
{
	load: function()
	{
		this.checkBrowser();

		this.mobile = this.isMobileAgent();

		this.checkConsoleCSS();
		this.checkFileAPI();

		this.support.onloadedmetadata = (typeof window.onloadedmetadata === "object");
		this.support.onkeyup = (typeof window.onkeyup === "object");
		this.support.onkeydown = (typeof window.onkeydown === "object");

		this.support.canvas = this.isCanvasSupport();
		this.support.webgl = this.isWebGLSupport();

		this.modernize();
	},

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
			console.warn("(meta.device.checkBrowser) Could not detect browser.");
		}
		else {
			if(this.name === "Chrome" || this.name === "Safari" || this.name === "Opera") {
				this.vendor = "webkit";
			}
			else if(this.name === "Firefox") {
				this.vendor = "moz";
			}
			else if(this.name === "MSIE") {
				this.vendor = "ms";
			}
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

	checkFileAPI: function() 
	{
		if(window.File && window.FileReader && window.FileList && window.Blob) {
			this.support.fileAPI = true;
		}
		else {
			this.support.fileAPI = false;
		}
	},

	modernize: function()
	{
		if(!Number.MAX_SAFE_INTEGER) {
			Number.MAX_SAFE_INTEGER = 9007199254740991;
		}

		this.supportConsole();
		this.supportPageVisibility();
		this.supportFullScreen();
		this.supportRequestAnimFrame();
		this.supportPerformanceNow();
		this.supportAudioFormats();
		this.supportAudioAPI();
		this.supportFileSystemAPI();
	},

	isMobileAgent: function() {
		return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
	},

	isCanvasSupport: function() {
		return !!window.CanvasRenderingContext2D;
	},

	isWebGLSupport: function()
	{
		var canvas = document.createElement("canvas");
		var context = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

		return !!context;
	},

	supportConsole: function()
	{
		if(!window.console) {
			window.console = {};
			window.console.log = meta.emptyFuncParam;
			window.console.warn = meta.emptyFuncParam;
			window.console.error = meta.emptyFuncParam;
		}
	},

	supportPageVisibility: function()
	{
		if(document.hidden !== undefined) {
			this.hidden = "hidden";
			this.visibilityChange = "visibilitychange";
		}
		else if(document.hidden !== undefined) {
			this.hidden = "webkitHidden";
			this.visibilityChange = "webkitvisibilitychange";
		}
		else if(document.hidden !== undefined) {
			this.hidden = "mozhidden";
			this.visibilityChange = "mozvisibilitychange";
		}
		else if(document.hidden !== undefined) {
			this.hidden = "mshidden";
			this.visibilityChange = "msvisibilitychange";
		}
	},

	supportFullScreen: function()
	{
		this.$fullScreenRequest();
		this.$fullScreenExit();
		this.$fullScreenOnChange();

		this.support.fullScreen = document.fullscreenEnabled || document.mozFullScreenEnabled ||
			document.webkitFullscreenEnabled || document.msFullscreenEnabled;
	},

	$fullScreenRequest: function()
	{
		var element = document.documentElement;
		if(element.requestFullscreen !== undefined) {
			this.fullScreenRequest = "requestFullscreen";
		}
		else if(element.webkitRequestFullscreen !== undefined) {
			this.fullScreenRequest = "webkitRequestFullscreen";
		}
		else if(element.mozRequestFullScreen !== undefined) {
			this.fullScreenRequest = "mozRequestFullScreen";
		}
		else if(element.msRequestFullscreen !== undefined) {
			this.fullScreenRequest = "msRequestFullscreen";
		}
	},

	$fullScreenExit: function()
	{
		if(document.exitFullscreen !== undefined) {
			this.fullScreenExit = "exitFullscreen";
		}
		else if(document.webkitExitFullscreen !== undefined) {
			this.fullScreenExit = "webkitExitFullscreen";
		}
		else if(document.mozCancelFullScreen !== undefined) {
			this.fullScreenExit = "mozCancelFullScreen";
		}
		else if(document.msExitFullscreen !== undefined) {
			this.fullScreenExit = "msExitFullscreen";
		}
	},

	$fullScreenOnChange: function()
	{
		if(document.onfullscreenchange !== undefined) {
			this.fullScreenOnChange = "fullscreenchange";
		}
		else if(document.onwebkitfullscreenchange !== undefined) {
			this.fullScreenOnChange = "webkitfullscreenchange";
		}
		else if(document.onmozfullscreenchange !== undefined) {
			this.fullScreenOnChange = "mozfullscreenchange";
		}
		else if(document.onmsfullscreenchange !== undefined) {
			this.fullScreenOnChange = "msfullscreenchange";
		}
	},

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

	supportPerformanceNow: function()
	{
		if(window.performance === undefined) {
			window.performance = {};
		}

		if(window.performance.now === undefined) {
			window.performance.now = Date.now;
		}
	},

	supportAudioFormats: function()
	{
		var audio = document.createElement("audio");
		if(audio.canPlayType("audio/mp4")) {
			this.audioFormats.push("m4a");
		}
		if(audio.canPlayType("audio/ogg")) {
			this.audioFormats.push("ogg");
		}
		if(audio.canPlayType("audio/mpeg")) {
			this.audioFormats.push("mp3");
		}
		if(audio.canPlayType("audio/wav")) {
			this.audioFormats.push("wav");
		}		
	},

	supportAudioAPI: function()
	{
		if(!window.AudioContext) {
			window.AudioContext = window.webkitAudioContext || 
				window.mozAudioContext ||
				window.oAudioContext ||
				window.msAudioContext;
		}

		if(window.AudioContext) {
			this.audioAPI = true;
		}
	},

	supportFileSystemAPI: function() 
	{
		if(!window.requestFileSystem) 
		{
			window.requestFileSystem = window.webkitRequestFileSystem || 
				window.mozRequestFileSystem ||
				window.oRequestFileSystem ||
				window.msRequestFileSystem;
		}

		if(window.requestFileSystem) {
			this.support.fileSystemAPI = true;
		}
	},

	//
	name: "unknown",
	version: "0",
	versionBuffer: null,

	vendors: [ "", "webkit", "moz", "ms", "o" ],
	vendor: "",
	support: {},

	audioFormats: [],

	mobile: false,
	isPortrait: false,
	audioAPI: false,

	hidden: null,
	visibilityChange: null,

	fullScreenRequest: null,
	fullScreenExit: null,
	fullScreenOnChange: null,
	fullscreen: false
};

meta.device.load();
