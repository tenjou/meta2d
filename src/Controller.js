"use strict";

/**
 * Class used as base for extending when a new controller is created.
 * @property view {meta.View} Default view controller is attached to.
 * @property name {string} Name of the controller.
 * @property flags {Boolean} All flags set to the controller.
 */
meta.class("meta.Controller",
{
	init: function() {
		this.view = meta.createView(this.__lastName__);
	},

	release: null,

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

		this.view.active = true;
		this.flags |= this.Flag.LOADED;
	},

	unload: function()
	{
		if((this.flags & this.Flag.LOADED) === 0) { return; }

		if(this.onUnload) {
			this.onUnload();
		}		

		this.view.active = false;
		this.flags &= ~this.Flag.LOADED | this.Flag.READY;	
	},

	onFirstLoad: null,

	onLoad: null,

	onUnload: null,

	onReady: null,	

	ready: function() 
	{
		if(this.flags & this.Flag.READY) { return; }

		if(this.onReady) {
			this.onReady();
		}

		this.flags |= this.Flag.READY;
	},

	/**
	 * Called in regular intervals that is defined in meta.tUpdate.
	 * @param tDelta {Number} The time difference between current and previous frame.
	 */
	update: null,

	render: null,

	Flag: {
		LOADED: 1,
		READY: 2,
		FIRST_LOADED: 4
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

	var instance = new cls();
	instance.name = name;
	scope[name] = instance;	
};	

meta.classes = {};

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

	meta.class("meta.constrollers." +name, extend, obj, _addClassInstance);
};

meta.plugin = function(name, extend, obj) {
	meta.class("meta.plugins." + name, extend, obj, _addClassInstance);
};
