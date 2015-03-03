"use strict";

meta.Anim = function() {
	this.texture = null;
};

meta.Anim.prototype =
{
	set: function(texture) 
	{
		// If texture was removed from entity:
		if(!texture) 
		{
			if(this.__index !== -1) {
				meta.renderer.removeAnim(this);
			}
			this.texture = null;
			return;
		}

		if(texture.frames > 1)
		{
			this.texture = texture;
			this.fps = texture.fps;	

			if(this.reverse) {
				this._frame = texture.frames - 1;
			}
			else {
				this._frame = 0;
			}

			// If texture is animated but not animating:
			if(this.autoPlay && this.__index === -1) {		
				meta.renderer.addAnim(this);
			}			
		}
		else if(this.__index !== -1) {
			meta.renderer.removeAnim(this);	
		}
	},

	play: function(loop) 
	{
		this.loop = loop || false;

		meta.renderer.addAnim(this);
	},

	pause: function() {
		meta.renderer.removeAnim(this);
	},

	resume: function() {
		meta.renderer.addAnim(this);
	},

	stop: function()
	{
		if(this.reverse) {
			this._frame = texture.frames - 1;
		}
		else {
			this._frame = 0;
		}

		meta.renderer.removeAnim(this);
	},

	onEnd: null,

	anim: function(tDelta)
	{
		this.__tAnim += tDelta;
		if(this.__tAnim < this.__delay) { return; }

		var frames = this.__tAnim / this.__delay | 0;
		this.__tAnim -= (frames * this.__delay);

		meta.renderer.needRender = true;

		if(!this.reverse)
		{
			this._frame += frames;

			if(this._frame >= this.texture.frames)
			{
				if(this.pauseLastFrame) {
					meta.renderer.removeAnim(this);
					this._frame = this.textures.frames - 1;					
				}				
				else if(!this.loop) {
					meta.renderer.removeAnim(this);
					this._frame = 0;
				}
				else {
					this._frame = this._frame % this.texture.frames;
				}

				if(this.onEnd) {
					this.onEnd();
				}
			}
		}
		else
		{
			this._frame -= frames;

			if(this._frame < 0)
			{
				if(this.pauseLastFrame) {
					meta.renderer.removeAnim(this);
					this._frame = 0;
				}				
				else if(!this.loop) {
					meta.renderer.removeAnim(this);
					this._frame = this.texture.frames - 1;
				}
				else {
					this._frame = (this.texture.frames + this._frame) % this.texture.frames;
				}				

				if(this.onEnd) {
					this.onEnd();
				}
			}
		}
	},	

	set frame(frame) {
		this._frame = frame;
		meta.renderer.needRender = true;
	},

	get frame() { return this._frame; },

	set fps(fps) {
		this._fps = fps;
		this.__delay = 1.0 / (fps * this._speed);
	},

	get fps() { this._fps; },

	set speed(speed) {
		this._speed = speed;
		this.__delay = 1.0 / (fps * this._speed);
	},

	get speed() { return this._speed; },

	set paused(value) 
	{
		if(value) {
			this.pause();
		}
		else {
			this.resume();
		}
	},

	get paused() {
		return true;
	},

	//
	loop: true,
	reverse: false,
	autoPlay: true,
	pauseLastFrame: false,
	_fps: 0,
	_speed: 1,
	_frame: 0,
	__index: -1,
	__removed: 0,
	__delay: 0,
	__tAnim: 0
};