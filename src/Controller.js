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
	init: meta.emptyFunc,

	_init: function(view) {
		this.view = view;
	},

	/**
	 * Destructor.
	 * @function
	 */
	release: meta.emptyFunc,

	/**
	 * (Virtual) Load view.
	 * @function
	 */
	load: meta.emptyFunc,

	/**
	 * (Virtual) Unload view.
	 * @function
	 */
	unload: meta.emptyFunc,

	/**
	 * (Virtual) Called after all controllers are loaded.
	 * @function
	 */
	ready: meta.emptyFunc,

	/**
	 * (Virtual) Called in regular intervals that is defined in meta.tUpdate.
	 * @function
	 * @param tDelta {Number} The time difference between current and previous frame.
	 */
	update: meta.emptyFuncParam,

	//
	view: null,
	name: "unknown",

	isLoaded: false
});
