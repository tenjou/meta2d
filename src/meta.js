"use strict";

var meta = 
{
	version: "0.8.0",
	importUrl: "http://meta2d.com/store/",

	device: null,
	resources: null,
	renderer: null,
	camera: null,
	input: null,
	channels: [],
	modules: {},

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
		this.engine.updateFuncs.push(func);
	},

	set render(func) {
		this.engine.renderFuncs.push(func);
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
