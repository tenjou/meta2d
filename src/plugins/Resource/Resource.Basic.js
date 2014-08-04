"use strict";

/**
 * @class Resource.Basic
 * @property id {number} Unique id.
 * @property type {Resource.Type} Resource type.
 * @property name {string} Name of resource.
 * @property path {string} Path to the resource.
 * @property chn {meta.Channel} Unique channel for passing events to users.
 * @property isLoaded {boolean} Setter/Getter. Flag if resource is loaded.
 * @property isLoading {boolean} Flag if resource is loading.
 * @property inUse {boolean} Flag if resource is in use.
 * @memberof! <global>
 */
Resource.Basic = meta.Class.extend
( /** @lends Resource.Basic.prototype */ {

	_init: function() {
		this.id = Resource.ctrl.getUniqueID();
	},


	/**
	 * Subscribe to resource events.
	 * @param owner {*} Listener object.
	 * @param func {Function} Listener callback function.
	 */
	subscribe: function(owner, func)
	{
		if(!this.chn) {
			this.chn = meta.createChannel("__res" + this.id);
		}

		this.chn.subscribe(owner, func);
	},

	/**
	 * Unsubscribe from resource events.
	 * @param owner {*} Listener object.
	 */
	unsubscribe: function(owner)
	{
		if(!this.chn) { return; }

		this.chn.unsubscribe(owner);
		if(this.chn.numSubs === 0) {
			this.chn.remove();
			this.chn = null;
		}
	},

	/**
	 * emit an event to onrs.
	 * @param data {*} Data linked with the event.
	 * @param event {*} Type of the event.
	 */
	emit: function(data, event)
	{
		if(this.chn) {
			this.chn.emit(data, event);
		}
	},


	set isLoaded(value)
	{
		if(value)
		{
			if(!this._isLoaded) {
				this._isLoaded = value;
				this.emit(this, Resource.Event.LOADED);
			}
			else {
				this._isLoaded = value;
				this.emit(this, Resource.Event.CHANGED);
			}
		}
		else
		{
			if(this._isLoaded) {
				this._isLoaded = value;
				this.emit(this, Resource.Event.UNLOADED);
			}
		}
	},

	get isLoaded() { return this._isLoaded; },


	//
	id: 0,
	type: Resource.Type.BASIC,
	name: "unknown",
	path: "",
	fullPath: "",

	chn: null,

	_isLoaded: false,
	isLoading: false,
	inUse: false
});