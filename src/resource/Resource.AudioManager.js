"use strict";

meta.class("Resource.AudioManager", 
{
	init: function()
	{
		// Audio
		var audioProto = Resource.Sound.prototype;
		if(meta.device.audioAPI) 
		{
			this.context = new AudioContext();
			this.gainNode = this.context.createGain();
			this.gainNode.connect(this.context.destination);
			this.gainNode.gain.value = this._volume;

			audioProto._context = this.context;
			audioProto._loadFromPath = audioProto._loadFromPath_WebAudio;
			audioProto._createInstance = audioProto._createInstance_WebAudio;
			audioProto.steps = 2;

			if(meta.device.support.consoleCSS) 
			{
				console.log("%cAudio: %cWebAudio ", 
					"font-weight: bold; padding: 2px 0 2px 0;", 
					"padding: 2px 0 2px 0;");	
			}
			else {
				console.log("Audio: WebAudio");	
			}
		}
		else 
		{
			audioProto._loadFromPath = audioProto._loadFromPath_Audio;
			audioProto._createInstance = audioProto._createInstance_Audio;
			audioProto._syncLoading = true;

			if(meta.device.support.consoleCSS) 
			{
				console.log("%cAudio: %c<audio> ", 
					"font-weight: bold; padding: 2px 0 1px 0; width: 500px;", 
					"padding: 2px 0 1px 0;");
			}
			else {
				console.log("Audio: <audio>");
			}			
		}
	},

	set volume(value)
	{
		this._volume = meta.math.clamp(value, 0.0, 1.0);

		if(this._muted) {
			return;
		}
		
		if(meta.device.audioAPI) {		
			this.gainNode.gain.value = this._volume;
		}
		else 
		{
			var sounds = meta.resources.resources[Resource.Type.SOUND];
			for(var key in sounds) {
				sounds[key].volume = this._volume;
			}
		}
	},

	get volume() {
		return this._volume;
	},

	set muted(value) 
	{
		if(this._muted === value) { return; }
		this._muted = value;

		var volume;
		if(value) {
			volume = 0;
		}
		else {
			volume = this._volume;
		}

		if(meta.device.audioAPI) {
			this.gainNode.gain.value = volume;
		}
		else 
		{
			var sounds = meta.resources.resources[Resource.Type.SOUND];
			for(var key in sounds) {
				sounds[key].volume = volume;
			}
		}
	},

	get muted() {
		return this._muted;
	},

	//
	context: null,
	gainNode: null,

	_volume: 0.5,
	_muted: false
});
