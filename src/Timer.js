"use strict";

meta._cache.timerIndex = 0;


meta.Timer = function(owner, func, tDelta, numTimes)
{
	this.owner = owner;
	this.id = meta._cache.timerIndex++;
	this.func = func;
	this.onRemove = null;

	this.tDelta = tDelta;
	this.numTimes = numTimes;
	if(this.numTimes === void(0)) {
		this.numTimes = -1;
	}

	this.tAccumulator = 0.0;
	this.tStart = Date.now();
};

meta.Timer.prototype =
{
	/**
	 * Remove timer.
	 */
	remove: function() {
		this.numTimes = 0;
	},

	/**
	 * Pause timer.
	 */
	pause: function() {
		this.isPaused = true;
	},

	/**
	 * Resume timer.
	 */
	resume: function() {
		this.isPaused = false;
		this.tStart = Date.now();
	},

	//
	onRemove: null,
	isPaused: false
};

/**
 * Add new timer.
 * @param owner {Object} Owner of the timer.
 * @param func {Function} Callback function.
 * @param tDelta {Number} Time between timer update in milliseconds.
 * @param numTimes {Number=} Number of repeats. By default it will be forever.
 * @returns {meta.Timer} Timer object.
 */
meta.addTimer = function(owner, func, tDelta, numTimes)
{
	if(typeof(owner) === "function") {
		numTimes = tDelta;
		tDelta = func;
		func = owner;
		owner = window;
	} 


	var newTimer = new meta.Timer(owner, func, tDelta, numTimes);
	meta.engine._timers.push(newTimer);
	meta.engine._numTimers++;

	return newTimer;
};