"use strict";

var meta =
{
	version: "0.9",
	view: null,
	views: {},

	flags: {
		autoPowTwo: true
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

	cache: {
		width: 0,
		height: 0,
		timerIndex: 0,
		camera: null,
		uniqueId: 1
	},

	$listeners: {},

	on: function(event, func, owner)
	{
		var buffer = this.$listeners[event];
		if(!buffer) {
			buffer = [ new this.Watcher(func, owner) ];
			this.$listeners[event] = buffer;
		}
		else {
			buffer.push(new this.Watcher(func, owner))
		}
	},

	off: function(event, func, owner)
	{
		var buffer = this.$listeners[event];
		if(!buffer) { 
			console.warn("(meta.off) No listeners found for the event: " + event);
			return; 
		}

		owner = owner || window;

		var num = buffer.length;
		for(var n = 0; n < num; n++)
		{
			var watcher = buffer[n];
			if(watcher.owner === owner && watcher.func === func) {
				buffer[n] = buffer[num - 1];
				buffer.pop();
				break;
			}
		}
	},

	emit: function(event, params)
	{
		var buffer = this.$listeners[event];
		if(!buffer) {
			return;
		}

		if(params)
		{
			for(var n = 0; n < buffer.length; n++) {
				var item = buffer[n];
				item.func.call(item.owner, params);
			}
		}
		else 
		{
			for(var n = 0; n < buffer.length; n++) {
				var item = buffer[n];
				item.func.call(item.owner);
			}			
		}
	},

	set camera(camera) 
	{
		if(this.cache.camera === camera) { return; }
		this.cache.camera = camera;

		camera.activate();
	},

	get camera() {
		return this.cache.camera;
	},

	Watcher: function(func, owner) {
		this.func = func;
		this.owner = owner || window;
	}
};
