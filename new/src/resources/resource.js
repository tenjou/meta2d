"use strict";

meta.class("meta.Resource", 
{
	init: function(params) {
		this.create(params || null);
	},

	create: function(params) 
	{
		if(params) {
			this.loadParams(params);
			this.load(params);
		}
		else {
			this.load(null);
		}
	},

	loadParams: function(params)
	{
		if(typeof params === "object") 
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
			var watcher = this.watchers[n];
			watcher.func.call(watcher.owner, event);
		}
	},

	get loaded() {
		return ((this.flags & this.Flag.LOADED) === this.Flag.LOADED);
	},

	set data(data)
	{
		if(this.$data === data) { return; }

		if(this.$data) {
			this.$data.unwatch(this.handleData, this);
		}

		this.$data = data;
		
		if(this.$data) 
		{
			var table = meta.resources.table[this.type];

			if(this.flags & this.Flag.ADDED) {
				delete table[this.id];
			}

			this.id = this.$data.id;
			table[this.id] = this;
			
			this.$data.watch(this.handleData, this);
		}
	},

	get data() {
		return this.$data;
	},

	handleData: function(event) {
		console.log("data_changed");
	},

	Flag: {
		LOADED: 1 << 0,
		ADDED: 1 << 1
	},

	//
	id: null,
	type: null,
	$data: null,

	watchers: null,

	flags: 0
});
