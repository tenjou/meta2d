"use strict";

/**
 * Class used as base for extending when a new controller is created.
 * @property view {meta.View} Default view controller is attached to.
 * @property name {string} Name of the controller.
 * @property flags {Boolean} All flags set to the controller.
 */
meta.class("meta.Controller",
{
	init: function() 
	{
		this.view = meta.createView("__ctrl__" + meta.cache.ctrlUniqueID++);

		if(this.onInit) {
			this.onInit();
		}
	},

	onInit: null,

	load: function() 
	{
		if(this.flags & this.Flag.LOADED) { return; }

		if((this.flags & this.Flag.FIRST_LOADED) === 0)
		{
			if(this.onFirstLoad) {
				this.onFirstLoad();
			}

			this.flags |= this.Flag.FIRST_LOADED;
		}

		if(this.onLoad) {
			this.onLoad();
		}

		meta.engine.controllersReady.push(this);
		meta.cache.view.attachView(this.view);
		
		this.flags |= this.Flag.LOADED;
	},

	unload: function()
	{
		if((this.flags & this.Flag.LOADED) === 0) { return; }

		if(this.onUnload) {
			this.onUnload();
		}

		if(this.onUpdate) {
			var buffer = meta.engine.controllersUpdate;
			var num = buffer.length;
			for(var n = 0; n < num; n++) {
				if(buffer[n] === this) {
					buffer.splice(n, 1);
					break;
				}
			}
		}

		meta.cache.view.detachView(this.view);
		this.flags &= ~(this.Flag.LOADED | this.Flag.READY);	
	},

	onFirstLoad: null,

	onLoad: null,

	onUnload: null,

	onFirstReady: null,

	onReady: null,	

	ready: function() 
	{
		if(this.flags & this.Flag.READY) { return; }

		if((this.flags & this.Flag.FIRST_READY) === 0)
		{
			if(this.onFirstReady) {
				this.onFirstReady();
			}

			this.flags |= this.Flag.FIRST_READY;
		}

		if(this.onReady) {
			this.onReady();
		}

		if(this.onUpdate) {
			meta.engine.controllersUpdate.push(this);
		}

		this.flags |= this.Flag.READY;
	},

	onUpdate: null,

	Flag: {
		LOADED: 1,
		READY: 2,
		FIRST_LOADED: 4,
		FIRST_READY: 8
	},

	//
	name: "",
	view: null,
	flags: 0
});

function _addClassInstance(cls) 
{
	var path = cls.prototype.__name__.split(".").slice(2);
	var num = path.length - 1;

	if(cls instanceof meta.Controller) {
		console.error("(meta.controller): Controller parent class should be meta.Controller");
		return;
	}
	
	var name;
	var scope = window;
	var prevScope = scope;
	for(var n = 0; n < num; n++) 
	{
		name = path[n];
		scope = prevScope[name];
		if(!scope) {
			scope = {};
			prevScope[name] = scope;
		}
		prevScope = scope;
	}

	var name = path[num];
	if(scope[name]) {
		console.error("(meta.controller): Scope is already in use: " + path.join("."));
		return;
	}

	cls.prototype.name = name;

	if(meta.engine.inited) {
		scope[name] = new cls();	
	}
	else 
	{
		if(!meta.cache.ctrlsToCreate) {
			meta.cache.ctrlsToCreate = [{ cls: cls, scope: scope }];
		}
		else {
			meta.cache.ctrlsToCreate.push({ cls: cls, scope: scope });
		}
	}
};	

meta.controllers = {};
meta.cache.ctrlUniqueID = 0;

meta.controller = function(name, extend, obj) 
{
	if(!obj) 
	{
		if(typeof(extend) === "object") {
			obj = extend;
			extend = "meta.Controller";
		}
		else {
			obj = null;
		}
	}

	if(!extend) {
		extend = "meta.Controller";
	}

	meta.class("meta.controllers." + name, extend, obj, _addClassInstance);
};

meta.plugin = function(name, extend, obj) {
	meta.class("meta.plugins." + name, extend, obj, _addClassInstance);
};
