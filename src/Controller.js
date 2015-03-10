"use strict";

/**
 * Class used as base for extending when a new controller is created.
 *
 * @class
 * @property view {meta.View} Default view controller is attached to.
 * @property name {string} Name of the controller.
 * @property isLoaded {Boolean} Flag if controller is loaded.
 */
meta.Controller = meta.class.extend
({
	_init: function() {
		this.view = meta.view;
		this.views = [];
	},

	/**
	 * Destructor.
	 */
	release: null,

	firstLoad: null,

	_load: function() 
	{
		if(this._alreadyLoaded) {
			if(this.firstLoad) {
				this.firstLoad();
				this._alreadyLoaded = true;
			}
		}

		var master = meta.view;
		var numViews = this.views.length;
		for(var i = 0; i < numViews; i++) {
			master.attachView(this.views[i]);
		}
	},

	_unload: function()
	{
		var master = meta.view;
		var numViews = this.views.length;
		for(var i = 0; i < numViews; i++) {
			master.detachView(this.views[i]);
		}	
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
		var view = meta.createView(name);
		this.view.push(view);
		return view;
	},

	//
	view: null,
	name: "unknown",
	views: null,

	loaded: false,
	_alreadyLoaded: false
});

/**
 * Register controller to the engine.
 * @param ctrlName {String} Name of the controller.
 */
meta.register = function(ctrlName)
{
	var scope = window[ctrlName];
	if(!scope || !scope.Controller) {
		console.error("(meta.register) No such controllers found - " + ctrlName);
		return null;
	}	

	if(scope.ctrl) {
		console.error("(meta.register) Controller (" + ctrlName + ") is already added in scope.");
		return null;
	}

	var ctrl = new scope.Controller(meta.view);
	ctrl.name = ctrlName;

	scope.ctrl = ctrl;
	meta.engine.ctrls.push(ctrl);

	if(ctrl.load && meta.engine.loadedCtrls) {
		ctrl.load();
	} 
	if(ctrl.ready && meta.engine.ready) {
		ctrl.ready();
	}
	if(ctrl.update) {
		meta.engine.ctrlsUpdateFuncs.push(ctrl);
	}

	return ctrl;
};

/**
 * Urnegister controller from the engine.
 * @param ctrlName {String} Name of the controller.
 */
meta.unregister = function(ctrlName)
{
	var scope = window[ctrlName];
	if(!scope || !scope.Controller) {
		console.error("(meta.unregister) No such controllers found - " + ctrlName);
		return null;
	}	

	if(!scope.ctrl) {
		console.error("(meta.unregister) No such controllers initialized - " + ctrlName);
		return null;
	}

	meta.engine.ctrlsRemove.push(scope);
};

