"use strict";

/**
 * @property id {number} Unique id.
 * @property type {Resource.Type} Resource type.
 * @property name {string} Name of resource.
 * @property path {string} Path to the resource.
 * @property chn {meta.Channel} Unique channel for passing events to users.
 * @property isLoaded {boolean} Setter/Getter. Flag if resource is loaded.
 * @property isLoading {boolean} Flag if resource is loading.
 * @property inUse {boolean} Flag if resource is in use.
 */
meta.class("Resource.Basic", 
{
	init: function(data, tag) 
	{
		this.id = meta.resources.getUniqueID();
		if(tag) {
			this.tag = tag;
		}	

		if(this.onInit) {
			this.onInit(data, tag);
		}	
	},

	onInit: null,


	/**
	 * Subscribe to resource events.
	 * @param owner {*} Listener object.
	 * @param func {Function} Listener callback function.
	 */
	subscribe: function(func, owner)
	{
		if(!this.chn) {
			this.chn = meta.createChannel("__res" + this.id);
		}

		this.chn.add(func, owner);
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


	set loaded(value)
	{
		if(value)
		{
			if(!this._loaded) {
				this._loaded = value;
				this.emit(this, Resource.Event.LOADED);
			}
			else {
				this._loaded = value;
				this.emit(this, Resource.Event.CHANGED);
			}
		}
		else
		{
			if(this._loaded) {
				this._loaded = value;
				this.emit(this, Resource.Event.UNLOADED);
			}
		}
	},

	get loaded() { return this._loaded; },

	Flag: {
		ADDED: 8
	},

	//
	id: 0,
	flags: 0,
	type: Resource.Type.BASIC,
	name: "unknown",
	path: "",
	fullPath: "",
	tag: "",

	chn: null,

	_loaded: false,
	loading: false,
	used: false,

	steps: 1,
	currStep: 0
});
