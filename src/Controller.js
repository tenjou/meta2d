"use strict";

/**
 * Class used as base for extending when a new controller is created.
 * @class meta.Controller
 * @memberof! <global>
 * @property view {meta.View} Default view controller is attached to.
 * @property name {string} Name of the controller.
 * @property isLoaded {Boolean} Flag if controller is loaded.
 */
meta.Controller = meta.Class.extend
( /** @lends meta.Controller.prototype */ {

	/**
	 * Constructor.
	 * @function
	 */
	_init: function(view) {
		this.view = view;
		console.log(view);
	},

	/**
	 * Destructor.
	 * @function
	 */
	release: null,

	/**
	 * Load view.
	 * @function
	 */
	load: null,

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

	//
	view: null,
	name: "unknown",

	loaded: false
});

/**
 * Register controller to the engine.
 * @param ctrlName {String} Name of the controller.
 */
meta.register = function(ctrlName)
{
	var scope = window[ctrlName];
	if(!scope && !scope.Controller) {
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
	if(!scope && !scope.Controller) {
		console.error("(meta.unregister) No such controllers found - " + ctrlName);
		return null;
	}	

	if(!scope.ctrl) {
		console.error("(meta.unregister) No such controllers initialized - " + ctrlName);
		return null;
	}

	meta.engine.ctrlsRemove.push(scope);
};

