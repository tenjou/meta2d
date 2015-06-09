"use strict";

/**
 * Tweening library. Have dependency on Entity.Controller.
 * @class
 * @param owner {Object} Object to tween.
 * @param chain {Array} Buffer with meta.Tween.Link.
 * @param numRepeat {Number} Number of repeat times.
 */
meta.Tween = function() {
	this.cache = null;
	this.chain = [];
};

meta.Tween.prototype =
{
	/**
	 * Start tweening.
	 * @return {meta.Tween}
	 */
	play: function()
	{
		if(!this.cache) {
			this.autoPlay = true;
		}
		else
		{
			var cache = this.cache;

			// If owner is removed or simply not set:
			if(!cache.owner) { return this; }
			if(cache.owner.removed) { return this; }

			cache.paused = false;
			cache.numRepeat = this.numRepeat;
			this.next();
			this._play();
			this.cache = null;
		}

		return this;
	},

	_play: function() 
	{	
		if(this.cache.__index !== -1) { return; }

		this.cache.__index = meta.renderer.tweens.push(this.cache) - 1;

		if(this._group) {
			this._group.activeUsers++;
		}
	},

	/**
	 * Stop tweening.
	 * @return {meta.Tween}
	 */
	stop: function(callCB)
	{
		if(this.cache.__index === -1) { return; }

		this.cache.link = null;
		this.cache.index = 0;

		meta.renderer.tweensRemove.push(this.cache.__index);
		this.cache.__index = -1;

		if(callCB) {
			callCB(this.cache.owner);
		}

		if(this._group)
		{
			this._group.activeUsers--;
			if(this._group.activeUsers === 0 && this._group.callback) {
				this._group.callback();
			}
		}			
	
		return this;
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

		this.cache.paused = value;

		return this;
	},

	/**
	 * Resume paused tween.
	 * @returns {meta.Tween}
	 */
	resume: function() {
		this.cache.paused = false;
		return this;
	},

	/**
	 * Clear all tweens.
	 * @returns {meta.Tween}
	 */
	clear: function()
	{
		this.stop(null);	
		this.chain.length = 0;

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
		cache.index = 0;
		cache.link = this.chain[0];

		if(!cache.link) { return this; }

		for(var key in cache.link.startValues) {
			cache.owner[key] = cache.link.startValues[key];
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
		var repeating = false;
		var cache = this.cache;

		if(cache.index === this.chain.length)
		{
			if(cache.numRepeat === 0) {
				this.stop();
				return this;
			}
			else
			{
				cache.index = 0;
				if(cache.numRepeat !== -1) 
				{
					cache.numRepeat--;
					if(cache.numRepeat === 0) 
					{
						if(this.onDone) {
							this.onDone.call(this.cache);
						}	

						this.stop();
						return this;
					}
				}
				
				repeating = true;
			}
		}

		cache._done = false;

		var key;
		var link = this.chain[cache.index++];
		var owner = cache.owner;

		if(!repeating)
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
		
		cache._tStart = meta.time.current;
		cache._tFrame = 0;
		cache.link = link;

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
	set reverse(value)
	{
		if(value === void(0)) {
			value = true;
		}

		this.cache.reverse = value;
		return this;
	},

	get reverse() { return this.cache.reverse; },


	/**
	 * Update tween animation.
	 * @param tDelta {Number} Time between frames.
	 */
	update: function(tDelta)
	{
		var cache = this.cache;
		if(!cache.link) {
			this.stop(false);
			return;
		}

		cache._tFrame += meta.time.delta;

		var link = cache.link;

		var tElapsed = (meta.time.current - cache._tStart) / link.duration;

		if(tElapsed > 1.0) {
			tElapsed = 1.0;
		}

		if(cache._done)
		{
			if(cache.tFrameDelay < link.tDelay) {
				return;
			}
		}
		else
		{
			if(link.endValues) 
			{
				link.update(tElapsed);

				if(link._onTick) {
					link._onTick.call(this.cache);
				}
			}
		}

		if(tElapsed === 1.0)
		{
			if(!cache._done) {
				cache._done = true;
				return;
			}

			if(link._onDone) {
				link._onDone.call(this.cache);
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
	wait: function(duration, onDone)
	{
		var link = new meta.Tween.Link(this, null, duration, onDone);
		this.chain.push(link);
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
			console.warn("(meta.Tween.group) No group name specified.");
			return this;
		}

		if(this._group) {
			console.warn("(meta.Tween.group) Tween already is part of a group.");
			return this;			
		}

		if(typeof group === "object") {
			this._group = group;
		}

		this._group.users++;

		return this;
	},


	//
	autoPlay: false,

	_group: null,
	_removeFlag: 0,
	numRepeat: 0
};

meta.Tween.Cache = function(owner) 
{
	this.owner = owner;
	this.tween = null;

	this.link = null;
	this.index = 0;
	this.numRepeat = 0;

	this._tStart = 0;
	this._tFrame = 0;	

	this.onDone = null;
	this._done = false;

	this.__index = -1;
};

meta.Tween.Cache.prototype = 
{
	update: function(tDelta) {
		this.tween.cache = this;
		this.tween.update(tDelta);
		this.tween.cache = null;
	},

	stop: function() {
		this.tween.cache = this;
		this.tween.stop();
		this.tween.cache = null;
	},

	//
	paused: false,
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
