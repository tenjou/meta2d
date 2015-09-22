"use strict";

/**
 * @property resources {Object} Map for all resources that are currently managed. Uses Resource.Type to access specific type.
 * @property resourceInUse {Object} Map with all resource that are in use.
 * @property rootPath {string} Root path of resources that's added at resource creation time.
 */
meta.class("Resource.Manager",
{
	init: function()
	{
		this._chn_added = meta.createChannel(Resource.Event.ADDED);
		this._chn_loaded = meta.createChannel(Resource.Event.LOADED);
		this._chn_loadingStart = meta.createChannel(Resource.Event.LOADING_START)
		this._chn_loadingEnd = meta.createChannel(Resource.Event.LOADING_END);
		this._chn_loadingUpdate = meta.createChannel(Resource.Event.LOADING_UPDATE)

		meta.subscribe(this, meta.Event.ADAPT, this.onAdapt);

		meta.audio = new Resource.AudioManager();

		var self = this;
		this._xhr = new XMLHttpRequest();
		this._xhr.onreadystatechange = function() {
			self._loadFileStateChange();
		};
	},

	/**
	 * Add a resource for managing.
	 * @param resource {Resource.Basic} Resource to add.
	 * @return {Resource.Basic|null} Resource added.
	 */
	add: function(resource)
	{
		if(resource.flags & resource.Flag.ADDED) {
			return;
		}
		resource.flags |= resource.Flag.ADDED;

		var subBuffer = this.resources[resource.type];
		if(!subBuffer) {
			subBuffer = {};
			this.resources[resource.type] = subBuffer;
		}

		// If no name is specified take it from the source.
		var path = resource.path;
		if(resource.name === "unknown" && path)
		{
			var wildcardIndex = path.lastIndexOf(".");
			var slashIndex = path.lastIndexOf("/");

			// If resource does not have a wildcard.
			if(wildcardIndex < 0 || (path.length - wildcardIndex) > 5) { 
				resource.name = resource.tag + path.slice(slashIndex + 1);
			}
			else {
				resource.name = resource.tag + path.slice(slashIndex + 1, wildcardIndex);
			}
		}

		if(subBuffer[resource.name])
		{
			console.warn("(Resource.Manager.add) There is already a resource(" + 
				meta.enumToString(Resource.Type, resource.type) + ") added with a name: " + resource.name);
			return null;
		}

		subBuffer[resource.name] = resource;

		this._chn_added.emit(resource, Resource.Event.ADDED);

		return resource;
	},

	/**
	 * Remove resource from the managing.
	 * @param resource {Resource.Basic} Resource to remove.
	 */
	remove: function(resource)
	{
		var subBuffer = this.resources[resource.type];
		if(!subBuffer)
		{
			console.warn("(Resource.Manager.remove) Resource(" + 
				meta.enumToString(Resource.Type, resource.type) + ")(" + resource.name + ") is not added to the manager.");
			return;
		}

		if(!subBuffer[resource.name])
		{
			console.warn("(Resource.Manager.remove) Resource(" + 
				meta.enumToString(Resource.Type, resource.type) + ")(" + resource.name + ") is not added to the manager.");
			return;
		}

		subBuffer[resource.name] = null;
	},

	_updateLoading: function()
	{
		this.numToLoad--;
		this._chn_loadingUpdate.emit(this, Resource.Event.LOADING_UPDATE);

		if(this.numToLoad === 0) {
			this.numTotalToLoad = 0;
			this.loading = false;
			this._chn_loadingEnd.emit(this, Resource.Event.LOADING_END);
		}		
	},

	loadFile: function(path, onSuccess)
	{
		if(!this.loading) {
			this.loading = true;
			this._chn_loadingStart.emit(this, Resource.Event.LOADING_START);
		}

		this.numToLoad++;
		this.numTotalToLoad++;

		this._xhrOnSuccess = onSuccess;
		this._xhr.open("GET", path, true);
		this._xhr.send();
	},

	_loadFileStateChange: function()
	{
		if(this._xhr.readyState === 4)
		{
			if(this._xhr.status === 200) 
			{
				if(this._xhrOnSuccess) {
					this._xhrOnSuccess(this._xhr.response);
				}
			}

			this._updateLoading();
		}
	},

	/**
	 * Flag texture that must be loaded.
	 * @param resource {Resource.Basic} Resource to load. 
	 */
	addToLoad: function(resource)
	{
		if(!this.loading) {
			this.loading = true;
			this._chn_loadingStart.emit(this, Resource.Event.LOADING_START);
		}

		this.add(resource);
		resource.loading = true;

		resource.currStep = 0;
		this.numToLoad += resource.steps;
		this.numTotalToLoad += resource.steps;
	},

	/**
	 * Load resource to "inUse" buffer.
	 * @param resource {Resource.Basic}
	 */
	loadSuccess: function(resource)
	{
		var subBuffer = this.resourcesInUse[resource.type];
		if(!subBuffer) {
			subBuffer = [];
			this.resourcesInUse[resource.type] = subBuffer;
		}
		
		resource.currStep++;
		this.numLoaded++;

		resource.loading = false;
		resource.inUse = true;
		subBuffer.push(resource);

		this._chn_loaded.emit(resource, Resource.Event.LOADED);
		this._updateLoading();
	},

	/**
	 * Remove flag that resource is loading.
	 * @param resource {Resource.Basic}
	 */
	loadFailed: function(resource) 
	{
		this.numLoaded += resource.steps - resource.currStep;
		this._updateLoading();

		resource.loading = false;
	},

	nextStep: function(resource) 
	{
		if(resource.currStep < resource.steps) {
			resource.currStep++;
			this.numLoaded++;
			this._updateLoading();
		}
	},

	getResource: function(name, type)
	{
		var subBuffer = this.resources[type];
		if(!subBuffer) {
			return null;
		}

		var texture = subBuffer[name];
		if(!texture) {
			return null;
		}

		return texture;
	},


	/**
	 * Get texture by name.
	 * @param name {String} Name of the texture resource.
	 * @returns {Resource.Texture|null} Texture from the manager.
	 */
	getTexture: function(name)
	{
		var subBuffer = this.resources[Resource.Type.TEXTURE];
		if(!subBuffer) {
			return null;
		}

		var texture = subBuffer[name];
		if(!texture) {
			return null;
		}

		return texture;
	},

	/**
	 * Get sound by name.
	 * @param name {String} Name of the sound resource.
	 * @returns {Resource.Sound|null} Sound from the manager.
	 */
	getSound: function(name)
	{
		if(!name) {
			console.warn("[Resource.Manager.getSound]:", "No name specified.");
			return null;
		}

		var subBuffer = this.resources[Resource.Type.SOUND];
		if(!subBuffer) {
			return null;
		}

		var sound = subBuffer[name];
		if(!sound) {
			return null;
		}

		return sound;
	},	


	/**
	 * Add resource loading into queue to guarantee synchronous loading.
	 * @param resource {Resource.Basic} Resource to queue.
	 */
	addToQueue: function(resource) 
	{
		if(!this._syncQueue) {
			this._syncQueue = [];
		}

		this._syncQueue.push(resource);
	},

	/** 
	 * Load next resource from queue.
	 */
	loadNextFromQueue: function() 
	{
		this.isSyncLoading = false;

		if(!this._syncQueue || !this._syncQueue.length) { 
			return; 
		}

		this._syncQueue[this._syncQueue.length - 1].forceLoad(true);
		this._syncQueue.pop();
	},

	/**
	 * Callback on adapt event.
	 * @param data {*} Event data.
	 * @param event {*} Type of the event.
	 */
	onAdapt: function(data, event)
	{
		var unitRatio = meta.unitRatio;

		var texture;
		var textures = this.resources[Resource.Type.TEXTURE];
		for(var key in textures) {
			texture = textures[key];
			texture.unitRatio = unitRatio;
			texture.load();
		}
	},


	/**
	 * Get unique id.
	 * @return {number} Generated unique id.
	 */
	getUniqueID: function() {
		return ++this._uniqueID;
	},

	//
	_xhr: null,
	_xhrOnSuccess: null,

	resources: {},
	resourcesInUse: {},
	rootPath: "",

	numLoaded: 0,
	numToLoad: 0,
	numTotalToLoad: 0,

	_syncQueue: null,
	isSyncLoading: false,

	_chn_added: null,
	_chn_loaded: null,
	_chn_loadingStart: null,
	_chn_loadingEnd: null,
	_chn_loadingUpdate: null,
	_uniqueID: 0,

	loading: false
});
