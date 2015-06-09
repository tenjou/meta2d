"use strict";

meta.Timer = function(owner, func, tDelta, numTimes)
{
	this.owner = owner;
	this.id = meta.cache.timerIndex++;
	this.func = func;
	this.onRemove = null;

	this.tDelta = tDelta;

	this.numTimes = numTimes;
	if(this.numTimes === void(0)) {
		this.numTimes = -1;
	}
	this.initNumTimes = this.numTimes;

	this.tAccumulator = 0.0;
	this.tStart = Date.now();

	this.__index = -1;
};

meta.Timer.prototype =
{
	play: function() 
	{
		if(this.__index !== -1) { return; }

		this.__index = meta.engine.timers.push(this) - 1;
	},

	/** Remove timer. */
	stop: function() 
	{
		if(this.__index === -1) { return; }

		meta.engine.timersRemove.push(this);
		this.__index = -1;
	},

	/** Pause timer. */
	pause: function() {
		this.paused = true;
	},

	/** Resume timer. */
	resume: function() {
		this.paused = false;
		this.tStart = Date.now();
	},

	/** Reset timer. */
	reset: function() {
		this.tAccumulator = 0;
		this.numTimes = this.initNumTimes;
		this.paused = false;
		this.play();
	},

	//
	onRemove: null,
	paused: false
};

/**
 * Create a new timer.
 * @param owner {Object} Owner of the timer.
 * @param func {Function} Callback function.
 * @param tDelta {Number} Time between timer update in milliseconds.
 * @param numTimes {Number=} Number of repeats. By default it will be forever.
 * @returns {meta.Timer} Timer object.
 */
meta.createTimer = function(owner, func, tDelta, numTimes)
{
	if(typeof(owner) === "function") {
		numTimes = tDelta;
		tDelta = func;
		func = owner;
		owner = window;
	} 

	if(!func) {
		console.warn("(meta.addTimer) Invalid function passed");
		return;
	}

	var newTimer = new meta.Timer(owner, func, tDelta, numTimes);
	return newTimer;
};

/**
 * Add a new timer.
 * @param owner {Object} Owner of the timer.
 * @param func {Function} Callback function.
 * @param tDelta {Number} Time between timer update in milliseconds.
 * @param numTimes {Number=} Number of repeats. By default it will be forever.
 * @returns {meta.Timer} Timer object.
 */
meta.addTimer = function(owner, func, tDelta, numTimes)
{
	var newTimer = meta.createTimer(owner, func, tDelta, numTimes);
	newTimer.play();

	return newTimer;
};
