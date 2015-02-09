"use strict";

var meta = 
{
	version: "1.2.0",

	device: null,
	renderer: null,
	camera: null,

	autoInit: true,
	autoMetaTags: true,

	cache: 
	{
		width: 0, height: 0,

		metaTagsAdded: false,
		timerIndex: 0,

		initBuffer: [], loadBuffer: [], readyBuffer: [],
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
