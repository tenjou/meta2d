"use strict";

/**
 * Class used as base for extending when a new controller is created.
 * @class
 * @property view {meta.View} Default view controller is attached to.
 * @property name {string} Name of the controller.
 * @property isLoaded {Boolean} Flag if controller is loaded.
 */
meta.class("meta.Controller",
{
	_init: function() {
		this.view = meta.view;
		this.views = {};
	},

	/**
	 * Destructor.
	 */
	release: null,

	firstLoad: null,

	_load: function() 
	{
		if(this._firstLoad) 
		{
			this._firstLoad = true;
			if(this.firstLoad) {
				this.firstLoad();
			}
		}

		if(this.load) {
			this.load();
		}

		var masterView = meta.view;
		for(var key in this.views) {
			masterView.attachView(this.views[key]);
		}

		this.loaded = true;
	},

	_unload: function()
	{
		if(this.unload) {
			this.unload();
		}

		var masterView = meta.view;
		for(var key in this.views) {
			masterView.detachView(this.views[key]);
		}

		this.loaded = false;	
	},

	/**
	 * Load view.
	 */
	load: null,

	unload: null,

	/**
	 * Called after all controllers are loaded.
	 * @function
	 */
	ready: null,

	/**
	 * Called in regular intervals that is defined in meta.tUpdate.
	 * @function
	 * @param tDelta {Number} The time difference between current and previous frame.
	 */
	update: null,

	render: null,

	createView: function(name)
	{
		if(this.views[name]) {
			console.warn("(meta.Controller.createView) Already added views with a name: " + name);
			return;
		}

		var view = meta.createView(name);
		this.views[name] = view;

		if(this.loaded) {
			meta.view.attachView(view);
		}

		return view;
	},

	removeView: function(name)
	{
		if(this.views[name]) {
			meta.view.detachView(name);
			this.views[name] = null;
		}
		else {
			console.warn("(meta.Controller.removeView) Could not find view with a name: " + name);
		}
	},

	//
	name: "",
	view: null,
	views: null,

	loaded: false,
	_firstLoad: true
});

