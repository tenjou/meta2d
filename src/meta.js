"use strict";

/** @namespace */
var meta = 
{
	version: "0.8.0",
	importUrl: "http://meta.infinite-games.com/store/",

	device: null,
	renderer: null,
	camera: null,
	channels: [],
	modules: {},

	time: {
		delta: 0,
		deltaF: 0,
		maxDelta: 250,
		scale: 1.0,
		update: 0,
		render: 0,
		fps: 0,
		elapsed: 0,
		frameIndex: 0,
		updateFreq: 1000 / 60
	},

	cache: 
	{
		width: 0, height: 0,

		metaTagsAdded: false,
		timerIndex: 0,

		initFuncs: [], 
		loadFuncs: [], 
		readyFuncs: [],
		updateFuncs: [],
		renderFuncs: [],

		view: null,
		views: {},

		scripts: null,
		pendingScripts: null, // IE<10
		numScriptsToLoad: 0,
		
		resolutions: null,
		currResolution: null,
		imageSmoothing: true,

		debug: false
	},

	set init(func) 
	{
		this.cache.initFuncs.push(func);
		if(this.engine && this.engine.inited) {
			func();
		}
	},

	set load(func) 
	{
		this.cache.loadFuncs.push(func);
		if(this.engine && this.engine.loaded) {
			func();
		}
	},

	set ready(func) 
	{
		this.cache.readyFuncs.push(func);
		if(this.engine && this.engine.ready) {
			func();
		}
	},

	set update(func) {
		this.cache.updateFuncs.push(func);
	},

	set render(func) {
		this.cache.renderFuncs.push(func);
	},	

	set debug(value) 
	{
		if(this.cache.debug === value) { return; }
		this.cache.debug = value;

		if(value) {
			meta.emit(meta.Event.DEBUG, value, meta.Event.DEBUG);
		}
		else {
			meta.emit(meta.Event.DEBUG, value, meta.Event.DEBUG);
		}
	},

	get debug() { return this.cache.debug; }
};
