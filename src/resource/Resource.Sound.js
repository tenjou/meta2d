"use strict";

meta.class("Resource.Sound", "Resource.Basic", 
{
	init: function(param, path)
	{
		if(typeof(param) === "string") {
			path = param;
			param = void(0);
		}

		if(path)
		{
			// Check if specific format is defined.
			var wildCardIndex = path.lastIndexOf(".");
			if(wildCardIndex !== -1 && (path.length - wildCardIndex) <= 5) {
				this.format = path.substr(wildCardIndex + 1, path.length - wildCardIndex - 1);
				path = path.substr(0, wildCardIndex);
			}

			this.path = meta.resources.rootPath + path;
		}	

		this._instances = [];

		// If Web Audio API is supported.
		var self = this;
		if(meta.device.isAudioAPI)
		{	
			this._request = new XMLHttpRequest();
			this._request.responseType = "arraybuffer";
			this._request.onreadystatechange = function() {
				self._onStateChange();
			}
		}
		else 
		{
			this._context = this._getInstance();
			this._context.audio.addEventListener("error", function() {
				if(!self.format) {
					self._loadNextExtension();
				}
				else {
					self._onLoadFailed();
				}
			});	
			this._numInstancesUsed = 0;			
		}
	},

	load: function()
	{
		if(this.loading) { return; }

		this.loading = true;
		this.loaded = false;

		var resourceCtrl = meta.resources;
		resourceCtrl.addToLoad(this);
		if(!resourceCtrl.isSyncLoading)
		{
			if(!this.syncLoading) {
				resourceCtrl.isSyncLoading = true;
			}
			
			this._loadNextExtension();
		}
		else {
			resourceCtrl.addToQueue(this);
		}
	},

	forceLoad: function() {
		this._loadNextExtension();
	},


	_loadNextExtension: function()
	{
		var url;

		if(this.format) {
			url = this.path;
		}
		else
		{
			var audioFormats = meta.device.audioFormats;

			this._requestFormat++;
			if(this._requestFormat > audioFormats.length) {
				this._onLoadFailed();
				return;
			}

			url = this.path + "." + meta.device.audioFormats[this._requestFormat - 1];
		}

		this._loadFromUrl(url);
	},


	_loadFromUrl: function(url) {
		this._request.open("GET", url, true);
		this._request.send();
	},

	_loadFromUrl_legacy: function(url) {
		this._context.audio.src = url;
		this._context.audio.load();
	},	


	_clear: function() {
		this._request.onreadystatechange = null;
		this._request = null;
	},

	_clear_legacy: function() {},


	_onStateChange: function()
	{
		if(this._request.readyState === 4)
		{
			if(this._request.status === 200) 
			{
				var self = this;
				this._context.decodeAudioData(this._request.response, 
					function(buffer) { self._onDecodeSuccess(buffer); },
					function() { self._onDecodeError(); }
				);
				this._request = null;
			}
			else 
			{
				if(!this.format) {
					this._loadNextExtension();
				}
				else {
					this._onLoadFailed();
				}
			}
		}		
	},

	_onDecodeSuccess: function(buffer)
	{
		if(!this.format) {
			this.path += "." + meta.device.audioFormats[this._requestFormat - 1];
		}

		this._buffer = buffer;
		this._isLoading = false;
		this._clear();
	
		this.isLoaded = true;
		Resource.ctrl.loadSuccess(this);

		var numInstances = this._instances.length;
		for(var i = 0; i < numInstances; i++) {
			this._createSource(this._instances[i]);
		}
	},

	_onDecodeError: function() 
	{
		if(!this.format) {
			this.path += "." + meta.device.audioFormats[this._requestFormat - 1];
		}

		console.warn("[Resource.Sound.load]:", "Error decoding file: " + this.path);

		this._isLoading = false;
		this._clear();
		Resource.ctrl.loadFailed(this);
	},

	_onLoadFailed: function()
	{
		if(!this.format) 
		{
			var format = meta.device.audioFormats[this._requestFormat - 1];
			if(format) {
				this.path += "." + format;
			}
		}

		console.warn("[Resource.Sound.load]:", "Error loading file: " + this.path);

		this._isLoading = false;
		this._clear();
		Resource.ctrl.loadFailed(this);
	},	


	// play: function(isLoop, time)
	// {
	// 	isLoop = isLoop || false;
	// 	time = time || 0;

	// 	var instance = this._getInstance();
	// 	instance.isLoop = isLoop;

	// 	if(!this._isLoaded) {
	// 		return instance;
	// 	}
	// 	else {
	// 		this._createSource(instance);
	// 	}

	// 	time += this._context.currentTime;
	// 	instance.gainNode.gain.value = instance._mixedVolume;
	// 	instance.source.loop = instance.isLoop;
	// 	instance.source.start(0);

	// 	return instance;
	// },

	// stop: function()
	// {
	// 	for(var i = 0; i < this._numInstancesUsed; i++) {
	// 		this._instances[i].source.stop();
	// 	}
	// },

	// pause: function()
	// {
		
	// },


	play: function(isLoop, time) 
	{
		var instance = this._getInstance();
		instance.isLoop = isLoop || false;
		instance.play(time);
	},

	stop: function()
	{
		for(var i = 0; i < this._numInstancesUsed; i++) {
			this._instances[i]._stop();
		}
		this._numInstancesUsed = 0;
	},

	pause: function()
	{
		for(var i = 0; i < this._numInstancesUsed; i++) {
			this._instances[i].pause();
		}
	},

	resume: function()
	{
		for(var i = 0; i < this._numInstancesUsed; i++) {
			this._instances[i].resume();
		}
	},	


	_createSource: function(instance) 
	{
		var gainNode = this._context.createGain();
		gainNode.connect(this._context.destination);

		var source = this._context.createBufferSource();
		source.buffer = this._buffer;
		source.loop = instance._isLoop;
		source.connect(gainNode);
		if(!source.start) {
			source.start = source.noteOn;
		}	
		if(!source.stop) {
			source.stop = source.noteOff;
		}		

		var self = this;
		source.onended = function() {
			self._clearInstance(instance);
		};				

		instance.source = source;
		instance.gainNode = gainNode;

		return source;
	},	


	_createInstance: function() {
		return new Resource.AudioInstance();
	},

	_createInstance_legacy: function() {
		return new Resource.AudioInstance_legacy(this);
	},


	_getInstance: function()
	{
		if(this._instances.length === this._numInstancesUsed) {
			this._instances.length += 1;
			this._instances[this._numInstancesUsed] = this._createInstance();
		}

		var instance = this._instances[this._numInstancesUsed];
		instance.id = this._numInstancesUsed;
		this._numInstancesUsed++;

		return instance;
	},

	_clearInstance: function(instance)
	{
		this._numInstancesUsed--;

		var lastInstance = this._instances[this._numInstancesUsed];
		lastInstance.id = instance.id;
		this._instances[instance.id] = lastInstance;
	},


	set volume(value) 
	{
		if(this._volume === value) { return; }
		this._volume = value;

		var numInstances = this._instances.length;
		for(var i = 0; i < numInstances; i++) {
			this._instances[i].volume = value;
		}
	},

	get volume() { return this._volume; },

	get isPlaying() 
	{ 
		if(this._numInstancesUsed > 0) {
			return true;
		}
		return false;
	},


	//
	type: Resource.Type.SOUND,
	format: "",

	_instances: null,
	_numInstancesUsed: 0,

	_autoIsLoop: false,
	_autoTime: 0,

	_context: null,
	_buffer: null,

	_request: null,
	_requestFormat: 0,

	_volume: 1.0,

	_isInQueue: false,
	_syncLoading: false
});

