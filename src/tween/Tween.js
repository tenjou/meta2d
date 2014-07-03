"use strict";

/**
 * Tweening library. Have dependency on Entity.Controller.
 * @class meta.Tween
 * @property owner {Object} Object to tween.
 * @proeprty chain {Array} Buffer with meta.Tween.Link.
 * @property linkIndex {Number} Current index of the link from the chain.
 * @property currLink {meta.Tween.Link} Current active link.
 * @property numRepeat {Number} Number of repeat times.
 * @property isPaused {Boolean} Flag if tween is paused.
 * @property doReverse {Boolean} Flag if play tween chain in reverse after it's complete.
 * @memberof! <global>
 */
meta.Tween = function(owner)
{
	this.owner = owner;
	this.chain = [];
	this.linkIndex = 0;
	this.currLink = null;

	this._updateNodeID = -1;
	this._tStart = 0;
	this._tFrame = 0;
};

meta.Tween.prototype =
{
	/**
	 * Start tweening.
	 * @returns {meta.Tween}
	 */
	play: function()
	{
		if(this.owner.isRemoved) { return this; }

		this.isPaused = false;
		this.next();
		this._play();

		return this;
	},

	_play: function()
	{
		if(!this._parent && this._updateNodeID === -1) {
			Entity.ctrl._addToUpdating(this);
		}
	},

	/**
	 * Stop tweening.
	 * @returns {meta.Tween}
	 */
	stop: function()
	{
		this.linkIndex = 0;
		this._stop();
		return this;
	},

	_stop: function()
	{
		if(!this._parent && this._updateNodeID !== -1) {
			Entity.ctrl._removeFromUpdating(this);
		}
	},

	/**
	 * Pause tween.
	 * @param value {Boolean=} Flag if pause or unpause.
	 * @returns {meta.Tween}
	 */
	paused: function(value)
	{
		if(value === void(0)) {
			value = true;
		}

		this.isPaused = value;

		return this;
	},

	/**
	 * Resume paused tween.
	 * @returns {meta.Tween}
	 */
	resume: function() {
		this.isPaused = false;
		return this;
	},

	/**
	 * Clear all tweens.
	 * @returns {meta.Tween}
	 */
	clear: function()
	{
		this.stop();
		this._tStart = 0;
		this.chain.length = 0;
		this.linkIndex = 0;
		this.currLink = null;

		return this;
	},


	/**
	 * Reset tween to the first chain.
	 * @returns {meta.Tween}
	 */
	reset: function()
	{
		this.linkIndex = 0;
		this.currLink = this.chain[0];

		if(!this.currLink) { return this; }

		for(var key in this.currLink.startValues) {
			this.owner[key] = this.currLink.startValues[key];
		}

		this.stop();

		return this;
	},

	/**
	 * Select next tween as active.
	 * @returns {meta.Tween}
	 */
	next: function()
	{
		var isRepeating = false;

		if(this.linkIndex === this.chain.length)
		{
			if(this.numRepeat === 0) {
				this.stop();
				return this;
			}
			else
			{
				this.linkIndex = 0;
				if(this.numRepeat !== -1) {
					this.numRepeat--;
				}

				isRepeating = true;
			}
		}

		this._isLinkDone = false;

		var key;
		var link = this.chain[this.linkIndex++];

		if(!isRepeating)
		{
			for(key in link.endValues) {
				link.startValues[key] = this.owner[key];
			}
		}
		else
		{
			for(key in link.startValues) {
				this.owner[key] = link.startValues[key];
			}
		}

		if(link._onStart) {
			link._onStart.call(this);
		}

		this._tStart = window.performance.now();
		this.currLink = link;

		return this;
	},

	/**
	 * Repeat tween selected number of times.
	 * @param numRepeat {Number=} Repeat times. For infinite repeating use -1 (which is by default).
	 * @returns {meta.Tween}
	 */
	repeat: function(numRepeat)
	{
		if(numRepeat === void(0)) {
			numRepeat = -1;
		}

		this.numRepeat = numRepeat;

		return this;
	},

	/**
	 * Play reverse of tween on end.
	 * @param value {Boolean}
	 * @returns {meta.Tween}
	 */
	reverse: function(value)
	{
		if(value === void(0)) {
			value = true;
		}

		this.doReverse = value;

		return this;
	},


	/**
	 * Update tween animation.
	 * @param tDelta {Number} Time between frames.
	 */
	update: function(tDelta)
	{
		if(!this.currLink) {
			this.stop();
			return;
		}

		var tCurr = window.performance.now();
		if(tCurr - this._tFrame < this.currLink.tFrameDelay) {
			return;
		}

		var tElapsed = (tCurr - this._tStart) / this.currLink.duration;
		if(tElapsed > 1.0) {
			tElapsed = 1.0;
		}

		if(this._isLinkDone)
		{
			if(tCurr - this._tFrame < this.currLink.tDelay) {
				return;
			}
		}
		else
		{
			this._tFrame = tCurr;
			this.currLink.update(tElapsed);

			if(this.currLink._onTick) {
				this.currLink._onTick.call(this);
			}
		}

		if(tElapsed === 1.0)
		{
			if(!this._isLinkDone && this.currLink.tDelay > 0) {
				this._isLinkDone = true;
				return;
			}

			if(this.currLink._onComplete) {
				this.currLink._onComplete.call(this, this.owner);
			}

			this.next();
		}
	},


	/**
	 * Create tween animation from owner starValues to endValues.
	 * @param endValues {Object} End values.
	 * @param duration {Number} Duration of animation in milliseconds.
	 * @param onComplete {Function} Callback function on complete.
	 * @returns {meta.Link}
	 */
	to: function(endValues, duration, onComplete)
	{
		var link = new meta.Tween.Link(this, endValues, duration, onComplete);
		this.chain.push(link);
		return link;
	},

	/**
	 * Wait before next action.
	 * @param tDelay {Number} Time to wait in milliseconds.
	 * @returns {meta.Tween.Link}
	 */
	wait: function(tDelay)
	{
		var link = this.to(null, 0, null);
		link.wait(tDelay);
		return link;
	},


	//
	numRepeat: 0,
	isPaused: false,
	doReverse: false,
	_isLinkDone: false,
	_isReversing: false
};