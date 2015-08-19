"use strict";

meta.class("Resource.Sound", "Resource.Basic", 
{
	onCreate: function(data, tag)
	{
		this._instances = [];

		// check if Web Audio API is supported:
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

		if(typeof(data) === "string")
		{
			var path;

			// check if specific format is defined:
			var wildCardIndex = data.lastIndexOf(".");
			if(wildCardIndex !== -1 && (data.length - wildCardIndex) <= 5) {
				this.format = data.substr(wildCardIndex + 1, data.length - wildCardIndex - 1);
				path = meta.resources.rootPath + data.substr(0, wildCardIndex);
			}
			else {
				path = meta.resources.rootPath + data;
			}

			this.load(path);
		}		
	},

	load: function(path)
	{
		if(this.loading) { return; }

		this.loading = true;
		this.loaded = false;
		this.path = path;

		meta.resources.addToLoad(this);
		this._loadNextExtension();
	},

	_loadNextExtension: function()
	{
		var url;
		var formats = meta.device.audioFormats;
		var numFormats = formats.length;

		if(this.format) 
		{
			var supported = false;

			for(var n = 0; n < numFormats; n++) 
			{
				if(this.format === formats[n]) {
					supported = true;
					break;
				}
			}

			if(!supported) {
				console.log("(Resource.Sound) Trying to load unsupported sound format: " + this.format);
				this._onLoadFailed();
				return;
			}

			url = this.path + "." + this.format;
		}
		else
		{
			this._requestFormat++;
			if(this._requestFormat > numFormats) {
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
		this._loading = false;
		this._clear();
	
		this.loaded = true;
		meta.resources.loadSuccess(this);

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

		console.warn("(Resource.Sound.load) Error decoding file: " + this.path);

		this._loading = false;
		this._clear();
		meta.resources.loadFailed(this);
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

		console.warn("(Resource.Sound.load) Error loading file: " + this.path);

		this._loading = false;
		this._clear();
		meta.resources.loadFailed(this);
	},	


	// play: function(looping, time)
	// {
	// 	looping = looping || false;
	// 	time = time || 0;

	// 	var instance = this._getInstance();
	// 	instance.looping = looping;

	// 	if(!this._loaded) {
	// 		return instance;
	// 	}
	// 	else {
	// 		this._createSource(instance);
	// 	}

	// 	time += this._context.currentTime;
	// 	instance.gainNode.gain.value = instance._mixedVolume;
	// 	instance.source.loop = instance.looping;
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


	play: function(looping, time) 
	{
		var instance = this._getInstance();
		instance.looping = looping || false;
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
		source.loop = instance._loaded;
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

	get playing() 
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

	_autoLooping: false,
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
	this.playing = false;
	this.looping = false;
	this._canPlay = false;
	this._metaLoaded = false;
	this._loaded = false;

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
		this.playing = true;

		this._loaded = true;
		if(this._loaded) {
			this.audio.currentTime = time || 0;
			this.audio.play();
		}
		else {
			this._autoPlay = true;
		}
	},

	stop: function() {
		this.playing = false;
		this.looping = false;
		this.audio.pause();
		this.parent._clearInstance(this);
	},

	_stop: function() {
		this.playing = false;
		this.looping = false;
		this.audio.pause();
	},

	pause: function() {
		this.playing = false;
		this.audio.pause();
	},

	resume: function() {
		this.playing = true;
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

		if(this.parent._loaded) {
			this.audio.src = this.parent.path;
			this.audio.load();
		}		
	},

	_onLoaded: function()
	{
		if(!this.parent._loaded) 
		{
			if(!this.parent.format) {
				this.parent.path += "." + meta.device.audioFormats[this.parent._requestFormat - 1];
			}			

			this.parent._loading = false;
			this.parent.loaded = true;

			var instance;
			var instances = this.parent._instances;
			var numInstances = this.parent._instances.length;
			for(var i = 1; i < numInstances; i++) {
				instance = instances[i];
				instance.audio.src = this.parent.path;
				instance.audio.load();
			}			

			meta.resources.loadSuccess(parent);
			meta.resources.loadNextFromQueue();
		}

		this._loaded = true;
		if(this._autoPlay) {
			this.audio.play();
		}
	},

	_onEnd: function()
	{
		if(this.looping) {
			
			this.audio.play();
			this.audio.currentTime = 0;
		}
		else 
		{
			if(this.playing) {
				this.playing = false;
				this.parent._clearInstance(this);
			}
		}
	},


	set currentTime(time)
	{
		if(!this.playing) {
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