Resource.AudioInstance = function()
{
	this.id = -1;
	this.source = null;
	this.gainNode = null;
	this.auto;
	this._volume = 1.0;
	this._mixedVolume = 1.0;
};

Resource.AudioInstance.prototype =
{
	set volume(value) {
		this._mixedVolume = this._volume * value;
		this.gainNode.gain.value = this._mixedVolume;
	},

	get volume() { return this._volume; },
	get mixedVolume() { return this._mixedVolume; }
};

Resource.AudioInstance_legacy = function(parent)
{
	this.id = -1;
	this.parent = parent;
	this.isPlaying = false;
	this.isLoop = false;
	this._canPlay = false;
	this._metaLoaded = false;
	this._isLoaded = false;

	this._volume = 1.0;
	this._mixedVolume = 1.0;	

	this.audio = new Audio();
	this.audio.preload = "auto";

	this._addEvents(parent);
};

Resource.AudioInstance_legacy.prototype =
{
	play: function(time) 
	{
		this.isPlaying = true;

		if(this._isLoaded) {
			this.audio.currentTime = time || 0;
			this.audio.play();
		}
		else {
			this._autoPlay = true;
		}
	},

	stop: function() {
		this.isPlaying = false;
		this.isLoop = false;
		this.audio.pause();
		this.parent._clearInstance(this);
	},

	_stop: function() {
		this.isPlaying = false;
		this.isLoop = false;
		this.audio.pause();
	},

	pause: function() {
		this.isPlaying = false;
		this.audio.pause();
	},

	resume: function() {
		this.isPlaying = true;
		this.audio.play();
	},


	_addEvents: function() 
	{
		var self = this;

		var canPlayFunc = function() {
			self.audio.removeEventListener("canplaythrough", canPlayFunc);
			self._canPlay = true;
			if(meta.device.support.onloadedmetadata && self._metaLoaded) {
				self._onLoaded();
			}		
		};
		this.audio.addEventListener("canplaythrough", canPlayFunc, false);

		if(meta.device.support.onloadedmetadata)
		{
			var metaFunc = function() {
				self.audio.removeEventListener("loadedmetadata", metaFunc);
				self._metaLoaded = true;
				if(self._canPlay) {
					self._onLoaded();
				}
			};
			this.audio.addEventListener("loadedmetadata", metaFunc, false);			
		}

		this.audio.addEventListener("ended", function() { 
			self._onEnd(); 
		}, false);

		if(this.parent._isLoaded) {
			this.audio.src = this.parent.path;
			this.audio.load();
		}		
	},

	_onLoaded: function()
	{
		if(!this.parent._isLoaded) 
		{
			if(!this.parent.format) {
				this.parent.path += "." + meta.device.audioFormats[this.parent._requestFormat - 1];
			}			

			this.parent._isLoading = false;
			this.parent.isLoaded = true;

			var instance;
			var instances = this.parent._instances;
			var numInstances = this.parent._instances.length;
			for(var i = 1; i < numInstances; i++) {
				instance = instances[i];
				instance.audio.src = this.parent.path;
				instance.audio.load();
			}			

			Resource.ctrl.loadSuccess(parent);
			Resource.ctrl.loadNextFromQueue();
		}

		this._isLoaded = true;
		if(this._autoPlay) {
			this.audio.play();
		}
	},

	_onEnd: function()
	{
		if(this.isLoop) {
			
			this.audio.play();
			this.audio.currentTime = 0;
		}
		else 
		{
			if(this.isPlaying) {
				this.isPlaying = false;
				this.parent._clearInstance(this);
			}
		}
	},


	set currentTime(time)
	{
		if(!this.isPlaying) {
			this.audio.play();
			this.audio.currentTime = time || 0;
			this.audio.pause();
		}
		else {
			this.audio.currentTime = time || 0;
		}
	},

	get currentTime() {
		return this.audio.currentTime;
	},


	set volume(value) 
	{
		if(value > 1.0) { value = 1.0; }
		else if(value < 0.0) { value = 0.0; }

		this._mixedVolume = this._volume * value;
		this.audio.volume = this._mixedVolume;
	},

	get volume() { return this._volume; },
	get mixedVolume() { return this._mixedVolume; },


	//
	_autoPlay: false
};
