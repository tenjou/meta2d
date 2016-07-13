"use strict";

meta.class("meta.Resource", 
{
	create: function(params) {
		this.loadParams(params);
	},

	loadParams: function(params)
	{
		if(typeof params === "string") {
			this.load(params);
		}
		else 
		{
			for(var key in params) {
				this[key] = params[key];
			}
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

	emit: function(event)
	{
		if(!this.watchers) { return; }
		
		for(var n = 0; n < this.watchers.length; n++) {
			this.watchers[n](event);
		}
	},

	set path(path)
	{
		if(this.$path === path) { return; }
		this.$path = path;

		this.load(path);
	},

	get path() {
		return this.$path;
	},

	get loaded() {
		return ((this.flags & this.Flag.LOADED) === this.Flag.LOADED);
	},

	Flag: {
		LOADED: 1 << 0
	},

	//
	watchers: null,

	flags: 0
});
