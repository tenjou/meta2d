"use strict";

meta.class("meta.Resource", 
{
	init: function(params, id) 
	{
		this.create(params, id);
	},

	create: function(params, id) 
	{
		if(this.flags & this.Flag.ADDED) { return; }

		if(!id)
		{
			if(typeof params === "string") {
				this.id = meta.getNameFromPath(params);
			}
			else if(params instanceof Object && params.id) {
				this.id = params.id;
			}
			else {
				this.id = meta.genUniqueId();
			}
		}
		else {
			this.id = id;
		}

		if(this.setup) {
			this.setup(params);
		}

		if(params) {
			this.loadParams(params);
		}

		meta.resources.add(this);
	},

	remove: function() 
	{
		if(this.flags & this.Flag.ADDED) {
			meta.resources.remove(this.type, this.id);
		}
		else {	
			this.$remove();
		}
	},

	$remove: function()
	{
		this.emit("removed");
		
		if(this.cleanup) {
			this.cleanup();
		}

		this.$id = null;
		if(this.watchers) {
			this.watchers.length = 0;
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

	set id(id) 
	{
		if(id === this.$id) { return; }

		if(this.$id) {
			meta.resources.move(this, id);
		}
		else {
			this.$id = id;
		}
	},

	get id() {
		return this.$id;
	},

	get loaded() {
		return ((this.flags & this.Flag.LOADED) === this.Flag.LOADED);
	},

	set loading(value) 
	{
		if(value) 
		{
			if(this.flags & this.Flag.LOADING) { return; }
			
			this.flags |= this.Flag.LOADING;
		}
		else 
		{
			this.flags &= ~this.Flag.LOADING;
			this.flags |= this.Flag.LOADED;
			this.emit("loaded");
		}
	},

	get loading() {
		return (this.flags & this.Flag.LOADING) === this.Flag.LOADING;
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
			delete table[this.id];

			var raw = data.raw;
			for(var key in raw) 
			{
				var value = this[key];
				var newValue = raw[key];

				if(value === undefined || value === newValue) { continue; }
				this[key] = raw[key];
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
		ADDED: 1 << 0,
		LOADED: 1 << 1,
		LOADING: 1 << 2
	},

	//
	$id: null,
	type: null,
	$data: null,

	watchers: null,

	flags: 0
});
