"use strict";

meta.class("meta.Resource", 
{
	init: function(params) {
		this.loadParams(params);
	},

	loadParams: function(params)
	{
		for(var key in params) {
			this[key] = params[key];
		}
	},

	watch: function(func, owner)
	{
		var watcher = new meta.Watcher(func, owner);

		if(this.watchers) {
			this.watchers.push(watcher);
		}
		else {
			this.watchers = [ watcher ];
		}
	},

	unwatch: function(owner)
	{
		var num = this.watchers.length;
		for(var n = 0; n < num; n++) 
		{
			if(this.watchers[n].owner === owner) {
				this.watchers[n] = this.watchers[num - 1];
				this.watchers.pop();
				break;
			}
		}
	},	

	Flag: {
		LOADED: 1 << 0
	},

	//
	watchers: null,

	flags: 0
});
