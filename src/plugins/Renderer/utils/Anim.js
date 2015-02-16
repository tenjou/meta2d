"use strict";

meta.Anim = function()
{
	this.texture = null;
	this._tAnim = 0;
	this._frame = 0;	
	this._fps = 0;
	this.looped = false;
	this.__animIndex = -1;
};

meta.Anim.prototype =
{
	set: function(texture) 
	{
		if(!texture || !texture.animated) {
			meta.renderer.removeAnim(this);
			return;
		}

		console.log("set")

		this.texture = texture;	
		this.looped = texture.looped;
		this.reverse = texture.reverse;
		this._fps = texture.fps;

		if(this.reverse) {
			
		}
		else {
			this._frame = 0;
		}

		if(texture.autoPlay) {
			meta.renderer.addAnim(this);
		}
	},

	play: function(loop)
	{
		this.loop = loop || false;
		
		meta.renderer.addAnim(this);
	},

	pause: function()
	{
		meta.renderer.removeAnim(this);
	},

	resume: function()
	{
		meta.renderer.addAnim(this);
	},

	stop: function()
	{
		meta.renderer.removeAnim(this);
	},

	onEnd: null,

	anim: function(tDelta)
	{
//		if(this.animSpeed <= 0.0 || this._texture.numFrames < 2) { return; }

		var delay = 1.0 / (this.fps * this.animSpeed);

		this._tAnim += tDelta;
		if(this._tAnim < delay) { return; }

		var frames = this._tAnim / delay | 0;
		this._tAnim -= (delay * frames);

		meta.renderer.needRender = true;

		if(!this.reverse)
		{
			this._currFrame += frames;

			if(this._currFrame >= this._texture.frames)
			{
				if(this.pauseAtEnd) {
					this.animating = false;
					this._frame = this._texture.numFrames - 1;					
				}				
				else if(!this.isLoop && !this._texture.isLoop) {
					this.animating = false;
					this._frame = 0;
				}
				else {
					this._frame = this._frame % this._texture.frames;
				}

				if(this.onEnd) {
					this.onEnd();
				}
			}
		}
		else
		{
			this._frame -= frames;

			if(this._currFrame < 0)
			{
				if(this.pauseAtEnd) {
					this.isAnimating = false;
					this._currFrame = 0;
				}				
				else if(!this.isLoop && !this._texture.isLoop) {
					this.isAnimating = false;
					this._currFrame = this._texture.numFrames - 1;
				}
				else {
					this._currFrame = (this.texture.frames + this._frame) % this._texture.numFrames;
				}				

				if(this.onAnimEnd) {
					this.onAnimEnd();
				}
			}
		}
	},	

	updateSpeed: function() {
		th
	},

	set frame(frame) {
		this._frame = frame;
		meta.renderer.needRender = true;
	},

	get frame() { return this._frame; },

	set fps(fps) {
		this._fps = fps;
	},

	get fps() { this._fps; },

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
	speed: 1,
	reverse: false,
	animating: false
};
