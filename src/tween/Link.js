"use strict";

/**
 * Tweening library. Have dependency on Entity.Controller.
 * @class meta.Tween.Link
 * @property tween {Object} Tween who owns this link.
 * @property startValues {Object} Starting values of owner before tween.
 * @property endValues {Object} End values of owner after tween.
 * @property duration {Number} Duration of tween in milliseconds.
 * @property tDelay {Number} Wait time in milliseconds before next link is chosen.
 * @property tFrameDelay {Number} Wait time in milliseconds between frame update.
 * @property isRounding {Boolean} Flag if after tween frame value is rounded.
 * @memberof! <global>
 */
meta.Tween.Link = function(tween, endValues, duration, onComplete)
{
	this.tween = tween;
	this.startValues = {};
	this.endValues = endValues;
	this.duration = duration;
	this._onComplete = onComplete;
};

meta.Tween.Link.prototype =
{
	/**
	 * Start tweening.
	 * @returns {meta.Tween.Link}
	 */
	play: function() {
		this.tween.play();
		return this;
	},

	/**
	 * Stop tweening.
	 * @returns {meta.Tween.Link}
	 */
	stop: function() {
		this.tween.stop();
		return this;
	},

	/**
	 * Pause tween.
	 * @param value {Boolean=} Flag if pause or unpause.
	 * @returns {meta.Tween.Link}
	 */
	paused: function(value) {
		this.tween.paused(value);
		return this;
	},

	/**
	 * Resume paused tween.
	 * @returns {meta.Tween.Link}
	 */
	resume: function() {
		this.tween.resume();
		return this;
	},

	/**
	 * Clear all tweens.
	 * @returns {meta.Tween.Link}
	 */
	clear: function() {
		this.tween.clear();
		return this;
	},

	/**
	 * Reset tween to the first chain.
	 * @returns {meta.Tween}
	 */
	reset: function() {
		this.tween.reset();
		return this;
	},

	/**
	 * Update values.
	 * @param tElapsed {Number} Elapsed time.
	 */
	update: function(tElapsed)
	{
		var value = this._easing(tElapsed);
		var startValue, endValue, result;

		for(var key in this.endValues)
		{
			startValue = this.startValues[key];
			endValue = this.endValues[key];

			if(typeof(startValue) === "string") {
				endValue = startValue + parseFloat(endValue, 4);
			}

			result = startValue + (endValue - startValue) * value;
			if(this.isRounding) {
				result = Math.round(result);
			}

			this.tween.owner[key] = result;
		}
	},

	/**
	 * Select next tween as active.
	 * @returns {meta.Tween.Link}
	 */
	next: function() {
		this.tween.next();
		return this;
	},


	/**
	 * Wait before next action.
	 * @param tDelay {Number} Time to wait in milliseconds.
	 * @returns {meta.Tween.Link}
	 */
	wait: function(tDelay) {
		this.tDelay = tDelay;
		return this;
	},

	/**
	 * Delay between tween frames in milliseconds.
	 * @param tFrameDelay {Number} Time to wait in milliseconds.
	 * @returns {meta.Tween.Link}
	 */
	frameDelay: function(tFrameDelay) {
		this.tFrameDelay = tFrameDelay;
		return this;
	},

	/**
	 * Flag if number should be rounded after each frame.
	 * @param value {Boolean} Flag.
	 * @returns {meta.Tween.Link}
	 */
	round: function(value)
	{
		if(value === void(0)) {
			value = true;
		}

		this.isRounding = value;

		return this;
	},

	/**
	 * Repeat tween selected number of times.
	 * @param numRepeat {Number} Repeat times.
	 * @returns {meta.Tween.Link}
	 */
	repeat: function(numRepeat) {
		this.tween.repeat(numRepeat);
		return this;
	},

	/**
	 * Play reverse of tween on end.
	 * @param value
	 * @returns {meta.Tween.Link}
	 */
	reverse: function(value) {
		this.tween.reverse(value);
		return this;
	},

	/**
	 * Easing function. Usually will be chosen from meta.Easing presets.
	 * @param func {Function} Easing function.
	 * @returns {meta.Tween.Link}
	 */
	easing: function(func) 
	{
		if(typeof(func) === "function") {
			this._easing = func;
		}
		else {
			this._easing = meta.Tween.Easing[func];
		}
		
		return this;
	},

	/**
	 * Callback function which is called on start of tweening.
	 * @param func {Function} Callback function.
	 * @returns {meta.Tween.Link}
	 */
	onStart: function(func) {
		this._onStart = func;
		return this;
	},

	/**
	 * Callback function which is called when tween link is completed.
	 * @param func {Function} Callback function.
	 * @returns {meta.Tween.Link}
	 */
	onComplete: function(func) {
		this._onComplete = func;
		return this;
	},

	/**
	 * Callback function which is called on every frame update.
	 * @param func {Function} Callback function.
	 * @returns {meta.Tween.Link}
	 */
	onTick: function(func) {
		this._onTick = func;
		return this;
	},


	/**
	 * Create tween animation from entity starValues to endValues.
	 * @param endValues {Object} End values.
	 * @param duration {Number} Duration of animation in milliseconds.
	 * @param onComplete {Function} Callback function on complete.
	 * @returns {meta.Tween.Link}
	 */
	to: function(endValues, duration, onComplete) {
		return this.tween.to(endValues, duration, onComplete);
	},


	group: function(name, callback) {
		return this.tween.group(name, callback);
	},


	//
	_easing: meta.Tween.Easing.linear,
	_onStart: null,
	_onComplete: null,
	_onTick: null,

	tDelay: 0,
	tFrameDelay: 0,
	isRounding: false
};