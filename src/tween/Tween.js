"use strict";

/**
 * Tweening library. Have dependency on Entity.Controller.
 * @class meta.Tween
 * @property owner {Object} Object to tween.
 * @proeprty chain {Array} Buffer with meta.Tween.Link.
 * @property linkIndex {Number} Current index of the link from the chain.
 * @property currLink {meta.Tween.Link} Current active link.
 * @property numRepeat {Number} Number of repeat times.
 * @memberof! <global>
 */
meta.Tween = function() {
	this.cache = null;
	this.chain = [];
};

meta.Tween.prototype =
{
	/**
	 * Start tweening.
	 * @returns {meta.Tween}
	 */
	play: function()
	{
		if(!this.cache) {
			this.autoPlay = true;
		}
		else
		{
			var cache = this.cache;

			// If owner is removed or simply not set.
			if(!cache.owner) { return this; }
			if(cache.owner.isRemoved) { return this; }

			cache.isPaused = false;
			this.next();
			this._play();
			this.cache = null;
		}

		return this;
	},

	_play: function() 
	{	
		if(Renderer.ctrl._addToUpdating(this.cache) && this._group) {
			this._group.activeUsers++;
		}
	},

	/**
	 * Stop tweening.
	 * @returns {meta.Tween}
	 */
	stop: function(callCB)
	{
		this.linkIndex = 0;
		this._stop(callCB);	

		if(this.cache) {
			this.autoPlay = false;
			this.cache = null;	
		}			
	
		return this;
	},

	_stop: function(callCB) 
	{
		if(Renderer.ctrl._removeFromUpdating(this.cache)) 
		{
			if(callCB) {
				callCB(this.cache.owner);
			}
			if(this.cache.currLink._onDone) {
				this.cache.currLink._onDone.call(this.cache.owner);
			}	

			if(this._group)
			{
				this._group.activeUsers--;
				if(this._group.activeUsers === 0 && this._group.callback) {
					this._group.callback();
				}
			}
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

		this.cache.isPaused = value;

		return this;
	},

	/**
	 * Resume paused tween.
	 * @returns {meta.Tween}
	 */
	resume: function() {
		this.cache.isPaused = false;
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

		if(this._group) {
			this._group.users--;
			this._group = null;
		}

		return this;
	},


	/**
	 * Reset tween to the first chain.
	 * @returns {meta.Tween}
	 */
	reset: function()
	{
		var cache = this.cache;
		cache.linkIndex = 0;
		cache.currLink = this.chain[0];

		if(!cache.currLink) { return this; }

		for(var key in cache.currLink.startValues) {
			cache.owner[key] = cache.currLink.startValues[key];
		}

		this.stop(false);

		return this;
	},

	/**
	 * Select next tween as active.
	 * @returns {meta.Tween}
	 */
	next: function()
	{
		var isRepeating = false;
		var cache = this.cache;

		if(cache.linkIndex === this.chain.length)
		{
			if(cache.numRepeat === 0) {
				this.stop();
				return this;
			}
			else
			{
				cache.linkIndex = 0;
				if(cache.numRepeat !== -1) 
				{
					cache.numRepeat--;
					if(cache.numRepeat === 0) {
						this.stop();
						return this;
					}
				}
				
				isRepeating = true;
			}

			if(cache.currLink._onDone) {
				cache.currLink._onDone.call(cache.owner);
			}
		}

		cache._isLinkDone = false;

		var key;
		var link = this.chain[cache.linkIndex++];
		var owner = cache.owner;

		if(!isRepeating)
		{
			for(key in link.endValues) {
				link.startValues[key] = owner[key];
			}
		}
		else
		{
			for(key in link.startValues) {
				owner[key] = link.startValues[key];
			}
		}

		if(link._onStart) {
			link._onStart.call(this);
		}

		cache._tStart = meta.engine.tNow;
		cache.currLink = link;

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

		this.cache.numRepeat = numRepeat;

		return this;
	},

	/**
	 * Play reverse of tween on end.
	 * @param value {Boolean}
	 * @returns {meta.Tween}
	 */
	set reverse(value)
	{
		if(value === void(0)) {
			value = true;
		}

		this.cache.isReverse = value;
		return this;
	},

	get reverse() {
		return this.cache.isReverse;
	},


	/**
	 * Update tween animation.
	 * @param tDelta {Number} Time between frames.
	 */
	update: function(tDelta)
	{
		var cache = this.cache;
		if(!cache.currLink) {
			this.stop(false);
			return;
		}

		var tCurr = meta.engine.tNow;
		var tFrameDelta = tCurr - cache._tFrame;

		if(tFrameDelta < cache.currLink.tFrameDelay) {
			return;
		}

		var tElapsed = (tCurr - cache._tStart) / cache.currLink.duration;
		if(tElapsed > 1.0) {
			tElapsed = 1.0;
		}

		if(cache._isLinkDone)
		{
			if(tFrameDelta < cache.currLink.tDelay) {
				return;
			}
		}
		else
		{
			cache._tFrame = tCurr;
			cache.currLink.update(tElapsed);

			if(cache.currLink._onTick) {
				cache.currLink._onTick.call(this);
			}
		}

		if(tElapsed === 1.0)
		{
			if(!cache._isLinkDone && cache.currLink.tDelay > 0) {
				cache._isLinkDone = true;
				return;
			}

			this.next();
		}
	},


	/**
	 * Create tween animation from owner starValues to endValues.
	 * @param endValues {Object} End values.
	 * @param duration {Number} Duration of animation in milliseconds.
	 * @param onDone {Function} Callback function on complete.
	 * @returns {meta.Link}
	 */
	to: function(endValues, duration, onDone)
	{
		var link = new meta.Tween.Link(this, endValues, duration, onDone);
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


	/**
	 * Add group to the tween.
	 * @param group {meta.Tween.Group} Group object.
	 * @returns {meta.Tween.Link}
	 */
	group: function(group) 
	{
		if(!group) {
			console.warn("[meta.Tween.group]:", "No group name specified.");
			return this;
		}

		if(this._group) {
			console.warn("[meta.Tween.group]:", "Tween already is part of a group.");
			return this;			
		}

		if(typeof(group) === "object") {
			this._group = group;
		}

		this._group.users++;

		return this;
	},


	//
	autoPlay: false,

	_group: null,
	_isReversing: false,
	_removeFlag: 0
};

meta.Tween.Cache = function(owner) 
{
	this.owner = owner;
	this.tween = null;

	this.linkIndex = 0;
	this.currLink = null;
	this.numRepeat = 0;

	this._updateNodeID = -1;
	this._isLinkDone = false;
	this._tStart = 0;
	this._tFrame = 0;	
};

meta.Tween.Cache.prototype = 
{
	update: function(tDelta) {
		this.tween.cache = this;
		this.tween.update(tDelta);
		this.tween.cache = null;
	},

	//
	isPaused: false,
	isRemoved: false,
	reverse: false,
	_flags: 0
};

meta.Tween.Group = function(name, callback) 
{
	if(typeof(name) === "function") {
		callback = name;
		name = "";
	}

	this.name = name;
	this.users = 0;
	this.activeUsers = 0;
	this.callback = callback || null;
};