meta.ctrl = 
{
	/**
	 * Register controller. Will be available through <scope.ctrl> but won't be loaded.
	 * @param name {string|Array} Name or buffer with names of the controller.
	 */	
	register: function(names)
	{
		if(names instanceof Array) {
			var numItems = names.length;
			for(var i = 0; i < numItems; i++) {
				this._register(names[i]);
			}
		}
		else {
			this._register(names)
		}

		return this;
	},

	_register: function(name)
	{
		var scope = window[name];
		if(!scope || !scope.Controller) {
			console.warn("(meta.ctrl.register) No such controllers found: " + name);
			return null;
		}	

		if(scope.ctrl) {
			console.warn("(meta.ctrl.register) Controller is already added in scope: " + name);
			return null;
		}

		var ctrl = new scope.Controller(meta.view);
		ctrl.name = name;

		scope.ctrl = ctrl;
		this._ctrls.push(ctrl);		
	},

	/**
	 * Unregister controller and remove from the <scope.ctrl>.
	 * @param name {string|Array} Name or buffer with names of the controller.
	 */	
	unregister: function(names)
	{
		if(names instanceof Array) {
			var numItems = names.length;
			for(var i = 0; i < numItems; i++) {
				this._unregister(names[i]);
			}
		}
		else {
			this._unregister(names)
		}

		return this;
	},

	_unregister: function(name)
	{
		var scope = window[name];
		if(!scope || !scope.Controller) {
			console.warn("(meta.ctrl.unregister) No such controllers found: " + name);
			return null;
		}	

		if(!scope.ctrl) {
			console.warn("(meta.ctrl.unregister) No such controllers initialized: " + name);
			return null;
		}

		if(scope.ctrl.loaded) {
			meta.ctrl.unload(name);
		}

		this._ctrlsRemove.push(scope);
	},

	/**
	 * Load controller.
	 * @param names {string|Array} Name or buffer with names of the controller.
	 */
	load: function(names)
	{
		if(names instanceof Array) {
			var numItems = names.length;
			for(var i = 0; i < numItems; i++) {
				this._load(names[i]);
			}
		}
		else {
			this._load(names);
		}

		return this;
	},

	_load: function(name)
	{
		var scope = window[name];
		if(!scope || !scope.Controller || !scope.ctrl) {
			console.warn("(meta.ctrl.load) No such controllers found: " + name);
			return null;
		}

		if(scope.ctrl.loaded) {
			console.warn("(meta.ctrl.unload) Controller is already loaded: " + name);
			return;
		}		

		this._ctrlsLoad.push(scope.ctrl);
		this._loading = true;
	},

	/**
	 * Unload controller.
	 * @param names {string|Array} Name or buffer with names of the controller.
	 */
	unload: function(names)
	{
		if(names instanceof Array) {
			var numItems = names.length;
			for(var i = 0; i < numItems; i++) {
				this._unload(names[i]);
			}
		}
		else {
			this._unload(names);
		}

		return this;
	},

	_unload: function(name)
	{
		var scope = window[name];
		if(!scope || !scope.Controller || !scope.ctrl) {
			console.warn("(meta.ctrl.unload) No such controllers found: " + name);
			return;
		}

		if(!scope.ctrl.loaded) {
			console.warn("(meta.ctrl.unload) Controller is not loaded: " + name);
			return;
		}

		scope.ctrl._unload();
	},

	/**
	 * Create model controller (automatically loads).
	 * @param names {string|Array} Name or buffer with names of the controller.
	 */
	create: function(names)
	{
		if(names instanceof Array) {
			var numItems = names.length;
			for(var i = 0; i < numItems; i++) {
				this._create(names[i]);
			}
		}
		else {
			this._create(names)
		}

		return this;
	},

	_create: function(name)
	{
		if(this.register(name)) {
			this.load(name);
		}		
	},

	loadCtrls: function()
	{
		for(var i = 0; i < this._ctrlsLoad.length; i++) {
			this._ctrlsLoad[i]._load();	
		}
	},

	readyCtrls: function() 
	{
		var ctrl;
		var numCtrl = this._ctrlsLoad.length;
		for(var i = 0; i < numCtrl; i++) 
		{
			ctrl = this._ctrlsLoad[i];
			
			if(ctrl.ready) {
				ctrl.ready();
			}
			if(ctrl.update) {
				this._ctrlsUpdate.push(ctrl);
			}

			this._ctrls.push(ctrl);
		}	

		this._ctrlsLoad.length = 0;	
		this._loading = false;
	},

	removeCtrls: function()
	{
		var numCtrls = this._ctrlsRemove.length;
		if(numCtrls) 
		{
			for(var i = 0; i < numCtrls; i++) {
				this._removeCtrl(this._ctrlsRemove[i]);
			}

			this._ctrlsRemove.length = 0;
		}
	},

	_removeCtrl: function(ctrl)
	{
		var scope = window[name];
		if(!scope || !scope.Controller) {
			console.warn("(meta.ctrl.removeCtrl) No such controllers found: " + name);
			return;
		}	

		var numCtrl = this._ctrl.length;
			
		for(var i = 0; i < numCtrl; i++) 
		{
			if(this._ctrlsUpdate[i] === ctrl) {
				this._ctrlsUpdate[i] = this._ctrlsUpdate[numCtrl - 1];
				this._ctrlsUpdate.pop();
				break;
			}
		}

		for(i = 0; i < numCtrl; i++) 
		{
			if(this._ctrls[i] === ctrl) {
				this._ctrls[i] = this._ctrls[numCtrl - 1];
				this._ctrls.pop();
				break;
			}
		}

		scope.ctrl = null;
	},

	update: function(tDelta) 
	{
		var numCtrl = this._ctrlsUpdate.length;
		for(var i = 0; i < numCtrl; i++) {
			this._ctrlsUpdate[i].update(tDelta);
		}

		if(this._loading)
		{
			this.loadCtrls();
			if(!meta.engine.loadingResources) {
				this.readyCtrls();
			}
		}
	},

	//
	_ctrls: [],
	_ctrlsLoad: [],
	_ctrlsRemove: [],
	_ctrlsUpdate: [],

	_loading: false
};

var Ctrl = {};
var Model = {};

