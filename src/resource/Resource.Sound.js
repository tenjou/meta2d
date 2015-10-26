"use strict";

meta.class("Resource.Sound", "Resource.Basic", 
{
	onInit: function(data, tag)
	{
		this._instances = [];

		this._prepare();

		if(typeof(data) === "string") {
			this.load(data);
		}		
	},

	_prepare: null,

	_prepare_Audio: function()
	{
		var self = this;

		this._context = this._getInstance();
		this._context.audio.addEventListener("error", function() 
		{
			if(!self.format) {
				self._loadNextExtension();
			}
			else {
				self._onLoadFailed();
			}
		});	
		this._numInstancesUsed = 0;	
	},

	_prepare_WebAudio: function()
	{
		var self = this;

		this._request = new XMLHttpRequest();
		this._request.responseType = "arraybuffer";
		this._request.onreadystatechange = function() {
			self._onStateChange();
		}

		this._gainNode = meta.audio.context.createGain();
		this._gainNode.connect(meta.audio.gainNode);
	},

	load: function(path)
	{
		if(this.loading) { return; }

		// check if specific format is defined:
		var wildCardIndex = path.lastIndexOf(".");
		if(wildCardIndex !== -1 && (path.length - wildCardIndex) <= 5) {
			this.format = path.substr(wildCardIndex + 1, path.length - wildCardIndex - 1);
			this.path = meta.resources.rootPath + path.substr(0, wildCardIndex);
		}
		else {
			this.path = meta.resources.rootPath + path;
		}

		this.loading = true;
		this.loaded = false;

		meta.resources.addToLoad(this);
		this._loadNextExtension();
	},

	_loadNextExtension: function()
	{
		var path;
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

			path = this.path + "." + this.format;
		}
		else
		{
			this._requestFormat++;
			if(this._requestFormat > numFormats) {
				this._onLoadFailed();
				return;
			}

			path = this.path + "." + meta.device.audioFormats[this._requestFormat - 1];
		}

		this._loadFromPath(path);
	},

	//
	_loadFromPath: null,

	_loadFromPath_WebAudio: function(path) 
	{
		this._request.open("GET", path, true);
		this._request.send();
	},

	_loadFromPath_Audio: function(path) 
	{
		this._context.audio.src = path;
		this._context.audio.load();
	},

	//
	_onStateChange: function()
	{
		if(this._request.readyState === 4)
		{
			if(this._request.status === 200) 
			{
				meta.resources.nextStep(this);

				var self = this;
				this._context.decodeAudioData(this._request.response, 
					function(buffer) { self._onDecodeSuccess(buffer); },
					function(error) { self._onDecodeError(error); }
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

		this.loaded = true;
		meta.resources.loadSuccess(this);

		var instance;
		var numInstances = this._instances.length;
		for(var i = 0; i < numInstances; i++) {
			instance = this._instances[i];
			if(instance.autoPlay) {
				instance.play();
			}
		}
	},

	_onDecodeError: function(error) 
	{
		console.log(error)
		if(!this.format) {
			this.path += "." + meta.device.audioFormats[this._requestFormat - 1];
		}

		console.warn("(Resource.Sound.load) Error decoding file: " + this.path);

		this._loading = false;
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
		meta.resources.loadFailed(this);
	},	

	onEnd: null,

	play: function(looping, offset)
	{
		if(meta.audio.audioAPI) {
			this._gainNode.gain.value = this._volume;
		}

		var instance = this._getInstance();
		instance.play(looping, offset);	
	},

	stop: function()
	{
		if(meta.audio.audioAPI) {
			this._gainNode.gain.value = 0;
		}

		for(var i = 0; i < this._numInstancesUsed; i++) {
			this._instances[i].stop();
		}
	},

	pause: function()
	{
		if(meta.audio.audioAPI) {
			this._gainNode.gain.value = 0;
		}

		for(var i = 0; i < this._numInstancesUsed; i++) {
			this._instances[i].pause();
		}
	},

	resume: function()
	{
		if(meta.audio.audioAPI) {
			this._gainNode.gain.value = this._volume;
		}

		for(var i = 0; i < this._numInstancesUsed; i++) {
			this._instances[i].resume();
		}
	},	

	//
	_createInstance: null,

	_createInstance_WebAudio: function() {
		return new Resource.AudioInstance(this);
	},

	_createInstance_Audio: function() {
		return new Resource.AudioInstance_Audio(this);
	},

	_getInstance: function()
	{
		if(this._instances.length === this._numInstancesUsed) {
			this._instances.push(this._createInstance());
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
		this._instances[this._numInstancesUsed] = instance;
	},

	set volume(value) 
	{
		if(this._volume === value) { return; }
		this._volume = value;

		if(meta.audio.audioAPI) {
			this._gainNode.gain.value = value;
		}
		else
		{
			var numInstances = this._instances.length;
			for(var i = 0; i < numInstances; i++) {
				this._instances[i].volume = value;
			}	
		}
	},

	get volume() { return this._volume; },

	get playing() 
	{ 
		var instance = this._instances[0];
		if(!instance) {
			return false;
		}

		return instance.playing;
	},

	get paused() 
	{ 
		var instance = this._instances[0];
		if(!instance) {
			return false;
		}

		return instance.paused;
	},

	get looping() 
	{ 
		var instance = this._instances[0];
		if(!instance) {
			return false;
		}

		return instance.looping;
	},	

	get duration() 
	{
		if(meta.audio.audioAPI) 
		{
			if(this._buffer) { 
				return this._buffer.duration; 
			}
			else 
			{
				var instance = this._instances[0];
				if(!instance) {
					return 0;
				}

				return instance.audio.duration;
			}
		}

		return 0;
	},

	set currentTime(offset)
	{
		var instance = this._instances[0];
		if(!instance) {
			return;
		}

		instance.currentTime = offset;
	},

	get currentTime()
	{
		var instance = this._instances[0];
		if(!instance) {
			return 0;
		}

		return instance.currentTime;
	},

	//
	type: Resource.Type.SOUND,
	format: "",

	_instances: null,
	_numInstancesUsed: 0,

	_context: null,
	_buffer: null,

	_request: null,
	_requestFormat: 0,

	_gainNode: null,
	_volume: 1.0
});

Resource.AudioInstance = function(parent)
{
	this.parent = parent;
	this.id = -1;
	this.source = null;

	this.looping = false;
	this.paused = false;
	this.playing = false;
	this.offset = 0;

	this.tStart = 0;
	this.tPaused = 0;

	var self = this;
	this.onEndFunc = function() 
	{
		if(self.parent.onEnd) {
			self.parent.onEnd(self.parent);
		}

		if(!self.paused) 
		{
			if(self.looping) {
				self.source.disconnect();
				self.play(true, 0);
			}
			else {
				self.parent._clearInstance(self);
			}
		}
	};
};

Resource.AudioInstance.prototype =
{
	play: function(looping, offset)
	{
		looping = looping || false;
		offset = offset || 0;

		this.paused = false;

		if(!this.parent._loaded) {
			this.autoPlay = true;
			this.looping = looping;
			this.offset = offset;
		}
		else 
		{
			this.playing = true;

			if(!this.autoPlay) {
				this.looping = looping;
				this.offset = offset;
			}
			else {
				this.autoPlay = false;
			}		

			this.source = meta.audio.context.createBufferSource();
			this.source.buffer = this.parent._buffer;
			this.source.connect(this.parent._gainNode);
			this.source.onended = this.onEndFunc;

			if(this.offset < 0) {
				this.offset = 0;
			}
			else if(this.offset > this.source.buffer.duration) {
				this.offset = this.source.buffer.duration;
			}	
			
			this.source.start(0, this.offset);

			this.tStart = this.source.context.currentTime - this.offset;
		}
	},

	stop: function()
	{
		if(!this.source) { return; }

		this.paused = false;
		this.looping = false;

		this.source.stop(this.source.context.currentTime + 0.2);
	},

	pause: function()
	{
		if(this.paused) { return; }

		this.paused = true;

		if(this.playing) { 
			this.tPaused = this.source.context.currentTime - this.tStart;
		}
		else {
			this.tPaused = 0;
		}

		if(this.source) {
			this.source.disconnect(this.parent._gainNode);
			this.source.stop(0);
		}
	},

	resume: function() {
		this.play(this.looping, this.tPaused);
	},

	set currentTime(offset)
	{
		this.stop();
		this.play(this.looping, offset);
	},

	get currentTime() 
	{
		if(!this.playing) {
			return 0;
		}

		return this.source.context.currentTime - this.tStart;
	},

	//
	autoPlay: false
};

Resource.AudioInstance_Audio = function(parent)
{
	this.parent = parent;
	this.id = -1;

	this.looping = false;
	this.paused = false;
	this.playing = false;
	this.offset = 0;

	this.audio = new Audio();
	this.audio.preload = "auto";

	//
	this._canPlay = false;
	this._metaLoaded = false;
	this._loaded = false;

	var self = this;
	this._canPlayFunc = function() {
		self.audio.removeEventListener("canplaythrough", self._canPlayFunc);
		self._canPlay = true;
		if(meta.device.support.onloadedmetadata && self._metaLoaded) {
			self._onLoaded();
		}		
	};

	this._metaFunc = function() {
		self.audio.removeEventListener("loadedmetadata", self._metaFunc);
		self._metaLoaded = true;
		if(self.canPlay) {
			self._onLoaded();
		}
	};

	this._onEndedFunc = function() { 
		self._onEnd();
	};

	this._addEvents(parent);
};

Resource.AudioInstance_Audio.prototype =
{
	play: function(looping, offset) 
	{
		looping = looping || false;
		offset = offset || 0;

		this.paused = false;

		if(!this._loaded) {
			this.autoPlay = true;
			this.looping = looping;
			this.offset = offset;
		}
		else 
		{
			this.playing = true;

			if(!this.autoPlay) {
				this.looping = looping;
				this.offset = offset;
			}
			else {
				this.autoPlay = false;
			}

			this.audio.currentTime = this.offset;
			this.audio.play();
		}
	},

	stop: function() 
	{
		this.playing = false;
		this.audio.pause();
		this.parent._clearInstance(this);
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
		this.audio.addEventListener("canplaythrough", this._canPlayFunc, false);

		if(meta.device.support.onloadedmetadata) {			
			this.audio.addEventListener("loadedmetadata", this._metaFunc, false);			
		}

		this.audio.addEventListener("ended", this._onEndedFunc, false);

		if(this.parent._loaded) {
			this.audio.src = this.parent.fullPath;
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
			this.parent.fullPath = this.parent.path + "." + this.parent.format;

			var instance;
			var instances = this.parent._instances;
			var numInstances = this.parent._instances.length;
			for(var i = 1; i < numInstances; i++) {
				instance = instances[i];
				instance.audio.src = this.parent.fullPath;
				instance.audio.load();
			}			

			meta.resources.loadSuccess(parent);
			meta.resources.loadNextFromQueue();
		}

		this._loaded = true;
		if(this.autoPlay) {
			this.play(false, 0);
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
		var mixedVolume = value * meta.audio._volume;
		this.audio.volume = mixedVolume;
	},

	//
	autoPlay: false
};
