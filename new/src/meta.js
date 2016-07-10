"use strict";

var meta =
{
	version: "0.9",
	flags: {},
	view: null,
	views: {},

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
		timerIndex: 0
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

	Watcher: function(func, owner) {
		this.func = func;
		this.owner = owner || window;
	}
};
