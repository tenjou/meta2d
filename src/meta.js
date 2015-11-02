"use strict";

var meta = 
{
	version: "0.82 nightly",
	importUrl: "http://meta2d.com/store/",

	device: null,
	resources: null,
	renderer: null,
	camera: null,
	input: null,
	physics: null,
	channels: [],
	modules: {},

	loading: null,
	preloading: null,

	flags: {
		webGL: true,
		audioAPI: true
	},

	time: {
		delta: 0,
		deltaF: 0,
		maxDelta: 250,
		scale: 1.0,
		curr: 0,
		fps: 0,
		current: 0,
		update: 0,
		accumulator: 0.0,
		frameIndex: 0,
		updateFreq: 1000 / 10
	},

	cache: 
	{
		width: 0, height: 0,

		metaTagsAdded: false,
		timerIndex: 0,

		initFuncs: [], 
		preloadFuncs: [],
		loadFuncs: [], 
		readyFuncs: [],

		view: null,
		views: {},

		scripts: null,
		pendingScripts: null, // IE<10
		numScriptsToLoad: 0,
		
		resolutions: null,
		currResolution: null,
		imageSmoothing: true
	},

	set onInit(func) 
	{
		this.cache.initFuncs.push(func);
		if(this.engine && this.engine.inited) {
			func();
		}
	},

	set onPreload(func)
	{
		this.cache.preloadFuncs.push(func);
		if(this.engine && this.engine.preloaded) {
			func();
		}
	},

	set onLoad(func) 
	{
		this.cache.loadFuncs.push(func);
		if(this.engine && this.engine.loaded) {
			func();
		}
	},

	set onReady(func) 
	{
		this.cache.readyFuncs.push(func);
		if(this.engine && this.engine.ready) {
			func();
		}
	},

	set onUpdate(func) {
		this.engine.updateFuncs.push(func);
	},

	set onRender(func) {
		this.engine.renderFuncs.push(func);
	},	

	set debug(value) 
	{
		if(this.cache.debug === value) { return; }
		this.cache.debug = value;

		console.log("here")
		if(value) {
			meta.emit(meta.Event.DEBUG, value, meta.Event.DEBUG);
			meta.debugger.load();
		}
		else {
			meta.emit(meta.Event.DEBUG, value, meta.Event.DEBUG);
			meta.debugger.unload();
		}
	},

	get debug() { return this.cache.debug; }
};
